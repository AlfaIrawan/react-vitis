import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Activity,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  X,
  Plug,
  Workflow,
  CalendarClock,
  Shield,
  GitBranch,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/modules/projects'
import { useConnectorStore } from '@/modules/connectors'
import { useRunStore } from '@/modules/runs'
import { getAllWorkflows } from '@/modules/workflows/utils/workflowStorage'

const MODULE_ROUTES = {
  overview: 'overview',
  integrations: 'integrations',
  workflows: 'workflows',
  executions: 'executions',
  schedules: 'schedules',
  policies: 'policies',
} as const

type ModuleKey = keyof typeof MODULE_ROUTES

interface ModuleItem {
  key: ModuleKey
  label: string
  icon: React.ComponentType<{ className?: string }>
  route: string
}

const MODULES: ModuleItem[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, route: MODULE_ROUTES.overview },
  { key: 'integrations', label: 'Integrations', icon: Plug, route: MODULE_ROUTES.integrations },
  { key: 'workflows', label: 'Workflow Designer & Orchestration', icon: Workflow, route: MODULE_ROUTES.workflows },
  { key: 'executions', label: 'Executions', icon: Activity, route: MODULE_ROUTES.executions },
  { key: 'schedules', label: 'Schedules', icon: CalendarClock, route: MODULE_ROUTES.schedules },
  { key: 'policies', label: 'Policies', icon: Shield, route: MODULE_ROUTES.policies },
]

export const PROJECT_SIDEBAR_STORAGE_KEY = 'vitis-project-context-sidebar-collapsed'

export function ProjectContextSidebar({
  collapsed: controlledCollapsed,
  onCollapsedChange,
}: {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
} = {}) {
  const { id: projectId, tab } = useParams<{ id: string; tab?: string }>()
  const navigate = useNavigate()
  const { getProject } = useProjectStore()
  const getConnectorsByProject = useConnectorStore((s) => s.getConnectorsByProject)
  const runs = useRunStore((s) => s.runs)

  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    const stored = localStorage.getItem(PROJECT_SIDEBAR_STORAGE_KEY)
    return stored ? JSON.parse(stored) : false
  })

  const isControlled = controlledCollapsed !== undefined
  const collapsed = isControlled ? controlledCollapsed : internalCollapsed
  const setCollapsed = (value: boolean) => {
    if (isControlled) onCollapsedChange?.(value)
    else setInternalCollapsed(value)
  }

  const [mobileOpen, setMobileOpen] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  const project = projectId ? getProject(projectId) : undefined

  useEffect(() => {
    if (!isControlled) {
      localStorage.setItem(PROJECT_SIDEBAR_STORAGE_KEY, JSON.stringify(collapsed))
    }
  }, [collapsed, isControlled])

  useEffect(() => setMobileOpen(false), [tab])

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      setIsTablet(w >= 768 && w < 1024)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isIconOnly = collapsed || isTablet
  if (!project) return null

  const currentModule =
    tab && Object.values(MODULE_ROUTES).includes(tab as never)
      ? (tab as ModuleKey)
      : 'overview'

  const connectors = getConnectorsByProject(project.id)
  const wfCount = getAllWorkflows(project.id).length
  const execCount = runs.filter((r) => r.projectId === project.id).length

  const moduleCounts: Partial<Record<ModuleKey, number>> = {
    integrations: connectors.length,
    workflows: wfCount,
    executions: execCount,
  }

  const handleModuleClick = (module: ModuleItem) => {
    if (!projectId) return
    if (module.route === MODULE_ROUTES.overview) {
      navigate(`/projects/${projectId}`)
    } else {
      navigate(`/projects/${projectId}/${module.route}`)
    }
  }

  const handleAction = (action: string) => {
    if (!projectId) return
    if (action === 'new-execution') navigate(`/projects/${projectId}/executions`)
    if (action === 'new-workflow') navigate(`/projects/${projectId}/workflows`)
  }

  const getContextualActions = () => {
    switch (currentModule) {
      case 'executions':
        return [{ label: 'New execution', action: 'new-execution', icon: Plus }]
      case 'workflows':
        return [{ label: 'Workflow Orchestration Studio', action: 'new-workflow', icon: GitBranch }]
      default:
        return []
    }
  }

  const contextualActions = getContextualActions()

  const MobileOverlay = mobileOpen && (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
      onClick={() => setMobileOpen(false)}
    />
  )

  return (
    <>
      {!mobileOpen && (
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden fixed bottom-4 right-4 z-40 shadow-lg bg-background"
          onClick={() => setMobileOpen(true)}
        >
          <GitBranch className="w-4 h-4" />
        </Button>
      )}
      {MobileOverlay}
      <aside
        className={cn(
          'fixed right-0 top-12 h-[calc(100vh-3rem)] glass-sidebar border-l border-border/20 transition-all duration-300 z-50',
          mobileOpen ? 'block w-72 translate-x-0 lg:hidden' : 'hidden translate-x-full lg:translate-x-0',
          'md:block md:w-12',
          'lg:block',
          collapsed ? 'lg:w-12' : 'lg:w-72'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="hidden lg:flex items-center justify-between p-2 border-b border-border/20">
            {!collapsed && (
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                Workspace
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="md:hidden flex items-center justify-between p-4 border-b border-border/20">
            <h2 className="text-lg font-semibold text-foreground">Context</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isIconOnly ? (
              <div className="space-y-1">
                {MODULES.map((module) => {
                  const Icon = module.icon
                  const isActive = currentModule === module.key
                  return (
                    <Tooltip key={module.key} content={module.label} side="right">
                      <button
                        onClick={() => handleModuleClick(module)}
                        className={cn(
                          'w-full p-2 rounded-lg transition-colors flex items-center justify-center',
                          isActive
                            ? 'bg-primary/20 text-primary'
                            : 'text-muted-foreground hover:bg-accent/30'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  )
                })}
              </div>
            ) : (
              <nav className="space-y-1">
                {MODULES.map((module) => {
                  const Icon = module.icon
                  const isActive = currentModule === module.key
                  const count = moduleCounts[module.key]
                  const showCount =
                    count !== undefined && count > 0 && ['integrations', 'workflows', 'executions'].includes(module.key)

                  return (
                    <button
                      key={module.key}
                      onClick={() => handleModuleClick(module)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        'hover:bg-accent/30',
                        isActive ? 'bg-primary/20 text-primary shadow-sm' : 'text-muted-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{module.label}</span>
                      </div>
                      {showCount && (
                        <span className="text-xs text-muted-foreground font-normal">{count}</span>
                      )}
                    </button>
                  )
                })}
              </nav>
            )}
          </div>

          {!collapsed && contextualActions.length > 0 && (
            <div className="p-2 border-t border-border/20">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                Actions
              </div>
              <div className="space-y-1">
                {contextualActions.map((a) => {
                  const I = a.icon
                  return (
                    <Button
                      key={a.action}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleAction(a.action)}
                    >
                      <I className="w-3.5 h-3.5 mr-2" />
                      {a.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {!collapsed && (
            <div className="p-4 border-t border-border/20 mt-auto">
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Workspace
                  </div>
                  <div className="font-medium text-foreground">{project.name}</div>
                  <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/20">
                  Vitis · Integration &amp; Process Orchestration
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
