import { cn } from '@/lib/utils'
import type { AlertSeverity } from '../store/deploymentStore'

interface AlertSeverityBadgeProps {
  severity: AlertSeverity
}

export function AlertSeverityBadge({ severity }: AlertSeverityBadgeProps) {
  const config = {
    info: {
      label: 'Info',
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    warning: {
      label: 'Warning',
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    },
    critical: {
      label: 'Critical',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
  }

  const { label, className } = config[severity]

  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-lg text-xs font-medium border',
        className
      )}
    >
      {label}
    </span>
  )
}
