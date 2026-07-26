import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plug, ArrowRight, FolderOpen } from 'lucide-react'
import { useConnectorStore } from '@/modules/connectors'
import { useProjectStore } from '@/modules/projects'
import { PageHeader } from '@/components/layout/PageHeader'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

/**
 * Enterprise-wide view of integration endpoints (Vitis — not AI lifecycle).
 */
export function GlobalIntegrationsCatalogPage() {
  const connectors = useConnectorStore((s) => s.connectors)
  const { getProject } = useProjectStore()

  const rows = useMemo(
    () =>
      [...connectors].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [connectors]
  )

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Integration catalog', href: '/integrations' }]} />
      <PageHeader
        title="Integration catalog"
        description="Semua konektor sistem eksternal di seluruh workspace — API, pesan, dan sumber data untuk orkestrasi proses."
      />

      <div className="glass-card rounded-2xl overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            Belum ada integrasi. Buat dari menu <strong>Integrations</strong> di dalam
            sebuah workspace.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {rows.map((c) => {
              const proj = getProject(c.projectId)
              return (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Plug className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-medium text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {c.type === 'engine' ? 'Application / service' : 'Data source'} ·{' '}
                      {c.status === 'connected' ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FolderOpen className="h-4 w-4" />
                    {proj?.name ?? c.projectId}
                  </div>
                  <Link
                    to={`/projects/${c.projectId}/integrations`}
                    className={cn(
                      'inline-flex items-center gap-1 text-sm font-medium text-primary',
                      'hover:underline'
                    )}
                  >
                    Buka workspace
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
