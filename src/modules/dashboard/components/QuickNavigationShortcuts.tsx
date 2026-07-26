import { Activity, AlertTriangle, Package, Briefcase, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const shortcuts = [
  {
    label: 'View Projects',
    path: '/projects',
    icon: Activity,
    description: 'Access all projects',
  },
  {
    label: 'Review Governance',
    path: '/governance',
    icon: AlertTriangle,
    description: 'Policy & compliance',
  },
  {
    label: 'Portfolio View',
    path: '/portfolio',
    icon: Briefcase,
    description: 'Strategic overview',
  },
  {
    label: 'Go to Projects',
    path: '/projects',
    icon: Package,
    description: 'Manage lifecycle',
  },
]

export function QuickNavigationShortcuts() {
  const iconConfigs = [
    { color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
    { color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
    { color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
    { color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' },
  ]

  return (
    <div className="glass-card-purple rounded-xl p-3">
      <h2 className="text-xs font-semibold text-gray-900 mb-3">
        Quick Navigation
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {shortcuts.map((shortcut, index) => {
          const Icon = shortcut.icon
          const config = iconConfigs[index % iconConfigs.length]
          
          return (
            <Link
              key={`${shortcut.label}-${index}`}
              to={shortcut.path}
              className={cn(
                'group glass-panel rounded-lg p-4 hover:shadow-lg transition-all duration-200'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  'p-1.5 rounded-md border',
                  config.bg
                )}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="font-medium text-gray-900 text-xs mb-1">
                {shortcut.label}
              </p>
              <p className="text-[10px] text-gray-500">
                {shortcut.description}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
