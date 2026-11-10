/** Authenticated calls only to configured first-party resource API URLs. */
import { ensureFreshSession, getSession } from '@/auth/authService'

export async function authenticatedResourceFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const session = (await ensureFreshSession()) ?? getSession()
  if (!session) throw new Error('Sign in to access this resource.')
  const headers = new Headers(init.headers)
  if (session.token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${session.token}`)
  return fetch(input, { ...init, headers, credentials: 'include' })
}
