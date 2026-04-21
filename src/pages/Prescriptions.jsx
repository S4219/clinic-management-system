import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchPrescriptions() }, [])

  async function fetchPrescriptions() {
    const { data } = await supabase
      .from('prescriptions')
      .select(`
        *,
        patients(name),
        doctors(name),
        prescription_medicines(medicine_id, medicine_name, dosage, frequency, duration)
      `)
      .order('date', { ascending: false })
    setPrescriptions(data || [])
    setLoading(false)
  }

  const filtered = prescriptions.filter(p =>
    p.patients?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.doctors?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.diagnosis?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Prescriptions</h1>
          <p>{prescriptions.length} prescriptions on record</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>All Prescriptions</h2>
          <input
            className="search-input"
            placeholder="Search by patient, doctor, diagnosis..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="loading">Loading prescriptions...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>No prescriptions found</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Diagnosis</th>
                <th>Medicines</th>
                <th>Instructions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(rx => (
                <>
                  <tr key={rx.prescription_id}>
                    <td>{rx.date}</td>
                    <td><strong>{rx.patients?.name || '—'}</strong></td>
                    <td>{rx.doctors?.name || '—'}</td>
                    <td>{rx.diagnosis || '—'}</td>
                    <td>
                      <span className="badge badge-purple">
                        {rx.prescription_medicines?.length || 0} medicine{rx.prescription_medicines?.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rx.instructions || '—'}
                    </td>
                    <td>
                      {rx.prescription_medicines?.length > 0 && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setExpanded(expanded === rx.prescription_id ? null : rx.prescription_id)}
                        >
                          {expanded === rx.prescription_id ? 'Hide' : 'View'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === rx.prescription_id && rx.prescription_medicines?.length > 0 && (
                    <tr key={`${rx.prescription_id}-medicines`}>
                      <td colSpan={7} style={{ background: '#f7faff', padding: '0 24px 16px' }}>
                        <div style={{ marginTop: 12 }}>
                          <strong style={{ fontSize: 13, color: '#4a5568' }}>Prescribed Medicines</strong>
                          <table style={{ marginTop: 8 }}>
                            <thead>
                              <tr>
                                <th>Medicine</th>
                                <th>Dosage</th>
                                <th>Frequency</th>
                                <th>Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rx.prescription_medicines.map(m => (
                                <tr key={m.medicine_id}>
                                  <td>{m.medicine_name}</td>
                                  <td>{m.dosage || '—'}</td>
                                  <td>{m.frequency || '—'}</td>
                                  <td>{m.duration || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
