import { InternalAccessRoles } from './internalAccessRoles'
import { useEffect, useState, type ReactNode } from 'react'
import { getSession, logoutAsync } from './authService'
import { IDENTITY_API_BASE } from '@/lib/api/gatewayBase'

export function InternalAccessDenied({ unavailable = false, administration = false }: { unavailable?: boolean; administration?: boolean }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <section className="liquid-glass-enterprise-panel w-full max-w-md rounded-lg p-8 space-y-4" role="alert">
        <h1 className="text-lg font-semibold">{unavailable ? 'Access verification unavailable' : administration ? 'Administrator access required' : 'Access denied'}</h1>
        <p className="text-sm text-muted-foreground">
          {unavailable ? 'Access could not be verified. Retry when the identity service is available.' : administration ?
            'You are signed in, but only a Vitis administrator or root can manage application users and access.' :
            'Vitis is an internal application. An administrator must provision your account and grant application access before you can sign in.'}
        </p>
        <div className="flex gap-4">
          <button type="button" className="text-primary hover:underline" onClick={() => window.location.reload()}>Retry</button>
          <button type="button" className="text-primary hover:underline" onClick={() => void logoutAsync().finally(() => window.location.assign('/login'))}>Back to sign in</button>
        </div>
      </section>
    </main>
  )
}

// This gate is UX protection, not the security boundary: APIs must enforce entitlement too.
export function InternalAccessGate({ children }: { children: ReactNode }) {
  const session = getSession()
  const token = session?.token ?? ''
  const subject = session?.user.id ?? ''
  const key = subject
  const [result, setResult] = useState<{ key: string; status: 'allowed' | 'denied' | 'unavailable'; roles?: string[] } | null>(null)

  useEffect(() => {
    let disposed = false
    let pending: AbortController | null = null
    const verify = async () => {
      pending?.abort()
      const controller = new AbortController()
      pending = controller
      const timeout = window.setTimeout(() => controller.abort(), 15000)
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        const currentSession = getSession()
        if (!currentSession || currentSession.user.id !== subject) {
          if (!disposed) setResult({ key, status: 'denied' })
          return
        }
        if (currentSession.token) headers.Authorization = `Bearer ${currentSession.token}`
        const response = await fetch(`${IDENTITY_API_BASE}/v1/internal-access/check`, {
          method: 'POST', credentials: 'include', headers,
          body: JSON.stringify({ client_id: 'vitis-spa' }), signal: controller.signal,
        })
        let status: 'allowed' | 'denied' | 'unavailable' = 'unavailable'
        let roles: string[] = []
        if (response.status === 401 || response.status === 403) status = 'denied'
        else if (response.ok) {
          const access = await response.json() as { active?: boolean; sub?: string; client_id?: string; roles?: unknown }
          roles = Array.isArray(access.roles) ? access.roles.filter((role): role is string => typeof role === 'string') : []
          status = access.active === true && access.client_id === 'vitis-spa' && access.sub === subject ? 'allowed' : 'denied'
        }
        if (!disposed && pending === controller) setResult({ key, status, roles })
      } catch {
        if (!disposed && pending === controller) setResult({ key, status: 'unavailable' })
      } finally { window.clearTimeout(timeout) }
    }
    void verify()
    // Revalidate in place so focus/periodic checks do not erase unsaved forms.
    const recheck = () => { void verify() }
    window.addEventListener('focus', recheck)
    window.addEventListener('pageshow', recheck)
    const interval = window.setInterval(recheck, 60000)
    return () => {
      disposed = true
      pending?.abort()
      window.clearInterval(interval)
      window.removeEventListener('focus', recheck)
      window.removeEventListener('pageshow', recheck)
    }
  }, [key, token, subject])

  if (!result || result.key !== key) return <div role="status" className="min-h-screen flex items-center justify-center">Verifying application access.</div>
  if (result.status !== 'allowed') return <InternalAccessDenied unavailable={result.status === 'unavailable'} />
  return <InternalAccessRoles.Provider value={result.roles ?? []}>{children}</InternalAccessRoles.Provider>
}
