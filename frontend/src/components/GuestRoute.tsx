import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthRouteLoadingScreen from './AuthRouteLoadingScreen'

type GuestRouteProps = {
  children: ReactNode
}

function GuestRoute({ children }: GuestRouteProps) {
  const { isLoading, isLoggedIn } = useAuth()

  if (isLoading) {
    return <AuthRouteLoadingScreen />
  }

  if (isLoggedIn) {
    return <Navigate replace to="/dashboard" />
  }

  return <>{children}</>
}

export default GuestRoute
