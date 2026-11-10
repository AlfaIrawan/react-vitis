import { canAdministerInternalApp, useInternalAccessRoles } from '@/auth/internalAccessRoles'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Activity, FolderOpen, Grid3x3, LayoutDashboard, Plug, Settings, Workflow } from 'lucide-react'
import { useMobileLayout } from '@/hooks/useMobileLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu'
import { MobileModuleMenu } from './MobileModuleMenu'

const defaultItems = [
  { icon: LayoutDashboard, label: 'Dashboard', description: 'Overview of Vitis capabilities', path: '/' },
  { icon: FolderOpen, label: 'Workspaces', description: 'Organize integrations and workflows by project', path: '/projects' },
  { icon: Plug, label: 'Integration Catalog', description: 'Browse workspace connectors', path: '/integrations' },
  { icon: Workflow, label: 'Workflow Designer', description: 'Design and organize process flows', path: '/workflows' },
  { icon: Activity, label: 'Process Monitor', description: 'Review workspace execution records', path: '/monitor' },
  { icon: Settings, label: 'Settings', description: 'Manage your Vitis preferences', path: '/settings' },
]

function launcherItemButtonClass(opts: {
  isActive: boolean
  isLastColumn: boolean
  isLastRow: boolean
}): string {
  return cn(
    'flex items-start gap-4 p-5 h-full transition-all duration-200',
    'text-left group relative',
    !opts.isLastRow && 'border-b border-gray-100',
    !opts.isLastColumn && 'border-r border-gray-200/60',
    'hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent',
    opts.isActive && 'bg-gradient-to-r from-blue-50 to-transparent',
  )
}

export function AppLauncher() {
  const admin = canAdministerInternalApp(useInternalAccessRoles())
  const items = admin ? [...defaultItems, { icon: Settings, label: 'Users & Access', description: 'Provision identities and application access', path: '/internal-users' }] : defaultItems
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const isMobile = useMobileLayout()
  const isItemActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path + '/'))
  const handleItemClick = (path: string) => {
    navigate(path)
    setOpen(false)
  }
  const columns = 2
  const lastRowStartIndex = Math.floor((items.length - 1) / columns) * columns
  if (isMobile) {
    return <MobileModuleMenu items={items} isActive={isItemActive} onSelect={handleItemClick} />
  }

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
          'w-[min(680px,calc(100vw-2rem))]',
          'p-0 liquid-glass-enterprise-panel app-launcher-content',
          '!border border-gray-200/80 !shadow-2xl rounded-xl',
          'mt-2 right-0 overflow-hidden',
          '!backdrop-blur-xl !bg-white',
        )}
        style={{
          backgroundColor: 'rgba(255,255,255,0.98)',
          color: '#0f172a',
          backdropFilter: 'none',
        }}
      >
        <div className="grid grid-cols-2 gap-0">
          {items.map((item, index) => {
            const Icon = item.icon
            const isActive = isItemActive(item.path)
            const isLastColumn = index % columns === columns - 1
            const isLastRow = index >= lastRowStartIndex

            return (
              <button
                key={item.path}
                onClick={() => handleItemClick(item.path)}
                className={launcherItemButtonClass({
                  isActive,
                  isLastColumn,
                  isLastRow,
                })}
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
                    isActive && 'from-blue-100 to-blue-50 border-blue-200',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors duration-200 text-slate-700',
                      'group-hover:text-blue-600',
                      isActive && 'text-blue-600',
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div
                    className={cn(
                      'font-semibold text-sm mb-1 text-slate-900',
                      'group-hover:text-blue-700 transition-colors duration-200',
                      isActive && 'text-blue-700',
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
