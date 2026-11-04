import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ListTodo, Palette, X } from 'lucide-react'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { Button } from '@/components/ui/button'
import ThemeSettingsPanel from '@/components/settings/ThemeSettingsPanel'
import { useSettingsPanelStore } from '@/stores/settings-panel-store'
import { usePreferencesStore } from '@/stores/preferences-store'
import { useThemeStore } from '@/stores/theme-store'
import { normalizeAccent } from '@/lib/vitisThemes'
import { cn } from '@/lib/utils'
import { TodoListPanel } from './TodoListPanel'
import { Topbar } from './Topbar'

export function AppLayout() {
  const { panel: settingsPanel, closePanel, openThemePanel, openTodoPanel } = useSettingsPanelStore()
  const { theme } = useThemeStore()
  const accent = usePreferencesStore((state) => state.preferences.accentColor)
  const themeSettingsOpen = settingsPanel === 'theme'
  const todoPanelOpen = settingsPanel === 'todo'
  const [panelContentEl, setPanelContentEl] = useState<HTMLElement | null>(null)
  const setPanelContentRef = useCallback((element: HTMLDivElement | null) => setPanelContentEl(element), [])

  useEffect(() => {
    document.documentElement.dataset.accent = normalizeAccent(accent)
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
  }, [theme, accent])

  useEffect(() => {
    if (!settingsPanel) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [settingsPanel, closePanel])

  const toggleTheme = () => themeSettingsOpen ? closePanel() : openThemePanel()
  const toggleTodo = () => todoPanelOpen ? closePanel() : openTodoPanel()

  return (
    <div className="app-shell relative flex h-[var(--app-vh,100dvh)] min-h-0 w-full min-w-0 flex-col pt-12">
      <Topbar onToggleThemeSettings={toggleTheme} onToggleTodoPanel={toggleTodo} />

      <div className="flex min-h-0 w-full min-w-0 flex-1 overflow-hidden">
        <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-auto scrollbar-hide">
          <main className="relative flex min-h-full w-full min-w-0 flex-1 flex-col">
            <div className="app-page-content relative flex min-h-full min-w-0 w-full max-w-none flex-1 flex-col self-stretch px-4 md:px-10 py-3">
              <AppErrorBoundary><Outlet /></AppErrorBoundary>
            </div>
          </main>
        </div>
      </div>
      {settingsPanel ? (
        <div
          className="fixed inset-0 z-[1050] bg-black/20 backdrop-blur-sm"
          data-theme-overlay
          onClick={closePanel}
          aria-hidden="true"
          role="button"
          tabIndex={-1}
        />
      ) : null}

      {/* Right panel: Theme Settings or Todo List (same drawer) */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full transform z-[1100] transition-all duration-300',
          'max-w-full bg-white dark:bg-slate-900 shadow-2xl',
          todoPanelOpen ? 'w-[480px]' : 'w-80',
          settingsPanel ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        )}
        style={{
          boxShadow: 'var(--vitis-overlay-shadow, 0 0 60px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.1))',
        }}
        role={settingsPanel ? 'dialog' : undefined}
        aria-label={todoPanelOpen ? 'Todo List' : themeSettingsOpen ? 'Theme Settings' : undefined}
        aria-hidden={!settingsPanel}
        inert={!settingsPanel}
      >
        <div className="settings-drawer-header flex shrink-0 items-center justify-between p-4 border-b border-border backdrop-blur-sm">
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
              <p data-todo-intro className="text-xs text-muted-foreground leading-snug max-w-[320px]">
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
          data-settings-content
        >
          {themeSettingsOpen && <ThemeSettingsPanel />}
          {todoPanelOpen && <TodoListPanel panelContainerEl={panelContentEl} />}
        </div>
      </div>
    </div>
  )
}
