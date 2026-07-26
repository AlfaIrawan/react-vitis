import { AlertTriangle, XCircle, MessageSquare, Shield, ChevronRight } from 'lucide-react'
import { useDashboardStore } from '../store/dashboardStore'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function AttentionAlertsSummary() {
  const getMetrics = useDashboardStore((state) => state.getMetrics)
  const metrics = getMetrics()

  const complianceConfig = {
    compliant: {
      label: 'Compliant',
      icon: Shield,
      className: 'text-green-600 dark:text-green-400',
      bgClassName: 'bg-green-500/10 border-green-500/20',
    },
    partial: {
      label: 'Partial Compliance',
      icon: AlertTriangle,
      className: 'text-yellow-600 dark:text-yellow-400',
      bgClassName: 'bg-yellow-500/10 border-yellow-500/20',
    },
    non_compliant: {
      label: 'Non-Compliant',
      icon: XCircle,
      className: 'text-red-600 dark:text-red-400',
      bgClassName: 'bg-red-500/10 border-red-500/20',
    },
  }

  const compliance = complianceConfig[metrics.complianceStatus]

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Attention & Alerts Summary</h2>

      <div className="space-y-4">
        {/* Models with Drift Warnings */}
        {metrics.modelsWithDrift.length > 0 && (
          <Link
            to="/deployments/drift"
            className="block glass-panel rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {metrics.modelsWithDrift.length} Model{metrics.modelsWithDrift.length !== 1 ? 's' : ''} with Active Drift Warnings
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {metrics.modelsWithDrift
                      .slice(0, 3)
                      .map((m) => m.name)
                      .join(', ')}
                    {metrics.modelsWithDrift.length > 3 && '...'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        )}

        {/* Deployments with Elevated Error Rate */}
        {metrics.deploymentsWithErrors.length > 0 && (
          <Link
            to="/deployments"
            className="block glass-panel rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {metrics.deploymentsWithErrors.length} Deployment{metrics.deploymentsWithErrors.length !== 1 ? 's' : ''} with Elevated Error Rate
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Error rates above 5% detected
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        )}

        {/* Feedback Awaiting Verification */}
        {metrics.feedbackAwaitingVerification > 0 && (
          <Link
            to="/feedback"
            className="block glass-panel rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {metrics.feedbackAwaitingVerification} Feedback Item{metrics.feedbackAwaitingVerification !== 1 ? 's' : ''} Awaiting Verification
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Requires manual review
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        )}

        {/* Compliance Status */}
        <Link
          to="/governance"
          className={cn(
            'block glass-panel rounded-lg p-4 hover:shadow-md transition-shadow border',
            compliance.bgClassName
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', compliance.bgClassName)}>
                <compliance.icon className={cn('w-5 h-5', compliance.className)} />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Compliance Status: {compliance.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  View governance dashboard for details
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Link>

        {/* Empty State */}
        {metrics.modelsWithDrift.length === 0 &&
          metrics.deploymentsWithErrors.length === 0 &&
          metrics.feedbackAwaitingVerification === 0 &&
          metrics.complianceStatus === 'compliant' && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No active alerts or attention items</p>
              <p className="text-xs mt-1">All systems operating normally</p>
            </div>
          )}
      </div>
    </div>
  )
}
