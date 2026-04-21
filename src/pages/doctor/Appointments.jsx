import { useEffect, useState, useCallback } from 'react'
import { Pencil } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import DoctorLayout from '../../layouts/DoctorLayout'
import { ModalShell, ModalActions } from '../../components/shared/Modal'
import Pagination from '../../components/shared/Pagination'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10
const STATUSES = ['scheduled', 'pending', 'completed', 'cancelled']
const STATUS_BADGE = {
  scheduled: 'badge-blue', completed: 'badge-green',
  cancelled: 'badge-red',  pending:   'badge-yellow',
}

function fmtTime(t) {
  if (!t) return '—'
  const [h, m] = t.split(':')
  const hr = Number(h)
  return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`
}

export default function DoctorAppointments() {
  const { user } = useAuth()
  const doctorId  = user?.linked_id

  const [rows,    setRows]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [statusF, setStatusF] = useState('')
  const [dateF,   setDateF]   = useState('')

  const [modal,    setModal]    = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving,   setSaving]   = useState(false)

  const fetch = useCallback(async (p = page) => {
    if (!doctorId) return
    setLoading(true)
    const from = (p - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let q = supabase.from('appointments')
      .select('*, patients(patient_id, name, age, gender, blood_group, contact)', { count: 'exact' })
      .eq('doctor_id', doctorId)
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .range(from, to)

    if (statusF) q = q.eq('status', statusF)
    if (dateF)   q = q.eq('date', dateF)

    const { data, count, error } = await q
    if (error) toast.error(error.message)
    else { setRows(data ?? []); setTotal(count ?? 0) }
    setLoading(false)
  }, [doctorId, page, statusF, dateF])

  useEffect(() => { fetch(page) }, [page])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1) }, 300)
    return () => clearTimeout(t)
  }, [statusF, dateF])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('appointments')
      .update({ status: selected.status, symptoms: selected.symptoms, time: selected.time, date: selected.date })
      .eq('appointment_id', selected.appointment_id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Appointment updated')
    setModal(false)
    fetch(page)
  }

  const set = (k, v) => setSelected(s => ({ ...s, [k]: v }))

  return (
    <DoctorLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="page-sub">{total} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input className="input w-40" type="date" value={dateF}
          onChange={e => setDateF(e.target.value)} />
        <select className="input w-36" value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="th">Patient</th>
                <th className="th">Age</th>
                <th className="th">Date</th>
                <th className="th">Time</th>
                <th className="th">Symptoms</th>
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
                  ? <tr><td colSpan={7} className="text-center py-14 text-sm text-gray-400">No appointments found</td></tr>
                  : rows.map(r => (
                      <tr key={r.appointment_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="td">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold flex-shrink-0">
                              {r.patients?.name?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{r.patients?.name ?? '—'}</p>
                              {r.patients?.contact && <p className="text-xs text-gray-400">{r.patients.contact}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="td text-gray-600">{r.patients?.age ?? '—'}</td>
                        <td className="td text-gray-600">{r.date}</td>
                        <td className="td font-medium text-gray-800">{fmtTime(r.time)}</td>
                        <td className="td text-gray-500 max-w-[160px] truncate" title={r.symptoms ?? ''}>
                          {r.symptoms || '—'}
                        </td>
                        <td className="td">
                          <span className={STATUS_BADGE[r.status] ?? 'badge-gray'}>{r.status}</span>
                        </td>
                        <td className="td">
                          <button
                            onClick={() => { setSelected(r); setModal(true) }}
                            className="btn-ghost p-1.5"
                            title="Update"
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

      {modal && selected && (
        <ModalShell title="Update Appointment" subtitle={selected.patients?.name} onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input className="input" type="date" value={selected.date}
                  onChange={e => set('date', e.target.value)} />
              </div>
              <div>
                <label className="label">Time</label>
                <input className="input" type="time" value={selected.time ?? ''}
                  onChange={e => set('time', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={selected.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Symptoms</label>
              <textarea className="input resize-none" rows={3}
                value={selected.symptoms ?? ''}
                onChange={e => set('symptoms', e.target.value)}
                placeholder="Update symptoms notes…" />
            </div>
            <ModalActions onClose={() => setModal(false)} loading={saving} submitLabel="Save Changes" />
          </form>
        </ModalShell>
      )}
    </DoctorLayout>
  )
}
