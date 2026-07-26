import { cn } from '@/lib/utils'
import type { ModelStatus } from '../store/modelStore'

interface ModelStatusBadgeProps {
  status: ModelStatus
}

export function ModelStatusBadge({ status }: ModelStatusBadgeProps) {
  const statusConfig = {
    draft: {
      label: 'Draft',
      className: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    },
    staging: {
      label: 'Staging',
      className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    },
    production: {
      label: 'Production',
      className: 'bg-green-500/20 text-green-300 border-green-500/30',
    },
    archived: {
      label: 'Archived',
      className: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
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
