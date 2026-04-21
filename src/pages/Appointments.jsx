import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const EMPTY_FORM = {
  appointment_id: '', patient_id: '', doctor_id: '', department_id: '',
  date: '', time: '', status: 'scheduled', symptoms: '',
}

const STATUS_BADGE = {
  scheduled: 'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-red',
  pending: 'badge-yellow',
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [{ data: apts }, { data: pats }, { data: docs }, { data: depts }] = await Promise.all([
      supabase.from('appointments')
        .select('*, patients(name), doctors(name), departments(name)')
        .order('date', { ascending: false }),
      supabase.from('patients').select('patient_id, name').order('name'),
      supabase.from('doctors').select('doctor_id, name, department_id').order('name'),
      supabase.from('departments').select('department_id, name').order('name'),
    ])
    setAppointments(apts || [])
    setPatients(pats || [])
    setDoctors(docs || [])
    setDepartments(depts || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.appointment_id.trim()) { alert('Appointment ID is required'); return }
    setSaving(true)
    const payload = { ...form }
    if (!payload.department_id) delete payload.department_id
    const { error } = await supabase.from('appointments').insert([payload])
    setSaving(false)
    if (!error) {
      setShowModal(false)
      setForm(EMPTY_FORM)
      fetchAll()
    } else {
      alert('Error: ' + error.message)
    }
  }

  function handleDoctorChange(e) {
    const doctorId = e.target.value
    const doctor = doctors.find(d => d.doctor_id === doctorId)
    setForm({ ...form, doctor_id: doctorId, department_id: doctor?.department_id || '' })
  }

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Appointments</h1>
          <p>{appointments.length} total appointments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Book Appointment
        </button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>All Appointments</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'scheduled', 'completed', 'cancelled'].map(s => (
              <button
                key={s}
                className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(s)}
                style={{ textTransform: 'capitalize' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="loading">Loading appointments...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>No appointments found</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Date</th>
                <th>Time</th>
                <th>Symptoms</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.appointment_id}>
                  <td><strong>{a.patients?.name || '—'}</strong></td>
                  <td>{a.doctors?.name || '—'}</td>
                  <td>{a.departments?.name || '—'}</td>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.symptoms || '—'}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[a.status] || 'badge-gray'}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Book Appointment</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group full">
                    <label>Appointment ID *</label>
                    <input required value={form.appointment_id} onChange={e => setForm({...form, appointment_id: e.target.value})} placeholder="e.g. APT-001" />
                  </div>
                  <div className="form-group full">
                    <label>Patient *</label>
                    <select required value={form.patient_id} onChange={e => setForm({...form, patient_id: e.target.value})}>
                      <option value="">Select patient...</option>
                      {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Doctor *</label>
                    <select required value={form.doctor_id} onChange={handleDoctorChange}>
                      <option value="">Select doctor...</option>
                      {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Department</label>
                    <select value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})}>
                      <option value="">Select department...</option>
                      {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date *</label>
                    <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Time *</label>
                    <input required type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      <option value="scheduled">Scheduled</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Symptoms</label>
                    <textarea value={form.symptoms} onChange={e => setForm({...form, symptoms: e.target.value})} placeholder="Describe symptoms..." />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Booking...' : 'Book Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
