import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchDoctors() }, [])

  async function fetchDoctors() {
    const { data } = await supabase
      .from('doctors')
      .select('*, departments(name)')
      .order('name')
    setDoctors(data || [])
    setLoading(false)
  }

  const filtered = doctors.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
    d.departments?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Doctors</h1>
          <p>{doctors.length} doctors on staff</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>All Doctors</h2>
          <input
            className="search-input"
            placeholder="Search by name, specialization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="loading">Loading doctors...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>No doctors found</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialization</th>
                <th>Department</th>
                <th>Experience</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.doctor_id}>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.specialization || '—'}</td>
                  <td>
                    {d.departments?.name
                      ? <span className="badge badge-blue">{d.departments.name}</span>
                      : '—'}
                  </td>
                  <td>{d.experience ? `${d.experience} yrs` : '—'}</td>
                  <td>{d.phone || '—'}</td>
                  <td>{d.email || '—'}</td>
                  <td>
                    <span className={`badge ${d.availability ? 'badge-green' : 'badge-red'}`}>
                      {d.availability ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
