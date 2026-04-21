import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight, FileText } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import DoctorLayout from '../../layouts/DoctorLayout'
import { ModalShell, ModalActions } from '../../components/shared/Modal'
import Pagination from '../../components/shared/Pagination'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10

const EMPTY_RX = {
  prescription_id: '', patient_id: '', appointment_id: '',
  diagnosis: '', instructions: '',
  date: new Date().toISOString().split('T')[0],
}

const EMPTY_MED = { medicine_id: '', medicine_name: '', dosage: '', frequency: '', duration: '' }

export default function DoctorPrescriptions() {
  const { user } = useAuth()
  const doctorId = user?.linked_id

  const [rows,     setRows]     = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [expanded, setExpanded] = useState(null)

  // Write prescription state
  const [showWrite, setShowWrite] = useState(false)
  const [patients,  setPatients]  = useState([])
  const [aptOpts,   setAptOpts]   = useState([])
  const [form,      setForm]      = useState(EMPTY_RX)
  const [medicines, setMedicines] = useState([{ ...EMPTY_MED }])
  const [saving,    setSaving]    = useState(false)

  // View modal
  const [viewing, setViewing] = useState(null)

  const fetch = useCallback(async (p = page) => {
    if (!doctorId) return
    setLoading(true)
    const from = (p - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let q = supabase.from('prescriptions')
      .select(`
        prescription_id, diagnosis, instructions, date,
        patients ( name ),
        prescription_medicines ( medicine_id, medicine_name, dosage, frequency, duration )
      `, { count: 'exact' })
      .eq('doctor_id', doctorId)
      .order('date', { ascending: false })
      .range(from, to)

    const { data, count, error } = await q
    if (error) toast.error(error.message)
    else { setRows(data ?? []); setTotal(count ?? 0) }
    setLoading(false)
  }, [doctorId, page])

  useEffect(() => { fetch(page) }, [page])

  // Load doctor's unique patients for the form dropdown
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

  // When patient changes in form, load their appointments with this doctor
  useEffect(() => {
    if (!form.patient_id || !doctorId) { setAptOpts([]); return }
    supabase.from('appointments')
      .select('appointment_id, date, time')
      .eq('patient_id', form.patient_id)
      .eq('doctor_id', doctorId)
      .order('date', { ascending: false })
      .limit(20)
      .then(({ data }) => setAptOpts(data ?? []))
  }, [form.patient_id, doctorId])

  // Medicine list helpers
  function addMed()            { setMedicines(m => [...m, { ...EMPTY_MED }]) }
  function removeMed(i)        { setMedicines(m => m.filter((_, idx) => idx !== i)) }
  function setMed(i, k, v)     { setMedicines(m => m.map((med, idx) => idx === i ? { ...med, [k]: v } : med)) }

  async function handleWrite(e) {
    e.preventDefault()
    if (!form.prescription_id.trim()) { toast.error('Prescription ID is required'); return }
    if (!form.patient_id)        { toast.error('Select a patient'); return }
    if (!form.diagnosis.trim())  { toast.error('Diagnosis is required'); return }
    const validMeds = medicines.filter(m => m.medicine_name.trim())
    if (validMeds.length === 0)  { toast.error('Add at least one medicine'); return }
    const missingMedId = validMeds.find(m => !m.medicine_id.trim())
    if (missingMedId) { toast.error('Medicine ID is required for all medicines'); return }

    setSaving(true)
    try {
      // 1. Insert prescription row
      const { data: rxData, error: rxErr } = await supabase
        .from('prescriptions')
        .insert([{
          prescription_id: form.prescription_id,
          doctor_id:      doctorId,
          patient_id:     form.patient_id,
          appointment_id: form.appointment_id || null,
          diagnosis:      form.diagnosis.trim(),
          instructions:   form.instructions.trim() || null,
          date:           form.date,
        }])
        .select('prescription_id')
        .single()

      if (rxErr) throw rxErr

      // 2. Insert medicines
      const medRows = validMeds.map(m => ({
        medicine_id:     m.medicine_id,
        prescription_id: rxData.prescription_id,
        medicine_name:   m.medicine_name.trim(),
        dosage:          m.dosage.trim() || null,
        frequency:       m.frequency.trim() || null,
        duration:        m.duration.trim() || null,
      }))

      const { error: medErr } = await supabase
        .from('prescription_medicines')
        .insert(medRows)

      if (medErr) throw medErr

      toast.success('Prescription saved successfully')
      setShowWrite(false)
      setForm(EMPTY_RX)
      setMedicines([{ ...EMPTY_MED }])
      fetch(1); setPage(1)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <DoctorLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Prescriptions</h1>
          <p className="page-sub">{total} prescriptions written</p>
        </div>
        <button onClick={() => { setForm(EMPTY_RX); setMedicines([{ ...EMPTY_MED }]); setShowWrite(true) }}
          className="btn-primary text-sm self-start">
          <Plus className="w-4 h-4" /> Write Prescription
        </button>
      </div>


      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="th w-8"></th>
                <th className="th">Date</th>
                <th className="th">Patient</th>
                <th className="th">Diagnosis</th>
                <th className="th">Medicines</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={6}><div className="h-5 m-4 bg-gray-100 animate-pulse rounded" /></td></tr>
                  ))
                : rows.length === 0
                  ? <tr><td colSpan={6} className="text-center py-14 text-sm text-gray-400">No prescriptions yet. Write your first one.</td></tr>
                  : rows.map(r => {
                      const isOpen = expanded === r.prescription_id
                      const medCount = r.prescription_medicines?.length ?? 0
                      return (
                        <>
                          <tr key={r.prescription_id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="td">
                              {medCount > 0 && (
                                <button
                                  onClick={() => setExpanded(isOpen ? null : r.prescription_id)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                              )}
                            </td>
                            <td className="td text-gray-600">{r.date}</td>
                            <td className="td font-medium text-gray-900">{r.patients?.name ?? '—'}</td>
                            <td className="td text-gray-700 max-w-[200px] truncate" title={r.diagnosis ?? ''}>
                              {r.diagnosis || '—'}
                            </td>
                            <td className="td">
                              <span className="badge-teal">{medCount} med{medCount !== 1 ? 's' : ''}</span>
                            </td>
                            <td className="td">
                              <button
                                onClick={() => setViewing(r)}
                                className="btn-ghost text-xs py-1 px-2"
                              >
                                <FileText className="w-3.5 h-3.5" /> View
                              </button>
                            </td>
                          </tr>

                          {isOpen && medCount > 0 && (
                            <tr key={`${r.prescription_id}-meds`}>
                              <td colSpan={6} className="bg-teal-50/40 px-8 py-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Medicines
                                </p>
                                <table className="w-full">
                                  <thead>
                                    <tr>
                                      <th className="th py-1 bg-transparent text-left">Medicine</th>
                                      <th className="th py-1 bg-transparent text-left">Dosage</th>
                                      <th className="th py-1 bg-transparent text-left">Frequency</th>
                                      <th className="th py-1 bg-transparent text-left">Duration</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {r.prescription_medicines.map(m => (
                                      <tr key={m.medicine_id}>
                                        <td className="td py-2 font-medium text-gray-800">{m.medicine_name}</td>
                                        <td className="td py-2 text-gray-600">{m.dosage || '—'}</td>
                                        <td className="td py-2 text-gray-600">{m.frequency || '—'}</td>
                                        <td className="td py-2 text-gray-600">{m.duration || '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {r.instructions && (
                                  <p className="text-xs text-gray-600 mt-2 italic">
                                    <span className="font-semibold not-italic">Instructions:</span> {r.instructions}
                                  </p>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })
              }
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={p => { setPage(p); fetch(p) }} />
      </div>

      {/* ── Write Prescription modal ── */}
      {showWrite && (
        <ModalShell
          title="Write Prescription"
          subtitle="Saves to prescriptions + prescription_medicines"
          onClose={() => setShowWrite(false)}
          size="xl"
        >
          <form onSubmit={handleWrite}>
            {/* Prescription ID */}
            <div className="mb-4">
              <label className="label">Prescription ID *</label>
              <input className="input" value={form.prescription_id}
                onChange={e => setF('prescription_id', e.target.value)}
                placeholder="e.g. RX-001" />
            </div>

            {/* Patient + appointment + date */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="col-span-2">
                <label className="label">Patient *</label>
                <select className="input" value={form.patient_id} onChange={e => setF('patient_id', e.target.value)}>
                  <option value="">Select patient…</option>
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input className="input" type="date" value={form.date}
                  onChange={e => setF('date', e.target.value)} />
              </div>
              <div className="col-span-3">
                <label className="label">
                  Linked Appointment <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select className="input" value={form.appointment_id}
                  onChange={e => setF('appointment_id', e.target.value)}
                  disabled={!form.patient_id}>
                  <option value="">None</option>
                  {aptOpts.map(a => (
                    <option key={a.appointment_id} value={a.appointment_id}>
                      {a.date}{a.time ? ` · ${a.time}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="label">Diagnosis *</label>
              <input className="input" value={form.diagnosis}
                onChange={e => setF('diagnosis', e.target.value)}
                placeholder="Primary diagnosis…" />
            </div>

            <div className="mb-5">
              <label className="label">Instructions</label>
              <textarea className="input resize-none" rows={2} value={form.instructions}
                onChange={e => setF('instructions', e.target.value)}
                placeholder="General instructions, dietary advice, follow-up…" />
            </div>

            {/* Medicine list */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Medicines * <span className="text-gray-400 font-normal">(at least one)</span></label>
                <button type="button" onClick={addMed}
                  className="btn-ghost text-xs py-1 px-2 text-teal-600 hover:bg-teal-50">
                  <Plus className="w-3.5 h-3.5" /> Add Medicine
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <p className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Med ID *</p>
                  <p className="col-span-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicine Name</p>
                  <p className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dosage</p>
                  <p className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Frequency</p>
                  <p className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</p>
                  <p className="col-span-1"></p>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-100">
                  {medicines.map((med, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                      <div className="col-span-2">
                        <input
                          className="input text-sm py-1.5"
                          placeholder="MED-001"
                          value={med.medicine_id}
                          onChange={e => setMed(i, 'medicine_id', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          className="input text-sm py-1.5"
                          placeholder="e.g. Paracetamol"
                          value={med.medicine_name}
                          onChange={e => setMed(i, 'medicine_name', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          className="input text-sm py-1.5"
                          placeholder="500mg"
                          value={med.dosage}
                          onChange={e => setMed(i, 'dosage', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          className="input text-sm py-1.5"
                          placeholder="Twice daily"
                          value={med.frequency}
                          onChange={e => setMed(i, 'frequency', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          className="input text-sm py-1.5"
                          placeholder="5 days"
                          value={med.duration}
                          onChange={e => setMed(i, 'duration', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {medicines.length > 1 && (
                          <button type="button" onClick={() => removeMed(i)}
                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <ModalActions onClose={() => setShowWrite(false)} loading={saving} submitLabel="Save Prescription" />
          </form>
        </ModalShell>
      )}

      {/* ── View Prescription modal ── */}
      {viewing && (
        <ModalShell
          title="Prescription"
          subtitle={`${viewing.patients?.name} · ${viewing.date}`}
          onClose={() => setViewing(null)}
          size="lg"
        >
          <div className="space-y-4">
            {viewing.diagnosis && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Diagnosis</p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{viewing.diagnosis}</p>
              </div>
            )}
            {viewing.instructions && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Instructions</p>
                <p className="text-sm text-gray-800 bg-blue-50 rounded-lg p-3 leading-relaxed">{viewing.instructions}</p>
              </div>
            )}
            {(viewing.prescription_medicines?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Medicines</p>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="th">Medicine</th>
                        <th className="th">Dosage</th>
                        <th className="th">Frequency</th>
                        <th className="th">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {viewing.prescription_medicines.map(m => (
                        <tr key={m.medicine_id}>
                          <td className="td font-medium">{m.medicine_name}</td>
                          <td className="td text-gray-600">{m.dosage || '—'}</td>
                          <td className="td text-gray-600">{m.frequency || '—'}</td>
                          <td className="td text-gray-600">{m.duration || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
