import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Heart, Shield, Stethoscope, UserCheck, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLE_HOME } from '../App'
import toast from 'react-hot-toast'

const ROLES = [
  {
    id: 'admin',
    label: 'Admin',
    icon: <Shield className="w-5 h-5" />,
    desc: 'Full system access',
    color: 'blue',
  },
  {
    id: 'doctor',
    label: 'Doctor',
    icon: <Stethoscope className="w-5 h-5" />,
    desc: 'Patient & appointment view',
    color: 'teal',
  },
  {
    id: 'receptionist',
    label: 'Receptionist',
    icon: <UserCheck className="w-5 h-5" />,
    desc: 'Appointments & billing',
    color: 'purple',
  },
]

const ROLE_COLORS = {
  blue:   { selected: 'border-blue-500 bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   ring: 'ring-blue-500' },
  teal:   { selected: 'border-teal-500 bg-teal-50',   icon: 'bg-teal-100 text-teal-600',   ring: 'ring-teal-500' },
  purple: { selected: 'border-purple-500 bg-purple-50', icon: 'bg-purple-100 text-purple-600', ring: 'ring-purple-500' },
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role !== role) {
        toast.error(`This account is a ${user.role}, not a ${role}`)
        setLoading(false)
        return
      }
      toast.success(`Welcome back, ${user.name}!`)
      navigate(ROLE_HOME[user.role] ?? '/')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLES.find(r => r.id === role)
  const colors = ROLE_COLORS[selectedRole.color]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-teal-500 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">ClinicMS</span>
          </Link>
          <p className="text-blue-200 text-sm mt-1">Clinic Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-blue-900/30 p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Sign in to your account</h1>
            <p className="text-sm text-gray-500 mt-1">Select your role and enter your credentials</p>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <label className="label">Select Role</label>
            <div className="grid grid-cols-3 gap-3 mt-1">
              {ROLES.map(r => {
                const c = ROLE_COLORS[r.color]
                const isSelected = role === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer text-center
                      ${isSelected ? c.selected + ' border-2' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? c.icon : 'bg-gray-100 text-gray-500'}`}>
                      {r.icon}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{r.label}</p>
                      <p className="text-xs text-gray-400 leading-tight hidden sm:block">{r.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label" style={{ marginBottom: 0 }}>Password</label>
                <button type="button" className="text-xs text-blue-600 hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-1">Demo Credentials</p>
            <p className="text-xs text-blue-600">Use your Supabase <code className="bg-blue-100 px-1 rounded">users</code> table email &amp; password.</p>
          </div>
        </div>

        <p className="text-center text-xs text-white/60 mt-6">
          © {new Date().getFullYear()} ClinicMS · Secure Healthcare Management
        </p>
      </div>
    </div>
  )
}
