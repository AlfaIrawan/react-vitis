import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Archive,
  ArrowLeft,
  MoreVertical,
  GitBranch,
  Plug,
  Workflow,
  Activity,
  Database,
  Code,
  Package,
  Rocket,
  Cpu,
  FileText,
  BarChart3,
  Zap,
  Image,
  TrendingUp,
  ShoppingCart,
  CalendarClock,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useProjectStore } from '@/modules/projects'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { useToast } from '@/components/ui/toast'
import { notifyEvent } from '@/lib/api/notificationApi'
import { ProjectContextSidebar, PROJECT_SIDEBAR_STORAGE_KEY } from './ProjectContextSidebar'
import { ConnectorListPage } from '@/modules/connectors'
import { WorkflowListPage } from '@/modules/workflows'
import { RunListPage } from '@/modules/runs'
import { useConnectorStore } from '@/modules/connectors'
import { useRunStore } from '@/modules/runs'
import { getAllWorkflows } from '@/modules/workflows/utils/workflowStorage'
import { VitisPlaceholderTab } from '@/modules/vitis'
import { cn } from '@/lib/utils'
import type { Project } from '@/modules/projects'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MODULE_ROUTES = {
  overview: 'overview',
  integrations: 'integrations',
  workflows: 'workflows',
  executions: 'executions',
  schedules: 'schedules',
  policies: 'policies',
} as const

const PROJECT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  database: Database,
  code: Code,
  package: Package,
  rocket: Rocket,
  cpu: Cpu,
  'file-text': FileText,
  'bar-chart-3': BarChart3,
  zap: Zap,
  image: Image,
  'trending-up': TrendingUp,
  'shopping-cart': ShoppingCart,
  gitbranch: GitBranch,
  plug: Plug,
  workflow: Workflow,
}

const PROJECT_BORDER_COLORS = [
  '#3b82f6',
  '#a855f7',
  '#10b981',
  '#f97316',
  '#ec4899',
  '#06b6d4',
  '#6366f1',
  '#14b8a6',
] as const

function getProjectBorderColor(project: Project) {
  if (project.borderColor) return project.borderColor
  let hash = 0
  for (let i = 0; i < project.id.length; i += 1) {
    hash = (hash * 31 + project.id.charCodeAt(i)) >>> 0
  }
  return PROJECT_BORDER_COLORS[hash % PROJECT_BORDER_COLORS.length]
}

function getProjectHeaderIcon(project: Project) {
  if (project.iconName && PROJECT_ICON_MAP[project.iconName]) {
    return PROJECT_ICON_MAP[project.iconName]
  }
  return GitBranch
}

type ModuleKey = keyof typeof MODULE_ROUTES

export function ProjectWorkspace() {
  const { id: projectId, tab } = useParams<{ id: string; tab?: string }>()
  const navigate = useNavigate()
  const { getProject, archiveProject } = useProjectStore()
  const { setActiveProject } = useActiveProjectStore()
  const { addToast } = useToast()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(PROJECT_SIDEBAR_STORAGE_KEY)
    return stored ? JSON.parse(stored) : false
  })

  const project = projectId ? getProject(projectId) : undefined

  useEffect(() => {
    localStorage.setItem(PROJECT_SIDEBAR_STORAGE_KEY, JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    if (projectId) setActiveProject(projectId)
  }, [projectId, setActiveProject])

  useEffect(() => {
    if (tab === 'settings' && projectId) {
      navigate(`/projects/${projectId}`, { replace: true })
    }
  }, [tab, projectId, navigate])

  const currentModule =
    tab && Object.values(MODULE_ROUTES).includes(tab as never)
      ? (tab as ModuleKey)
      : 'overview'

  if (!project) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Workspaces
        </Button>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Workspace not found</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const handleArchive = async () => {
    try {
      await archiveProject(project.id)
      navigate('/projects')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to archive'
      addToast({ title: 'Error', description: msg, variant: 'error' })
    }
  }

  const IconComponent = getProjectHeaderIcon(project)

  return (
    <>
      <ProjectContextSidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div
        className={cn(
          'flex flex-col flex-1 min-h-0 gap-4 transition-all duration-300',
          'mr-0 md:mr-12',
          sidebarCollapsed ? 'lg:mr-12' : 'lg:mr-72'
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div
              className="self-stretch w-[10px]"
              style={{ backgroundColor: getProjectBorderColor(project) }}
              aria-hidden
            />
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                <div
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                    project.status === 'active'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {project.status === 'active' ? 'Active' : 'Archived'}
                </div>
              </div>
              {project.description && (
                <p className="text-xs text-muted-foreground mb-2">{project.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(project.createdAt)}</span>
              </div>
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-[10px] rounded-md bg-accent/50 text-accent-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {project.status === 'active' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleArchive} className="text-destructive">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {currentModule === 'overview' && (
          <VitisOverviewTab project={project} />
        )}
        {currentModule === 'integrations' && <ConnectorListPage />}
        {currentModule === 'workflows' && <WorkflowListPage />}
        {currentModule === 'executions' && <RunListPage />}
        {currentModule === 'schedules' && (
          <VitisPlaceholderTab
            title="Schedules & triggers"
            description="Jadwalkan eksekusi workflow (cron, event-driven). Modul ini akan menghubungkan ke mesin penjadwal terpusat — belum mengelola model atau pelatihan AI."
            icon={CalendarClock}
          />
        )}
        {currentModule === 'policies' && (
          <VitisPlaceholderTab
            title="Policies & SLAs"
            description="Kebijakan routing pesan, retry, timeout, dan SLA antar sistem. Terpisah dari governance model AI."
            icon={Shield}
          />
        )}
      </div>
    </>
  )
}

function VitisOverviewTab({ project }: { project: Project }) {
  const getConnectorsByProject = useConnectorStore((s) => s.getConnectorsByProject)
  const runs = useRunStore((s) => s.runs)
  const { updateProject } = useProjectStore()
  const { addToast } = useToast()

  const connectors = getConnectorsByProject(project.id)
  const wfCount = getAllWorkflows(project.id).length
  const execCount = runs.filter((r) => r.projectId === project.id).length

  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
  })
  const [tags, setTags] = useState<string[]>(project.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFormData({
      name: project.name,
      description: project.description || '',
    })
    setTags(project.tags || [])
  }, [project])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      addToast({ title: 'Error', description: 'Name required', variant: 'error' })
      return
    }
    setSaving(true)
    try {
      await updateProject(project.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        tags,
      })
      addToast({ title: 'Saved', description: 'Workspace updated', variant: 'success' })
      notifyEvent({
        type_code: 'project',
        title: 'Workspace updated',
        body: project.name,
      })
    } catch (e) {
      addToast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed',
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Integrations', value: connectors.length, icon: Plug },
          { label: 'Workflows', value: wfCount, icon: Workflow },
          { label: 'Executions', value: execCount, icon: Activity },
        ].map((c) => (
          <div key={c.label} className="glass-card rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <c.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {(connectors.length === 0 || wfCount === 0) && (
        <div className="px-1">
          <p className="text-sm font-semibold text-foreground">Getting started</p>
          <p className="text-sm text-muted-foreground mt-1">
            Hubungkan sistem eksternal lewat <strong>Integrations</strong>, definisikan alur di{' '}
            <strong>Workflows</strong>, lalu pantau jalannya di <strong>Executions</strong>. Vitis
            fokus pada orkestrasi proses — bukan dataset, pelatihan model, atau deployment ML.
          </p>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Workspace settings</h3>
        <div className="space-y-2">
          <Label htmlFor="ws-name">Name</Label>
          <Input
            id="ws-name"
            value={formData.name}
            onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ws-desc">Description</Label>
          <Input
            id="ws-desc"
            value={formData.description}
            onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-1 mb-1">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                className="text-xs px-2 py-0.5 rounded-md bg-muted"
                onClick={() => setTags(tags.filter((x) => x !== t))}
              >
                {t} ×
              </button>
            ))}
          </div>
          <Input
            placeholder="Add tag, Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tagInput.trim()) {
                e.preventDefault()
                const t = tagInput.trim().toLowerCase()
                if (!tags.includes(t)) setTags([...tags, t])
                setTagInput('')
              }
            }}
          />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
