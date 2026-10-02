import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ensureFreshSession, attemptSilentSso } from './authService'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    let cancelled = false
    ensureFreshSession()
      .then(async (session) => {
        // No local session yet — try silent cross-app SSO before redirecting to login.
        const resolved = session ?? (await attemptSilentSso())
        if (!cancelled) {
          setAuthenticated(resolved != null)
          setChecking(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthenticated(false)
          setChecking(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!authenticated) {
    const next = location.pathname + location.search
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  return <>{children}</>
}
