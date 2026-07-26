import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  FolderOpen,
  Plug,
  Activity,
  Settings,
  Grid3x3,
  GitBranch,
  Workflow,
  Zap,
  BarChart3,
  Shield,
  Users,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface AppLauncherItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  path: string
}

const ROWS_PER_COLUMN = 3

const existingNavItems: AppLauncherItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'Workspace governance, lifecycle, access, and portfolio control',
    path: '/',
  },
  {
    icon: FolderOpen,
    label: 'Workspaces',
    description: 'Browse workspaces across your instance',
    path: '/projects',
  },
  {
    icon: Plug,
    label: 'Integration Catalog',
    description: 'Enterprise connector inventory, API registry, and system integration control',
    path: '/integrations',
  },
  {
    icon: Workflow,
    label: 'Workflow Designer & Orchestration',
    description: 'AI-native visual workflow orchestration, execution design, reusable automation flows, decision routing, runtime coordination, and enterprise execution control',
    path: '/workflows',
  },
  {
    icon: Activity,
    label: 'Process Monitor',
    description: 'Execution logs, process health, SLA tracking, and real-time monitoring dashboard',
    path: '/monitor',
  },
  {
    icon: Zap,
    label: 'Automation Rules',
    description: 'Trigger configuration, conditional execution, approval workflows, and state automation',
    path: '/automation',
  },
  {
    icon: BarChart3,
    label: 'Analytics & Reporting',
    description: 'Integration metrics, process performance, throughput analysis, and KPI dashboards',
    path: '/analytics',
  },
  {
    icon: FileText,
    label: 'Documentation',
    description: 'API docs, integration guides, workflow templates, and best practices',
    path: '/docs',
  },
  {
    icon: Settings,
    label: 'Platform Settings',
    description: 'System configuration, user management, security policies, and environment control',
    path: '/settings',
  },
]

const launcherColumns = Array.from({ length: 3 }, (_, index) =>
  existingNavItems.slice(index * ROWS_PER_COLUMN, (index + 1) * ROWS_PER_COLUMN)
)

export function AppLauncher() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleItemClick = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  const isItemActive = (path: string) =>
    location.pathname === path ||
    (path === '/projects' && location.pathname.startsWith('/projects')) ||
    (path === '/integrations' && location.pathname === '/integrations') ||
    (path === '/monitor' && location.pathname === '/monitor') ||
    (path === '/workflows' && location.pathname.startsWith('/workflows')) ||
    (path === '/automation' && location.pathname === '/automation') ||
    (path === '/analytics' && location.pathname === '/analytics') ||
    (path === '/docs' && location.pathname === '/docs') ||
    (path === '/settings' && location.pathname === '/settings')

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="topbar-action-btn hover:bg-gray-100/80 rounded-lg transition-all duration-200"
          aria-label="Open app launcher"
        >
          <Grid3x3 className="h-4 w-4 text-gray-700 topbar-action-icon" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          'w-[960px] max-w-[calc(100vw-2rem)] p-0 !glass-card app-launcher-content',
          '!border border-gray-200/80 !shadow-2xl rounded-xl',
          'mt-2 right-0 overflow-hidden',
          '!backdrop-blur-xl !bg-white'
        )}
        style={{
          backgroundColor: 'rgba(255,255,255,0.98)',
          color: '#0f172a',
          backdropFilter: 'none',
        }}
      >
        <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
          {launcherColumns.map((columnItems, columnIndex) => (
            <div
              key={`column-${columnIndex}`}
              className={cn(
                'flex flex-col',
                columnIndex < launcherColumns.length - 1 && 'border-r border-gray-200/60'
              )}
            >
              {columnItems.map((item, index) => {
                const Icon = item.icon
                const isActive = isItemActive(item.path)

                return (
                  <button
                    key={`${columnIndex}-${index}`}
                    onClick={() => handleItemClick(item.path)}
                    className={cn(
                      'flex items-start gap-4 p-5 transition-all duration-200',
                      'text-left group relative',
                      'border-b border-gray-100 last:border-b-0',
                      'hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent',
                      isActive && 'bg-gradient-to-r from-blue-50 to-transparent'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
                    )}

                    <div
                      className={cn(
                        'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                        'transition-all duration-200',
                        'bg-gradient-to-br from-gray-100 to-gray-50',
                        'border border-gray-200/60',
                        'group-hover:from-blue-50 group-hover:to-blue-100/50',
                        'group-hover:border-blue-200/60',
                        'group-hover:scale-105',
                        isActive && 'from-blue-100 to-blue-50 border-blue-200'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 transition-colors duration-200 text-slate-700',
                          'group-hover:text-blue-600',
                          isActive && 'text-blue-600'
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div
                        className={cn(
                          'font-semibold text-sm mb-1 text-slate-900',
                          'group-hover:text-blue-700 transition-colors duration-200',
                          isActive && 'text-blue-700'
                        )}
                      >
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {item.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
