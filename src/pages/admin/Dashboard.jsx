import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Stethoscope, CalendarDays, CreditCard,
  TrendingUp, Plus, X, ChevronRight, Clock, AlertCircle
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import AdminLayout from '../../layouts/AdminLayout'
import toast from 'react-hot-toast'

// ── helpers ──────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  scheduled: 'badge-blue',
  completed:  'badge-green',
  cancelled:  'badge-red',
  pending:    'badge-yellow',
}

function statusBadge(status) {
  return STATUS_STYLE[status] ?? 'badge-gray'
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, iconBg, loading }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        {loading
          ? <div className="h-7 w-16 bg-gray-100 animate-pulse rounded mb-1" />
          : <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        }
        <p className="text-sm text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Add Patient modal ─────────────────────────────────────────────────────────
const PATIENT_EMPTY = {
  patient_id: '', name: '', age: '', gender: '', contact: '', email: '',
  address: '', blood_group: '', emergency_contact: '', status: 'active', medical_history: '',
}

function AddPatientModal({ onClose, onSaved }) {
  const [form, setForm] = useState(PATIENT_EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    if (!form.patient_id.trim()) { toast.error('Patient ID is required'); return }
    if (!form.name || !form.age || !form.gender || !form.contact) {
      toast.error('Name, age, gender and contact are required')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('patients').insert([{
      ...form,
      age: Number(form.age),
    }])
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Patient added successfully')
    onSaved()
    onClose()
  }

  return (
    <ModalShell title="Add New Patient" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Patient ID *</label>
            <input className="input" value={form.patient_id} onChange={e => set('patient_id', e.target.value)} placeholder="e.g. PAT-001" />
          </div>
          <div className="col-span-2">
            <label className="label">Full Name *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Priya Sharma" />
          </div>
          <div>
            <label className="label">Age *</label>
            <input className="input" type="number" min="0" max="150" value={form.age} onChange={e => set('age', e.target.value)} placeholder="28" />
          </div>
          <div>
            <label className="label">Gender *</label>
            <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option value="">Select…</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="label">Contact *</label>
            <input className="input" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="+91 9876543210" />
          </div>
          <div>
            <label className="label">Blood Group</label>
            <select className="input" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
              <option value="">Select…</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="patient@example.com" />
          </div>
          <div className="col-span-2">
            <label className="label">Emergency Contact</label>
            <input className="input" value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} placeholder="Name — Phone" />
          </div>
          <div className="col-span-2">
            <label className="label">Address</label>
            <textarea className="input resize-none" rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, City, State" />
          </div>
          <div className="col-span-2">
            <label className="label">Medical History</label>
            <textarea className="input resize-none" rows={2} value={form.medical_history} onChange={e => set('medical_history', e.target.value)} placeholder="Known conditions, allergies, past surgeries…" />
          </div>
        </div>
        <ModalActions onClose={onClose} loading={saving} submitLabel="Add Patient" />
      </form>
    </ModalShell>
  )
}

// ── Book Appointment modal ────────────────────────────────────────────────────
const APT_EMPTY = {
  appointment_id: '', patient_id: '', doctor_id: '', department_id: '',
  date: '', time: '', status: 'scheduled', symptoms: '',
}

function BookAppointmentModal({ onClose, onSaved }) {
  const [form, setForm] = useState(APT_EMPTY)
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors]   = useState([])
  const [depts, setDepts]       = useState([])
  const [saving, setSaving]     = useState(false)
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

  function pickDoctor(doctorId) {
    const doc = doctors.find(d => d.doctor_id === doctorId)
    setForm(f => ({ ...f, doctor_id: doctorId, department_id: doc?.department_id ?? '' }))
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
    toast.success('Appointment booked successfully')
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
          <textarea className="input resize-none" rows={2} value={form.symptoms} onChange={e => set('symptoms', e.target.value)} placeholder="Brief description of symptoms…" />
        </div>
        <ModalActions onClose={onClose} loading={saving} submitLabel="Book Appointment" />
      </form>
    </ModalShell>
  )
}

// ── Shared modal shell + actions ──────────────────────────────────────────────
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading
          ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          : null}
        {loading ? 'Saving…' : submitLabel}
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()

  const [kpi, setKpi] = useState({
    patients: null, doctors: null, todayApts: null, pendingBills: null
  })
  const [recentApts, setRecentApts]   = useState([])
  const [todayApts, setTodayApts]     = useState([])
  const [kpiLoading, setKpiLoading]   = useState(true)
  const [tableLoading, setTableLoading] = useState(true)
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [showBookApt,    setShowBookApt]    = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    await Promise.all([fetchKpi(), fetchAppointments()])
  }

  async function fetchKpi() {
    const today = new Date().toISOString().split('T')[0]
    const [
      { count: patients },
      { count: doctors },
      { count: todayApts },
      { count: pendingBills },
    ] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('doctors').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today),
      supabase.from('bills').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending'),
    ])
    setKpi({ patients, doctors, todayApts, pendingBills })
    setKpiLoading(false)
  }

  async function fetchAppointments() {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: recent }, { data: todayList }] = await Promise.all([
      supabase
        .from('appointments')
        .select('appointment_id, date, time, status, symptoms, patients(name), doctors(name)')
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(8),
      supabase
        .from('appointments')
        .select('appointment_id, date, time, status, patients(name), doctors(name)')
        .eq('date', today)
        .order('time', { ascending: true }),
    ])
    setRecentApts(recent ?? [])
    setTodayApts(todayList ?? [])
    setTableLoading(false)
  }

  return (
    <AdminLayout>
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Here's what's happening at the clinic today</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddPatient(true)}
            className="btn-secondary text-sm"
          >
            <Plus className="w-4 h-4" /> Add Patient
          </button>
          <button
            onClick={() => setShowBookApt(true)}
            className="btn-primary text-sm"
          >
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={Users}
          label="Total Patients"
          value={kpi.patients ?? '—'}
          iconBg="bg-blue-100 text-blue-600"
          loading={kpiLoading}
        />
        <KpiCard
          icon={Stethoscope}
          label="Total Doctors"
          value={kpi.doctors ?? '—'}
          iconBg="bg-teal-100 text-teal-600"
          loading={kpiLoading}
        />
        <KpiCard
          icon={CalendarDays}
          label="Today's Appointments"
          value={kpi.todayApts ?? '—'}
          sub={`${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`}
          iconBg="bg-purple-100 text-purple-600"
          loading={kpiLoading}
        />
        <KpiCard
          icon={CreditCard}
          label="Pending Bills"
          value={kpi.pendingBills ?? '—'}
          iconBg="bg-yellow-100 text-yellow-600"
          loading={kpiLoading}
        />
      </div>

      {/* ── Body: 2-col grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Recent appointments table — spans 2 cols */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Appointments</h2>
            </div>
            <button
              onClick={() => navigate('/admin/appointments')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {tableLoading ? (
            <TableSkeleton cols={5} rows={5} />
          ) : recentApts.length === 0 ? (
            <EmptyState icon={<CalendarDays className="w-8 h-8 text-gray-300" />} text="No appointments found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="th">Patient</th>
                    <th className="th">Doctor</th>
                    <th className="th">Date</th>
                    <th className="th">Time</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentApts.map(a => (
                    <tr key={a.appointment_id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="td font-medium text-gray-900">{a.patients?.name ?? '—'}</td>
                      <td className="td text-gray-600">{a.doctors?.name ?? '—'}</td>
                      <td className="td text-gray-600">{fmt(a.date)}</td>
                      <td className="td text-gray-600">{a.time ?? '—'}</td>
                      <td className="td">
                        <span className={statusBadge(a.status)}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: Today's schedule + Quick actions */}
        <div className="flex flex-col gap-5">

          {/* Today's schedule */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Clock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Today's Schedule</h2>
              {kpi.todayApts !== null && (
                <span className="ml-auto badge-blue">{kpi.todayApts}</span>
              )}
            </div>

            {tableLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg" />)}
              </div>
            ) : todayApts.length === 0 ? (
              <EmptyState icon={<Clock className="w-7 h-7 text-gray-300" />} text="No appointments today" />
            ) : (
              <ul className="divide-y divide-gray-50">
                {todayApts.slice(0, 6).map(a => (
                  <li key={a.appointment_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                      {a.patients?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{a.patients?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{a.doctors?.name ?? '—'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-gray-700">{a.time ?? '—'}</p>
                      <span className={`text-[10px] ${statusBadge(a.status)}`}>{a.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
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
                { label: 'Add New Patient',     onClick: () => setShowAddPatient(true), style: 'btn-primary' },
                { label: 'Book Appointment',     onClick: () => setShowBookApt(true),   style: 'btn-secondary' },
                { label: 'View All Patients',    onClick: () => navigate('/admin/patients'),      style: 'btn-secondary' },
                { label: 'View Billing',         onClick: () => navigate('/admin/bills'),         style: 'btn-secondary' },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={a.onClick}
                  className={`${a.style} w-full justify-between text-sm`}
                >
                  {a.label}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showAddPatient && (
        <AddPatientModal
          onClose={() => setShowAddPatient(false)}
          onSaved={fetchKpi}
        />
      )}
      {showBookApt && (
        <BookAppointmentModal
          onClose={() => setShowBookApt(false)}
          onSaved={fetchAppointments}
        />
      )}
    </AdminLayout>
  )
}

// ── Utility sub-components ────────────────────────────────────────────────────
function TableSkeleton({ cols, rows }) {
  return (
    <div className="p-4 space-y-2">
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

function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon}
      <p className="text-sm text-gray-400 mt-2">{text}</p>
    </div>
  )
}
