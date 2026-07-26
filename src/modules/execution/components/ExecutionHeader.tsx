import { ArrowLeft, Pause, Play, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useExecutionStore, type ExecutionStatus } from '@/modules/execution'
import { useRunStore } from '@/modules/runs'
import { useProjectStore } from '@/modules/projects'
import { type Dataset, fetchDataset } from '@/modules/datasets'
import { useTrainerStore } from '@/modules/trainers'
import { useComputeStore } from '@/modules/compute'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface ExecutionHeaderProps {
  sessionId: string
  onPause?: () => void
  onResume?: () => void
  onCancel?: () => void
}

export function ExecutionHeader({ sessionId, onPause, onResume, onCancel }: ExecutionHeaderProps) {
  const navigate = useNavigate()
  const { getSession } = useExecutionStore()
  const { getRun } = useRunStore()
  const { getProject } = useProjectStore()
  const { getTrainer } = useTrainerStore()
  const { getCompute } = useComputeStore()
  const [dataset, setDataset] = useState<Dataset | null>(null)

  const session = getSession(sessionId)
  if (!session) return null

  const run = getRun(session.runId)
  const project = run ? getProject(run.projectId) : null

  // Fetch dataset when run is available
  useEffect(() => {
    if (run?.datasetId) {
      fetchDataset(run.datasetId)
        .then(setDataset)
        .catch((error) => {
          console.error('[ExecutionHeader] Failed to fetch dataset:', error)
          setDataset(null)
        })
    } else {
      setDataset(null)
    }
  }, [run?.datasetId])

  const trainer = run?.trainerId ? getTrainer(run.trainerId) : null
  const compute = run?.computeId ? getCompute(run.computeId) : null

  const statusConfig: Record<ExecutionStatus, { label: string; className: string }> = {
    queued: { label: 'Queued', className: 'bg-muted text-muted-foreground' },
    starting: { label: 'Starting', className: 'bg-blue-500/10 text-blue-500' },
    running: { label: 'Running', className: 'bg-green-500/10 text-green-500' },
    paused: { label: 'Paused', className: 'bg-yellow-500/10 text-yellow-500' },
    completed: { label: 'Completed', className: 'bg-green-500/10 text-green-500' },
    failed: { label: 'Failed', className: 'bg-red-500/10 text-red-500' },
    cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
  }

  const formatDuration = (startedAt: number, endedAt?: number) => {
    const end = endedAt || Date.now()
    const seconds = Math.floor((end - startedAt) / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const config = statusConfig[session.status]

  return (
    <div className="glass-card rounded-xl p-3 space-y-3">
      {/* Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/runs')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-sm font-semibold text-foreground truncate">
              {run?.name || 'Training Execution'}
            </h1>
            <span
              className={cn(
                'px-2 py-0.5 rounded-md text-[10px] font-medium',
                config.className
              )}
            >
              {config.label}
            </span>
          </div>

          {/* Project & Resources */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground ml-9">
            {project && (
              <span>
                <span className="font-medium">Project:</span> {project.name}
              </span>
            )}
            {dataset && (
              <span>
                <span className="font-medium">Dataset:</span> {dataset.name}
              </span>
            )}
            {trainer && (
              <span>
                <span className="font-medium">Trainer:</span> {trainer.name}
              </span>
            )}
            {compute && (
              <span>
                <span className="font-medium">Compute:</span> {compute.name}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {session.status === 'running' && onPause && (
            <Button variant="outline" size="sm" onClick={onPause}>
              <Pause className="h-4 w-4 mr-1.5" />
              Pause
            </Button>
          )}
          {session.status === 'paused' && onResume && (
            <Button variant="outline" size="sm" onClick={onResume}>
              <Play className="h-4 w-4 mr-1.5" />
              Resume
            </Button>
          )}
          {(session.status === 'running' || session.status === 'paused' || session.status === 'starting') && onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1.5" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/20">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Start Time</div>
          <div className="text-sm font-medium text-foreground">
            {formatDate(session.startedAt)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Duration</div>
          <div className="text-sm font-medium text-foreground">
            {formatDuration(session.startedAt, session.endedAt)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Progress</div>
          <div className="text-sm font-medium text-foreground">
            {session.progressPct.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Epoch / Step</div>
          <div className="text-sm font-medium text-foreground">
            {session.epoch} / {session.step}
          </div>
        </div>
      </div>

      {/* Status Message */}
      {session.status === 'starting' && (
        <div className="text-sm text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          Training dimulai. Monitoring akan muncul di sini.
        </div>
      )}
      {session.status === 'running' && (
        <div className="text-sm text-muted-foreground bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          Training sedang berjalan.
        </div>
      )}
      {session.status === 'completed' && (
        <div className="text-sm text-muted-foreground bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          Training selesai.
        </div>
      )}
      {session.status === 'failed' && (
        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          Training gagal. Lihat log untuk detail.
          {session.errorMessage && (
            <div className="mt-2 font-medium">{session.errorMessage}</div>
          )}
        </div>
      )}
      {session.status === 'paused' && (
        <div className="text-sm text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          Training dijeda.
        </div>
      )}

      {/* Info Note */}
      <div className="text-xs text-muted-foreground pt-2 border-t border-border/20">
        Data monitoring bersifat real-time (simulasi jika belum terhubung engine).
      </div>
    </div>
  )
}
