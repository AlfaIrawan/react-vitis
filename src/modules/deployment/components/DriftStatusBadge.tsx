import { cn } from '@/lib/utils'
import type { DriftStatus } from '../store/deploymentStore'

interface DriftStatusBadgeProps {
  status: DriftStatus
}

export function DriftStatusBadge({ status }: DriftStatusBadgeProps) {
  const config = {
    normal: {
      label: 'Normal',
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    warning: {
      label: 'Warning',
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    },
    alert: {
      label: 'Alert',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
  }

  const { label, className } = config[status]

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
