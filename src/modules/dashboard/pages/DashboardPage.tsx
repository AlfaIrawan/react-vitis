import { Link } from 'react-router-dom'
import { Activity, FolderOpen, Plug, Workflow } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

const capabilities = [
  { title: 'Workspaces', description: 'Organize integrations and workflows by workspace.', path: '/projects', Icon: FolderOpen },
  { title: 'Integration catalog', description: 'Browse connectors across your workspaces.', path: '/integrations', Icon: Plug },
  { title: 'Workflow designer', description: 'Design and organize process flows.', path: '/workflows', Icon: Workflow },
  { title: 'Process monitor', description: 'Review execution records across workspaces.', path: '/monitor', Icon: Activity },
]

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Vitis" description="Integration and process orchestration" />
      <nav aria-label="Vitis capabilities" className="grid gap-4 sm:grid-cols-2">
        {capabilities.map(({ title, description, path, Icon }) => (
          <Link key={path} to={path} className="glass-card rounded-2xl p-5 transition hover:border-primary focus-visible:outline focus-visible:outline-primary">
            <Icon className="mb-3 h-5 w-5 text-primary" aria-hidden />
            <h2 className="font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </Link>
        ))}
      </nav>
    </div>
  )
}
