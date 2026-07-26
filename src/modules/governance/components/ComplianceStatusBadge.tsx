import { cn } from '@/lib/utils'
import type { ComplianceStatus } from '../store/governanceStore'

interface ComplianceStatusBadgeProps {
  status: ComplianceStatus
}

export function ComplianceStatusBadge({ status }: ComplianceStatusBadgeProps) {
  const statusConfig = {
    compliant: {
      label: 'Compliant',
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    partial: {
      label: 'Partial',
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    },
    non_compliant: {
      label: 'Non-Compliant',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
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
