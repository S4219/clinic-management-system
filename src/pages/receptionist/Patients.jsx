import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Eye } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import ReceptionistLayout from '../../layouts/ReceptionistLayout'
import { ModalShell, ModalActions } from '../../components/shared/Modal'
import Pagination from '../../components/shared/Pagination'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const STATUS_BADGE = { active: 'badge-green', inactive: 'badge-gray' }

const EMPTY = {
  patient_id: '', name: '', age: '', gender: '', contact: '', email: '',
  address: '', blood_group: '', emergency_contact: '',
  status: 'active', medical_history: '',
}

export default function ReceptionistPatients() {
  const [rows,    setRows]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')
  const [statusF, setStatusF] = useState('')

  const [modal,    setModal]    = useState(null)   // 'add' | 'view'
  const [selected, setSelected] = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)

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
    if (error) toast.error(error.message)
    else { setRows(data ?? []); setTotal(count ?? 0) }
    setLoading(false)
  }, [page, search, statusF])

  useEffect(() => { fetch(page) }, [page])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1) }, 300)
    return () => clearTimeout(t)
  }, [search, statusF])

  async function handleAdd(e) {
    e.preventDefault()
    if (!selected.patient_id.trim()) { toast.error('Patient ID is required'); return }
    if (!selected.name || !selected.age || !selected.gender || !selected.contact) {
      toast.error('Name, age, gender and contact are required'); return
    }
    setSaving(true)
    const { patient_id, ...rest } = selected
    const { error } = await supabase.from('patients').insert([{
      patient_id,
      ...rest,
      age: Number(selected.age),
    }])
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Patient added')
    setModal(null)
    setSelected(EMPTY)
    fetch(page)
  }

  const set = (k, v) => setSelected(s => ({ ...s, [k]: v }))

  return (
    <ReceptionistLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-sub">{total} patients registered</p>
        </div>
        <button
          onClick={() => { setSelected(EMPTY); setModal('add') }}
          className="btn-primary text-sm self-start"
        >
          <Plus className="w-4 h-4" /> Add Patient
        </button>
      </div>

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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="th">Name</th>
                <th className="th">Age / Gender</th>
                <th className="th">Contact</th>
                <th className="th">Blood Group</th>
                <th className="th">Last Visit</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={7}><div className="h-5 m-4 bg-gray-100 animate-pulse rounded" /></td></tr>
                  ))
                : rows.length === 0
                  ? <tr><td colSpan={7} className="text-center py-14 text-sm text-gray-400">No patients found</td></tr>
                  : rows.map(r => (
                      <tr key={r.patient_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="td">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">
                              {r.name?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <p className="text-sm font-medium text-gray-900">{r.name}</p>
                          </div>
                        </td>
                        <td className="td text-gray-600">{r.age}{r.gender ? ` / ${r.gender}` : ''}</td>
                        <td className="td text-gray-600">{r.contact || '—'}</td>
                        <td className="td text-gray-600">{r.blood_group || '—'}</td>
                        <td className="td text-gray-500">{r.last_visit || '—'}</td>
                        <td className="td">
                          <span className={STATUS_BADGE[r.status] ?? 'badge-gray'}>{r.status}</span>
                        </td>
                        <td className="td">
                          <button
                            onClick={() => { setSelected(r); setModal('view') }}
                            className="btn-ghost p-1.5"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={p => { setPage(p); fetch(p) }} />
      </div>

      {/* Add Patient modal */}
      {modal === 'add' && (
        <ModalShell title="Add New Patient" onClose={() => setModal(null)} size="lg">
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Patient ID *</label>
                <input className="input" value={selected.patient_id}
                  onChange={e => set('patient_id', e.target.value)} placeholder="e.g. PAT-001" />
              </div>
              <div className="col-span-2">
                <label className="label">Full Name *</label>
                <input className="input" value={selected.name}
                  onChange={e => set('name', e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <label className="label">Age *</label>
                <input className="input" type="number" min="0" max="150"
                  value={selected.age} onChange={e => set('age', e.target.value)} />
              </div>
              <div>
                <label className="label">Gender *</label>
                <select className="input" value={selected.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select…</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="label">Contact *</label>
                <input className="input" value={selected.contact}
                  onChange={e => set('contact', e.target.value)} placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="label">Blood Group</label>
                <select className="input" value={selected.blood_group}
                  onChange={e => set('blood_group', e.target.value)}>
                  <option value="">Select…</option>
                  {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Email</label>
                <input className="input" type="email" value={selected.email}
                  onChange={e => set('email', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">Emergency Contact</label>
                <input className="input" value={selected.emergency_contact}
                  onChange={e => set('emergency_contact', e.target.value)}
                  placeholder="Name — Phone" />
              </div>
              <div className="col-span-2">
                <label className="label">Address</label>
                <textarea className="input resize-none" rows={2}
                  value={selected.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">Medical History</label>
                <textarea className="input resize-none" rows={2}
                  value={selected.medical_history}
                  onChange={e => set('medical_history', e.target.value)}
                  placeholder="Known conditions, allergies…" />
              </div>
            </div>
            <ModalActions onClose={() => setModal(null)} loading={saving} submitLabel="Add Patient" />
          </form>
        </ModalShell>
      )}

      {/* View Patient modal */}
      {modal === 'view' && selected && (
        <ModalShell title="Patient Details" subtitle={selected.name} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {selected.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{selected.name}</p>
                <p className="text-sm text-gray-500">
                  {[selected.age && `${selected.age} yrs`, selected.gender, selected.blood_group]
                    .filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                ['Contact',           selected.contact],
                ['Email',             selected.email],
                ['Blood Group',       selected.blood_group],
                ['Emergency Contact', selected.emergency_contact],
                ['Status',            selected.status],
                ['Last Visit',        selected.last_visit],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{k}</dt>
                  <dd className="text-sm text-gray-800 mt-0.5">{v}</dd>
                </div>
              ))}
              {selected.address && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Address</dt>
                  <dd className="text-sm text-gray-800 mt-0.5">{selected.address}</dd>
                </div>
              )}
            </dl>
            {selected.medical_history && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Medical History</p>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-gray-800 leading-relaxed">
                  {selected.medical_history}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <button className="btn-secondary" onClick={() => setModal(null)}>Close</button>
          </div>
        </ModalShell>
      )}
    </ReceptionistLayout>
  )
}
