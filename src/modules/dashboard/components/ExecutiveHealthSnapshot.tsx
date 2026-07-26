import { Package, Rocket, Activity, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { useDashboardStore, type AIHealthStatus } from '@/modules/dashboard'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

function HealthStatusBadge({ status }: { status: AIHealthStatus }) {
  const config = {
    healthy: {
      label: 'Healthy',
      icon: CheckCircle2,
      className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    },
    attention: {
      label: 'Attention',
      icon: AlertTriangle,
      className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    },
    critical: {
      label: 'Critical',
      icon: XCircle,
      className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    },
  }

  const { label, icon: Icon, className } = config[status]

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium',
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  )
}

export function ExecutiveHealthSnapshot() {
  const getMetrics = useDashboardStore((state) => state.getMetrics)
  const metrics = getMetrics()

  const cards = [
    {
      title: 'Total Models',
      value: metrics.totalModels.total,
      subtitle: `Prod: ${metrics.totalModels.production} | Staging: ${metrics.totalModels.staging} | Dev: ${metrics.totalModels.development}`,
      icon: Package,
      link: '/models',
      color: 'text-blue-500',
      glowClass: 'glass-card-neon',
      iconBg: 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Active Deployments',
      value: metrics.activeDeployments,
      subtitle: 'Currently serving requests',
      icon: Rocket,
      link: '/deployments',
      color: 'text-purple-500',
      glowClass: 'glass-card-purple',
      iconBg: 'bg-purple-50 border-purple-200',
    },
    {
      title: 'Training Runs',
      value: metrics.trainingRuns.last24h,
      subtitle: `Last 24h: ${metrics.trainingRuns.last24h} | Last 7d: ${metrics.trainingRuns.last7d}`,
      icon: Activity,
      link: '/runs',
      color: 'text-gray-500',
      glowClass: 'glass-card-neon',
      iconBg: 'bg-gray-50 border-gray-200',
    },
    {
      title: 'Active Alerts',
      value: metrics.activeAlerts.total,
      subtitle: `Drift: ${metrics.activeAlerts.drift} | Errors: ${metrics.activeAlerts.errors} | Compliance: ${metrics.activeAlerts.compliance}`,
      icon: AlertTriangle,
      link: '/deployments/drift',
      color: 'text-orange-500',
      glowClass: 'glass-card-orange',
      iconBg: 'bg-orange-50 border-orange-300',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-900">
          Executive AI Health Snapshot
        </h2>
        <HealthStatusBadge status={metrics.overallHealthStatus} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.title}
              to={card.link}
              className={cn(
                'rounded-xl p-3 hover:shadow-xl transition-all duration-200 relative',
                card.glowClass
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={cn(
                  'p-1.5 rounded-md border',
                  card.iconBg
                )}>
                  <Icon className={cn('h-4 w-4', card.color)} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-900 leading-none">{card.value}</p>
                <p className="text-xs font-semibold text-gray-700">{card.title}</p>
                <p className="text-[10px] text-gray-500 leading-snug">{card.subtitle}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
