import { Package, Calendar, Tag, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { Model } from '../store/modelStore'
import { ModelStatusBadge } from './ModelStatusBadge'

interface ModelCardProps {
  model: Model
}

export function ModelCard({ model }: ModelCardProps) {
  const navigate = useNavigate()
  const currentVersion = model.versions.find((v) => v.id === model.currentVersionId)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div
      className="glass-card rounded-2xl p-5 cursor-pointer hover:shadow-xl transition-all duration-300 group"
      onClick={() => navigate(`/models/${model.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
              {model.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{model.projectName}</p>
          </div>
        </div>
        <ModelStatusBadge status={model.status} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span className="capitalize">{model.taskType}</span>
          </div>
          {currentVersion && (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">Version:</span>
              <span>{currentVersion.version}</span>
            </div>
          )}
        </div>

        {currentVersion && (
          <div className="flex items-center gap-4 text-xs">
            {currentVersion.metrics.accuracy !== undefined && (
              <div>
                <span className="text-muted-foreground">Accuracy: </span>
                <span className="font-medium text-foreground">
                  {(currentVersion.metrics.accuracy * 100).toFixed(1)}%
                </span>
              </div>
            )}
            {currentVersion.metrics.loss !== undefined && (
              <div>
                <span className="text-muted-foreground">Loss: </span>
                <span className="font-medium text-foreground">
                  {currentVersion.metrics.loss.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Created {formatDate(model.createdAt)}</span>
          </div>
          <span>Updated {formatDate(model.updatedAt)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/20">
        <span className="text-xs text-muted-foreground">
          {model.versions.length} {model.versions.length === 1 ? 'version' : 'versions'}
        </span>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  )
}
