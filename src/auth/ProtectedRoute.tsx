import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from './authService'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const authenticated = isAuthenticated()

  if (!authenticated) {
    // Preserve the intended destination in query string
    const next = location.pathname + location.search
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  return <>{children}</>
}