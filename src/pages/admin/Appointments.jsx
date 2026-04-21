import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, XCircle } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import AdminLayout from '../../layouts/AdminLayout'
import { ModalShell, ModalActions } from '../../components/shared/Modal'
import ConfirmModal from '../../components/shared/ConfirmModal'
import Pagination from '../../components/shared/Pagination'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10
const STATUSES = ['scheduled','pending','completed','cancelled']
const STATUS_BADGE = { scheduled:'badge-blue', completed:'badge-green', cancelled:'badge-red', pending:'badge-yellow' }

const EMPTY = { appointment_id:'', patient_id:'', doctor_id:'', department_id:'', date:'', time:'', status:'scheduled', symptoms:'' }

export default function AdminAppointments() {
  const [rows,      setRows]      = useState([])
  const [total,     setTotal]     = useState(0)
  const [patients,  setPatients]  = useState([])
  const [doctors,   setDoctors]   = useState([])
  const [depts,     setDepts]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [page,      setPage]      = useState(1)
  const [statusF,   setStatusF]   = useState('')
  const [dateF,     setDateF]     = useState('')

  const [modal,     setModal]     = useState(null)
  const [selected,  setSelected]  = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling,   setCancelling]   = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('patients').select('patient_id,name').order('name'),
      supabase.from('doctors').select('doctor_id,name,department_id').order('name'),
      supabase.from('departments').select('department_id,name').order('name'),
    ]).then(([{data:p},{data:d},{data:dp}]) => {
      setPatients(p??[]); setDoctors(d??[]); setDepts(dp??[])
    })
  }, [])

  const fetch = useCallback(async (p = page) => {
    setLoading(true)
    const from = (p-1)*PAGE_SIZE, to = from+PAGE_SIZE-1

    let q = supabase.from('appointments')
      .select('*, patients(name), doctors(name), departments(name)', { count:'exact' })
      .order('date', { ascending:false }).order('time', { ascending:false })
      .range(from, to)

    if (statusF) q = q.eq('status', statusF)
    if (dateF)   q = q.eq('date', dateF)

    const { data, count, error } = await q
    if (error) toast.error(error.message)
    else { setRows(data??[]); setTotal(count??0) }
    setLoading(false)
  }, [page, statusF, dateF])

  useEffect(() => { fetch(page) }, [page])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1) }, 300)
    return () => clearTimeout(t)
  }, [statusF, dateF])

  function pickDoctor(id) {
    const doc = doctors.find(d => d.doctor_id === id)
    setSelected(s => ({ ...s, doctor_id: id, department_id: doc?.department_id ?? '' }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (modal === 'add' && !selected.appointment_id.trim()) {
      toast.error('Appointment ID is required'); return
    }
    if (!selected.patient_id || !selected.doctor_id || !selected.date || !selected.time) {
      toast.error('Patient, doctor, date and time are required'); return
    }
    setSaving(true)
    const { appointment_id, patients: _p, doctors: _d, departments: _dp, ...rest } = selected
    const payload = { ...rest, department_id: selected.department_id || null }
    const { error } = modal === 'add'
      ? await supabase.from('appointments').insert([{ appointment_id, ...payload }])
      : await supabase.from('appointments').update(payload).eq('appointment_id', selected.appointment_id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(modal === 'add' ? 'Appointment booked' : 'Appointment updated')
    setModal(null); fetch(page)
  }

  async function confirmCancel() {
    setCancelling(true)
    const { error } = await supabase.from('appointments')
      .update({ status:'cancelled' }).eq('appointment_id', cancelTarget.appointment_id)
    setCancelling(false)
    if (error) { toast.error(error.message); return }
    toast.success('Appointment cancelled')
    setCancelTarget(null); fetch(page)
  }

  const set = (k, v) => setSelected(s => ({ ...s, [k]: v }))

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h1 className="page-title">Appointments</h1><p className="page-sub">{total} total</p></div>
        <button onClick={() => { setSelected(EMPTY); setModal('add') }} className="btn-primary text-sm self-start">
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input className="input w-40" type="date" value={dateF} onChange={e => setDateF(e.target.value)} />
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
                <th className="th">Patient</th><th className="th">Doctor</th>
                <th className="th">Dept</th><th className="th">Date</th>
                <th className="th">Time</th><th className="th">Status</th><th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({length:5}).map((_,i)=>(
                    <tr key={i}><td colSpan={7}><div className="h-5 m-4 bg-gray-100 animate-pulse rounded"/></td></tr>
                  ))
                : rows.length===0
                  ? <tr><td colSpan={7} className="text-center py-14 text-sm text-gray-400">No appointments found</td></tr>
                  : rows.map(r=>(
                      <tr key={r.appointment_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="td font-medium text-gray-900">{r.patients?.name??'—'}</td>
                        <td className="td text-gray-600">{r.doctors?.name??'—'}</td>
                        <td className="td">{r.departments?.name ? <span className="badge-blue">{r.departments.name}</span> : '—'}</td>
                        <td className="td text-gray-600">{r.date}</td>
                        <td className="td text-gray-600">{r.time??'—'}</td>
                        <td className="td"><span className={STATUS_BADGE[r.status]??'badge-gray'}>{r.status}</span></td>
                        <td className="td">
                          <div className="flex gap-1">
                            <button onClick={() => { setSelected(r); setModal('edit') }} className="btn-ghost p-1.5" title="Edit"><Pencil className="w-4 h-4"/></button>
                            {r.status !== 'cancelled' && r.status !== 'completed' && (
                              <button onClick={() => setCancelTarget(r)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50" title="Cancel"><XCircle className="w-4 h-4"/></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={p=>{setPage(p);fetch(p)}} />
      </div>

      {(modal==='add'||modal==='edit') && (
        <ModalShell title={modal==='add'?'Book Appointment':'Edit Appointment'} onClose={()=>setModal(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            {modal === 'add' && (
              <div><label className="label">Appointment ID *</label>
                <input className="input" value={selected.appointment_id}
                  onChange={e=>set('appointment_id',e.target.value)} placeholder="e.g. APT-001" /></div>
            )}
            <div><label className="label">Patient *</label>
              <select className="input" value={selected.patient_id} onChange={e=>set('patient_id',e.target.value)}>
                <option value="">Select patient…</option>
                {patients.map(p=><option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
              </select></div>
            <div><label className="label">Doctor *</label>
              <select className="input" value={selected.doctor_id} onChange={e=>pickDoctor(e.target.value)}>
                <option value="">Select doctor…</option>
                {doctors.map(d=><option key={d.doctor_id} value={d.doctor_id}>{d.name}</option>)}
              </select></div>
            <div><label className="label">Department</label>
              <select className="input" value={selected.department_id||''} onChange={e=>set('department_id',e.target.value)}>
                <option value="">Select…</option>
                {depts.map(d=><option key={d.department_id} value={d.department_id}>{d.name}</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Date *</label>
                <input className="input" type="date" value={selected.date} onChange={e=>set('date',e.target.value)}/></div>
              <div><label className="label">Time *</label>
                <input className="input" type="time" value={selected.time} onChange={e=>set('time',e.target.value)}/></div>
            </div>
            <div><label className="label">Status</label>
              <select className="input" value={selected.status} onChange={e=>set('status',e.target.value)}>
                {STATUSES.map(s=><option key={s} value={s} className="capitalize">{s}</option>)}
              </select></div>
            <div><label className="label">Symptoms</label>
              <textarea className="input resize-none" rows={2} value={selected.symptoms} onChange={e=>set('symptoms',e.target.value)}/></div>
            <ModalActions onClose={()=>setModal(null)} loading={saving} submitLabel={modal==='add'?'Book':'Save'} />
          </form>
        </ModalShell>
      )}

      {cancelTarget && (
        <ConfirmModal
          title="Cancel Appointment"
          message={`Cancel the appointment for "${cancelTarget.patients?.name}"? The status will be set to cancelled.`}
          onConfirm={confirmCancel}
          onCancel={()=>setCancelTarget(null)}
          loading={cancelling}
        />
      )}
    </AdminLayout>
  )
}
