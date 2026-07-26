import { Activity, Settings, LayoutDashboard } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-4">
          {Icon && (
            <div className="p-3 rounded-xl bg-primary/10">
              <Icon className="w-8 h-8 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-muted-foreground">
          This is a placeholder page for Module 1 (Core Shell & Navigation).
          {title === 'Runs' && (
            <span className="block mt-2 text-sm">
              This navigation entry is a placeholder for the future Training module.
              No domain logic or capabilities are implemented at this stage.
            </span>
          )}
          {title === 'Settings' && (
            <span className="block mt-2 text-sm">
              This navigation entry is a placeholder for the future System/Cross-cutting module.
              No domain logic or capabilities are implemented at this stage.
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

// Route configuration for Module 1
// Note: "Runs" and "Settings" are placeholder navigation entries only.
// They have no domain logic, no submenus, and no implied capabilities.
// They exist solely as navigation placeholders for future modules.
export const module1Routes = [
  {
    path: '/',
    title: 'Dashboard',
    description: 'Overview of AI training monitoring',
    icon: LayoutDashboard,
  },
  {
    path: '/runs',
    title: 'Runs',
    description: 'Placeholder: Future Training module entry point',
    icon: Activity,
    // This is NOT a module - just a navigation placeholder
    // Future Training module will implement actual functionality
  },
  {
    path: '/settings',
    title: 'Settings',
    description: 'Placeholder: Future System/Cross-cutting module entry point',
    icon: Settings,
    // This is NOT a module - just a navigation placeholder
    // Future System module will implement actual functionality
  },
]
