import { getSession } from '@/auth/authService'
import { IDENTITY_API_BASE } from './gatewayBase'

export interface InternalUserGrant {
  user_id: string
  email?: string
  display_name?: string
  roles: string[]
  enabled: boolean
  is_bootstrap?: boolean
  account_status?: string
  valid_until?: string | null
  login_verified_at?: string | null
  admin_verified_at?: string | null
  updated_at?: string | null
  revision?: number
}
export interface ProvisionInternalUser { email: string; display_name: string; roles: string[]; password?: string }
export interface UpdateInternalGrant { roles: string[]; enabled: boolean }
const base = `${IDENTITY_API_BASE}/v1/internal-apps/vitis-spa/users`

export function parseInternalRoles(value: string): string[] {
  const roles = [...new Set(value.split(',').map(role => role.trim()).filter(Boolean))]
  if (!roles.length || roles.length > 32 || roles.some(role => !/^vitis_[a-z][a-z0-9_]*$/.test(role))) {
    throw new Error('Enter one or more vitis_ roles, separated by commas (maximum 32).')
  }
  return roles
}

function safeError(status: number, detail: unknown): string {
  const messages: Record<string, string> = {
    application_root_required_for_admin_changes: 'Only an application root can change administrator or root grants.',
    application_admin_required: 'Your current account is not an administrator for this application.',
    grant_conflict_or_successor_required: 'Change blocked. Preserve the last durable administrator. Bootstrap retirement requires a verified durable root successor.',
    identity_exists_or_invalid_grant: 'This identity already exists or the grant is invalid. Use its verified UUID to grant access; existing accounts are not overwritten.',
    roles_must_belong_to_application: 'All roles must belong to this application.',
    bootstrap_must_remain_root: 'The protected bootstrap identity must retain its root role.',
  }
  if (typeof detail === 'string' && messages[detail]) return messages[detail]
  if (status === 401) return 'Your session is no longer valid. Sign in again.'
  if (status === 403) return 'Access denied. Current application administrator or root permission is required.'
  if (status === 422) return 'Validation failed. Check the email, identity UUID, roles and password policy.'
  if (status === 409) return 'Change conflicts with an existing identity or protected administrator constraint. Refresh and review before retrying.'
  return 'The identity service could not complete this operation. Refresh the directory to check its outcome before retrying.'
}
export class InternalMutationOutcomeUnknownError extends Error {
  readonly outcomeUnknown = true
}
export function isInternalMutationOutcomeUnknown(error: unknown): boolean {
  return error instanceof InternalMutationOutcomeUnknownError
}

async function request<T>(suffix: string, method: 'GET' | 'POST' | 'PUT', body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getSession()?.token
  if (token) headers.Authorization = `Bearer ${token}`
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(base + suffix, { method, credentials: 'include', headers, signal: controller.signal,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { detail?: unknown }
      if (method !== 'GET' && response.status >= 500) throw new InternalMutationOutcomeUnknownError('The service could not confirm the change. Refresh the directory to reconcile its outcome before any further save.')
      throw new Error(safeError(response.status, error.detail))
    }
    try { return await response.json() as T }
    catch {
      if (method !== 'GET') throw new InternalMutationOutcomeUnknownError('The change response was incomplete. Refresh the directory to reconcile its outcome before any further save.')
      throw new Error('The directory response was incomplete. Refresh and try again.')
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError' && !(error instanceof TypeError)) throw error
    if (method !== 'GET') throw new InternalMutationOutcomeUnknownError('Connection interrupted. The change may have completed. Refresh the directory and verify its outcome before any further save.')
    throw new Error('Unable to load the application directory. Try again.')
  } finally { window.clearTimeout(timer) }
}
export const listInternalUsers = () => request<{ items: InternalUserGrant[] }>('', 'GET')
export const provisionInternalUser = (body: ProvisionInternalUser) => request<InternalUserGrant>('', 'POST', body)
export function updateInternalGrant(userId: string, body: UpdateInternalGrant) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return Promise.reject(new Error('Enter the existing identity UUID supplied by your identity administrator.'))
  }
  return request<InternalUserGrant>(`/${encodeURIComponent(userId)}`, 'PUT', body)
}
