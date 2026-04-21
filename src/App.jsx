import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import AdminDashboard        from './pages/admin/Dashboard'
import AdminPatients         from './pages/admin/Patients'
import AdminDoctors          from './pages/admin/Doctors'
import AdminAppointments     from './pages/admin/Appointments'
import AdminPrescriptions    from './pages/admin/Prescriptions'
import AdminBills            from './pages/admin/Bills'
import AdminLabTests         from './pages/admin/LabTests'
import AdminUsers            from './pages/admin/Users'
import AdminSettings         from './pages/admin/Settings'
import DoctorDashboard       from './pages/doctor/Dashboard'
import DoctorAppointments    from './pages/doctor/Appointments'
import DoctorPatients        from './pages/doctor/Patients'
import DoctorPrescriptions   from './pages/doctor/Prescriptions'
import DoctorLabTests        from './pages/doctor/LabTests'
import DoctorSettings        from './pages/doctor/Settings'
import ReceptionistDashboard     from './pages/receptionist/Dashboard'
import ReceptionistAppointments from './pages/receptionist/Appointments'
import ReceptionistBills        from './pages/receptionist/Bills'
import ReceptionistPatients     from './pages/receptionist/Patients'
import ReceptionistSettings     from './pages/receptionist/Settings'

export const ROLE_HOME = {
  admin:        '/admin/dashboard',
  doctor:       '/doctor/dashboard',
  receptionist: '/receptionist/dashboard',
}

// Redirect already-authenticated users away from /login
function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (user) return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />
  return children
}

// Require auth + specific role; wrong role → their own home
function RoleRoute({ role, children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role] ?? '/login'} replace />
  return children
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
      Loading…
    </div>
  )
}

// ── Placeholder pages (replaced as each dashboard is built) ──────────────────
function PlaceholderDashboard({ role }) {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏥</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 capitalize">{role} Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}</p>
        <p className="text-xs text-gray-400 mt-3">This page is under construction.</p>
        <button
          onClick={logout}
          className="mt-6 btn-secondary w-full justify-center"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />

        {/* Admin routes */}
        <Route path="/admin/dashboard"     element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
        <Route path="/admin/patients"      element={<RoleRoute role="admin"><AdminPatients /></RoleRoute>} />
        <Route path="/admin/doctors"       element={<RoleRoute role="admin"><AdminDoctors /></RoleRoute>} />
        <Route path="/admin/appointments"  element={<RoleRoute role="admin"><AdminAppointments /></RoleRoute>} />
        <Route path="/admin/prescriptions" element={<RoleRoute role="admin"><AdminPrescriptions /></RoleRoute>} />
        <Route path="/admin/bills"         element={<RoleRoute role="admin"><AdminBills /></RoleRoute>} />
        <Route path="/admin/lab-tests"     element={<RoleRoute role="admin"><AdminLabTests /></RoleRoute>} />
        <Route path="/admin/users"         element={<RoleRoute role="admin"><AdminUsers /></RoleRoute>} />
        <Route path="/admin/settings"      element={<RoleRoute role="admin"><AdminSettings /></RoleRoute>} />

        {/* Doctor routes */}
        <Route path="/doctor/dashboard"      element={<RoleRoute role="doctor"><DoctorDashboard /></RoleRoute>} />
        <Route path="/doctor/appointments"   element={<RoleRoute role="doctor"><DoctorAppointments /></RoleRoute>} />
        <Route path="/doctor/patients"       element={<RoleRoute role="doctor"><DoctorPatients /></RoleRoute>} />
        <Route path="/doctor/prescriptions"  element={<RoleRoute role="doctor"><DoctorPrescriptions /></RoleRoute>} />
        <Route path="/doctor/lab-tests"      element={<RoleRoute role="doctor"><DoctorLabTests /></RoleRoute>} />
        <Route path="/doctor/settings"       element={<RoleRoute role="doctor"><DoctorSettings /></RoleRoute>} />

        {/* Receptionist routes */}
        <Route path="/receptionist/dashboard"    element={<RoleRoute role="receptionist"><ReceptionistDashboard /></RoleRoute>} />
        <Route path="/receptionist/appointments" element={<RoleRoute role="receptionist"><ReceptionistAppointments /></RoleRoute>} />
        <Route path="/receptionist/bills"        element={<RoleRoute role="receptionist"><ReceptionistBills /></RoleRoute>} />
        <Route path="/receptionist/patients"     element={<RoleRoute role="receptionist"><ReceptionistPatients /></RoleRoute>} />
        <Route path="/receptionist/settings"     element={<RoleRoute role="receptionist"><ReceptionistSettings /></RoleRoute>} />

        {/* Fallback: send logged-in users to their home, others to landing */}
        <Route path="*" element={<FallbackRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

function FallbackRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (user) return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />
  return <Navigate to="/" replace />
}
