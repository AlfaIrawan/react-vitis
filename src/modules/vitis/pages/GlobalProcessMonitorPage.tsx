import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, FolderOpen } from 'lucide-react'
import { useRunStore } from '@/modules/runs'
import { useProjectStore } from '@/modules/projects'
import { PageHeader } from '@/components/layout/PageHeader'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  ready: 'Ready',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  blocked: 'Blocked',
}

/**
 * Cross-workspace process execution monitor (Vitis).
 */
export function GlobalProcessMonitorPage() {
  const runs = useRunStore((s) => s.runs)
  const { getProject } = useProjectStore()

  const rows = useMemo(
    () =>
      [...runs].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [runs]
  )

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Process monitor', href: '/monitor' }]} />
      <PageHeader
        title="Process monitor"
        description="Eksekusi alur proses dan orkestrasi di semua workspace — bukan pelatihan model."
      />

      <div className="glass-card rounded-2xl overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            Belum ada eksekusi. Mulai dari tab <strong>Executions</strong> di dalam
            workspace.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {rows.map((r) => {
              const proj = getProject(r.projectId)
              const st = statusLabel[r.status] ?? r.status
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-medium text-foreground">{r.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{st}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FolderOpen className="h-4 w-4" />
                    {proj?.name ?? r.projectId}
                  </div>
                  <Link
                    to={`/projects/${r.projectId}/executions`}
                    className={cn(
                      'inline-flex items-center gap-1 text-sm font-medium text-primary',
                      'hover:underline'
                    )}
                  >
                    Detail
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
