import { ArrowDown, Package, Play, FolderOpen, Database, Brain, Server } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/modules/projects'
import { type Dataset, fetchDataset } from '@/modules/datasets'
import { useTrainerStore } from '@/modules/trainers'
import { useComputeStore } from '@/modules/compute'
import { useRunStore } from '@/modules/runs'
import type { Model, ModelVersion } from '@/modules/models'
import { cn } from '@/lib/utils'

interface LineageDiagramProps {
  model: Model
  version: ModelVersion
}

export function LineageDiagram({ model, version }: LineageDiagramProps) {
  const navigate = useNavigate()
  const { getProject } = useProjectStore()
  const { getTrainer } = useTrainerStore()
  const { getCompute } = useComputeStore()
  const { getRun } = useRunStore()
  const [dataset, setDataset] = useState<Dataset | null>(null)

  const project = getProject(model.projectId)
  const run = getRun(version.sourceRunId)

  // Fetch dataset when run is available
  useEffect(() => {
    if (run?.datasetId) {
      fetchDataset(run.datasetId)
        .then(setDataset)
        .catch((error) => {
          console.error('[LineageDiagram] Failed to fetch dataset:', error)
          setDataset(null)
        })
    } else {
      setDataset(null)
    }
  }, [run?.datasetId])

  const trainer = run?.trainerId ? getTrainer(run.trainerId) : undefined
  const compute = run?.computeId ? getCompute(run.computeId) : undefined

  const lineageItems = [
    {
      label: 'Model Version',
      value: version.version,
      icon: Package,
      onClick: () => navigate(`/models/versions/${version.id}`),
    },
    {
      label: 'Source Run',
      value: version.sourceRunName,
      icon: Play,
      onClick: () => navigate(`/runs/${version.sourceRunId}/results`),
    },
    {
      label: 'Project',
      value: project?.name || 'Unknown',
      icon: FolderOpen,
      onClick: () => navigate(`/projects/${model.projectId}`),
    },
    {
      label: 'Dataset',
      value: dataset?.name || 'N/A',
      icon: Database,
      onClick: dataset
        ? () => navigate(`/projects/${model.projectId}/datasets/${dataset.id}`)
        : undefined,
    },
    {
      label: 'Trainer',
      value: trainer?.name || 'N/A',
      icon: Brain,
      onClick: trainer ? () => navigate(`/projects/${model.projectId}/trainers/${trainer.id}`) : undefined,
    },
    {
      label: 'Compute',
      value: compute?.name || 'N/A',
      icon: Server,
      onClick: compute ? () => navigate(`/projects/${model.projectId}/compute/${compute.id}`) : undefined,
    },
  ]

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Lineage & Traceability</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Traceability lengkap dari model version hingga data source dan engine yang digunakan.
        Semua informasi bersifat read-only untuk audit dan governance.
      </p>

      <div className="space-y-4">
        {lineageItems.map((item, index) => {
          const Icon = item.icon
          const isLast = index === lineageItems.length - 1

          return (
            <div key={item.label} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    item.onClick
                      ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30 transition-colors'
                      : 'bg-muted/30 text-muted-foreground'
                  )}
                  onClick={item.onClick}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {!isLast && (
                  <ArrowDown className="w-4 h-4 text-muted-foreground my-1" />
                )}
              </div>
              <div className="flex-1 pt-2">
                <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                <div
                  className={cn(
                    'text-sm font-medium text-foreground',
                    item.onClick && 'cursor-pointer hover:text-primary transition-colors'
                  )}
                  onClick={item.onClick}
                >
                  {item.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
