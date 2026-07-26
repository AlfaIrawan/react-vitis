import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, FileText, Download, CheckCircle2 } from 'lucide-react'
import { useModelStore } from '@/modules/models'
import { useProjectStore } from '@/modules/projects'
import { useRunStore } from '@/modules/runs'
import { type Dataset, fetchDataset } from '@/modules/datasets'
import { useTrainerStore } from '@/modules/trainers'
import { useComputeStore } from '@/modules/compute'
import { LineageDiagram } from '../components/LineageDiagram'
import { Button } from '@/components/ui/button'
import { FinalMetricsSummary } from '../../runs/components/FinalMetricsSummary'
import type { RunResultData } from '@/modules/runs'

export function ModelVersionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { models } = useModelStore()
  const { getProject } = useProjectStore()
  const { getRun } = useRunStore()
  const { getTrainer } = useTrainerStore()
  const { getCompute } = useComputeStore()
  const [dataset, setDataset] = useState<Dataset | null>(null)

  // Find the version
  const version = models
    .flatMap((m) => m.versions.map((v) => ({ ...v, model: m })))
    .find((v) => v.id === id)

  const run = version ? getRun(version.sourceRunId) : undefined

  // Fetch dataset when run is available
  useEffect(() => {
    if (run?.datasetId) {
      fetchDataset(run.datasetId)
        .then(setDataset)
        .catch((error) => {
          console.error('[ModelVersionDetailPage] Failed to fetch dataset:', error)
          setDataset(null)
        })
    } else {
      setDataset(null)
    }
  }, [run?.datasetId])

  if (!version) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/models')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Model Registry
        </Button>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Version not found</p>
        </div>
      </div>
    )
  }

  const model = version.model
  const project = getProject(model.projectId)
  const trainer = run?.trainerId ? getTrainer(run.trainerId) : undefined
  const compute = run?.computeId ? getCompute(run.computeId) : undefined
  const isActive = version.id === model.currentVersionId

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  // Convert version metrics to RunResultData format for FinalMetricsSummary
  const resultData: RunResultData | undefined = run?.resultData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(`/models/${model.id}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl font-bold text-foreground">
                {model.name} - {version.version}
              </h1>
              {isActive && (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Current Version
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1.5">
                <span>Model: {model.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Project: {project?.name || model.projectName || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created {formatDate(version.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Source Run</div>
                <div
                  className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/runs/${version.sourceRunId}/results`)}
                >
                  {version.sourceRunName}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Project</div>
                <div
                  className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/projects/${model.projectId}`)}
                >
                  {project?.name || model.projectName || 'Unknown'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Trainer</div>
                <div className="text-sm font-medium text-foreground">
                  {trainer ? (
                    <span
                      className="cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/projects/${model.projectId}/trainers/${trainer.id}`)}
                    >
                      {trainer.name}
                    </span>
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Dataset</div>
                <div className="text-sm font-medium text-foreground">
                  {dataset ? (
                    <span
                      className="cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/projects/${model.projectId}/datasets/${dataset.id}`)}
                    >
                      {dataset.name}
                    </span>
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Compute</div>
                <div className="text-sm font-medium text-foreground">
                  {compute ? (
                    <span
                      className="cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/projects/${model.projectId}/compute/${compute.id}`)}
                    >
                      {compute.name}
                    </span>
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Data Source</div>
                <div className="text-sm font-medium text-foreground">
                  {dataSourceConnector ? (
                    <span
                      className="cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/connectors/${dataSourceConnector.id}`)}
                    >
                      {dataSourceConnector.name}
                    </span>
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Task Type</div>
                <div className="text-sm font-medium text-foreground capitalize">
                  {model.taskType}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Version Status</div>
                <div className="text-sm font-medium text-foreground">
                  {isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>

          {/* Final Metrics */}
          {resultData && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Final Metrics</h2>
              <FinalMetricsSummary resultData={resultData} status="completed" />
            </div>
          )}

          {/* Artifacts */}
          {version.artifacts && version.artifacts.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Artifacts</h2>
              <div className="space-y-2">
                {version.artifacts.map((artifact, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{artifact.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {artifact.type} • {formatFileSize(artifact.size)}
                          {artifact.format && ` • ${artifact.format}`}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Config Snapshot */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Configuration Snapshot</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Konfigurasi yang digunakan saat training. Bersifat read-only dan immutable.
            </p>
            <div className="bg-black/20 dark:bg-black/40 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-foreground font-mono">
                {JSON.stringify(version.configSnapshot, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Sidebar - Lineage */}
        <div className="space-y-6">
          <LineageDiagram model={model} version={version} />
        </div>
      </div>
    </div>
  )
}
