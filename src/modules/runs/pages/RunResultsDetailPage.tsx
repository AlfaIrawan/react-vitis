import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, AlertCircle, XCircle } from 'lucide-react'
import { useRunStore } from '@/modules/runs'
import { useProjectStore } from '@/modules/projects'
import { RunStatusBadge } from '@/modules/runs'
import { FinalMetricsSummary } from '../components/FinalMetricsSummary'
import { PerformanceCharts } from '../components/PerformanceCharts'
import { EvaluationBreakdown } from '../components/EvaluationBreakdown'
import { RunComparison } from '../components/RunComparison'
import { ArtifactsOutputs } from '../components/ArtifactsOutputs'
import { NextActions } from '../components/NextActions'
import { Button } from '@/components/ui/button'

/**
 * RunResultsDetailPage - Module 6: Results & Evaluation (POST-Training)
 * 
 * This page is shown ONLY for runs with FINAL status (completed, failed, cancelled).
 * It displays final results, metrics, charts, and next actions.
 * NO real-time monitoring, NO pause/cancel controls, NO configuration editing.
 */
export function RunResultsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getRun, runs } = useRunStore()
  const { getProject } = useProjectStore()

  const run = id ? getRun(id) : undefined

  if (!run) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/runs')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Runs
        </Button>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Run not found</p>
        </div>
      </div>
    )
  }

  // Redirect non-FINAL status runs to regular detail page
  if (run.status !== 'completed' && run.status !== 'failed' && run.status !== 'cancelled') {
    navigate(`/runs/${run.id}`)
    return null
  }

  // If no result data, show placeholder
  if (!run.resultData) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/runs')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Runs
        </Button>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Results data not available for this run</p>
        </div>
      </div>
    )
  }

  const project = getProject(run.projectId)
  const dataset = run.datasetId ? getDataset(run.datasetId) : undefined
  const trainer = run.trainerId ? getTrainer(run.trainerId) : undefined
  const compute = run.computeId ? getCompute(run.computeId) : undefined

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header - Read-only */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/runs')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl font-bold text-foreground">{run.name}</h1>
              <RunStatusBadge status={run.status} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Project: {project ? project.name : 'N/A'}</span>
              </div>
              {dataset && (
                <div className="flex items-center gap-1.5">
                  <span>Dataset: {dataset.name}</span>
                </div>
              )}
              {trainer && (
                <div className="flex items-center gap-1.5">
                  <span>Trainer: {trainer.name}</span>
                </div>
              )}
              {compute && (
                <div className="flex items-center gap-1.5">
                  <span>Compute: {compute.name}</span>
                </div>
              )}
              {false}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {formatDate(run.resultData.startTime)} – {formatDate(run.resultData.endTime)}
                </span>
              </div>
              <span>Duration: {formatDuration(run.resultData.durationSeconds)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Summary for Failed Runs */}
      {run.status === 'failed' && (run.resultData.errorMessage || run.resultData.errorSummary) && (
        <div className="glass-card rounded-2xl p-4 border border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-400 mb-1">Training Failed</h3>
              {run.resultData.errorSummary && (
                <p className="text-sm text-foreground mb-2">{run.resultData.errorSummary}</p>
              )}
              {run.resultData.errorMessage && (
                <p className="text-xs text-muted-foreground font-mono bg-black/20 p-2 rounded">
                  {run.resultData.errorMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Partial Results Warning for Cancelled Runs */}
      {run.status === 'cancelled' && run.resultData.completedEpochs < run.resultData.totalEpochs && (
        <div className="glass-card rounded-2xl p-4 border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-400 mb-1">Training Cancelled</h3>
              <p className="text-sm text-foreground">
                Training was cancelled before completion. Displaying partial results from{' '}
                {run.resultData.completedEpochs} of {run.resultData.totalEpochs} epochs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Final Metrics Summary */}
      <FinalMetricsSummary resultData={run.resultData} status={run.status} />

      {/* Performance Charts */}
      <PerformanceCharts resultData={run.resultData} />

      {/* Evaluation Breakdown - Collapsible */}
      <EvaluationBreakdown resultData={run.resultData} />

      {/* Run Comparison */}
      <RunComparison currentRun={run} allRuns={runs} />

      {/* Artifacts & Outputs */}
      <ArtifactsOutputs artifacts={run.resultData.artifacts} />

      {/* Next Actions - Only for completed runs */}
      <NextActions run={run} />
    </div>
  )
}
