import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '../lib/api'
import { connectSocket, disconnectSocket } from '../lib/socket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const username = localStorage.getItem('username')
    return username ? { username } : null
  })
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // disconnected | connecting | connected | error

  const login = useCallback(async (username, password) => {
    const data = await api.login({ username, password })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('username', data.username)
    setUser({ username: data.username })
    return data
  }, [])

  const register = useCallback(async (payload) => {
    return api.register(payload)
  }, [])

  const logout = useCallback(() => {
    disconnectSocket()
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('username')
    setUser(null)
    setConnectionStatus('disconnected')
  }, [])

  useEffect(() => {
    if (!user) return

    setConnectionStatus('connecting')
    connectSocket({
      onConnect: () => setConnectionStatus('connected'),
      onError: () => setConnectionStatus('error'),
    })

    return () => disconnectSocket()
  }, [user])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, connectionStatus }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
