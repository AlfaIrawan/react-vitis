import type { InternalUserGrant } from './api/internalUsersApi'

export interface PendingInternalMutation {
  kind: 'new' | 'existing'
  baselineRevision: number
  userId: string
  email: string
  roles: string[]
  enabled: boolean
}

// Tab-scoped recovery metadata contains no passwords or tokens. It survives a
// reload so an interrupted POST/PUT cannot silently become a fresh submission.
export function readPendingInternalMutation(key: string): PendingInternalMutation | null {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(key) ?? 'null') as PendingInternalMutation | null
    if (value && (value.kind === 'new' || value.kind === 'existing') && typeof value.userId === 'string'
      && typeof value.email === 'string' && Array.isArray(value.roles) && value.roles.every(role => typeof role === 'string')
      && typeof value.enabled === 'boolean' && Number.isInteger(value.baselineRevision) && value.baselineRevision >= 0) return value
  } catch { /* A missing/unavailable store is handled before any mutation. */ }
  return null
}

export function savePendingInternalMutation(key: string, operation: PendingInternalMutation): boolean {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(operation))
    return window.sessionStorage.getItem(key) === JSON.stringify(operation)
  } catch { return false }
}

export function clearPendingInternalMutation(key: string): void {
  try { window.sessionStorage.removeItem(key) } catch { /* Retain a conservative lock on the next visit. */ }
}

export function internalMutationMatches(operation: PendingInternalMutation, users: InternalUserGrant[]): boolean {
  const user = users.find(item => operation.kind === 'existing' ? item.user_id === operation.userId
    : item.email?.trim().toLowerCase() === operation.email.trim().toLowerCase())
  return !!user && Number.isInteger(user.revision) && (user.revision ?? 0) > operation.baselineRevision
    && user.enabled === operation.enabled && user.roles.length === operation.roles.length
    && operation.roles.every(role => user.roles.includes(role))
}

export function rootSuccessorReadiness(user: InternalUserGrant, prefix: string, now = Date.now()): string {
  if (user.is_bootstrap) return 'Protected bootstrap; cannot act as its own successor.'
  if (!user.roles.includes(`${prefix}_root`)) return 'A non-bootstrap application root is required.'
  if (!user.enabled || user.account_status !== 'active') return 'Not ready: active account and enabled access are required.'
  if (user.valid_until != null) return 'Not ready: the successor grant must be durable, without an expiry.'
  const updated = Date.parse(user.updated_at ?? '')
  const login = Date.parse(user.login_verified_at ?? '')
  const admin = Date.parse(user.admin_verified_at ?? '')
  if (!Number.isFinite(updated)) return 'Cannot verify: latest grant update time is unavailable. Refresh the directory.'
  if (!Number.isFinite(login) || login < updated) return 'Not ready: complete a fresh interactive login after the latest grant change.'
  if (!Number.isFinite(admin) || admin < login) return 'Not ready: open this administration directory after the fresh login.'
  if (admin <= now - 24 * 60 * 60 * 1000) return 'Not ready: administration verification is older than 24 hours. Open this directory again.'
  if (updated > now || login > now || admin > now) return 'Cannot verify: server and browser clocks differ. The server must check eligibility.'
  return 'Ready for server verification: durable root with fresh login and administration proof.'
}
