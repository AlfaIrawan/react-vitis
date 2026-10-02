/**
 * Identity Lite OIDC auth for Vitis (password + social + passkey + silent SSO).
 * Shares the identity-lite backend and `tectona-spa` client with Platanus / Tectona,
 * so a login in any of them bootstraps the others (same browser).
 */
import {
  loginWithPassword,
  exchangeAuthorizationCode,
  refreshAccessToken,
  fetchUserInfo,
  registerWithEmail,
  bootstrapSsoSession,
  revokeServerSession,
  roleFromEmail,
  normalizeLoginEmail,
  type OidcLoginOptions,
  type OidcTokenResponse,
  type OidcUserInfo,
} from '@/lib/api/identityApi'
import { enrollPasskey, authenticateWithPasskey } from '@/lib/api/webauthnApi'

export interface Session {
  user: {
    id: string
    name: string
    email: string
    role: string
    roles?: string[]
  }
  token: string
  refreshToken?: string
  expiresAt?: string
  loginAt: string
}

const SESSION_KEY = 'vitis_session'
const REFRESH_BUFFER_MS = 60_000

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

function persistSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}

export function requireAuth(): Session | null {
  return getSession()
}

function buildSessionFromUserinfo(
  userinfo: OidcUserInfo,
  emailHint: string,
  token: OidcTokenResponse,
): Session {
  const email = userinfo.email ?? emailHint
  const role =
    userinfo.roles?.includes('tectona_root') || userinfo.roles?.includes('admin')
      ? 'admin'
      : userinfo.roles?.includes('reviewer')
        ? 'reviewer'
        : roleFromEmail(email)
  return {
    user: {
      id: userinfo.sub,
      name: email.split('@')[0] || 'User',
      email,
      role,
      roles: userinfo.roles ?? [],
    },
    token: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
    loginAt: new Date().toISOString(),
  }
}

async function finalize(token: OidcTokenResponse, emailHint: string): Promise<Session> {
  const userinfo = await fetchUserInfo(token.access_token)
  const session = buildSessionFromUserinfo(userinfo, emailHint, token)
  persistSession(session)
  return session
}

export async function login(email: string, password: string, opts?: OidcLoginOptions): Promise<Session> {
  const token = await loginWithPassword(email, password, opts)
  return finalize(token, normalizeLoginEmail(email))
}

export async function loginWithAuthorizationCode(input: {
  code: string
  redirectUri: string
  codeVerifier: string
}): Promise<Session> {
  const token = await exchangeAuthorizationCode(input)
  return finalize(token, '')
}

export { registerWithEmail }

function isAccessTokenExpired(session: Session, skewMs = 0): boolean {
  if (!session.expiresAt) return false
  return Date.now() + skewMs >= new Date(session.expiresAt).getTime()
}

export async function ensureFreshSession(): Promise<Session | null> {
  const session = getSession()
  if (!session) return null
  if (!isAccessTokenExpired(session, REFRESH_BUFFER_MS)) return session
  if (!session.refreshToken) {
    clearSession()
    return null
  }
  try {
    const token = await refreshAccessToken(session.refreshToken)
    const updated: Session = {
      ...session,
      token: token.access_token,
      refreshToken: token.refresh_token ?? session.refreshToken,
      expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
    }
    persistSession(updated)
    return updated
  } catch {
    clearSession()
    return null
  }
}

/** Silent cross-app SSO: bootstrap a session from the shared identity-lite cookie. */
export async function attemptSilentSso(): Promise<Session | null> {
  const existing = getSession()
  if (existing) return existing
  try {
    const token = await bootstrapSsoSession()
    if (!token?.access_token) return null
    return await finalize(token, '')
  } catch {
    return null
  }
}

/** Enrol a passkey for the currently signed-in user. */
export async function registerPasskey(label?: string): Promise<void> {
  const session = getSession()
  if (!session?.token) throw new Error('not_authenticated')
  await enrollPasskey(session.token, label)
}

/** Sign in with a passkey (usernameless / discoverable). */
export async function loginWithPasskey(): Promise<Session> {
  const token = await authenticateWithPasskey()
  return finalize(token, '')
}

export function logout(): void {
  const session = getSession()
  clearSession()
  void revokeServerSession(session?.refreshToken)
}

export async function logoutAsync(): Promise<void> {
  const session = getSession()
  clearSession()
  await revokeServerSession(session?.refreshToken)
}
