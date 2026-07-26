import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Tag, Package } from 'lucide-react'
import { useModelStore } from '../store/modelStore'
import { useProjectStore } from '../../projects/store/projectStore'
import { ModelStatusBadge } from '../components/ModelStatusBadge'
import { ModelVersionList } from '../components/ModelVersionList'
import { LifecycleActions } from '../components/LifecycleActions'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export function ModelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getModel } = useModelStore()
  const { getProject } = useProjectStore()

  const model = id ? getModel(id) : undefined

  // Update project name if needed
  useEffect(() => {
    if (model) {
      const project = getProject(model.projectId)
      if (project && !model.projectName) {
        // Project name will be populated in the component
      }
    }
  }, [model, getProject])

  if (!model) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/models')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Model Registry
        </Button>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Model not found</p>
        </div>
      </div>
    )
  }

  const project = getProject(model.projectId)
  const currentVersion = model.versions.find((v) => v.id === model.currentVersionId)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/models')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl font-bold text-foreground">{model.name}</h1>
              <ModelStatusBadge status={model.status} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                <span>Current Version: {currentVersion?.version || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span className="capitalize">{model.taskType}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Project: {project?.name || model.projectName || 'Unknown'}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created {formatDate(model.createdAt)}</span>
              </div>
              <span>Updated {formatDate(model.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Version List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Model Versions</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Semua versi model bersifat immutable. Klik versi untuk melihat detail lengkap.
            </p>
            <ModelVersionList
              modelId={model.id}
              versions={model.versions}
              currentVersionId={model.currentVersionId}
            />
          </div>
        </div>

        {/* Sidebar - Lifecycle Actions */}
        <div className="space-y-6">
          <LifecycleActions model={model} />
        </div>
      </div>
    </div>
  )
}
