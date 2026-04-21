import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingBills: 0,
    activeDoctors: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentAppointments, setRecentAppointments] = useState([])

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const today = new Date().toISOString().split('T')[0]

    const [
      { count: totalPatients },
      { count: todayAppointments },
      { count: pendingBills },
      { count: activeDoctors },
      { data: appointments },
    ] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today),
      supabase.from('bills').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending'),
      supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('availability', true),
      supabase
        .from('appointments')
        .select('appointment_id, date, time, status, patients(name), doctors(name)')
        .order('date', { ascending: false })
        .limit(6),
    ])

    setStats({
      totalPatients: totalPatients || 0,
      todayAppointments: todayAppointments || 0,
      pendingBills: pendingBills || 0,
      activeDoctors: activeDoctors || 0,
    })
    setRecentAppointments(appointments || [])
    setLoading(false)
  }

  const statusBadge = (status) => {
    const map = {
      scheduled: 'badge-blue',
      completed: 'badge-green',
      cancelled: 'badge-red',
      pending: 'badge-yellow',
    }
    return map[status] || 'badge-gray'
  }

  if (loading) return <div className="loading">Loading dashboard...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back — here's what's happening today</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div className="stat-info">
            <h3>{stats.totalPatients}</h3>
            <p>Total Patients</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📅</div>
          <div className="stat-info">
            <h3>{stats.todayAppointments}</h3>
            <p>Today's Appointments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">🧾</div>
          <div className="stat-info">
            <h3>{stats.pendingBills}</h3>
            <p>Pending Bills</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">🩺</div>
          <div className="stat-info">
            <h3>{stats.activeDoctors}</h3>
            <p>Active Doctors</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>Recent Appointments</h2>
        </div>
        {recentAppointments.length === 0 ? (
          <div className="empty-state"><p>No appointments found</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.map(apt => (
                <tr key={apt.appointment_id}>
                  <td>{apt.patients?.name || '—'}</td>
                  <td>{apt.doctors?.name || '—'}</td>
                  <td>{apt.date}</td>
                  <td>{apt.time}</td>
                  <td>
                    <span className={`badge ${statusBadge(apt.status)}`}>
                      {apt.status}
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
