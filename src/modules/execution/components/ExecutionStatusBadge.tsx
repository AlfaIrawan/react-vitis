import { cn } from '@/lib/utils'
import type { ExecutionStatus } from '../store/executionStore'

interface ExecutionStatusBadgeProps {
  status: ExecutionStatus
  className?: string
}

export function ExecutionStatusBadge({ status, className }: ExecutionStatusBadgeProps) {
  const statusConfig: Record<ExecutionStatus, { label: string; className: string }> = {
    queued: {
      label: 'Queued',
      className: 'bg-muted text-muted-foreground',
    },
    starting: {
      label: 'Starting',
      className: 'bg-blue-500/10 text-blue-500',
    },
    running: {
      label: 'Running',
      className: 'bg-green-500/10 text-green-500',
    },
    paused: {
      label: 'Paused',
      className: 'bg-yellow-500/10 text-yellow-500',
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-500/10 text-green-500',
    },
    failed: {
      label: 'Failed',
      className: 'bg-red-500/10 text-red-500',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-muted text-muted-foreground',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-md text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
