import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/patients', icon: '👥', label: 'Patients' },
  { to: '/appointments', icon: '📅', label: 'Appointments' },
  { to: '/doctors', icon: '🩺', label: 'Doctors' },
  { to: '/prescriptions', icon: '💊', label: 'Prescriptions' },
  { to: '/bills', icon: '🧾', label: 'Billing' },
  { to: '/lab-tests', icon: '🔬', label: 'Lab Tests' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Clinic MS</h2>
        <p>Management System</p>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-label">Main Menu</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
