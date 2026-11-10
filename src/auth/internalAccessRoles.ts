import { createContext, useContext } from 'react'

// Roles come from the live entitlement check, never inferred from email or generic roles.
export const InternalAccessRoles = createContext<string[]>([])
export function canAdministerInternalApp(roles: readonly string[]): boolean {
  return roles.includes('vitis_admin') || roles.includes('vitis_root')
}
export function useInternalAccessRoles() { return useContext(InternalAccessRoles) }
