import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useThemeStore } from '@/stores/theme-store'
import { useSettingsPanelStore } from '@/stores/settings-panel-store'
import { usePreferencesStore } from '@/stores/preferences-store'
import { cn } from '@/lib/utils'
import { Outlet } from 'react-router-dom'
import ThemeSettingsPanel from '@/components/settings/ThemeSettingsPanel'
import { TodoListPanel } from './TodoListPanel'
import { X, ListTodo, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type { SettingsPanelType } from '@/stores/settings-panel-store'

interface AppLayoutProps {
  children?: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { panel: settingsPanel, closePanel } = useSettingsPanelStore()
  const { theme } = useThemeStore()
  const rawAccent = usePreferencesStore((s) => s.preferences?.accentColor)
  const validAccents = ['gradient', 'deep-cosmic', 'indigo-command', 'frosted-steel', 'blue-granite']
  const accentColor = validAccents.includes(rawAccent as string) ? rawAccent : 'gradient'

  const themeSettingsOpen = settingsPanel === 'theme'
  const todoPanelOpen = settingsPanel === 'todo'
  const [panelContentEl, setPanelContentEl] = useState<HTMLElement | null>(null)
  const setPanelContentRef = useCallback((el: HTMLDivElement | null) => setPanelContentEl(el), [])

  // Apply accent/theme data attribute for CSS (e.g. Deep Cosmic Enterprise)
  useEffect(() => {
    if (accentColor) {
      document.documentElement.dataset.accent = accentColor
    } else {
      delete document.documentElement.dataset.accent
    }
  }, [accentColor])

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }, [theme])

  // Ensure panel is closed on mount
  useEffect(() => {
    closePanel()
  }, [closePanel])

  // ESC key closes panel
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && settingsPanel) {
        closePanel()
      }
    }

    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [settingsPanel, closePanel])

  // Disable native browser/Windows right-click context menu so only app custom menus show
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  const toggleThemeSettings = () => {
    useSettingsPanelStore.getState().panel === 'theme' ? closePanel() : useSettingsPanelStore.getState().openThemePanel()
  }

  const toggleTodoPanel = () => {
    const store = useSettingsPanelStore.getState()
    store.panel === 'todo' ? store.closePanel() : store.openTodoPanel()
  }

  return (
    <div className="min-h-screen relative">
      {/* Sidebar removed - replaced with App Launcher dropdown */}
      {/* <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      /> */}
      <Topbar
        sidebarCollapsed={false}
        accentColor={accentColor}
        onToggleThemeSettings={toggleThemeSettings}
        onToggleTodoPanel={toggleTodoPanel}
      />
      <main
        className={cn(
          'pt-12 transition-all duration-300 min-h-screen relative',
          'ml-0'
        )}
      >
        <div className="px-10 py-3 max-w-[1920px] mx-auto relative">
          {children || <Outlet />}
        </div>
      </main>

      {/* Overlay when any settings panel is open */}
      <div
        className={cn(
          'fixed inset-0 bg-black/20 backdrop-blur-sm z-[1050] transition-opacity',
          settingsPanel ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={closePanel}
        aria-hidden="true"
        role="button"
        tabIndex={-1}
      />

      {/* Right panel: Theme Settings or Todo List (same drawer) — full height, no rounded. Background: white (as before). */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full transform z-[1100] transition-all duration-300',
          'bg-white dark:bg-slate-900 shadow-2xl',
          todoPanelOpen ? 'w-[480px]' : 'w-80',
          settingsPanel ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        )}
        style={{
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border backdrop-blur-sm">
          <div className="flex flex-col gap-0.5 min-w-0">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {themeSettingsOpen && <Palette className="h-5 w-5 text-muted-foreground" aria-hidden />}
              {todoPanelOpen && <ListTodo className="h-5 w-5 text-muted-foreground" aria-hidden />}
              {themeSettingsOpen ? 'Theme Settings' : todoPanelOpen ? 'Todo List' : ''}
            </h2>
            {themeSettingsOpen && (
              <p className="text-xs text-muted-foreground leading-snug max-w-[320px]">
                Customize accent color, font size, and animation speed to match your preference.
              </p>
            )}
            {todoPanelOpen && (
              <p className="text-xs text-muted-foreground leading-snug max-w-[320px]">
                Add tasks, set due dates and priorities, organize by category, and filter by status to stay on top of your work.
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closePanel}
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div
          ref={setPanelContentRef}
          className="relative p-4 overflow-y-auto h-[calc(100%-4rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {themeSettingsOpen && <ThemeSettingsPanel />}
          {todoPanelOpen && <TodoListPanel panelContainerEl={panelContentEl} />}
        </div>
      </div>
    </div>
  )
}
