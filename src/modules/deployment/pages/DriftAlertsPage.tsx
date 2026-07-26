import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Info, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useDeploymentStore } from '../store/deploymentStore'
import { DeploymentStatusBadge } from '../components/DeploymentStatusBadge'
import { DriftStatusBadge } from '../components/DriftStatusBadge'
import { AlertSeverityBadge } from '../components/AlertSeverityBadge'
import { Button } from '@/components/ui/button'

export function DriftAlertsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getDeployment, getActiveAlerts } = useDeploymentStore()

  const deployment = id ? getDeployment(id) : undefined
  const alerts = id ? getActiveAlerts(id) : getActiveAlerts()

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return AlertCircle
      case 'warning':
        return AlertTriangle
      default:
        return Info
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400'
      case 'warning':
        return 'text-yellow-400'
      default:
        return 'text-blue-400'
    }
  }

  if (!deployment && id) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/deployments')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Deployments
        </Button>
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">Deployment not found</p>
        </div>
      </div>
    )
  }

  // Group alerts by deployment if viewing all
  const alertsByDeployment = !id
    ? alerts.reduce(
        (acc, alert) => {
          if (!acc[alert.deploymentId]) {
            acc[alert.deploymentId] = []
          }
          acc[alert.deploymentId].push(alert)
          return acc
        },
        {} as Record<string, typeof alerts>
      )
    : { [id]: alerts }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {id && (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/deployments/${id}/monitoring`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {id ? 'Drift & Alerts' : 'All Drift & Alerts'}
              </h1>
              {deployment && <DeploymentStatusBadge status={deployment.status} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {id
                ? `${deployment?.modelName} • Version ${deployment?.modelVersion} • Observational data & governance`
                : 'Monitor data and prediction drift across all deployments'}
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="glass-panel rounded-xl p-4 border border-blue-500/30 bg-blue-500/10">
        <p className="text-sm text-blue-400">
          Drift monitoring helps detect when model inputs or predictions deviate from expected patterns.
          These alerts are informational and governance-oriented.
        </p>
      </div>

      {/* Alerts */}
      {alerts.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Active Alerts</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            All deployments are operating within expected parameters. No drift detected.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(alertsByDeployment).map(([deploymentId, deploymentAlerts]) => {
            const dep = getDeployment(deploymentId)
            return (
              <div key={deploymentId} className="space-y-4">
                {!id && dep && (
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{dep.modelName}</h2>
                    <span className="text-sm text-muted-foreground">v{dep.modelVersion}</span>
                  </div>
                )}
                <div className="space-y-3">
                  {deploymentAlerts.map((alert) => {
                    const Icon = getSeverityIcon(alert.severity)
                    const iconColor = getSeverityColor(alert.severity)

                    return (
                      <div key={alert.id} className="glass-card rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg bg-${alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'yellow' : 'blue'}-500/10`}>
                              <Icon className={`w-4 h-4 ${iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-foreground uppercase">
                                  {alert.type.replace('_', ' ')}
                                </span>
                                <DriftStatusBadge status={alert.status} />
                                <AlertSeverityBadge severity={alert.severity} />
                              </div>
                              <p className="text-sm text-foreground mb-2">{alert.message}</p>
                              <p className="text-xs text-muted-foreground">
                                Detected: {formatTimestamp(alert.detectedAt)}
                                {alert.resolvedAt && ` • Resolved: ${formatTimestamp(alert.resolvedAt)}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
