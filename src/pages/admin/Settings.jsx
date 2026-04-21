import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import AdminLayout from '../../layouts/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { User, Lock, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const { user, login } = useAuth()

  // Profile
  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Password
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)

  async function saveProfile(e) {
    e.preventDefault()
    if (!profile.name || !profile.email) { toast.error('Name and email are required'); return }
    setSavingProfile(true)
    const { error } = await supabase.from('users')
      .update({ name: profile.name, email: profile.email })
      .eq('user_id', user.user_id)
    setSavingProfile(false)
    if (error) { toast.error(error.message); return }
    // Refresh local storage
    const updated = { ...user, name: profile.name, email: profile.email }
    localStorage.setItem('clinic_user', JSON.stringify(updated))
    toast.success('Profile updated')
  }

  async function savePassword(e) {
    e.preventDefault()
    if (!passwords.current || !passwords.newPw || !passwords.confirm) {
      toast.error('All fields are required'); return
    }
    if (passwords.newPw !== passwords.confirm) { toast.error('New passwords do not match'); return }
    if (passwords.newPw.length < 6) { toast.error('Password must be at least 6 characters'); return }

    setSavingPw(true)
    // Verify current password
    const { data: check } = await supabase.from('users')
      .select('user_id').eq('user_id', user.user_id).eq('password_hash', passwords.current).single()

    if (!check) { setSavingPw(false); toast.error('Current password is incorrect'); return }

    const { error } = await supabase.from('users')
      .update({ password_hash: passwords.newPw }).eq('user_id', user.user_id)
    setSavingPw(false)
    if (error) { toast.error(error.message); return }
    setPasswords({ current:'', newPw:'', confirm:'' })
    toast.success('Password changed successfully')
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Manage your account and preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* Profile */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
              <p className="text-xs text-gray-500">Update your name and email</p>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role} · {user?.email}</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-3">
            <div><label className="label">Full Name</label>
              <input className="input" value={profile.name} onChange={e => setProfile(p=>({...p,name:e.target.value}))} /></div>
            <div><label className="label">Email</label>
              <input className="input" type="email" value={profile.email} onChange={e => setProfile(p=>({...p,email:e.target.value}))} /></div>
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile
                ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : <Save className="w-4 h-4" />}
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Change Password</h2>
              <p className="text-xs text-gray-500">Use a strong password with at least 6 characters</p>
            </div>
          </div>
          <form onSubmit={savePassword} className="space-y-3">
            <div><label className="label">Current Password</label>
              <input className="input" type="password" value={passwords.current} onChange={e=>setPasswords(p=>({...p,current:e.target.value}))} /></div>
            <div><label className="label">New Password</label>
              <input className="input" type="password" value={passwords.newPw} onChange={e=>setPasswords(p=>({...p,newPw:e.target.value}))} /></div>
            <div><label className="label">Confirm New Password</label>
              <input className="input" type="password" value={passwords.confirm} onChange={e=>setPasswords(p=>({...p,confirm:e.target.value}))} /></div>
            <button type="submit" disabled={savingPw} className="btn-primary">
              {savingPw
                ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : <Lock className="w-4 h-4" />}
              {savingPw ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </AdminLayout>
  )
}
