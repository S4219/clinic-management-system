import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import AdminLayout from '../../layouts/AdminLayout'
import { ModalShell, ModalActions } from '../../components/shared/Modal'
import ConfirmModal from '../../components/shared/ConfirmModal'
import Pagination from '../../components/shared/Pagination'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const EMPTY = {
  patient_id:'', name:'', age:'', gender:'', contact:'', email:'', address:'',
  blood_group:'', emergency_contact:'', status:'active', medical_history:''
}

const STATUS_BADGE = { active: 'badge-green', inactive: 'badge-gray' }

export default function AdminPatients() {
  const [rows,    setRows]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')
  const [statusF, setStatusF] = useState('')

  const [modal,    setModal]    = useState(null)  // 'add' | 'edit' | 'view'
  const [selected, setSelected] = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [delTarget, setDelTarget] = useState(null)
  const [deleting,  setDeleting]  = useState(false)

  const fetch = useCallback(async (p = page) => {
    setLoading(true)
    const from = (p - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let q = supabase.from('patients')
      .select('*', { count: 'exact' })
      .order('name')
      .range(from, to)

    if (search)  q = q.or(`name.ilike.%${search}%,contact.ilike.%${search}%,email.ilike.%${search}%`)
    if (statusF) q = q.eq('status', statusF)

    const { data, count, error } = await q
    if (error) { toast.error(error.message) }
    else { setRows(data ?? []); setTotal(count ?? 0) }
    setLoading(false)
  }, [page, search, statusF])

  useEffect(() => { fetch(page) }, [page])

  // Debounce search/filter → reset to page 1
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1) }, 300)
    return () => clearTimeout(t)
  }, [search, statusF])

  function openAdd()        { setSelected(EMPTY); setModal('add') }
  function openEdit(row)    { setSelected(row);   setModal('edit') }
  function openView(row)    { setSelected(row);   setModal('view') }

  async function handleSave(e) {
    e.preventDefault()
    if (modal === 'add' && !selected.patient_id.trim()) { toast.error('Patient ID is required'); return }
    if (!selected.name || !selected.age || !selected.gender || !selected.contact) {
      toast.error('Name, age, gender and contact are required'); return
    }
    setSaving(true)
    const { patient_id, ...rest } = selected
    const payload = { ...rest, age: Number(selected.age) }
    const { error } = modal === 'add'
      ? await supabase.from('patients').insert([{ patient_id, ...payload }])
      : await supabase.from('patients').update(payload).eq('patient_id', selected.patient_id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(modal === 'add' ? 'Patient added' : 'Patient updated')
    setModal(null)
    fetch(page)
  }

  async function confirmDelete() {
    setDeleting(true)
    const { error } = await supabase.from('patients').delete().eq('patient_id', delTarget.patient_id)
    setDeleting(false)
    if (error) { toast.error('Cannot delete: patient may have linked records'); return }
    toast.success('Patient deleted')
    setDelTarget(null)
    fetch(page)
  }

  const set = (k, v) => setSelected(p => ({ ...p, [k]: v }))

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h1 className="page-title">Patients</h1><p className="page-sub">{total} total patients</p></div>
        <button onClick={openAdd} className="btn-primary text-sm self-start">
          <Plus className="w-4 h-4" /> Add Patient
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search name, contact, email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="th">Name</th>
                <th className="th">Age / Gender</th>
                <th className="th">Contact</th>
                <th className="th">Blood</th>
                <th className="th">Last Visit</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({length:5}).map((_,i) => (
                    <tr key={i}><td colSpan={7} className="td"><div className="h-5 bg-gray-100 animate-pulse rounded"/></td></tr>
                  ))
                : rows.length === 0
                  ? <tr><td colSpan={7} className="text-center py-14 text-sm text-gray-400">No patients found</td></tr>
                  : rows.map(r => (
                      <tr key={r.patient_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="td font-medium text-gray-900">{r.name}</td>
                        <td className="td text-gray-600">{r.age} / {r.gender}</td>
                        <td className="td text-gray-600">{r.contact}</td>
                        <td className="td">{r.blood_group || '—'}</td>
                        <td className="td text-gray-500">{r.last_visit || '—'}</td>
                        <td className="td">
                          <span className={STATUS_BADGE[r.status] ?? 'badge-gray'}>{r.status}</span>
                        </td>
                        <td className="td">
                          <div className="flex gap-1">
                            <button onClick={() => openView(r)} className="btn-ghost p-1.5" title="View"><Eye className="w-4 h-4"/></button>
                            <button onClick={() => openEdit(r)} className="btn-ghost p-1.5" title="Edit"><Pencil className="w-4 h-4"/></button>
                            <button onClick={() => setDelTarget(r)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4"/></button>
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

      {/* Add / Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <ModalShell title={modal === 'add' ? 'Add Patient' : 'Edit Patient'} onClose={() => setModal(null)} size="lg">
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-2 gap-4">
              {modal === 'add' && (
                <div className="col-span-2"><label className="label">Patient ID *</label>
                  <input className="input" value={selected.patient_id} onChange={e => set('patient_id', e.target.value)} placeholder="e.g. PAT-001" /></div>
              )}
              <div className="col-span-2"><label className="label">Full Name *</label>
                <input className="input" value={selected.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label className="label">Age *</label>
                <input className="input" type="number" min="0" max="150" value={selected.age} onChange={e => set('age', e.target.value)} /></div>
              <div><label className="label">Gender *</label>
                <select className="input" value={selected.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select…</option><option>Male</option><option>Female</option><option>Other</option>
                </select></div>
              <div><label className="label">Contact *</label>
                <input className="input" value={selected.contact} onChange={e => set('contact', e.target.value)} /></div>
              <div><label className="label">Blood Group</label>
                <select className="input" value={selected.blood_group} onChange={e => set('blood_group', e.target.value)}>
                  <option value="">Select…</option>{BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select></div>
              <div className="col-span-2"><label className="label">Email</label>
                <input className="input" type="email" value={selected.email} onChange={e => set('email', e.target.value)} /></div>
              <div><label className="label">Emergency Contact</label>
                <input className="input" value={selected.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} /></div>
              <div><label className="label">Status</label>
                <select className="input" value={selected.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select></div>
              <div className="col-span-2"><label className="label">Address</label>
                <textarea className="input resize-none" rows={2} value={selected.address} onChange={e => set('address', e.target.value)} /></div>
              <div className="col-span-2"><label className="label">Medical History</label>
                <textarea className="input resize-none" rows={3} value={selected.medical_history} onChange={e => set('medical_history', e.target.value)} placeholder="Known conditions, allergies, past surgeries…"/></div>
            </div>
            <ModalActions onClose={() => setModal(null)} loading={saving} submitLabel={modal === 'add' ? 'Add Patient' : 'Save Changes'} />
          </form>
        </ModalShell>
      )}

      {/* View modal */}
      {modal === 'view' && (
        <ModalShell title="Patient Details" subtitle={selected.name} onClose={() => setModal(null)} size="md">
          <dl className="space-y-3">
            {[
              ['Age', selected.age],['Gender', selected.gender],['Contact', selected.contact],
              ['Email', selected.email || '—'],['Blood Group', selected.blood_group || '—'],
              ['Emergency Contact', selected.emergency_contact || '—'],
              ['Address', selected.address || '—'],['Status', selected.status],
              ['Last Visit', selected.last_visit || '—'],
            ].map(([k,v]) => (
              <div key={k} className="flex gap-4">
                <dt className="text-xs font-semibold text-gray-500 w-36 flex-shrink-0">{k}</dt>
                <dd className="text-sm text-gray-800">{v}</dd>
              </div>
            ))}
            {selected.medical_history && (
              <div>
                <dt className="text-xs font-semibold text-gray-500 mb-1">Medical History</dt>
                <dd className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 leading-relaxed">{selected.medical_history}</dd>
              </div>
            )}
          </dl>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button className="btn-secondary" onClick={() => setModal(null)}>Close</button>
            <button className="btn-primary" onClick={() => setModal('edit')}>Edit</button>
          </div>
        </ModalShell>
      )}

      {/* Confirm delete */}
      {delTarget && (
        <ConfirmModal
          title="Delete Patient"
          message={`Are you sure you want to delete "${delTarget.name}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDelTarget(null)}
          loading={deleting}
        />
      )}
    </AdminLayout>
  )
}
