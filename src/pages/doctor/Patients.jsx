import { useEffect, useState } from 'react'
import { Search, Eye } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import DoctorLayout from '../../layouts/DoctorLayout'
import { ModalShell } from '../../components/shared/Modal'
import toast from 'react-hot-toast'

const STATUS_BADGE = { active: 'badge-green', inactive: 'badge-gray' }

export default function DoctorPatients() {
  const { user } = useAuth()
  const doctorId = user?.linked_id

  const [patients, setPatients] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [viewing,  setViewing]  = useState(null)

  useEffect(() => {
    if (!doctorId) return
    fetchPatients()
  }, [doctorId])

  async function fetchPatients() {
    setLoading(true)
    // Get all appointments for this doctor, join patients, deduplicate
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        patient_id,
        patients (
          patient_id, name, age, gender, contact, email,
          blood_group, address, emergency_contact,
          status, last_visit, medical_history
        )
      `)
      .eq('doctor_id', doctorId)
      .order('date', { ascending: false })

    if (error) { toast.error(error.message); setLoading(false); return }

    // Deduplicate by patient_id
    const seen = new Set()
    const unique = []
    for (const row of (data ?? [])) {
      if (row.patients && !seen.has(row.patient_id)) {
        seen.add(row.patient_id)
        unique.push(row.patients)
      }
    }
    setPatients(unique)
    setLoading(false)
  }

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.contact?.includes(search) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DoctorLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">My Patients</h1>
          <p className="page-sub">{patients.length} unique patients under your care</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search name, contact, email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="th">Patient</th>
                <th className="th">Age / Gender</th>
                <th className="th">Blood Group</th>
                <th className="th">Contact</th>
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
                : filtered.length === 0
                  ? <tr><td colSpan={7} className="text-center py-14 text-sm text-gray-400">No patients found</td></tr>
                  : filtered.map(p => (
                      <tr key={p.patient_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="td">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                              {p.name?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          </div>
                        </td>
                        <td className="td text-gray-600">{p.age}{p.gender ? ` / ${p.gender}` : ''}</td>
                        <td className="td text-gray-600">{p.blood_group || '—'}</td>
                        <td className="td text-gray-600">{p.contact || '—'}</td>
                        <td className="td text-gray-500">{p.last_visit || '—'}</td>
                        <td className="td">
                          <span className={STATUS_BADGE[p.status] ?? 'badge-gray'}>{p.status || 'active'}</span>
                        </td>
                        <td className="td">
                          <button onClick={() => setViewing(p)} className="btn-ghost p-1.5" title="View details">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {filtered.length} of {patients.length} patients
            </p>
          </div>
        )}
      </div>

      {/* Patient detail modal */}
      {viewing && (
        <ModalShell
          title="Patient Details"
          subtitle={`ID: ${viewing.patient_id}`}
          onClose={() => setViewing(null)}
          size="md"
        >
          <div className="space-y-4">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {viewing.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{viewing.name}</p>
                <p className="text-sm text-gray-500">
                  {[viewing.age && `${viewing.age} yrs`, viewing.gender, viewing.blood_group].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                ['Contact',           viewing.contact || '—'],
                ['Email',             viewing.email || '—'],
                ['Blood Group',       viewing.blood_group || '—'],
                ['Emergency Contact', viewing.emergency_contact || '—'],
                ['Status',            viewing.status || 'active'],
                ['Last Visit',        viewing.last_visit || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{k}</dt>
                  <dd className="text-sm text-gray-800 mt-0.5">{v}</dd>
                </div>
              ))}
              {viewing.address && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Address</dt>
                  <dd className="text-sm text-gray-800 mt-0.5">{viewing.address}</dd>
                </div>
              )}
            </dl>

            {viewing.medical_history && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Medical History</p>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-gray-800 leading-relaxed">
                  {viewing.medical_history}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <button className="btn-secondary" onClick={() => setViewing(null)}>Close</button>
          </div>
        </ModalShell>
      )}
    </DoctorLayout>
  )
}
