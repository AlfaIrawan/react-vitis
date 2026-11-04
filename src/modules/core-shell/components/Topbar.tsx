import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Circle, ListTodo, LogOut, MoreHorizontal, Palette, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Tooltip } from '@/components/ui/tooltip'
import { getSession, logoutAsync } from '@/auth/authService'
import { fetchUnreadCount, VITIS_APP_ID } from '@/lib/api/notificationApi'
import { cn } from '@/lib/utils'
import { normalizeUserDisplayName } from '@/lib/userDisplayName'
import { NotificationPanel } from './NotificationPanel'
import { AppLauncher } from './AppLauncher'

export function Topbar({ onToggleThemeSettings, onToggleTodoPanel }: { onToggleThemeSettings: () => void; onToggleTodoPanel: () => void }) {
  const navigate = useNavigate()
  const session = getSession()
  const userId = session?.user.id
  const userName = normalizeUserDisplayName(session?.user.name || session?.user.email || 'User')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0)
  useEffect(() => {
    if (!userId) return
    let active = true
    const refresh = () => fetchUnreadCount({ app_id: VITIS_APP_ID, user_id: userId })
      .then((result) => { if (active) setNotificationUnreadCount(result.unread_count) })
      .catch(() => {})
    void refresh()
    const timer = window.setInterval(refresh, 30_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [userId])

  const topbarEnvironment = { tone: import.meta.env.VITE_APP_ENV === 'production' ? 'production' : 'other',
    label: import.meta.env.VITE_APP_ENV === 'production' ? 'Production' : 'Development' }
  const handleLogout = () => {
    void logoutAsync().finally(() => navigate('/login', { replace: true }))
  }
  return (
    <header
      className={cn(
        'absolute top-0 right-0 left-0 h-12 z-[60] transition-all duration-300',
        'glass-topbar responsive-topbar',
        'left-0'
      )}
    >
      <div className="flex items-center justify-between h-full px-2 gap-2">
        {/* Left Side: Logo + pembatas + nama tenant */}
        <div className="flex items-center gap-3">
          <img src="/images/vitis-wordmark.svg" alt="Vitis — AI Workflow Automation"
            className="h-10 w-auto shrink-0 object-contain"
          />
          <div
            className="topbar-tenant-sep h-6 w-px flex-shrink-0 bg-slate-300"
            aria-hidden
          />
          <span
            className="topbar-tenant-name text-base font-medium text-slate-700 whitespace-nowrap max-w-[min(20rem,calc(100vw-24rem))] truncate"
            title="AI Workflow Automation"
          >
            AI Workflow Automation
          </span>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Environment Indicator - class agar teks tetap gelap di tema topbar gelap */}
          <div className="environment-indicator flex items-center gap-1.5 h-8 px-3 rounded-md bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm">
            <Circle className={cn(
              'h-2 w-2 shrink-0',
              topbarEnvironment.tone === 'production'
                ? 'text-red-500 fill-red-500'
                : 'text-green-500 fill-green-500'
            )} />
            <span className="text-xs font-medium text-slate-800">
              {topbarEnvironment.label}
            </span>
          </div>

          {/* Notifications - integrated with python-notification-service-fastapi */}
          <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="topbar-action-btn relative hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 text-gray-600 topbar-action-icon" />
                {notificationUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-0 w-auto z-[100] !bg-transparent border-0 shadow-none">
              <NotificationPanel
                open={notificationOpen}
                appId={VITIS_APP_ID}
                userId={session?.user?.id ?? ''}
                onOpenChange={setNotificationOpen}
                onUnreadCountChange={setNotificationUnreadCount}
              />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Todo List */}
          <Tooltip content="Todo list" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              className="topbar-action-btn mobile-topbar-secondary hover:bg-gray-100"
              aria-label="Todo list"
              onClick={onToggleTodoPanel}
            >
              <ListTodo className="h-4 w-4 text-gray-600 topbar-action-icon" />
            </Button>
          </Tooltip>

          {/* Theme Settings */}
          <Tooltip content="Theme Settings" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleThemeSettings || (() => {})}
              className="topbar-action-btn mobile-topbar-secondary hover:bg-gray-100"
              aria-label="Open theme settings"
            >
              <Palette className="h-4 w-4 text-gray-600 topbar-action-icon" />
            </Button>
          </Tooltip>

          {/* App Launcher - Before Account */}
          <AppLauncher />

          <div className="mobile-topbar-more hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="More tools"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onToggleTodoPanel}>Todo list</DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleThemeSettings}>Theme settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Menu */}
          <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="topbar-action-btn flex items-center gap-2 px-2 h-8 hover:bg-gray-100"
              >
                <div className="relative h-7 w-7 shrink-0">
                  <div className="h-7 w-7 overflow-hidden rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </div>
                <span className="text-xs font-medium hidden sm:inline-block text-gray-700 topbar-action-icon">
                  {userName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <div className="border-t border-border/40 my-1" />
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
