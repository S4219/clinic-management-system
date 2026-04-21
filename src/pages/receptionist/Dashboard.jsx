import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, CreditCard, Users, Clock,
  CheckCircle2, XCircle, Hourglass, ChevronRight,
  Plus, X, AlertCircle
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import ReceptionistLayout from '../../layouts/ReceptionistLayout'
import toast from 'react-hot-toast'

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  scheduled: 'badge-blue',
  completed:  'badge-green',
  cancelled:  'badge-red',
  pending:    'badge-yellow',
}

function fmtTime(t) {
  if (!t) return '—'
  const [h, m] = t.split(':')
  const hr = Number(h)
  return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, iconBg, loading }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        {loading
          ? <div className="h-6 w-12 bg-gray-100 animate-pulse rounded mb-1" />
          : <p className="text-2xl font-bold text-gray-900 leading-none">{value ?? '—'}</p>
        }
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
      <div className="text-gray-300 mb-3">{icon}</div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function SkeletonRows({ rows = 4, cols = 5 }) {
  return (
    <div className="p-4 space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-8 bg-gray-100 animate-pulse rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Shared modal primitives ───────────────────────────────────────────────────
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
      </div>
    </div>
  )
}

function ModalActions({ onClose, loading, submitLabel }) {
  return (
    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-4">
      <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {loading ? 'Saving…' : submitLabel}
      </button>
    </div>
  )
}

// ── Book Appointment modal ────────────────────────────────────────────────────
const APT_EMPTY = {
  appointment_id: '', patient_id: '', doctor_id: '', department_id: '',
  date: '', time: '', status: 'scheduled', symptoms: '',
}

function BookAppointmentModal({ onClose, onSaved }) {
  const [form, setForm]     = useState(APT_EMPTY)
  const [patients, setPatients] = useState([])
  const [doctors,  setDoctors]  = useState([])
  const [depts,    setDepts]    = useState([])
  const [saving,   setSaving]   = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    Promise.all([
      supabase.from('patients').select('patient_id,name').order('name'),
      supabase.from('doctors').select('doctor_id,name,department_id').order('name'),
      supabase.from('departments').select('department_id,name').order('name'),
    ]).then(([{ data: p }, { data: d }, { data: dp }]) => {
      setPatients(p ?? [])
      setDoctors(d ?? [])
      setDepts(dp ?? [])
    })
  }, [])

  function pickDoctor(id) {
    const doc = doctors.find(d => d.doctor_id === id)
    setForm(f => ({ ...f, doctor_id: id, department_id: doc?.department_id ?? '' }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.appointment_id.trim()) {
      toast.error('Appointment ID is required')
      return
    }
    if (!form.patient_id || !form.doctor_id || !form.date || !form.time) {
      toast.error('Patient, doctor, date and time are required')
      return
    }
    setSaving(true)
    const payload = { ...form }
    if (!payload.department_id) delete payload.department_id
    const { error } = await supabase.from('appointments').insert([payload])
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Appointment booked')
    onSaved()
    onClose()
  }

  return (
    <ModalShell title="Book Appointment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Appointment ID *</label>
          <input className="input" value={form.appointment_id}
            onChange={e => set('appointment_id', e.target.value)}
            placeholder="e.g. APT-001" />
        </div>
        <div>
          <label className="label">Patient *</label>
          <select className="input" value={form.patient_id} onChange={e => set('patient_id', e.target.value)}>
            <option value="">Select patient…</option>
            {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Doctor *</label>
          <select className="input" value={form.doctor_id} onChange={e => pickDoctor(e.target.value)}>
            <option value="">Select doctor…</option>
            {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Department</label>
          <select className="input" value={form.department_id} onChange={e => set('department_id', e.target.value)}>
            <option value="">Select department…</option>
            {depts.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date *</label>
            <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label className="label">Time *</label>
            <input className="input" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="scheduled">Scheduled</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="label">Symptoms</label>
          <textarea className="input resize-none" rows={2} value={form.symptoms} onChange={e => set('symptoms', e.target.value)} placeholder="Brief description…" />
        </div>
        <ModalActions onClose={onClose} loading={saving} submitLabel="Book Appointment" />
      </form>
    </ModalShell>
  )
}

// ── Generate Bill modal ───────────────────────────────────────────────────────
const BILL_EMPTY = {
  bill_id: '', patient_id: '', appointment_id: '',
  consultation_fee: '', lab_charges: '', medicine_charges: '', other_charges: '',
  payment_status: 'pending', payment_method: '',
}

function GenerateBillModal({ onClose, onSaved }) {
  const [form, setForm]           = useState(BILL_EMPTY)
  const [patients,  setPatients]  = useState([])
  const [appointments, setAppointments] = useState([])
  const [saving, setSaving]       = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const total = ['consultation_fee','lab_charges','medicine_charges','other_charges']
    .reduce((sum, k) => sum + (parseFloat(form[k]) || 0), 0)

  useEffect(() => {
    supabase.from('patients').select('patient_id,name').order('name')
      .then(({ data }) => setPatients(data ?? []))
  }, [])

  // When patient changes, load their appointments (for linking the bill)
  useEffect(() => {
    if (!form.patient_id) { setAppointments([]); set('appointment_id', ''); return }
    supabase
      .from('appointments')
      .select('appointment_id, date, time, doctors(name)')
      .eq('patient_id', form.patient_id)
      .order('date', { ascending: false })
      .limit(20)
      .then(({ data }) => setAppointments(data ?? []))
  }, [form.patient_id])

  function invoiceNumber() {
    return `INV-${Date.now().toString(36).toUpperCase()}`
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.bill_id.trim()) { toast.error('Bill ID is required'); return }
    if (!form.patient_id) { toast.error('Select a patient'); return }
    if (total <= 0)        { toast.error('Enter at least one charge'); return }

    setSaving(true)
    const payload = {
      bill_id:           form.bill_id,
      patient_id:        form.patient_id,
      appointment_id:    form.appointment_id || null,
      invoice_number:    invoiceNumber(),
      consultation_fee:  parseFloat(form.consultation_fee)  || 0,
      lab_charges:       parseFloat(form.lab_charges)       || 0,
      medicine_charges:  parseFloat(form.medicine_charges)  || 0,
      other_charges:     parseFloat(form.other_charges)     || 0,
      total_amount:      total,
      payment_status:    form.payment_status,
      payment_method:    form.payment_method || null,
      date:              new Date().toISOString().split('T')[0],
    }
    const { error } = await supabase.from('bills').insert([payload])
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Bill generated successfully')
    onSaved()
    onClose()
  }

  return (
    <ModalShell title="Generate Bill" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Bill ID *</label>
          <input className="input" value={form.bill_id}
            onChange={e => set('bill_id', e.target.value)} placeholder="e.g. BILL-001" />
        </div>
        <div>
          <label className="label">Patient *</label>
          <select className="input" value={form.patient_id} onChange={e => set('patient_id', e.target.value)}>
            <option value="">Select patient…</option>
            {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Linked Appointment <span className="text-gray-400 font-normal">(optional)</span></label>
          <select
            className="input"
            value={form.appointment_id}
            onChange={e => set('appointment_id', e.target.value)}
            disabled={!form.patient_id}
          >
            <option value="">None</option>
            {appointments.map(a => (
              <option key={a.appointment_id} value={a.appointment_id}>
                {a.date} {a.time ? `· ${a.time}` : ''} {a.doctors?.name ? `· ${a.doctors.name}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Charges grid */}
        <div>
          <label className="label mb-2 block">Charges (₹)</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'consultation_fee',  label: 'Consultation' },
              { key: 'lab_charges',       label: 'Lab' },
              { key: 'medicine_charges',  label: 'Medicines' },
              { key: 'other_charges',     label: 'Other' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Total preview */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Total Amount</span>
          <span className="text-lg font-bold text-gray-900">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Payment Status</label>
            <select className="input" value={form.payment_status} onChange={e => set('payment_status', e.target.value)}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
              <option value="">Select…</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="insurance">Insurance</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        <ModalActions onClose={onClose} loading={saving} submitLabel="Generate Bill" />
      </form>
    </ModalShell>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReceptionistDashboard() {
  const navigate = useNavigate()

  const [stats,      setStats]      = useState({ today: null, total: null, pending: null, pendingBills: null })
  const [todayApts,  setTodayApts]  = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [aptsLoading,  setAptsLoading]  = useState(true)
  const [showBookApt,  setShowBookApt]  = useState(false)
  const [showBill,     setShowBill]     = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    await Promise.all([fetchStats(), fetchTodayAppointments()])
  }

  async function fetchStats() {
    const today = new Date().toISOString().split('T')[0]
    const [
      { count: todayCount },
      { count: totalCount },
      { count: scheduledCount },
      { count: pendingBills },
    ] = await Promise.all([
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'scheduled'),
      supabase.from('bills').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending'),
    ])
    setStats({ today: todayCount, total: totalCount, pending: scheduledCount, pendingBills })
    setStatsLoading(false)
  }

  async function fetchTodayAppointments() {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        appointment_id, date, time, status, symptoms,
        patients ( name, contact ),
        doctors  ( name ),
        departments ( name )
      `)
      .eq('date', today)
      .order('time', { ascending: true })

    if (!error) setTodayApts(data ?? [])
    setAptsLoading(false)
  }

  // Status breakdown counts from todayApts
  const breakdown = todayApts.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {})

  return (
    <ReceptionistLayout>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Reception Desk</h1>
          <p className="page-sub">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowBookApt(true)} className="btn-secondary text-sm">
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
          <button onClick={() => setShowBill(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Generate Bill
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={CalendarDays} label="Appointments Today" value={stats.today}       iconBg="bg-purple-100 text-purple-600" loading={statsLoading} />
        <StatCard icon={Clock}        label="Scheduled"          value={stats.pending}     iconBg="bg-blue-100 text-blue-600"   loading={statsLoading} />
        <StatCard icon={Users}        label="Total Appointments" value={stats.total}       iconBg="bg-teal-100 text-teal-600"   loading={statsLoading} />
        <StatCard icon={CreditCard}   label="Pending Bills"      value={stats.pendingBills} iconBg="bg-yellow-100 text-yellow-600" loading={statsLoading} />
      </div>

      {/* Body grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Today's appointments table — 2 cols */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Today's Appointments</h2>
              {!aptsLoading && (
                <span className="badge-purple ml-1">{todayApts.length}</span>
              )}
            </div>
            <button
              onClick={() => navigate('/receptionist/appointments')}
              className="text-xs text-purple-600 hover:underline flex items-center gap-1"
            >
              All appointments <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {aptsLoading ? (
            <SkeletonRows rows={5} cols={5} />
          ) : todayApts.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="w-10 h-10" />}
              title="No appointments today"
              sub="Use 'Book Appointment' to schedule one"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="th">Patient</th>
                    <th className="th">Doctor</th>
                    <th className="th">Dept</th>
                    <th className="th">Time</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {todayApts.map(a => (
                    <tr key={a.appointment_id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="td">
                        <p className="text-sm font-medium text-gray-900">{a.patients?.name ?? '—'}</p>
                        {a.patients?.contact && (
                          <p className="text-xs text-gray-400">{a.patients.contact}</p>
                        )}
                      </td>
                      <td className="td text-gray-600">{a.doctors?.name ?? '—'}</td>
                      <td className="td">
                        {a.departments?.name
                          ? <span className="badge-blue">{a.departments.name}</span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="td font-medium text-gray-800">{fmtTime(a.time)}</td>
                      <td className="td">
                        <span className={STATUS_STYLE[a.status] ?? 'badge-gray'}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Status breakdown */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Today's Status Breakdown</h2>
            {aptsLoading ? (
              <div className="space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-8 bg-gray-100 animate-pulse rounded-lg" />)}
              </div>
            ) : todayApts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-2.5">
                {[
                  { key: 'scheduled', label: 'Scheduled', icon: <Clock className="w-4 h-4" />,        color: 'bg-blue-100 text-blue-600' },
                  { key: 'completed', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-green-100 text-green-600' },
                  { key: 'pending',   label: 'Pending',   icon: <Hourglass className="w-4 h-4" />,    color: 'bg-yellow-100 text-yellow-600' },
                  { key: 'cancelled', label: 'Cancelled', icon: <XCircle className="w-4 h-4" />,      color: 'bg-red-100 text-red-600' },
                ].map(({ key, label, icon, color }) => {
                  const count = breakdown[key] || 0
                  const pct   = todayApts.length ? Math.round((count / todayApts.length) * 100) : 0
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">{label}</span>
                          <span className="text-gray-400">{count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              key === 'scheduled' ? 'bg-blue-500' :
                              key === 'completed' ? 'bg-green-500' :
                              key === 'pending'   ? 'bg-yellow-500' : 'bg-red-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Book Appointment',    style: 'btn-primary',   icon: <CalendarDays className="w-4 h-4" />, onClick: () => setShowBookApt(true) },
                { label: 'Generate Bill',       style: 'btn-primary',   icon: <CreditCard   className="w-4 h-4" />, onClick: () => setShowBill(true) },
                { label: 'View All Appointments', style: 'btn-secondary', icon: <CalendarDays className="w-4 h-4" />, onClick: () => navigate('/receptionist/appointments') },
                { label: 'View Billing',        style: 'btn-secondary', icon: <CreditCard   className="w-4 h-4" />, onClick: () => navigate('/receptionist/bills') },
                { label: 'Manage Patients',     style: 'btn-secondary', icon: <Users        className="w-4 h-4" />, onClick: () => navigate('/receptionist/patients') },
              ].map(a => (
                <button key={a.label} onClick={a.onClick} className={`${a.style} w-full justify-between text-sm`}>
                  <span className="flex items-center gap-2">{a.icon}{a.label}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {showBookApt && (
        <BookAppointmentModal
          onClose={() => setShowBookApt(false)}
          onSaved={fetchAll}
        />
      )}
      {showBill && (
        <GenerateBillModal
          onClose={() => setShowBill(false)}
          onSaved={fetchStats}
        />
      )}

    </ReceptionistLayout>
  )
}
