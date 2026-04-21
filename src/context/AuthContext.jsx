import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // { user_id, name, email, role, linked_id }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('clinic_user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  async function login(email, password) {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, name, email, role, linked_id')
      .eq('email', email)
      .eq('password_hash', password)
      .single()

    if (error || !data) throw new Error('Invalid email or password')

    localStorage.setItem('clinic_user', JSON.stringify(data))
    setUser(data)
    return data
  }

  function logout() {
    localStorage.removeItem('clinic_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
