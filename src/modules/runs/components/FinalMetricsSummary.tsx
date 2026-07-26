import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RunResultData } from '../store/runStore'

interface FinalMetricsSummaryProps {
  resultData: RunResultData
  status: 'completed' | 'failed' | 'cancelled'
}

/**
 * FinalMetricsSummary - Display final metrics as stat cards
 * Module 6 - Results & Evaluation (POST-Training)
 */
export function FinalMetricsSummary({ resultData, status }: FinalMetricsSummaryProps) {
  const formatMetric = (value: number | undefined, suffix: string = '') => {
    if (value === undefined) return 'N/A'
    if (suffix === '%') {
      return `${(value * 100).toFixed(2)}%`
    }
    return value.toFixed(4)
  }

  const stats = [
    {
      label: 'Final Accuracy',
      value: formatMetric(resultData.finalAccuracy, '%'),
      icon: CheckCircle2,
      highlight: status === 'completed',
    },
    {
      label: 'Validation Accuracy',
      value: formatMetric(resultData.validationAccuracy, '%'),
      icon: CheckCircle2,
      highlight: status === 'completed' && resultData.validationAccuracy !== undefined,
    },
    {
      label: 'Final Loss',
      value: formatMetric(resultData.finalLoss),
      icon: status === 'failed' ? XCircle : CheckCircle2,
      highlight: status === 'completed',
    },
    {
      label: 'Epochs Completed',
      value: `${resultData.completedEpochs} / ${resultData.totalEpochs}`,
      icon: status === 'cancelled' ? AlertCircle : CheckCircle2,
      highlight: resultData.completedEpochs === resultData.totalEpochs,
      partial: status === 'cancelled' && resultData.completedEpochs < resultData.totalEpochs,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={index}
            className={cn(
              'glass-card rounded-2xl p-4 space-y-2',
              stat.highlight && 'border border-green-500/30',
              stat.partial && 'border border-yellow-500/30'
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <Icon
                className={cn(
                  'w-4 h-4',
                  stat.highlight ? 'text-green-400' : stat.partial ? 'text-yellow-400' : 'text-muted-foreground'
                )}
              />
            </div>
            <p
              className={cn(
                'text-2xl font-bold',
                stat.highlight ? 'text-green-400' : stat.partial ? 'text-yellow-400' : 'text-foreground'
              )}
            >
              {stat.value}
            </p>
            {stat.partial && (
              <p className="text-xs text-yellow-400/70">Partial results</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
