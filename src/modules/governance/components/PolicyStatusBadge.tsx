import { cn } from '@/lib/utils'
import type { PolicyStatus } from '../store/governanceStore'

interface PolicyStatusBadgeProps {
  status: PolicyStatus
}

export function PolicyStatusBadge({ status }: PolicyStatusBadgeProps) {
  const statusConfig = {
    active: {
      label: 'Active',
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    deprecated: {
      label: 'Deprecated',
      className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-lg text-xs font-medium border',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
