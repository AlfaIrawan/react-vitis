import {
  Database,
  Activity,
  Package,
  Rocket,
  Zap,
  MessageSquare,
  Shield,
  ChevronRight,
} from 'lucide-react'
import { useDashboardStore } from '@/modules/dashboard'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const lifecycleStages = [
  {
    id: 'data',
    label: 'Data',
    icon: Database,
    path: '/projects',
    description: 'Data preparation',
    note: 'View in Projects',
  },
  {
    id: 'training',
    label: 'Training',
    icon: Activity,
    path: '/projects',
    description: 'Model training',
    note: 'View in Projects',
  },
  {
    id: 'model',
    label: 'Model',
    icon: Package,
    path: '/projects',
    description: 'Model registry',
    note: 'View in Projects',
  },
  {
    id: 'deployment',
    label: 'Deployment',
    icon: Rocket,
    path: '/projects',
    description: 'Model deployment',
    note: 'View in Projects',
  },
  {
    id: 'inference',
    label: 'Inference',
    icon: Zap,
    path: '/projects',
    description: 'Live inference',
    note: 'View in Projects',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: MessageSquare,
    path: '/projects',
    description: 'Ground truth',
    note: 'View in Projects',
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: Shield,
    path: '/governance',
    description: 'Policy & audit',
    note: 'Enterprise view',
  },
]

export function LifecycleOverview() {
  const getMetrics = useDashboardStore((state) => state.getMetrics)
  const metrics = getMetrics()

  return (
    <div className="glass-card-neon rounded-xl p-3">
      <h2 className="text-xs font-semibold text-gray-900 mb-3">
        AI Lifecycle Overview
      </h2>
      
      <div className="flex flex-wrap items-center gap-4 md:gap-6 justify-center md:justify-start">
        {lifecycleStages.map((stage, index) => {
          const Icon = stage.icon
          const count = metrics.lifecycleCounts[stage.id as keyof typeof metrics.lifecycleCounts]
          const isLast = index === lifecycleStages.length - 1
          const isEven = index % 2 === 0
          const iconColor = isEven ? 'text-blue-500' : 'text-purple-500'
          const iconBg = isEven ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'

          return (
            <div key={stage.id} className="flex items-center gap-4 md:gap-6">
              <Link
                to={stage.path}
                className="group flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
                title={stage.note}
              >
                <div className="relative">
                  <div className={cn(
                    'p-1.5 rounded-md border transition-colors',
                    iconBg,
                    'group-hover:border-opacity-100'
                  )}>
                    <Icon className={cn('h-4 w-4', iconColor)} />
                  </div>
                  {count > 0 && (
                    <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-purple-500 text-white text-xs font-bold shadow-md">
                      {count > 99 ? '99+' : count}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900">
                    {stage.label}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {stage.description}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {stage.note}
                  </p>
                </div>
              </Link>
              
              {!isLast && (
                <ChevronRight className="h-4 w-4 text-gray-400 hidden md:block" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
