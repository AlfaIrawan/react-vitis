import { ArrowUp, Archive, RotateCcw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useModelStore } from '../store/modelStore'
import type { Model } from '../store/modelStore'
import { useToast } from '@/components/ui/toast'

interface LifecycleActionsProps {
  model: Model
}

export function LifecycleActions({ model }: LifecycleActionsProps) {
  const { promoteModel, archiveModel } = useModelStore()
  const { addToast } = useToast()

  const handlePromoteToStaging = () => {
    if (model.status === 'archived') {
      addToast({
        title: 'Cannot promote archived model',
        description: 'Archived models cannot be promoted. Please restore the model first.',
        variant: 'error',
      })
      return
    }
    promoteModel(model.id, 'staging')
    addToast({
      title: 'Model promoted to Staging',
      description: `${model.name} has been promoted to Staging status.`,
      variant: 'success',
    })
  }

  const handlePromoteToProduction = () => {
    if (model.status === 'archived') {
      addToast({
        title: 'Cannot promote archived model',
        description: 'Archived models cannot be promoted. Please restore the model first.',
        variant: 'error',
      })
      return
    }
    promoteModel(model.id, 'production')
    addToast({
      title: 'Model promoted to Production',
      description: `${model.name} has been promoted to Production status.`,
      variant: 'success',
    })
  }

  const handleArchive = () => {
    if (model.status === 'production') {
      addToast({
        title: 'Cannot archive production model',
        description: 'Production models should be demoted first before archiving.',
        variant: 'error',
      })
      return
    }
    archiveModel(model.id)
    addToast({
      title: 'Model archived',
      description: `${model.name} has been archived.`,
      variant: 'success',
    })
  }

  const canPromoteToStaging = model.status === 'draft' || model.status === 'staging'
  const canPromoteToProduction = model.status === 'staging'
  const canArchive = model.status !== 'archived' && model.status !== 'production'

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Lifecycle Actions</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Kelola status model melalui lifecycle management. Semua aksi bersifat state transition dan
        tidak dapat diubah kembali kecuali melalui rollback.
      </p>

      <div className="space-y-3">
        {canPromoteToStaging && (
          <Button
            onClick={handlePromoteToStaging}
            variant="outline"
            className="w-full justify-start"
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Promote to Staging
          </Button>
        )}

        {canPromoteToProduction && (
          <Button
            onClick={handlePromoteToProduction}
            variant="outline"
            className="w-full justify-start"
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Promote to Production
          </Button>
        )}

        {canArchive && (
          <Button
            onClick={handleArchive}
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive Model
          </Button>
        )}

        {model.status === 'archived' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-yellow-300 font-medium">Model Archived</p>
              <p className="text-xs text-muted-foreground mt-1">
                Model ini telah diarsipkan dan tidak dapat dipromosikan.
              </p>
            </div>
          </div>
        )}

        {model.status === 'production' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <AlertCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-green-300 font-medium">Production Model</p>
              <p className="text-xs text-muted-foreground mt-1">
                Model ini sedang digunakan di production. Demote ke staging sebelum archiving.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
