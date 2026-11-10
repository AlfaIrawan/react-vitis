import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getSession } from '@/auth/authService'
import { InternalAccessDenied } from '@/auth/InternalAccessGate'
import { canAdministerInternalApp, useInternalAccessRoles } from '@/auth/internalAccessRoles'
import { listInternalUsers, parseInternalRoles, provisionInternalUser, updateInternalGrant, type InternalUserGrant } from '@/lib/api/internalUsersApi'

const fieldClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm'
const buttonClass = 'rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50'

export function InternalUsersPage() {
  const currentRoles = useInternalAccessRoles()
  const allowed = canAdministerInternalApp(currentRoles)
  const root = currentRoles.includes('vitis_root')
  const [users, setUsers] = useState<InternalUserGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const generation = useRef(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [roles, setRoles] = useState('vitis_member')
  const [enabled, setEnabled] = useState(true)
  const [localPassword, setLocalPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const selected = mode === 'existing' ? users.find(user => user.user_id === userId.trim()) : undefined
  const protectedAdmin = selected?.roles.some(role => role === 'vitis_admin' || role === 'vitis_root') ?? false

  const load = useCallback(async () => {
    if (!allowed) return
    const request = ++generation.current
    setLoading(true)
    try {
      const data = await listInternalUsers()
      if (request === generation.current) { setUsers(data.items); setError('') }
    } catch (err) {
      if (request === generation.current) setError(err instanceof Error ? err.message : 'Unable to load users.')
    } finally { if (request === generation.current) setLoading(false) }
  }, [allowed])
  useEffect(() => { void load(); return () => { generation.current++ } }, [load])

  function reset(next: 'new' | 'existing') {
    setMode(next); setUserId(''); setEmail(''); setDisplayName(''); setRoles('vitis_member')
    setEnabled(true); setPassword(''); setLocalPassword(false); setConfirmed(false); setNotice(''); setError('')
  }
  function edit(user: InternalUserGrant) {
    reset('existing'); setUserId(user.user_id); setRoles(user.roles.join(', ')); setEnabled(user.enabled)
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!allowed || pending.current || !confirmed) return
    setError(''); setNotice('')
    let parsed: string[]
    try {
      parsed = parseInternalRoles(roles)
      if (!root && (protectedAdmin || parsed.includes('vitis_admin') || parsed.includes('vitis_root'))) throw new Error('Only an application root can change administrator or root grants.')
      if (selected?.is_bootstrap && !parsed.includes('vitis_root')) throw new Error('Bootstrap identity cannot be demoted. Retain its root role.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Invalid roles.'); return }
    pending.current = true; setBusy(true)
    const secret = password
    setPassword('')
    try {
      if (mode === 'new') {
        await provisionInternalUser({ email: email.trim(), display_name: displayName.trim(), roles: parsed,
          ...(localPassword ? { password: secret } : {}) })
      } else await updateInternalGrant(userId.trim(), { roles: parsed, enabled })
      setConfirmed(false)
      setNotice('Saved. Changed grants revoke existing sessions; the user must sign in again.')
      if (mode === 'existing' && userId.trim() === getSession()?.user.id) {
        window.location.assign('/login')
        return
      }
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save. Refresh and check before retrying.') }
    finally { pending.current = false; setBusy(false) }
  }

  if (!allowed) return <InternalAccessDenied administration />
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Vitis users &amp; access</h1><p className="text-sm text-muted-foreground">Administrator-managed application identities and entitlements.</p></div>
        <Link to="/" className={buttonClass}>Back to application</Link>
      </header>
      <section className="rounded-lg border border-border bg-card p-4 text-sm space-y-2">
        <p>Only a Vitis root can change admin or root grants. Bootstrap identities cannot be deleted or demoted. The last durable administrator is protected.</p>
        <p>Before disabling bootstrap access, establish a durable non-bootstrap root successor. That person must complete a fresh interactive login and open this directory after their latest grant change, within 24 hours. The server verifies eligibility.</p>
        <p>This page only manages Vitis grants. Existing identity UUIDs must come from an authorized identity administrator; there is no global identity search.</p>
      </section>
      {error && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-border p-3 text-sm">{notice}</p>}
      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Application directory</h2><button type="button" className={buttonClass} disabled={busy || loading} onClick={() => void load()}>Refresh directory</button></div>
        {loading && <p role="status">Loading application users.</p>}
        {!loading && users.length === 0 && <p>No application grants found.</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {users.map(user => <article key={user.user_id} className="min-w-0 rounded-lg border border-border p-3 text-sm space-y-2">
            <h3 className="font-semibold break-words">{user.display_name || user.email || user.user_id}</h3>
            <p className="break-words">{user.email}</p><p className="break-all text-xs">Identity UUID: {user.user_id}</p>
            <p className="break-words">Roles: {user.roles.join(', ')}</p>
            <p>{user.enabled ? 'Access enabled' : 'Access disabled'} · Account: {user.account_status ?? 'unknown'}{user.is_bootstrap ? ' · Protected bootstrap' : ''}</p>
            {user.valid_until && <p>Temporary grant expires: {user.valid_until}</p>}
            <button type="button" className={buttonClass} disabled={busy || (!root && user.roles.some(role => role === 'vitis_admin' || role === 'vitis_root'))} onClick={() => edit(user)}>Edit access</button>
          </article>)}
        </div>
      </section>
      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} aria-pressed={mode === 'new'} disabled={busy} onClick={() => reset('new')}>Provision new identity</button><button type="button" className={buttonClass} aria-pressed={mode === 'existing'} disabled={busy} onClick={() => reset('existing')}>Grant existing identity</button></div>
        <form onSubmit={event => void submit(event)} className="space-y-4" onChange={() => setConfirmed(false)}>
          <fieldset disabled={busy} className="space-y-4">
            {mode === 'new' ? <>
              <label className="block text-sm space-y-1">Work email<input className={fieldClass} type="email" required maxLength={320} value={email} onChange={event => setEmail(event.target.value)} /></label>
              <label className="block text-sm space-y-1">Display name<input className={fieldClass} required maxLength={256} value={displayName} onChange={event => setDisplayName(event.target.value)} /></label>
              <label className="flex gap-2 text-sm"><input type="checkbox" checked={localPassword} onChange={event => { setLocalPassword(event.target.checked); setPassword('') }} />Enable local password sign-in (otherwise federated-only)</label>
              {localPassword && <label className="block text-sm space-y-1">Initial password<input className={fieldClass} type="password" autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} /><span className="block text-xs text-muted-foreground">Must satisfy the identity service password policy. Never place credentials in notes or URLs. Password is cleared after submission and not retained by this app.</span></label>}
            </> : <label className="block text-sm space-y-1">Existing identity UUID<input className={fieldClass} required value={userId} onChange={event => setUserId(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></label>}
            <label className="block text-sm space-y-1">Application roles<input className={fieldClass} required value={roles} onChange={event => setRoles(event.target.value)} /><span className="block text-xs">Comma-separated vitis_ roles. Examples: vitis_member{root ? ', vitis_admin, vitis_root' : ''}. Preserve existing product roles when editing.</span></label>
            {mode === 'existing' && <label className="flex gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />Application access enabled</label>}
          </fieldset>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={event => { event.stopPropagation(); setConfirmed(event.target.checked) }} />I reviewed this identity, roles and access state. I understand changes revoke this user’s application sessions.</label>
          <button type="submit" className={buttonClass} disabled={busy || !confirmed || (!root && protectedAdmin)}>{busy ? 'Saving…' : mode === 'new' ? 'Create identity and grant access' : 'Save application access'}</button>
        </form>
      </section>
    </main>
  )
}
