import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const STATUS_BADGE = {
  paid: 'badge-green',
  pending: 'badge-yellow',
  overdue: 'badge-red',
  partial: 'badge-blue',
}

export default function Bills() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchBills() }, [])

  async function fetchBills() {
    const { data } = await supabase
      .from('bills')
      .select('*, patients(name)')
      .order('date', { ascending: false })
    setBills(data || [])
    setLoading(false)
  }

  const filtered = bills
    .filter(b => filter === 'all' || b.payment_status === filter)
    .filter(b =>
      b.patients?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.invoice_number?.toLowerCase().includes(search.toLowerCase())
    )

  const totalRevenue = bills
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0)

  const pendingAmount = bills
    .filter(b => b.payment_status === 'pending' || b.payment_status === 'overdue')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Billing</h1>
          <p>{bills.length} invoices total</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon green">💰</div>
          <div className="stat-info">
            <h3>₹{totalRevenue.toLocaleString()}</h3>
            <p>Total Revenue (Paid)</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⏳</div>
          <div className="stat-info">
            <h3>₹{pendingAmount.toLocaleString()}</h3>
            <p>Pending / Overdue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🧾</div>
          <div className="stat-info">
            <h3>{bills.filter(b => b.payment_status === 'paid').length}</h3>
            <p>Paid Bills</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📋</div>
          <div className="stat-info">
            <h3>{bills.filter(b => b.payment_status === 'pending').length}</h3>
            <p>Pending Bills</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>All Invoices</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="search-input"
              placeholder="Search patient or invoice..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 200 }}
            />
            {['all', 'paid', 'pending', 'overdue'].map(s => (
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
          <div className="loading">Loading bills...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>No bills found</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Patient</th>
                <th>Date</th>
                <th>Consultation</th>
                <th>Lab</th>
                <th>Medicines</th>
                <th>Other</th>
                <th>Total</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.bill_id}>
                  <td><code style={{ fontSize: 12, color: '#3182ce' }}>{b.invoice_number || '—'}</code></td>
                  <td><strong>{b.patients?.name || '—'}</strong></td>
                  <td>{b.date}</td>
                  <td>₹{(b.consultation_fee || 0).toLocaleString()}</td>
                  <td>₹{(b.lab_charges || 0).toLocaleString()}</td>
                  <td>₹{(b.medicine_charges || 0).toLocaleString()}</td>
                  <td>₹{(b.other_charges || 0).toLocaleString()}</td>
                  <td><strong>₹{(b.total_amount || 0).toLocaleString()}</strong></td>
                  <td>{b.payment_method || '—'}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[b.payment_status] || 'badge-gray'}`}>
                      {b.payment_status}
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
