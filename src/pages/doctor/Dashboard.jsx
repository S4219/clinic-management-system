import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, Users, FileText, Clock,
  ChevronRight, AlertTriangle, CheckCircle2,
  Hourglass, XCircle, Plus
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import DoctorLayout from '../../layouts/DoctorLayout'

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  scheduled: 'badge-blue',
  completed:  'badge-green',
  cancelled:  'badge-red',
  pending:    'badge-yellow',
}

const STATUS_ICON = {
  scheduled: <Clock        className="w-3.5 h-3.5" />,
  completed:  <CheckCircle2 className="w-3.5 h-3.5" />,
  cancelled:  <XCircle      className="w-3.5 h-3.5" />,
  pending:    <Hourglass    className="w-3.5 h-3.5" />,
}

function fmtTime(t) {
  if (!t) return '—'
  const [h, m] = t.split(':')
  const hr = Number(h)
  return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
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

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
      <div className="text-gray-300 mb-3">{icon}</div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
function SkeletonRows({ rows = 4, cols = 4 }) {
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const doctorId  = user?.linked_id   // doctor_id from doctors table

  const [todayApts,  setTodayApts]  = useState([])
  const [patients,   setPatients]   = useState([])
  const [stats,      setStats]      = useState({ today: null, total: null, pending: null })
  const [statsLoading, setStatsLoading] = useState(true)
  const [aptsLoading,  setAptsLoading]  = useState(true)
  const [patsLoading,  setPatsLoading]  = useState(true)

  // Guard: doctor account not linked to a doctors row
  const notLinked = !doctorId

  useEffect(() => {
    if (notLinked) return
    fetchStats()
    fetchTodayAppointments()
    fetchPatients()
  }, [doctorId])

  // ── KPI counts ──────────────────────────────────────────────────────────────
  async function fetchStats() {
    const today = new Date().toISOString().split('T')[0]
    const [
      { count: todayCount },
      { count: totalCount },
      { count: pendingCount },
    ] = await Promise.all([
      supabase.from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('date', today),
      supabase.from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId),
      supabase.from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('status', 'scheduled'),
    ])
    setStats({ today: todayCount, total: totalCount, pending: pendingCount })
    setStatsLoading(false)
  }

  // ── Today's appointments ────────────────────────────────────────────────────
  async function fetchTodayAppointments() {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        appointment_id, date, time, status, symptoms,
        patients ( patient_id, name, age, gender, blood_group )
      `)
      .eq('doctor_id', doctorId)
      .eq('date', today)
      .order('time', { ascending: true })

    if (!error) setTodayApts(data ?? [])
    setAptsLoading(false)
  }

  // ── Unique patients who have seen this doctor ───────────────────────────────
  async function fetchPatients() {
    // Fetch all appointments for this doctor and collect unique patient records
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        patient_id,
        patients ( patient_id, name, age, gender, blood_group, contact, status, last_visit )
      `)
      .eq('doctor_id', doctorId)
      .order('date', { ascending: false })

    if (!error && data) {
      // Deduplicate by patient_id, keep the most-recent appointment row per patient
      const seen = new Set()
      const unique = []
      for (const row of data) {
        if (row.patients && !seen.has(row.patient_id)) {
          seen.add(row.patient_id)
          unique.push(row.patients)
        }
      }
      setPatients(unique)
    }
    setPatsLoading(false)
  }

  // ── Not linked guard ─────────────────────────────────────────────────────────
  if (notLinked) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="card p-10 text-center max-w-sm">
            <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-base font-semibold text-gray-900">Account not linked</h2>
            <p className="text-sm text-gray-500 mt-1">
              Your user account is not linked to a doctor record. Please ask an admin to set your <code className="bg-gray-100 px-1 rounded text-xs">linked_id</code>.
            </p>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <DoctorLayout>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Good {greeting()}, {firstName(user?.name)}</h1>
          <p className="page-sub">Here's your clinical summary for today</p>
        </div>
        <button
          onClick={() => navigate('/doctor/prescriptions')}
          className="btn-primary text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Write Prescription
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={CalendarDays}
          label="Appointments Today"
          value={stats.today}
          iconBg="bg-teal-100 text-teal-600"
          loading={statsLoading}
        />
        <StatCard
          icon={Users}
          label="My Patients"
          value={patients.length || (patsLoading ? null : 0)}
          iconBg="bg-blue-100 text-blue-600"
          loading={patsLoading}
        />
        <StatCard
          icon={FileText}
          label="Scheduled (Upcoming)"
          value={stats.pending}
          iconBg="bg-purple-100 text-purple-600"
          loading={statsLoading}
        />
      </div>

      {/* Body grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* ── Today's appointments — 3 cols ── */}
        <div className="xl:col-span-3 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Today's Appointments</h2>
              {!aptsLoading && (
                <span className="badge-teal ml-1">{todayApts.length}</span>
              )}
            </div>
            <button
              onClick={() => navigate('/doctor/appointments')}
              className="text-xs text-teal-600 hover:underline flex items-center gap-1"
            >
              All appointments <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {aptsLoading ? (
            <SkeletonRows rows={4} cols={5} />
          ) : todayApts.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="w-10 h-10" />}
              title="No appointments today"
              sub="Your schedule is clear for today"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="th">Patient</th>
                    <th className="th">Age</th>
                    <th className="th">Time</th>
                    <th className="th">Symptoms</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {todayApts.map(apt => (
                    <tr key={apt.appointment_id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="td">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold flex-shrink-0">
                            {apt.patients?.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 leading-none">
                              {apt.patients?.name ?? '—'}
                            </p>
                            {apt.patients?.blood_group && (
                              <p className="text-xs text-gray-400 mt-0.5">{apt.patients.blood_group}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="td text-gray-600">{apt.patients?.age ?? '—'}</td>
                      <td className="td">
                        <span className="text-sm font-medium text-gray-800">{fmtTime(apt.time)}</span>
                      </td>
                      <td className="td">
                        <span
                          className="text-sm text-gray-500 block max-w-[160px] truncate"
                          title={apt.symptoms ?? ''}
                        >
                          {apt.symptoms || '—'}
                        </span>
                      </td>
                      <td className="td">
                        <span className={`${STATUS_STYLE[apt.status] ?? 'badge-gray'} inline-flex items-center gap-1`}>
                          {STATUS_ICON[apt.status]}
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Right col — 2 cols ── */}
        <div className="xl:col-span-2 flex flex-col gap-5">

          {/* My patients */}
          <div className="card overflow-hidden flex-1">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">My Patients</h2>
                {!patsLoading && (
                  <span className="badge-blue ml-1">{patients.length}</span>
                )}
              </div>
              <button
                onClick={() => navigate('/doctor/patients')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {patsLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 animate-pulse rounded w-3/4" />
                      <div className="h-2.5 bg-gray-100 animate-pulse rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : patients.length === 0 ? (
              <EmptyState
                icon={<Users className="w-9 h-9" />}
                title="No patients yet"
                sub="Patients will appear here after appointments"
              />
            ) : (
              <ul className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {patients.map(p => (
                  <li key={p.patient_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                      {p.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {[p.age && `${p.age} yrs`, p.gender, p.blood_group].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className={p.status === 'active' ? 'badge-green' : 'badge-gray'}>
                        {p.status ?? 'active'}
                      </span>
                      {p.last_visit && (
                        <p className="text-xs text-gray-400 mt-1">{fmtDate(p.last_visit)}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                {
                  label: 'Write a Prescription',
                  icon: <FileText className="w-4 h-4" />,
                  style: 'btn-primary',
                  onClick: () => navigate('/doctor/prescriptions'),
                },
                {
                  label: "View Today's Schedule",
                  icon: <CalendarDays className="w-4 h-4" />,
                  style: 'btn-secondary',
                  onClick: () => navigate('/doctor/appointments'),
                },
                {
                  label: 'View All Patients',
                  icon: <Users className="w-4 h-4" />,
                  style: 'btn-secondary',
                  onClick: () => navigate('/doctor/patients'),
                },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={a.onClick}
                  className={`${a.style} w-full justify-between text-sm`}
                >
                  <span className="flex items-center gap-2">{a.icon}{a.label}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

    </DoctorLayout>
  )
}

// ── tiny helpers ──────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function firstName(full) {
  if (!full) return ''
  return full.split(' ')[0]
}
