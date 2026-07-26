import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Edit, Trash2 } from 'lucide-react'
import { useRunStore } from '@/modules/runs'
import { useProjectStore } from '@/modules/projects'
import { type Dataset, fetchDataset } from '@/modules/datasets'
import { useTrainerStore } from '@/modules/trainers'
import { useComputeStore } from '@/modules/compute'
import { RunStatusBadge } from '@/modules/runs'
import { RequirementsChecklist } from '@/modules/runs'
import { RunFormModal } from '@/modules/runs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/ui/toast'

export function RunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getRun, deleteRun } = useRunStore()
  const { getProject } = useProjectStore()
  const { getTrainer } = useTrainerStore()
  const { getCompute } = useComputeStore()
  const { addToast } = useToast()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [dataset, setDataset] = useState<Dataset | null>(null)

  const run = id ? getRun(id) : undefined

  // Fetch dataset when run is available
  useEffect(() => {
    if (run?.datasetId) {
      fetchDataset(run.datasetId)
        .then(setDataset)
        .catch((error) => {
          console.error('[RunDetailPage] Failed to fetch dataset:', error)
          setDataset(null)
        })
    } else {
      setDataset(null)
    }
  }, [run?.datasetId])

  // Redirect FINAL status runs to Results page (Module 6)
  if (run && (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled')) {
    navigate(`/runs/${run.id}/results`, { replace: true })
    return null
  }

  if (!run) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/runs')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Runs
        </Button>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Run not found</p>
        </div>
      </div>
    )
  }

  const project = getProject(run.projectId)
  // dataset is already fetched in useEffect above
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

  const handleDelete = () => {
    if (window.confirm(`Hapus run "${run.name}"?`)) {
      deleteRun(run.id)
      addToast({
        title: 'Run dihapus',
        description: `Run "${run.name}" telah dihapus.`,
        variant: 'success',
      })
      navigate('/runs')
    }
  }

  // Build requirements checklist
  const requirements = [
    {
      label: 'Run name terisi',
      met: !!run.name && run.name.trim().length > 0,
    },
    {
      label: 'Project dipilih',
      met: !!run.projectId && !!project,
    },
    {
      label: 'Dataset dipilih',
      met: !!run.datasetId && !!dataset,
      error: run.validationErrors.find((e) => e.includes('Dataset'))
        ? 'Dataset belum dipilih'
        : undefined,
    },
    {
      label: 'Trainer dipilih',
      met: !!run.trainerId && !!trainer,
      error: run.validationErrors.find((e) => e.includes('Trainer'))
        ? 'Trainer belum dipilih'
        : undefined,
    },
    {
      label: 'Compute dipilih',
      met: !!run.computeId && !!compute,
      error: run.validationErrors.find((e) => e.includes('Compute'))
        ? 'Compute environment belum dipilih'
        : undefined,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate('/runs')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl font-bold text-foreground">{run.name}</h1>
              <RunStatusBadge status={run.status} />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Updated {formatDate(run.updatedAt)}</span>
              </div>
            </div>
            {run.notes && (
              <p className="text-sm text-muted-foreground mb-2">{run.notes}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Draft
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Info */}
      <div className="glass-card rounded-2xl p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Project</p>
            <p className="text-sm font-medium text-foreground">
              {project ? project.name : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Run Type</p>
            <p className="text-sm font-medium text-foreground">Training</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Dataset</p>
            <p className="text-sm font-medium text-foreground">
              {dataset ? dataset.name : 'Not selected'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Trainer</p>
            <p className="text-sm font-medium text-foreground">
              {trainer ? trainer.name : 'Not selected'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Compute</p>
            <p className="text-sm font-medium text-foreground">
              {compute ? compute.name : 'Not selected'}
            </p>
          </div>
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="glass-card rounded-2xl p-4">
        <RequirementsChecklist requirements={requirements} />
      </div>

      {/* Configuration (Draft) */}
      <div className="glass-card rounded-2xl p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Configuration (Draft)
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Purpose</p>
            <p className="text-sm font-medium text-foreground capitalize">
              {run.purpose.replace('-', ' ')}
            </p>
          </div>

          {Object.keys(run.parameters).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Parameters</p>
              <div className="space-y-1">
                {Object.entries(run.parameters).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-2 rounded-lg bg-accent/30"
                  >
                    <span className="text-xs font-medium text-foreground">{key}:</span>
                    <span className="text-xs text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {run.tags && run.tags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {run.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 text-xs rounded-md bg-accent/50 text-accent-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation Errors (if any) */}
      {run.validationErrors.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-orange-500/20">
          <h2 className="text-base font-semibold text-foreground mb-2">
            Validation Issues
          </h2>
          <ul className="space-y-1">
            {run.validationErrors.map((error, index) => (
              <li key={index} className="text-sm text-orange-500">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Edit Modal */}
      <RunFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        run={run}
      />
    </div>
  )
}
