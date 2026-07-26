import { Link } from 'react-router-dom'
import { Plug, Activity, Workflow, FolderOpen, ArrowRight, GitBranch } from 'lucide-react'
import { useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useConnectorStore } from '@/modules/connectors'
import { useRunStore } from '@/modules/runs'
import { useProjectStore } from '@/modules/projects'
import { getAllWorkflows } from '@/modules/workflows/utils/workflowStorage'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const connectors = useConnectorStore((s) => s.connectors)
  const runs = useRunStore((s) => s.runs)
  const projects = useProjectStore((s) => s.projects)

  const workflowCount = useMemo(() => {
    let n = 0
    for (const p of projects) {
      n += getAllWorkflows(p.id).length
    }
    return n
  }, [projects])

  const cards = [
    {
      title: 'Workspaces',
      value: projects.filter((p) => p.status === 'active').length,
      subtitle: 'Ruang kerja orkestrasi aktif',
      icon: FolderOpen,
      link: '/projects',
      color: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Integrations',
      value: connectors.length,
      subtitle: 'Konektor ke sistem eksternal',
      icon: Plug,
      link: '/integrations',
      color: 'text-violet-600',
      iconBg: 'bg-violet-50 border-violet-200',
    },
    {
      title: 'Process definitions',
      value: workflowCount,
      subtitle: 'Alur yang didefinisikan di semua workspace',
      icon: Workflow,
      link: '/projects',
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Executions (all)',
      value: runs.length,
      subtitle: 'Catatan eksekusi proses',
      icon: Activity,
      link: '/monitor',
      color: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-200',
    },
  ]

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard' }]} />
      <PageHeader
        title="Vitis Dashboard"
        description="Ikhtisar integrasi dan orkestrasi proses. Bukan siklus hidup AI — kelola alur di setiap workspace."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Link
              key={c.title}
              to={c.link}
              className={cn(
                'glass-card rounded-2xl p-5 transition-all duration-200',
                'hover:shadow-lg hover:border-primary/20 group'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={cn(
                    'p-2.5 rounded-xl border',
                    c.iconBg
                  )}
                >
                  <Icon className={cn('h-5 w-5', c.color)} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {c.value}
                </div>
                <div className="text-sm font-medium text-foreground mt-1">{c.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.subtitle}</div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <GitBranch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Mulai cepat</h3>
              <p className="text-xs text-muted-foreground">
                Orkestrasi end-to-end
              </p>
            </div>
          </div>
          <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
            <li>
              Buka <Link className="text-primary font-medium hover:underline" to="/projects">Workspaces</Link> dan pilih atau buat workspace.
            </li>
            <li>
              Tambah <strong className="text-foreground">Integrations</strong> (API, antrean pesan, database).
            </li>
            <li>
              Rancang <strong className="text-foreground">Workflow</strong> lalu jalankan dari{' '}
              <strong className="text-foreground">Executions</strong>.
            </li>
          </ol>
        </div>
        <div className="glass-card rounded-2xl p-6 border-dashed">
          <h3 className="font-semibold text-foreground mb-2">Enterprise visibility</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Lihat semua konektor dan eksekusi lintas workspace tanpa masuk ke setiap proyek.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/integrations"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Integration catalog →
            </Link>
            <Link
              to="/monitor"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Process monitor →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
