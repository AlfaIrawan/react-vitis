/**
 * Identity Lite OIDC client for Vitis — password grant, authorization_code (social),
 * refresh, userinfo, public register, and silent SSO bootstrap. Shares the identity-lite
 * backend + `tectona-spa` client with Platanus / Tectona.
 */
import { IDENTITY_API_BASE, TECTONA_OIDC_CLIENT_ID } from './gatewayBase'

export interface OidcTokenResponse {
  access_token: string
  token_type?: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

export interface OidcUserInfo {
  sub: string
  email?: string
  email_verified?: boolean
  roles?: string[]
}

export interface OidcLoginOptions {
  sessionPolicy?: 'replace'
}

export function normalizeLoginEmail(input: string): string {
  return input.trim().toLowerCase()
}

/** UI role from roles / email — mirrors Platanus. */
export function roleFromEmail(email: string): string {
  const e = email.toLowerCase()
  if (e.startsWith('admin') || e.startsWith('root')) return 'admin'
  if (e.startsWith('reviewer')) return 'reviewer'
  return 'member'
}

async function parseError(res: Response, fallback: string): Promise<string> {
  const text = await res.text().catch(() => '')
  try {
    const j = JSON.parse(text) as { detail?: unknown; error_description?: string; error?: string }
    const detail = typeof j.detail === 'string' ? j.detail : undefined
    return j.error_description || detail || (typeof j.error === 'string' ? j.error : undefined) || fallback
  } catch {
    return text || fallback
  }
}

export async function loginWithPassword(
  email: string,
  password: string,
  opts?: OidcLoginOptions,
): Promise<OidcTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: TECTONA_OIDC_CLIENT_ID,
    username: normalizeLoginEmail(email),
    password,
  })
  if (opts?.sessionPolicy === 'replace') body.set('session_policy', 'replace')
  const res = await fetch(`${IDENTITY_API_BASE}/oauth2/token`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  })
  if (!res.ok) throw new Error(await parseError(res, 'Invalid email or password.'))
  return res.json() as Promise<OidcTokenResponse>
}

export async function fetchUserInfo(accessToken: string): Promise<OidcUserInfo> {
  const res = await fetch(`${IDENTITY_API_BASE}/oauth2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`userinfo failed (${res.status})`)
  return res.json() as Promise<OidcUserInfo>
}

export interface RegisterResponse {
  subject_id: string
  email: string
  status: string
  message?: string
}

export async function registerWithEmail(input: {
  email: string
  password: string
  displayName?: string
}): Promise<RegisterResponse> {
  const res = await fetch(`${IDENTITY_API_BASE}/v1/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      email: normalizeLoginEmail(input.email),
      password: input.password,
      display_name: input.displayName?.trim() || undefined,
      client_id: TECTONA_OIDC_CLIENT_ID,
    }),
  })
  if (res.status === 409) {
    throw new Error('Email is already registered. Use a different email or sign in.')
  }
  if (!res.ok) throw new Error(await parseError(res, 'Could not create the account.'))
  return res.json() as Promise<RegisterResponse>
}

export async function exchangeAuthorizationCode(input: {
  code: string
  redirectUri: string
  codeVerifier: string
}): Promise<OidcTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: TECTONA_OIDC_CLIENT_ID,
    code: input.code,
    redirect_uri: input.redirectUri,
    code_verifier: input.codeVerifier,
  })
  const res = await fetch(`${IDENTITY_API_BASE}/oauth2/token`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  })
  if (!res.ok) throw new Error(await parseError(res, 'Sign-in failed.'))
  return res.json() as Promise<OidcTokenResponse>
}

export async function refreshAccessToken(refreshToken: string): Promise<OidcTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: TECTONA_OIDC_CLIENT_ID,
    refresh_token: refreshToken,
  })
  const res = await fetch(`${IDENTITY_API_BASE}/oauth2/token`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  })
  if (!res.ok) throw new Error(await parseError(res, 'Session refresh failed.'))
  return res.json() as Promise<OidcTokenResponse>
}

/** Silent cross-app SSO bootstrap from the shared identity-lite cookie. */
export async function bootstrapSsoSession(
  clientId: string = TECTONA_OIDC_CLIENT_ID,
): Promise<OidcTokenResponse | null> {
  try {
    const res = await fetch(
      `${IDENTITY_API_BASE}/oauth2/session/bootstrap?client_id=${encodeURIComponent(clientId)}`,
      { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return null
    const data = (await res.json()) as OidcTokenResponse
    return data?.access_token ? data : null
  } catch {
    return null
  }
}

/** Best-effort server-side sign-out (revokes refresh sessions + clears SSO cookie). */
export async function revokeServerSession(refreshToken?: string): Promise<void> {
  try {
    const body = new URLSearchParams({ client_id: TECTONA_OIDC_CLIENT_ID })
    if (refreshToken) body.set('refresh_token', refreshToken)
    await fetch(`${IDENTITY_API_BASE}/oauth2/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      keepalive: true,
    })
  } catch {
    /* ignore */
  }
}
