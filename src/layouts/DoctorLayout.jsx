import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, CalendarDays, Users, FileText,
  FlaskConical, Settings, LogOut, Stethoscope, Menu, X, Bell
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/doctor/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/doctor/appointments',  icon: CalendarDays,    label: 'My Appointments' },
  { to: '/doctor/patients',      icon: Users,           label: 'My Patients' },
  { to: '/doctor/prescriptions', icon: FileText,        label: 'Prescriptions' },
  { to: '/doctor/lab-tests',     icon: FlaskConical,    label: 'Lab Tests' },
  { to: '/doctor/settings',      icon: Settings,        label: 'Settings' },
]

export default function DoctorLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed top-0 left-0 h-full w-60 bg-[#0d1f2d] flex flex-col z-30
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/8">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">ClinicMS</p>
            <p className="text-slate-400 text-xs mt-0.5">Doctor Portal</p>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Doctor info badge */}
        <div className="mx-3 mt-4 mb-1 bg-teal-900/40 rounded-xl px-4 py-3">
          <p className="text-teal-300 text-xs font-semibold truncate">{user?.name}</p>
          <p className="text-slate-500 text-xs mt-0.5">Attending Physician</p>
        </div>

        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">
            Navigation
          </p>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors
                 ${isActive
                   ? 'bg-teal-600 text-white'
                   : 'text-slate-400 hover:text-white hover:bg-white/8'
                 }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/8 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs">Doctor</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between shadow-sm">
          <button
            className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block">
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() ?? 'D'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-none">{user?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">Doctor</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
