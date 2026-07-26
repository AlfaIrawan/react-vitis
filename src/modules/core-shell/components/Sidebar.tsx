import {
  LayoutDashboard,
  Settings,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Plug,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocation, useNavigate } from 'react-router-dom'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FolderOpen, label: 'Workspaces', path: '/projects' },
  { icon: Plug, label: 'Integration catalog', path: '/integrations' },
  { icon: Activity, label: 'Process monitor', path: '/monitor' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen glass-sidebar transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between h-12 px-2 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <GitBranch className="h-4 w-4 text-emerald-600" />
              </div>
              <h1 className="text-sm font-semibold text-gray-900">Vitis</h1>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.path ||
              (item.path === '/projects' &&
                location.pathname.startsWith('/projects') &&
                !location.pathname.match(/^\/projects\/[^/]+\//)) ||
              (item.path === '/integrations' && location.pathname === '/integrations') ||
              (item.path === '/monitor' && location.pathname === '/monitor') ||
              (item.path === '/settings' && location.pathname === '/settings')

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full transition-all',
                  collapsed
                    ? 'flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-md'
                    : 'flex items-center gap-2 p-1.5 rounded-md',
                  'text-xs font-medium hover:bg-gray-50',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {collapsed ? (
                  <span className="text-[10px] leading-none text-gray-600 text-center">
                    {item.label.split(' ')[0]}
                  </span>
                ) : (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="px-2 py-2 border-t border-border/20">
          {!collapsed && (
            <div className="text-[10px] text-muted-foreground">
              <div className="font-medium text-foreground text-xs">v1.0.0</div>
              <div className="text-[10px] mt-0.5 opacity-70">Integration &amp; Orchestration</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
