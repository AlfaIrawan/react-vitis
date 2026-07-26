import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RunDraft, RunResultData } from '../store/runStore'

interface RunComparisonProps {
  currentRun: RunDraft
  previousRun?: RunDraft
  allRuns: RunDraft[]
}

/**
 * RunComparison - Compare current run with previous successful run
 * Module 6 - Results & Evaluation (POST-Training)
 */
export function RunComparison({ currentRun, previousRun, allRuns }: RunComparisonProps) {
  // If no previous run provided, find the last successful run
  const comparisonRun = previousRun || findLastSuccessfulRun(allRuns, currentRun.id)

  if (!comparisonRun || !comparisonRun.resultData || !currentRun.resultData) {
    return null
  }

  const current = currentRun.resultData
  const previous = comparisonRun.resultData

  const comparisons = [
    {
      label: 'Accuracy',
      current: current.finalAccuracy,
      previous: previous.finalAccuracy,
      unit: '%',
      format: (v: number) => `${(v * 100).toFixed(2)}%`,
    },
    {
      label: 'Loss',
      current: current.finalLoss,
      previous: previous.finalLoss,
      unit: '',
      format: (v: number) => v.toFixed(4),
    },
    {
      label: 'Training Time',
      current: current.durationSeconds,
      previous: previous.durationSeconds,
      unit: '',
      format: (v: number) => formatDuration(v),
    },
  ]

  const calculateDelta = (current: number | undefined, previous: number | undefined) => {
    if (current === undefined || previous === undefined) return null
    return current - previous
  }

  const calculateDeltaPercent = (current: number | undefined, previous: number | undefined) => {
    if (current === undefined || previous === undefined || previous === 0) return null
    return ((current - previous) / previous) * 100
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Run Comparison</h2>
        {comparisonRun && (
          <p className="text-xs text-muted-foreground">
            Compared with: <span className="font-medium">{comparisonRun.name}</span>
          </p>
        )}
      </div>

      <div className="space-y-4">
        {comparisons.map((comp, index) => {
          if (comp.current === undefined || comp.previous === undefined) return null

          const delta = calculateDelta(comp.current, comp.previous)
          const deltaPercent = calculateDeltaPercent(comp.current, comp.previous)
          const isImprovement =
            comp.label === 'Loss' ? delta! < 0 : delta! > 0 // Lower loss is better

          return (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">{comp.label}</p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="text-lg font-bold text-foreground">{comp.format(comp.current)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Previous</p>
                    <p className="text-base font-medium text-muted-foreground">{comp.format(comp.previous)}</p>
                  </div>
                </div>
              </div>
              {delta !== null && (
                <div
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 rounded-lg',
                    isImprovement ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  )}
                >
                  {isImprovement ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : delta === 0 ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <div>
                    <p className="text-sm font-bold">
                      {deltaPercent !== null
                        ? `${isImprovement ? '+' : ''}${deltaPercent.toFixed(1)}%`
                        : comp.format(Math.abs(delta))}
                    </p>
                    {comp.label === 'Training Time' && deltaPercent !== null && (
                      <p className="text-xs opacity-70">{comp.format(Math.abs(delta))}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function findLastSuccessfulRun(runs: RunDraft[], excludeId: string): RunDraft | undefined {
  return runs
    .filter((run) => run.id !== excludeId && run.status === 'completed' && run.resultData)
    .sort((a, b) => {
      const aTime = a.resultData?.endTime || a.updatedAt
      const bTime = b.resultData?.endTime || b.updatedAt
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })[0]
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}
