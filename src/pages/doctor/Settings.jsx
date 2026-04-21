import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import DoctorLayout from '../../layouts/DoctorLayout'
import { User, Lock, Stethoscope, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DoctorSettings() {
  const { user } = useAuth()

  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '' })
  const [savingProfile, setSavingProfile] = useState(false)

  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' })
  const [savingPw,  setSavingPw]  = useState(false)

  const [doctorInfo, setDoctorInfo] = useState(null)
  const [loadedInfo, setLoadedInfo] = useState(false)

  // Lazily load doctor record when the info section is shown
  async function loadDoctorInfo() {
    if (loadedInfo || !user?.linked_id) return
    const { data } = await supabase.from('doctors')
      .select('name, specialization, phone, email, experience, education, schedule')
      .eq('doctor_id', user.linked_id)
      .single()
    setDoctorInfo(data)
    setLoadedInfo(true)
  }

  async function saveProfile(e) {
    e.preventDefault()
    if (!profile.name || !profile.email) { toast.error('Name and email are required'); return }
    setSavingProfile(true)
    const { error } = await supabase.from('users')
      .update({ name: profile.name, email: profile.email })
      .eq('user_id', user.user_id)
    setSavingProfile(false)
    if (error) { toast.error(error.message); return }
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
    const { data: check } = await supabase.from('users')
      .select('user_id').eq('user_id', user.user_id).eq('password_hash', passwords.current).single()
    if (!check) { setSavingPw(false); toast.error('Current password is incorrect'); return }

    const { error } = await supabase.from('users')
      .update({ password_hash: passwords.newPw }).eq('user_id', user.user_id)
    setSavingPw(false)
    if (error) { toast.error(error.message); return }
    setPasswords({ current: '', newPw: '', confirm: '' })
    toast.success('Password updated')
  }

  return (
    <DoctorLayout>
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Manage your account details</p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* Profile */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
              <User className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
              <p className="text-xs text-gray-500">Update your login name and email</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase() ?? 'D'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-3">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
            </div>
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
              <p className="text-xs text-gray-500">Minimum 6 characters</p>
            </div>
          </div>
          <form onSubmit={savePassword} className="space-y-3">
            <div>
              <label className="label">Current Password</label>
              <input className="input" type="password" value={passwords.current}
                onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} />
            </div>
            <div>
              <label className="label">New Password</label>
              <input className="input" type="password" value={passwords.newPw}
                onChange={e => setPasswords(p => ({ ...p, newPw: e.target.value }))} />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input className="input" type="password" value={passwords.confirm}
                onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
            </div>
            <button type="submit" disabled={savingPw} className="btn-primary">
              {savingPw
                ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : <Lock className="w-4 h-4" />}
              {savingPw ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Doctor record info */}
        {user?.linked_id && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Doctor Record</h2>
                  <p className="text-xs text-gray-500">Your profile from the doctors table</p>
                </div>
              </div>
              {!loadedInfo && (
                <button onClick={loadDoctorInfo} className="btn-secondary text-xs">Load Info</button>
              )}
            </div>

            {doctorInfo ? (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  ['Name',           doctorInfo.name],
                  ['Specialization', doctorInfo.specialization],
                  ['Phone',          doctorInfo.phone],
                  ['Email',          doctorInfo.email],
                  ['Experience',     doctorInfo.experience ? `${doctorInfo.experience} years` : null],
                  ['Education',      doctorInfo.education],
                ].map(([k, v]) => v ? (
                  <div key={k}>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{k}</dt>
                    <dd className="text-sm text-gray-800 mt-0.5">{v}</dd>
                  </div>
                ) : null)}
                {doctorInfo.schedule && (
                  <div className="col-span-2">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Schedule</dt>
                    <dd className="text-sm text-gray-800 mt-0.5">{doctorInfo.schedule}</dd>
                  </div>
                )}
              </dl>
            ) : loadedInfo ? (
              <p className="text-sm text-gray-400">Doctor record not found.</p>
            ) : (
              <p className="text-sm text-gray-400">Click "Load Info" to view your doctor record.</p>
            )}
          </div>
        )}
      </div>
    </DoctorLayout>
  )
}
