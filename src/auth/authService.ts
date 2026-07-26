// Single source of truth for demo users (id used by notification service)
export const DEMO_USERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@vitis.local',
    password: 'admin',
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'reviewer@vitis.local',
    password: 'reviewer',
    name: 'Reviewer User',
    role: 'reviewer',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'member@vitis.local',
    password: 'member',
    name: 'Member User',
    role: 'member',
  },
] as const

export interface Session {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  token: string
  loginAt: string
}

const SESSION_KEY = 'vitis_session'

/**
 * Login with email and password
 * Normalizes input and validates against DEMO_USERS
 * @throws {Error} if credentials are invalid
 */
export function login(email: string, password: string): Session {
  // Normalize input
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPassword = password.trim()

  // Find user in DEMO_USERS
  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === normalizedPassword
  )

  if (!user) {
    throw new Error('Invalid email or password')
  }

  // Don't overwrite existing session if login fails (but this is success, so proceed)
  const session: Session = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token: 'demo-token',
    loginAt: new Date().toISOString(),
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

/**
 * Logout current user
 */
export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}

/**
 * Get current session from localStorage
 */
/** Map email to demo user id for notification service (legacy sessions without id). */
const EMAIL_TO_ID: Record<string, string> = {
  'admin@vitis.local': '00000000-0000-0000-0000-000000000001',
  'reviewer@vitis.local': '00000000-0000-0000-0000-000000000002',
  'member@vitis.local': '00000000-0000-0000-0000-000000000003',
}

export function getSession(): Session | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) {
      return null
    }

    const session = JSON.parse(stored) as Session
    if (session?.user && !('id' in session.user)) {
      session.user.id = EMAIL_TO_ID[session.user.email?.toLowerCase()] ?? '00000000-0000-0000-0000-000000000001'
    }
    return session
  } catch {
    return null
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getSession() !== null
}

/**
 * Require authentication - returns session or null
 * Helper for components that need to check auth status
 * @returns Session if authenticated, null otherwise
 */
export function requireAuth(): Session | null {
  return getSession()
}

/**
 * Get demo accounts info (for login page helper)
 * Uses DEMO_USERS as single source of truth
 */
export function getDemoAccounts() {
  return DEMO_USERS.map(({ email, password, role, name }) => ({
    email,
    password,
    role,
    name,
  }))
}