import { useState } from 'react'
import { Calendar, MoreVertical, Edit, Trash2, Eye, Play, Activity } from 'lucide-react'
import type { RunDraft } from '@/modules/runs'
import { RunStatusBadge } from '@/modules/runs'
import { ExecutionStatusBadge } from '@/modules/execution'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'
import { useRunStore } from '@/modules/runs'
import { useProjectStore } from '@/modules/projects'
import { useExecutionStore } from '@/modules/execution'
import { MockTrainingAdapter } from '@/modules/execution'
import { useToast } from '@/components/ui/toast'

interface RunCardProps {
  run: RunDraft
  onEdit?: (run: RunDraft) => void
}

export function RunCard({ run, onEdit }: RunCardProps) {
  const navigate = useNavigate()
  const { deleteRun } = useRunStore()
  const { getProject } = useProjectStore()
  const { getSessionByRunId, startSession } = useExecutionStore()
  const { addToast } = useToast()
  const [adapter] = useState(() => new MockTrainingAdapter())

  const project = getProject(run.projectId)
  const executionSession = getSessionByRunId(run.id)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDelete = () => {
    if (window.confirm(`Hapus run "${run.name}"?`)) {
      deleteRun(run.id)
      addToast({
        title: 'Run dihapus',
        description: `Run "${run.name}" telah dihapus.`,
        variant: 'success',
      })
    }
  }

  const handleStartTraining = async () => {
    if (run.status !== 'ready') {
      addToast({
        title: 'Cannot start training',
        description: 'Run must be in "Ready" status to start training.',
        variant: 'error',
      })
      return
    }

    try {
      startSession(run.id)
      await adapter.start({
        runId: run.id,
        name: run.name,
        projectId: run.projectId,
        datasetId: run.datasetId,
        trainerId: run.trainerId,
        computeId: run.computeId,
        parameters: run.parameters,
      })
      addToast({
        title: 'Training started',
        description: 'Training session has been started.',
        variant: 'success',
      })
      navigate(`/runs/${run.id}/execution`)
    } catch (error) {
      addToast({
        title: 'Failed to start training',
        description: 'Could not start training session.',
        variant: 'error',
      })
    }
  }

  const handleViewMonitoring = () => {
    if (executionSession) {
      navigate(`/execution/${executionSession.sessionId}`)
    } else {
      navigate(`/runs/${run.id}/execution`)
    }
  }

  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-5 hover:shadow-lg transition-all',
        run.status === 'blocked' && 'opacity-75'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {run.name}
            </h3>
            <RunStatusBadge status={run.status} />
            {executionSession && (
              <ExecutionStatusBadge status={executionSession.status} />
            )}
          </div>
          {project && (
            <p className="text-sm text-muted-foreground mb-1">
              Project: {project.name}
            </p>
          )}
          <p className="text-xs text-muted-foreground mb-2">
            Run Type: Training
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigate(`/runs/${run.id}`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Detail
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEdit?.(run)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Draft
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Draft
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3 mb-3">
        {run.status === 'ready' && !executionSession && (
          <Button
            size="sm"
            onClick={handleStartTraining}
            className="flex-1"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Training
          </Button>
        )}
        {executionSession && (executionSession.status === 'running' || executionSession.status === 'completed' || executionSession.status === 'paused') && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleViewMonitoring}
            className="flex-1"
          >
            <Activity className="w-4 h-4 mr-2" />
            View Monitoring
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Updated {formatDate(run.updatedAt)}</span>
        </div>
      </div>

      {run.tags && run.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {run.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs rounded-md bg-accent/50 text-accent-foreground"
            >
              {tag}
            </span>
          ))}
          {run.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-muted-foreground">
              +{run.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
