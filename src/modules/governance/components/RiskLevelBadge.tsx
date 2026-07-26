import { cn } from '@/lib/utils'
import type { RiskLevel } from '../store/governanceStore'

interface RiskLevelBadgeProps {
  level: RiskLevel
}

export function RiskLevelBadge({ level }: RiskLevelBadgeProps) {
  const levelConfig = {
    low: {
      label: 'Low',
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    medium: {
      label: 'Medium',
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    },
    high: {
      label: 'High',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
  }

  const config = levelConfig[level]

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
