import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import apiClient from '../api/client'

// ── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  name: string
  email: string
  role: 'student' | 'admin'
}

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>
  logout: () => void
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  )
  const [isLoading, setIsLoading] = useState(true)

  // ── Internal helpers ────────────────────────────────────────────────────

  const storeToken = (newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  const fetchMe = useCallback(async () => {
    try {
      const res = await apiClient.get<{ user: User }>('/auth/me')
      setUser(res.data.user)
    } catch {
      clearAuth()
    }
  }, [clearAuth])

  // ── Session restoration on mount ────────────────────────────────────────

  useEffect(() => {
    const restore = async () => {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        await fetchMe()
      }
      setIsLoading(false)
    }
    restore()
  }, [fetchMe])

  // ── Listen for 401 from Axios interceptor ───────────────────────────────

  useEffect(() => {
    const handler = () => clearAuth()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [clearAuth])

  // ── Public methods ──────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    const res = await apiClient.post<{ token: string; user: User }>(
      '/auth/login',
      { email, password }
    )
    storeToken(res.data.token)
    setUser(res.data.user)
  }

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    const res = await apiClient.post<{ token: string; user: User }>(
      '/auth/register',
      { name, email, password }
    )
    storeToken(res.data.token)
    setUser(res.data.user)
  }

  const logout = () => {
    clearAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}
