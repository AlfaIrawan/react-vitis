import { useEffect, useState } from 'react'
import { ensureFreshSession, getSession } from '@/auth/authService'
import { useVitisWorkspace } from '@/auth/vitisWorkspace'
import { authenticatedResourceFetch } from '@/lib/api/authenticatedResourceFetch'

export function VitisWorkspaceSelector() {
  const { workspaceId, workspaceIds, select, setMemberships } = useVitisWorkspace()
  const subject = getSession()?.user.id ?? ''
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true); setError('')
      try {
        const appId = (import.meta.env.VITE_VITIS_AUTHZ_APP_ID as string | undefined)?.trim()
        if (!appId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appId)) throw new Error('Administrator setup required: configure VITE_VITIS_AUTHZ_APP_ID to the Vitis WAC application UUID.')
        const session = await ensureFreshSession()
        if (!session || session.user.id !== subject) throw new Error('Sign in again to load workspace memberships.')
        const base = ((import.meta.env.VITE_WORKSPACE_ACCESS_CONTROL_API_URL as string | undefined)?.trim() || '/api/workspace-access-control').replace(/\/$/, '')
        const response = await authenticatedResourceFetch(`${base}/v1/apps/${encodeURIComponent(appId)}/subjects/${encodeURIComponent(subject)}/memberships?active_only=true`)
        if (!response.ok) throw new Error('Workspace access could not be verified. Ask your administrator to check Vitis membership and service configuration.')
        const body = await response.json() as { items?: { app_id: string; subject_id: string; workspace_id: string; status_code: string }[] }
        if (!Array.isArray(body.items)) throw new Error('Invalid workspace membership response.')
        const ids = [...new Set(body.items.filter(item => item.app_id === appId && item.subject_id === subject && item.status_code === 'active').map(item => item.workspace_id))]
        if (!cancelled && getSession()?.user.id === subject) setMemberships(subject, ids)
      } catch (err) {
        if (!cancelled) { setMemberships(subject, []); setError(err instanceof Error ? err.message : 'Unable to verify workspace access.') }
      } finally { if (!cancelled) setLoading(false) }
    }
    void load()
    return () => { cancelled = true }
  }, [subject, reload, setMemberships])
  return <section className="space-y-2 rounded-lg border border-border bg-card p-3 text-sm">
    <label className="block">Authorized workspace
      <select aria-label="Authorized workspace" className="mt-1 w-full rounded border border-border bg-background px-3 py-2" value={workspaceId} disabled={loading} onChange={event => select(event.target.value)}>
        <option value="">Select an existing workspace</option>
        {workspaceIds.map(id => <option key={id} value={id}>{id}</option>)}
      </select>
    </label>
    {loading ? <p role="status">Verifying workspace memberships…</p> : error ? <p role="alert">{error}</p> : !workspaceIds.length ? <p>No active Vitis workspace memberships. Ask your administrator to grant access to an existing workspace.</p> : <p>Only your active Vitis memberships are listed. Application access does not create workspace membership.</p>}
    <button type="button" disabled={loading} onClick={() => setReload(value => value + 1)} className="text-primary hover:underline">Refresh memberships</button>
  </section>
}
