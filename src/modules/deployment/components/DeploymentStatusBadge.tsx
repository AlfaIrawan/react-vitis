import { cn } from '@/lib/utils'
import type { DeploymentStatus } from '../store/deploymentStore'

interface DeploymentStatusBadgeProps {
  status: DeploymentStatus
}

export function DeploymentStatusBadge({ status }: DeploymentStatusBadgeProps) {
  const config = {
    active: {
      label: 'Active',
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    paused: {
      label: 'Paused',
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    },
    retired: {
      label: 'Retired',
      className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
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
