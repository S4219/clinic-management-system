import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const EMPTY_FORM = {
  patient_id: '', name: '', age: '', gender: '', contact: '', email: '',
  address: '', blood_group: '', emergency_contact: '', status: 'active', medical_history: '',
}

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchPatients() }, [])

  async function fetchPatients() {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .order('name')
    setPatients(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.patient_id.trim()) { alert('Patient ID is required'); return }
    setSaving(true)
    const { error } = await supabase.from('patients').insert([{
      ...form,
      age: Number(form.age),
    }])
    setSaving(false)
    if (!error) {
      setShowModal(false)
      setForm(EMPTY_FORM)
      fetchPatients()
    } else {
      alert('Error: ' + error.message)
    }
  }

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.contact?.includes(search) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  const statusBadge = (s) => s === 'active' ? 'badge-green' : 'badge-gray'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Patients</h1>
          <p>{patients.length} total patients registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Patient
        </button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>All Patients</h2>
          <input
            className="search-input"
            placeholder="Search by name, contact, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="loading">Loading patients...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>No patients found</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Contact</th>
                <th>Blood Group</th>
                <th>Last Visit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.patient_id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.age}</td>
                  <td>{p.gender}</td>
                  <td>{p.contact}</td>
                  <td>{p.blood_group || '—'}</td>
                  <td>{p.last_visit || '—'}</td>
                  <td><span className={`badge ${statusBadge(p.status)}`}>{p.status}</span></td>
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
              <h2>Add New Patient</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Patient ID *</label>
                    <input required value={form.patient_id} onChange={e => setForm({...form, patient_id: e.target.value})} placeholder="e.g. PAT-001" />
                  </div>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Age *</label>
                    <input required type="number" min="0" max="150" value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Gender *</label>
                    <select required value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                      <option value="">Select...</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Blood Group</label>
                    <select value={form.blood_group} onChange={e => setForm({...form, blood_group: e.target.value})}>
                      <option value="">Select...</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Contact *</label>
                    <input required value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact</label>
                    <input value={form.emergency_contact} onChange={e => setForm({...form, emergency_contact: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Address</label>
                    <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={2} />
                  </div>
                  <div className="form-group full">
                    <label>Medical History</label>
                    <textarea value={form.medical_history} onChange={e => setForm({...form, medical_history: e.target.value})} rows={3} placeholder="Known conditions, allergies, previous surgeries..." />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Add Patient'}
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
