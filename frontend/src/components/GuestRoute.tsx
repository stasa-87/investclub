import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AUTH_STORAGE_KEY } from '../lib/auth'
import AuthRouteLoadingScreen from './AuthRouteLoadingScreen'

type GuestRouteProps = {
  children: ReactNode
}

function getSessionFromStorage(): boolean {
  try {
    return !!window.localStorage.getItem(AUTH_STORAGE_KEY)
  } catch {
    return false
  }
}

function GuestRoute({ children }: GuestRouteProps) {
  const { isLoading, isLoggedIn, session } = useAuth()
  const hasSession = isLoggedIn || session || getSessionFromStorage()

  if (isLoading) {
    return <AuthRouteLoadingScreen />
  }

  if (hasSession) {
    return <Navigate replace to="/dashboard" />
  }

  return <>{children}</>
}

export default GuestRoute
