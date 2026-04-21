import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const STATUS_BADGE = {
  pending: 'badge-yellow',
  'in-progress': 'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

export default function LabTests() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchTests() }, [])

  async function fetchTests() {
    const { data } = await supabase
      .from('lab_tests')
      .select('*, patients(name), doctors(name)')
      .order('date', { ascending: false })
    setTests(data || [])
    setLoading(false)
  }

  const filtered = tests
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t =>
      t.patients?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.test_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.doctors?.name?.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Lab Tests</h1>
          <p>{tests.length} tests on record</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>All Lab Tests</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="search-input"
              placeholder="Search patient, test, doctor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 220 }}
            />
            {['all', 'pending', 'in-progress', 'completed'].map(s => (
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
          <div className="loading">Loading lab tests...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>No lab tests found</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Patient</th>
                <th>Ordered By</th>
                <th>Date</th>
                <th>Status</th>
                <th>Result</th>
                <th>Report</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.lab_test_id}>
                  <td><strong>{t.test_name}</strong></td>
                  <td>{t.patients?.name || '—'}</td>
                  <td>{t.doctors?.name || '—'}</td>
                  <td>{t.date}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[t.status] || 'badge-gray'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.result || '—'}
                  </td>
                  <td>
                    {t.report_url ? (
                      <a
                        href={t.report_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        View Report
                      </a>
                    ) : '—'}
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
