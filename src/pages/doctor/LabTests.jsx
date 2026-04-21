import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import DoctorLayout from '../../layouts/DoctorLayout'
import { ModalShell, ModalActions } from '../../components/shared/Modal'
import Pagination from '../../components/shared/Pagination'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10
const STATUSES = ['pending', 'in-progress', 'completed', 'cancelled']
const STATUS_BADGE = {
  pending: 'badge-yellow', 'in-progress': 'badge-blue',
  completed: 'badge-green', cancelled: 'badge-red',
}

const EMPTY = {
  lab_test_id: '', patient_id: '', test_name: '',
  date: new Date().toISOString().split('T')[0],
  status: 'pending', result: '', report_url: '',
}

export default function DoctorLabTests() {
  const { user } = useAuth()
  const doctorId = user?.linked_id

  const [rows,     setRows]     = useState([])
  const [total,    setTotal]    = useState(0)
  const [patients, setPatients] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [statusF,  setStatusF]  = useState('')

  const [modal,    setModal]    = useState(null)   // 'request' | 'update'
  const [selected, setSelected] = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)

  // Load this doctor's patients for the request form
  useEffect(() => {
    if (!doctorId) return
    supabase.from('appointments')
      .select('patient_id, patients(patient_id, name)')
      .eq('doctor_id', doctorId)
      .then(({ data }) => {
        const seen = new Set()
        const unique = []
        for (const row of (data ?? [])) {
          if (row.patients && !seen.has(row.patient_id)) {
            seen.add(row.patient_id)
            unique.push(row.patients)
          }
        }
        setPatients(unique)
      })
  }, [doctorId])

  const fetch = useCallback(async (p = page) => {
    if (!doctorId) return
    setLoading(true)
    const from = (p - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let q = supabase.from('lab_tests')
      .select('*, patients(name)', { count: 'exact' })
      .eq('doctor_id', doctorId)
      .order('date', { ascending: false })
      .range(from, to)

    if (search)  q = q.ilike('test_name', `%${search}%`)
    if (statusF) q = q.eq('status', statusF)

    const { data, count, error } = await q
    if (error) toast.error(error.message)
    else { setRows(data ?? []); setTotal(count ?? 0) }
    setLoading(false)
  }, [doctorId, page, search, statusF])

  useEffect(() => { fetch(page) }, [page])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1) }, 300)
    return () => clearTimeout(t)
  }, [search, statusF])

  async function handleSave(e) {
    e.preventDefault()
    if (modal === 'request') {
      if (!selected.lab_test_id.trim()) { toast.error('Lab Test ID is required'); return }
      if (!selected.patient_id) { toast.error('Select a patient'); return }
      if (!selected.test_name.trim()) { toast.error('Test name is required'); return }
    }
    setSaving(true)
    const { error } = modal === 'request'
      ? await supabase.from('lab_tests').insert([{
          lab_test_id: selected.lab_test_id,
          doctor_id:  doctorId,
          patient_id: selected.patient_id,
          test_name:  selected.test_name.trim(),
          date:       selected.date,
          status:     'pending',
        }])
      : await supabase.from('lab_tests').update({
          status:     selected.status,
          result:     selected.result || null,
          report_url: selected.report_url || null,
        }).eq('lab_test_id', selected.lab_test_id)

    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(modal === 'request' ? 'Lab test requested' : 'Lab test updated')
    setModal(null)
    fetch(page)
  }

  const set = (k, v) => setSelected(s => ({ ...s, [k]: v }))

  return (
    <DoctorLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Lab Tests</h1>
          <p className="page-sub">{total} tests requested by you</p>
        </div>
        <button
          onClick={() => { setSelected(EMPTY); setModal('request') }}
          className="btn-primary text-sm self-start"
        >
          <Plus className="w-4 h-4" /> Request Lab Test
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search test name…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="th">Test Name</th>
                <th className="th">Patient</th>
                <th className="th">Date</th>
                <th className="th">Status</th>
                <th className="th">Result</th>
                <th className="th">Report</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={7}><div className="h-5 m-4 bg-gray-100 animate-pulse rounded" /></td></tr>
                  ))
                : rows.length === 0
                  ? <tr><td colSpan={7} className="text-center py-14 text-sm text-gray-400">No lab tests found</td></tr>
                  : rows.map(r => (
                      <tr key={r.lab_test_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="td font-medium text-gray-900">{r.test_name}</td>
                        <td className="td text-gray-600">{r.patients?.name ?? '—'}</td>
                        <td className="td text-gray-600">{r.date}</td>
                        <td className="td">
                          <span className={STATUS_BADGE[r.status] ?? 'badge-gray'}>{r.status}</span>
                        </td>
                        <td className="td text-gray-600 max-w-[160px] truncate" title={r.result ?? ''}>
                          {r.result || '—'}
                        </td>
                        <td className="td">
                          {r.report_url
                            ? <a href={r.report_url} target="_blank" rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-xs">View</a>
                            : '—'}
                        </td>
                        <td className="td">
                          <button
                            onClick={() => { setSelected(r); setModal('update') }}
                            className="btn-ghost p-1.5"
                            title="Update result"
                          >
                            <Pencil className="w-4 h-4" />
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

      {/* Request modal */}
      {modal === 'request' && (
        <ModalShell title="Request Lab Test" onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="label">Lab Test ID *</label>
              <input className="input" value={selected.lab_test_id}
                onChange={e => set('lab_test_id', e.target.value)}
                placeholder="e.g. LAB-001" />
            </div>
            <div>
              <label className="label">Patient *</label>
              <select className="input" value={selected.patient_id}
                onChange={e => set('patient_id', e.target.value)}>
                <option value="">Select patient…</option>
                {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Test Name *</label>
              <input className="input" value={selected.test_name}
                onChange={e => set('test_name', e.target.value)}
                placeholder="e.g. CBC, LFT, X-Ray Chest, MRI Brain…" />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={selected.date}
                onChange={e => set('date', e.target.value)} />
            </div>
            <ModalActions onClose={() => setModal(null)} loading={saving} submitLabel="Request Test" />
          </form>
        </ModalShell>
      )}

      {/* Update result modal */}
      {modal === 'update' && (
        <ModalShell
          title="Update Lab Test"
          subtitle={`${selected.test_name} · ${rows.find(r => r.lab_test_id === selected.lab_test_id)?.patients?.name ?? ''}`}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="label">Status</label>
              <select className="input" value={selected.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Result</label>
              <textarea className="input resize-none" rows={4} value={selected.result || ''}
                onChange={e => set('result', e.target.value)}
                placeholder="Enter test result details…" />
            </div>
            <div>
              <label className="label">Report URL</label>
              <input className="input" value={selected.report_url || ''}
                onChange={e => set('report_url', e.target.value)}
                placeholder="https://…" />
            </div>
            <ModalActions onClose={() => setModal(null)} loading={saving} submitLabel="Save Update" />
          </form>
        </ModalShell>
      )}
    </DoctorLayout>
  )
}
