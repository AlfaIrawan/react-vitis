import { cn } from '@/lib/utils'
import type { ConnectorStatus } from '../store/connectorStore'

interface ConnectorStatusBadgeProps {
  status: ConnectorStatus
  className?: string
}

/**
 * ConnectorStatusBadge - Display connector connection status
 * 
 * This is a READ-ONLY badge component. It does NOT provide any actions or capabilities.
 * 
 * Scope: Module 3 - Connector Management (non-operational)
 */
export function ConnectorStatusBadge({ status, className }: ConnectorStatusBadgeProps) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-md text-xs font-medium',
        status === 'connected'
          ? 'bg-green-500/10 text-green-500'
          : 'bg-muted text-muted-foreground',
        className
      )}
    >
      {status === 'connected' ? 'Connected' : 'Not Connected'}
    </span>
  )
}
