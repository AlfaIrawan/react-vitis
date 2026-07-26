import { cn } from '@/lib/utils'
import type { RunStatus } from '../store/runStore'

interface RunStatusBadgeProps {
  status: RunStatus
  className?: string
}

/**
 * RunStatusBadge - Display run draft status
 * 
 * This is a READ-ONLY badge component. It does NOT provide any actions or capabilities.
 * 
 * Scope: Module 4 - Run Setup (PRE-Training)
 */
export function RunStatusBadge({ status, className }: RunStatusBadgeProps) {
  const statusConfig = {
    draft: {
      label: 'Draft',
      className: 'bg-muted text-muted-foreground',
    },
    ready: {
      label: 'Siap',
      className: 'bg-green-500/10 text-green-500',
    },
    blocked: {
      label: 'Perlu dilengkapi',
      className: 'bg-orange-500/10 text-orange-500',
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-600/20 text-green-400 border border-green-500/30',
    },
    failed: {
      label: 'Failed',
      className: 'bg-red-600/20 text-red-400 border border-red-500/30',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30',
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
