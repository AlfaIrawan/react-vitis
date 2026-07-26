import { CheckCircle2, XCircle, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeedbackType } from '../store/feedbackStore'

interface FeedbackTypeBadgeProps {
  type: FeedbackType
  className?: string
}

export function FeedbackTypeBadge({ type, className }: FeedbackTypeBadgeProps) {
  const variants = {
    correct: {
      icon: CheckCircle2,
      label: 'Correct',
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    incorrect: {
      icon: XCircle,
      label: 'Incorrect',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    outcome: {
      icon: Target,
      label: 'Outcome',
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
  }

  const variant = variants[type]
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
