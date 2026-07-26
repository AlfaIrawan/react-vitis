import { Calendar, CheckCircle2, Circle, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useModelStore } from '../store/modelStore'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import type { ModelVersion } from '../store/modelStore'

interface ModelVersionListProps {
  modelId: string
  versions: ModelVersion[]
  currentVersionId: string | null
}

export function ModelVersionList({ modelId, versions, currentVersionId }: ModelVersionListProps) {
  const navigate = useNavigate()
  const { rollbackModel } = useModelStore()
  const { addToast } = useToast()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const sortedVersions = [...versions].sort((a, b) => {
    const aNum = parseInt(a.version.replace('v', ''), 10)
    const bNum = parseInt(b.version.replace('v', ''), 10)
    return bNum - aNum // Newest first
  })

  const handleRollback = (e: React.MouseEvent, versionId: string, versionName: string) => {
    e.stopPropagation()
    rollbackModel(modelId, versionId)
    addToast({
      title: 'Version rolled back',
      description: `Model has been rolled back to ${versionName}.`,
      variant: 'success',
    })
  }

  return (
    <div className="space-y-2">
      {sortedVersions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No versions available
        </p>
      ) : (
        sortedVersions.map((version) => {
          const isActive = version.id === currentVersionId

          return (
            <div
              key={version.id}
              className={cn(
                'glass-card rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all',
                isActive && 'ring-2 ring-primary/50'
              )}
              onClick={() => navigate(`/models/versions/${version.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isActive ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="font-semibold text-foreground">{version.version}</span>
                  {isActive && (
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleRollback(e, version.id, version.version)}
                      className="h-7 text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Rollback
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(version.createdAt)}
                  </span>
                </div>
              </div>

              <div className="mb-2">
                <p className="text-sm text-foreground font-medium mb-1">{version.sourceRunName}</p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                {version.metrics.accuracy !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Accuracy: </span>
                    <span className="font-medium text-foreground">
                      {(version.metrics.accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                {version.metrics.loss !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Loss: </span>
                    <span className="font-medium text-foreground">
                      {version.metrics.loss.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
