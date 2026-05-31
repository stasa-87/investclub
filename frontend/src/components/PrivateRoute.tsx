import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthRouteLoadingScreen from './AuthRouteLoadingScreen'

type PrivateRouteProps = {
  children: ReactNode
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const location = useLocation()
  const { isLoading, isLoggedIn } = useAuth()

  if (isLoading) {
    return <AuthRouteLoadingScreen />
  }

  if (!isLoggedIn) {
    return <Navigate replace state={{ from: location.pathname }} to="/" />
  }

  return <>{children}</>
}

export default PrivateRoute
