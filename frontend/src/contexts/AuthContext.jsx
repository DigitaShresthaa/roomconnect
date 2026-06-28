import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { apiGetAuth } from '../lib/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'roomconnect_token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)

  const login = (newToken, profile) => {
    setToken(newToken)
    localStorage.setItem(TOKEN_KEY, newToken)
    setUser(profile || null)
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  useEffect(() => {
    if (!token) return
    apiGetAuth('/api/v1/auth/me')
      .then((profile) => setUser(profile))
      .catch((err) => {
        if (err.status === 401) {
          logout()
        }
      })
  }, [token])

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
      setUser,
    }),
    [token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
