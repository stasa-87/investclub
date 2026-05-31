import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  clearAuthSession,
  fetchCurrentUserProfile,
  isAuthenticated,
  loginWithBackend,
  readAuthSession,
  refreshAuthSession,
  type AuthSession,
} from '../lib/auth'

type AuthContextValue = {
  isLoading: boolean
  isLoggedIn: boolean
  login: (usernameOrEmail: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  session: AuthSession | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession())
  const [isLoading, setIsLoading] = useState(true)

  const syncSession = () => {
    setSession(readAuthSession())
  }

  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      if (!isAuthenticated()) {
        if (isMounted) {
          setIsLoading(false)
        }
        return
      }

      try {
        await refreshAuthSession().catch(async () => {
          await fetchCurrentUserProfile()
        })
      } catch {
        clearAuthSession()
      } finally {
        if (isMounted) {
          syncSession()
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isLoggedIn: session !== null,
      login: async (usernameOrEmail: string, password: string) => {
        await loginWithBackend(usernameOrEmail, password)
        syncSession()
      },
      logout: () => {
        clearAuthSession()
        syncSession()
      },
      refreshProfile: async () => {
        await fetchCurrentUserProfile()
        syncSession()
      },
      session,
    }),
    [isLoading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

export default AuthProvider
