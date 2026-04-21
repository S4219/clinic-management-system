import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import AdminLayout from '../../layouts/AdminLayout'
import { ModalShell, ModalActions } from '../../components/shared/Modal'
import ConfirmModal from '../../components/shared/ConfirmModal'
import Pagination from '../../components/shared/Pagination'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10
const EMPTY = {
  doctor_id:'', name:'', specialization:'', department_id:'', availability:true,
  phone:'', email:'', experience:'', education:'', schedule:''
}

export default function AdminDoctors() {
  const [rows,    setRows]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [depts,   setDepts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')
  const [availF,  setAvailF]  = useState('')
  const [deptF,   setDeptF]   = useState('')

  const [modal,    setModal]    = useState(null)
  const [selected, setSelected] = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [delTarget, setDelTarget] = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => {
    supabase.from('departments').select('department_id,name').order('name')
      .then(({ data }) => setDepts(data ?? []))
  }, [])

  const fetch = useCallback(async (p = page) => {
    setLoading(true)
    const from = (p - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let q = supabase.from('doctors')
      .select('*, departments(name)', { count: 'exact' })
      .order('name')
      .range(from, to)

    if (search) q = q.or(`name.ilike.%${search}%,specialization.ilike.%${search}%`)
    if (availF !== '') q = q.eq('availability', availF === 'true')
    if (deptF)  q = q.eq('department_id', deptF)

    const { data, count, error } = await q
    if (error) toast.error(error.message)
    else { setRows(data ?? []); setTotal(count ?? 0) }
    setLoading(false)
  }, [page, search, availF, deptF])

  useEffect(() => { fetch(page) }, [page])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1) }, 300)
    return () => clearTimeout(t)
  }, [search, availF, deptF])

  async function handleSave(e) {
    e.preventDefault()
    if (modal === 'add' && !selected.doctor_id.trim()) { toast.error('Doctor ID is required'); return }
    if (!selected.name) { toast.error('Doctor name is required'); return }
    setSaving(true)
    const { doctor_id, departments: _dept, ...rest } = selected
    const payload = {
      ...rest,
      experience: selected.experience ? Number(selected.experience) : null,
      department_id: selected.department_id || null,
    }
    const { error } = modal === 'add'
      ? await supabase.from('doctors').insert([{ doctor_id, ...payload }])
      : await supabase.from('doctors').update(payload).eq('doctor_id', selected.doctor_id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(modal === 'add' ? 'Doctor added' : 'Doctor updated')
    setModal(null)
    fetch(page)
  }

  async function confirmDelete() {
    setDeleting(true)
    const { error } = await supabase.from('doctors').delete().eq('doctor_id', delTarget.doctor_id)
    setDeleting(false)
    if (error) { toast.error('Cannot delete: doctor may have linked appointments or users'); return }
    toast.success('Doctor deleted')
    setDelTarget(null)
    fetch(page)
  }

  const set = (k, v) => setSelected(p => ({ ...p, [k]: v }))

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h1 className="page-title">Doctors</h1><p className="page-sub">{total} doctors on staff</p></div>
        <button onClick={() => { setSelected(EMPTY); setModal('add') }} className="btn-primary text-sm self-start">
          <Plus className="w-4 h-4" /> Add Doctor
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search name, specialization…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={deptF} onChange={e => setDeptF(e.target.value)}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
        </select>
        <select className="input w-36" value={availF} onChange={e => setAvailF(e.target.value)}>
          <option value="">Availability</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="th">Name</th>
                <th className="th">Specialization</th>
                <th className="th">Department</th>
                <th className="th">Experience</th>
                <th className="th">Phone</th>
                <th className="th">Availability</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({length:5}).map((_,i) => (
                    <tr key={i}><td colSpan={7}><div className="h-5 m-4 bg-gray-100 animate-pulse rounded"/></td></tr>
                  ))
                : rows.length === 0
                  ? <tr><td colSpan={7} className="text-center py-14 text-sm text-gray-400">No doctors found</td></tr>
                  : rows.map(r => (
                      <tr key={r.doctor_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="td font-medium text-gray-900">{r.name}</td>
                        <td className="td text-gray-600">{r.specialization || '—'}</td>
                        <td className="td">
                          {r.departments?.name
                            ? <span className="badge-blue">{r.departments.name}</span>
                            : '—'}
                        </td>
                        <td className="td text-gray-600">{r.experience ? `${r.experience} yrs` : '—'}</td>
                        <td className="td text-gray-600">{r.phone || '—'}</td>
                        <td className="td">
                          <span className={r.availability ? 'badge-green' : 'badge-red'}>
                            {r.availability ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="td">
                          <div className="flex gap-1">
                            <button onClick={() => { setSelected(r); setModal('edit') }} className="btn-ghost p-1.5"><Pencil className="w-4 h-4"/></button>
                            <button onClick={() => setDelTarget(r)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={p => { setPage(p); fetch(p) }} />
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <ModalShell title={modal === 'add' ? 'Add Doctor' : 'Edit Doctor'} onClose={() => setModal(null)} size="lg">
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-2 gap-4">
              {modal === 'add' && (
                <div className="col-span-2"><label className="label">Doctor ID *</label>
                  <input className="input" value={selected.doctor_id} onChange={e => set('doctor_id', e.target.value)} placeholder="e.g. DOC-001" /></div>
              )}
              <div className="col-span-2"><label className="label">Full Name *</label>
                <input className="input" value={selected.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label className="label">Specialization</label>
                <input className="input" value={selected.specialization} onChange={e => set('specialization', e.target.value)} /></div>
              <div><label className="label">Department</label>
                <select className="input" value={selected.department_id || ''} onChange={e => set('department_id', e.target.value)}>
                  <option value="">Select…</option>
                  {depts.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                </select></div>
              <div><label className="label">Phone</label>
                <input className="input" value={selected.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div><label className="label">Email</label>
                <input className="input" type="email" value={selected.email} onChange={e => set('email', e.target.value)} /></div>
              <div><label className="label">Experience (years)</label>
                <input className="input" type="number" min="0" value={selected.experience} onChange={e => set('experience', e.target.value)} /></div>
              <div><label className="label">Availability</label>
                <select className="input" value={String(selected.availability)} onChange={e => set('availability', e.target.value === 'true')}>
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select></div>
              <div className="col-span-2"><label className="label">Education</label>
                <input className="input" value={selected.education} onChange={e => set('education', e.target.value)} placeholder="MBBS, MD…"/></div>
              <div className="col-span-2"><label className="label">Schedule</label>
                <textarea className="input resize-none" rows={2} value={selected.schedule} onChange={e => set('schedule', e.target.value)} placeholder="Mon–Fri 9am–5pm…"/></div>
            </div>
            <ModalActions onClose={() => setModal(null)} loading={saving} submitLabel={modal === 'add' ? 'Add Doctor' : 'Save Changes'} />
          </form>
        </ModalShell>
      )}

      {delTarget && (
        <ConfirmModal
          title="Delete Doctor"
          message={`Delete "${delTarget.name}"? This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDelTarget(null)}
          loading={deleting}
        />
      )}
    </AdminLayout>
  )
}
