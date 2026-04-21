import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, CalendarDays, CreditCard,
  Users, Settings, LogOut, UserCheck, Menu, X, Bell
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/receptionist/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/receptionist/appointments', icon: CalendarDays,    label: 'Appointments' },
  { to: '/receptionist/bills',        icon: CreditCard,      label: 'Billing' },
  { to: '/receptionist/patients',     icon: Users,           label: 'Patients' },
  { to: '/receptionist/settings',     icon: Settings,        label: 'Settings' },
]

export default function ReceptionistLayout({ children }) {
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
        fixed top-0 left-0 h-full w-60 bg-[#1a1035] flex flex-col z-30
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/8">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">ClinicMS</p>
            <p className="text-slate-400 text-xs mt-0.5">Reception</p>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto">
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
                   ? 'bg-purple-600 text-white'
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'R'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs">Receptionist</p>
            </div>
            <button onClick={handleLogout} title="Sign out" className="text-slate-400 hover:text-red-400 transition-colors">
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
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() ?? 'R'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-none">{user?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">Receptionist</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
