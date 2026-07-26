import { useNavigate } from 'react-router-dom'
import { Package, Globe, Clock, Play, Pause, Archive, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Deployment } from '../store/deploymentStore'
import { Button } from '@/components/ui/button'

interface DeploymentCardProps {
  deployment: Deployment
  onActivate?: (id: string) => void
  onPause?: (id: string) => void
  onRetire?: (id: string) => void
}

export function DeploymentCard({ deployment, onActivate, onPause, onRetire }: DeploymentCardProps) {
  const navigate = useNavigate()

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '–'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusConfig = {
    active: {
      label: 'Active',
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    paused: {
      label: 'Paused',
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    },
    retired: {
      label: 'Retired',
      className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    },
  }

  const status = statusConfig[deployment.status]

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground mb-1 truncate">
              {deployment.modelName}
            </h3>
            <p className="text-xs text-muted-foreground">
              Version {deployment.modelVersion} • {deployment.environment}
            </p>
          </div>
        </div>
        <div
          className={cn(
            'px-2.5 py-1 rounded-lg text-xs font-medium border',
            status.className
          )}
        >
          {status.label}
        </div>
      </div>

      {/* Endpoint */}
      <div className="flex items-start gap-2">
        <Globe className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1">Endpoint</p>
          <p className="text-xs text-foreground font-mono truncate">{deployment.endpoint}</p>
        </div>
      </div>

      {/* Deployment Config (Read-only) */}
      <div className="flex items-start gap-2">
        <Settings className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1.5">Config (Read-only)</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Autoscaling:</span>
              <span className="ml-1.5 text-foreground font-medium">{deployment.config.autoscaling}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Replicas:</span>
              <span className="ml-1.5 text-foreground font-medium">{deployment.config.replicas}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Timeout:</span>
              <span className="ml-1.5 text-foreground font-medium">{deployment.config.timeout}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            {deployment.status === 'active' && deployment.activatedAt && (
              <>Activated: {formatDate(deployment.activatedAt)}</>
            )}
            {deployment.status === 'paused' && deployment.pausedAt && (
              <>Paused: {formatDate(deployment.pausedAt)}</>
            )}
            {deployment.status === 'retired' && deployment.retiredAt && (
              <>Retired: {formatDate(deployment.retiredAt)}</>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/20">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 flex-1"
          onClick={() => navigate(`/deployments/${deployment.id}/monitoring`)}
        >
          View Monitoring
        </Button>
        {deployment.status === 'active' && onPause && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => onPause(deployment.id)}
          >
            <Pause className="w-3.5 h-3.5 mr-1.5" />
            Pause
          </Button>
        )}
        {deployment.status === 'paused' && onActivate && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => onActivate(deployment.id)}
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Activate
          </Button>
        )}
        {(deployment.status === 'active' || deployment.status === 'paused') && onRetire && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => onRetire(deployment.id)}
          >
            <Archive className="w-3.5 h-3.5 mr-1.5" />
            Retire
          </Button>
        )}
      </div>
    </div>
  )
}
