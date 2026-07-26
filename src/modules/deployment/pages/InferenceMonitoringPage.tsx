import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Clock, AlertCircle, CheckCircle2, Activity, Settings, Globe, Bell } from 'lucide-react'
import { useDeploymentStore } from '../store/deploymentStore'
import { DeploymentStatusBadge } from '../components/DeploymentStatusBadge'
import { AlertSeverityBadge } from '../components/AlertSeverityBadge'
import { Button } from '@/components/ui/button'

export function InferenceMonitoringPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getDeployment, getLatestMetrics, getMetricsHistory } = useDeploymentStore()

  const deployment = id ? getDeployment(id) : undefined
  const latestMetrics = id ? getLatestMetrics(id) : undefined
  const metricsHistory = id ? getMetricsHistory(id, 24) : []

  // Calculate success rate
  const successRate = useMemo(() => {
    if (!latestMetrics || latestMetrics.requestCount === 0) return 0
    return (latestMetrics.successCount / latestMetrics.requestCount) * 100
  }, [latestMetrics])

  // Calculate error rate
  const errorRate = useMemo(() => {
    if (!latestMetrics || latestMetrics.requestCount === 0) return 0
    return (latestMetrics.errorCount / latestMetrics.requestCount) * 100
  }, [latestMetrics])

  if (!deployment) {
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

  const stats = [
    {
      label: 'Total Requests (24h)',
      value: metricsHistory.reduce((sum, m) => sum + m.requestCount, 0).toLocaleString(),
      icon: Activity,
      color: 'text-blue-400',
    },
    {
      label: 'Success Rate',
      value: `${successRate.toFixed(2)}%`,
      icon: CheckCircle2,
      color: 'text-green-400',
    },
    {
      label: 'Error Rate',
      value: `${errorRate.toFixed(2)}%`,
      icon: AlertCircle,
      color: 'text-red-400',
    },
    {
      label: 'Avg Latency',
      value: latestMetrics ? `${latestMetrics.avgLatency.toFixed(0)}ms` : '–',
      icon: Clock,
      color: 'text-purple-400',
    },
    {
      label: 'P95 Latency',
      value: latestMetrics ? `${latestMetrics.p95Latency.toFixed(0)}ms` : '–',
      icon: TrendingUp,
      color: 'text-orange-400',
    },
    {
      label: 'P99 Latency',
      value: latestMetrics ? `${latestMetrics.p99Latency.toFixed(0)}ms` : '–',
      icon: TrendingUp,
      color: 'text-yellow-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/deployments')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{deployment.modelName}</h1>
              <DeploymentStatusBadge status={deployment.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Version {deployment.modelVersion} • Real-time inference monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Deployment Config & Endpoint (Read-only) */}
      <div className="glass-card rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <Settings className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-2">Deployment Config (Read-only)</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Autoscaling:</span>
                  <span className="text-foreground font-medium">{deployment.config.autoscaling}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Replicas:</span>
                  <span className="text-foreground font-medium">{deployment.config.replicas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Timeout:</span>
                  <span className="text-foreground font-medium">{deployment.config.timeout}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Globe className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Endpoint (Read-only)</p>
              <p className="text-xs text-foreground font-mono break-all">{deployment.endpoint}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Request Volume Chart (Simplified visualization) */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Request Volume (Last 24 Hours)</h2>
        <div className="h-48 flex items-end gap-1">
          {metricsHistory.slice(-24).map((metric, index) => {
            const maxRequests = Math.max(...metricsHistory.map((m) => m.requestCount))
            const height = (metric.requestCount / maxRequests) * 100
            return (
              <div
                key={index}
                className="flex-1 bg-primary/30 rounded-t hover:bg-primary/50 transition-colors"
                style={{ height: `${height}%` }}
                title={`${metric.requestCount} requests`}
              />
            )
          })}
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>24h ago</span>
          <span>Now</span>
        </div>
      </div>

      {/* Confidence Distribution */}
      {latestMetrics?.confidenceDistribution && (
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Confidence Distribution</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-24 text-xs text-muted-foreground">High (&gt;0.9)</div>
              <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500/50"
                  style={{
                    width: `${(latestMetrics.confidenceDistribution.high / latestMetrics.requestCount) * 100}%`,
                  }}
                />
              </div>
              <div className="w-16 text-xs text-foreground text-right">
                {latestMetrics.confidenceDistribution.high.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-xs text-muted-foreground">Medium (0.7-0.9)</div>
              <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500/50"
                  style={{
                    width: `${(latestMetrics.confidenceDistribution.medium / latestMetrics.requestCount) * 100}%`,
                  }}
                />
              </div>
              <div className="w-16 text-xs text-foreground text-right">
                {latestMetrics.confidenceDistribution.medium.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-xs text-muted-foreground">Low (&lt;0.7)</div>
              <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500/50"
                  style={{
                    width: `${(latestMetrics.confidenceDistribution.low / latestMetrics.requestCount) * 100}%`,
                  }}
                />
              </div>
              <div className="w-16 text-xs text-foreground text-right">
                {latestMetrics.confidenceDistribution.low.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Thresholds (Informational) */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Alert Thresholds</h2>
          <span className="text-xs text-muted-foreground">(Informational)</span>
        </div>
        <div className="space-y-2">
          {deployment.alertThresholds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alert thresholds configured.</p>
          ) : (
            deployment.alertThresholds.map((threshold, index) => {
              const metricLabels: Record<string, string> = {
                error_rate: 'Error Rate',
                p95_latency: 'P95 Latency',
                p99_latency: 'P99 Latency',
                avg_latency: 'Avg Latency',
                request_count: 'Request Count',
              }

              const formatMetricValue = (value: number, unit?: string) => {
                return `${value}${unit || ''}`
              }

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20"
                >
                  <div className="flex items-center gap-3">
                    <AlertSeverityBadge severity={threshold.severity} />
                    <span className="text-sm text-foreground font-medium">
                      {metricLabels[threshold.metric] || threshold.metric}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {threshold.operator} {formatMetricValue(threshold.value, threshold.unit)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">→ {threshold.severity.charAt(0).toUpperCase() + threshold.severity.slice(1)}</span>
                </div>
              )
            })
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-4 italic">
          These thresholds are informational only. No auto-actions are configured.
        </p>
      </div>

      {/* Links to other sections */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/deployments/${id}/logs`)}
        >
          View Logs
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/deployments/${id}/drift`)}
        >
          View Drift & Alerts
        </Button>
      </div>
    </div>
  )
}
