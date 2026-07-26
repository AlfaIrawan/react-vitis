import { AlertTriangle, Clock, CheckCircle2, Info } from 'lucide-react'
import { useDashboardStore } from '../store/dashboardStore'
import { cn } from '@/lib/utils'

interface InterpretationItem {
  type: 'warning' | 'pending' | 'success' | 'info'
  message: string
  icon: typeof AlertTriangle
}

export function ExecutiveInterpretation() {
  const getMetrics = useDashboardStore((state) => state.getMetrics)
  const metrics = getMetrics()

  const interpretations: InterpretationItem[] = []

  // Check for drift warnings (but within tolerance)
  const driftWarnings = metrics.modelsWithDrift.filter((m) => m.severity === 'warning')
  if (driftWarnings.length > 0) {
    interpretations.push({
      type: 'warning',
      message: `${driftWarnings.length} model${driftWarnings.length !== 1 ? 's' : ''} show${driftWarnings.length === 1 ? 's' : ''} early drift signals but remain${driftWarnings.length === 1 ? 's' : ''} within tolerance`,
      icon: AlertTriangle,
    })
  }

  // Check for critical drift alerts
  const criticalDrift = metrics.modelsWithDrift.filter((m) => m.severity === 'critical')
  if (criticalDrift.length > 0) {
    interpretations.push({
      type: 'warning',
      message: `${criticalDrift.length} model${criticalDrift.length !== 1 ? 's' : ''} with critical drift requiring immediate attention`,
      icon: AlertTriangle,
    })
  }

  // Check for pending feedback
  if (metrics.feedbackAwaitingVerification > 0) {
    interpretations.push({
      type: 'pending',
      message: `${metrics.feedbackAwaitingVerification} feedback item${metrics.feedbackAwaitingVerification !== 1 ? 's' : ''} pending verification`,
      icon: Clock,
    })
  }

  // Check for deployments with errors
  if (metrics.deploymentsWithErrors.length > 0) {
    interpretations.push({
      type: 'warning',
      message: `${metrics.deploymentsWithErrors.length} deployment${metrics.deploymentsWithErrors.length !== 1 ? 's' : ''} with elevated error rate (above 5%)`,
      icon: AlertTriangle,
    })
  }

  // Compliance status
  if (metrics.complianceStatus === 'compliant') {
    interpretations.push({
      type: 'success',
      message: 'No critical compliance violations detected',
      icon: CheckCircle2,
    })
  } else if (metrics.complianceStatus === 'partial') {
    interpretations.push({
      type: 'warning',
      message: 'Partial compliance detected - some models require attention',
      icon: AlertTriangle,
    })
  } else if (metrics.complianceStatus === 'non_compliant') {
    interpretations.push({
      type: 'warning',
      message: 'Non-compliance detected - immediate governance review required',
      icon: AlertTriangle,
    })
  }

  // Training activity
  if (metrics.trainingRuns.last7d === 0) {
    interpretations.push({
      type: 'info',
      message: 'No training runs in the last 7 days',
      icon: Info,
    })
  } else if (metrics.trainingRuns.last7d > 0 && metrics.trainingRuns.last24h === 0) {
    interpretations.push({
      type: 'info',
      message: `${metrics.trainingRuns.last7d} training run${metrics.trainingRuns.last7d !== 1 ? 's' : ''} in the last 7 days, none in the last 24 hours`,
      icon: Info,
    })
  }

  // If no interpretations, show all-clear message
  if (interpretations.length === 0) {
    interpretations.push({
      type: 'success',
      message: 'All systems operating normally - no attention items this week',
      icon: CheckCircle2,
    })
  }

  const getItemStyles = (type: InterpretationItem['type']) => {
    switch (type) {
      case 'warning':
        return {
          icon: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-500/10 border-yellow-500/20',
          text: 'text-foreground',
        }
      case 'pending':
        return {
          icon: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/20',
          text: 'text-foreground',
        }
      case 'success':
        return {
          icon: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-500/10 border-green-500/20',
          text: 'text-foreground',
        }
      case 'info':
        return {
          icon: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-500/10 border-gray-500/20',
          text: 'text-foreground',
        }
    }
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">What Needs Attention This Week</h2>
      
      <div className="space-y-3">
        {interpretations.map((item, index) => {
          const Icon = item.icon
          const styles = getItemStyles(item.type)
          
          return (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border',
                styles.bg
              )}
            >
              <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', styles.icon)} />
              <p className={cn('text-sm leading-relaxed', styles.text)}>
                {item.message}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
