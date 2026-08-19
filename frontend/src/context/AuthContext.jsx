import { createContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('taskai_token')
    const savedUser = localStorage.getItem('taskai_user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
        // Verify token is still valid
        authAPI.getMe()
          .then(({ data }) => setUser(data.user))
          .catch(() => {
            localStorage.removeItem('taskai_token')
            localStorage.removeItem('taskai_user')
            setUser(null)
          })
          .finally(() => setIsLoading(false))
      } catch {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('taskai_token', data.token)
    localStorage.setItem('taskai_user', JSON.stringify(data.user))
    setUser(data.user)
    toast.success(`Welcome back, ${data.user.name}!`)
    return data
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password })
    localStorage.setItem('taskai_token', data.token)
    localStorage.setItem('taskai_user', JSON.stringify(data.user))
    setUser(data.user)
    toast.success('Account created successfully!')
    return data
  }, [])

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch { /* ignore */ }
    localStorage.removeItem('taskai_token')
    localStorage.removeItem('taskai_user')
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
