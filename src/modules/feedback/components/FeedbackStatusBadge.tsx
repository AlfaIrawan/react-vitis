import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeedbackStatus } from '../store/feedbackStore'

interface FeedbackStatusBadgeProps {
  status: FeedbackStatus
  className?: string
}

export function FeedbackStatusBadge({ status, className }: FeedbackStatusBadgeProps) {
  const variants = {
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    },
    verified: {
      icon: CheckCircle2,
      label: 'Verified',
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    rejected: {
      icon: XCircle,
      label: 'Rejected',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
  }

  const variant = variants[status]
  const Icon = variant.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border',
        variant.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {variant.label}
    </span>
  )
}
