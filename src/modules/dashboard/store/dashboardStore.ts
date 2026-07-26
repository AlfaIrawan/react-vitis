import { create } from 'zustand'
import { useModelStore } from '../../models/store/modelStore'
import { useDeploymentStore } from '../../deployment/store/deploymentStore'
import { useRunStore } from '../../runs/store/runStore'
import { useFeedbackStore } from '../../feedback/store/feedbackStore'
import { useGovernanceStore } from '../../governance/store/governanceStore'

export type AIHealthStatus = 'healthy' | 'attention' | 'critical'
export type Environment = 'production' | 'staging' | 'development'

export interface DashboardMetrics {
  // Executive Health Snapshot
  totalModels: {
    production: number
    staging: number
    development: number
    total: number
  }
  activeDeployments: number
  trainingRuns: {
    last24h: number
    last7d: number
  }
  activeAlerts: {
    drift: number
    errors: number
    compliance: number
    total: number
  }
  overallHealthStatus: AIHealthStatus

  // Lifecycle Overview
  lifecycleCounts: {
    data: number
    training: number
    model: number
    deployment: number
    inference: number
    feedback: number
    governance: number
  }

  // Live Signals
  liveSignals: {
    requests24h: number
    avgLatencyP95: number // milliseconds
    errorRate: number // percentage
    driftWarningsCount: number
  }

  // Attention & Alerts
  modelsWithDrift: Array<{
    id: string
    name: string
    deploymentId: string
    severity: 'warning' | 'critical'
  }>
  deploymentsWithErrors: Array<{
    id: string
    modelName: string
    errorRate: number
  }>
  feedbackAwaitingVerification: number
  complianceStatus: 'compliant' | 'partial' | 'non_compliant'
}

interface DashboardState {
  getMetrics: () => DashboardMetrics
  refreshMetrics: () => void
}

// Calculate overall health status
function calculateHealthStatus(
  driftAlerts: number,
  errorRate: number,
  complianceStatus: 'compliant' | 'partial' | 'non_compliant'
): AIHealthStatus {
  if (driftAlerts > 5 || errorRate > 10 || complianceStatus === 'non_compliant') {
    return 'critical'
  }
  if (driftAlerts > 2 || errorRate > 5 || complianceStatus === 'partial') {
    return 'attention'
  }
  return 'healthy'
}

export const useDashboardStore = create<DashboardState>(() => ({
  getMetrics: () => {
    // Get data from all stores
    const modelStore = useModelStore.getState()
    const deploymentStore = useDeploymentStore.getState()
    const runStore = useRunStore.getState()
    const feedbackStore = useFeedbackStore.getState()
    const governanceStore = useGovernanceStore.getState()

    // Calculate model counts by environment
    const allModels = modelStore.models
    const modelCounts = {
      production: allModels.filter((m) => m.status === 'production').length,
      staging: allModels.filter((m) => m.status === 'staging').length,
      development: allModels.filter((m) => m.status === 'draft').length,
      total: allModels.length,
    }

    // Active deployments
    const activeDeployments = deploymentStore.deployments.filter(
      (d) => d.status === 'active'
    ).length

    // Training runs (last 24h and 7d)
    const now = Date.now()
    const last24h = now - 24 * 60 * 60 * 1000
    const last7d = now - 7 * 24 * 60 * 60 * 1000

    const runs24h = runStore.runs.filter(
      (r) => new Date(r.createdAt).getTime() >= last24h
    ).length
    const runs7d = runStore.runs.filter(
      (r) => new Date(r.createdAt).getTime() >= last7d
    ).length

    // Active alerts
    const driftAlerts = deploymentStore.getActiveAlerts()
    const driftCount = driftAlerts.filter((a) => a.type === 'data_drift' || a.type === 'prediction_drift').length
    
    // Calculate error rate from deployments
    let totalErrors = 0
    let totalRequests = 0
    deploymentStore.deployments.forEach((deployment) => {
      const latestMetrics = deploymentStore.getLatestMetrics(deployment.id)
      if (latestMetrics) {
        totalRequests += latestMetrics.requestCount
        totalErrors += latestMetrics.errorCount
      }
    })
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0

    // Compliance status
    const complianceStatus = governanceStore.getComplianceStatus()

    const activeAlerts = {
      drift: driftCount,
      errors: errorRate > 5 ? 1 : 0, // Count as alert if error rate > 5%
      compliance: complianceStatus === 'non_compliant' ? 1 : complianceStatus === 'partial' ? 1 : 0,
      total: driftCount + (errorRate > 5 ? 1 : 0) + (complianceStatus !== 'compliant' ? 1 : 0),
    }

    const overallHealthStatus = calculateHealthStatus(
      driftCount,
      errorRate,
      complianceStatus
    )

    // Lifecycle counts
    const lifecycleCounts = {
      data: runStore.runs.filter((r) => r.purpose === 'data-prep').length,
      training: runStore.runs.filter((r) => r.status === 'ready' || r.status === 'draft').length,
      model: allModels.length,
      deployment: activeDeployments,
      inference: totalRequests, // Use request count as proxy
      feedback: feedbackStore.feedbacks.length,
      governance: governanceStore.getTotalModelsGoverned(),
    }

    // Live signals
    const liveSignals = {
      requests24h: totalRequests,
      avgLatencyP95: (() => {
        let totalP95 = 0
        let count = 0
        deploymentStore.deployments.forEach((deployment) => {
          const latestMetrics = deploymentStore.getLatestMetrics(deployment.id)
          if (latestMetrics) {
            totalP95 += latestMetrics.p95Latency
            count++
          }
        })
        return count > 0 ? Math.round(totalP95 / count) : 0
      })(),
      errorRate: Math.round(errorRate * 100) / 100, // Round to 2 decimals
      driftWarningsCount: driftCount,
    }

    // Models with drift warnings
    const modelsWithDrift = driftAlerts
      .filter((a) => a.status === 'warning' || a.severity === 'critical')
      .map((alert) => {
        const deployment = deploymentStore.getDeployment(alert.deploymentId)
        return {
          id: deployment?.modelId || '',
          name: deployment?.modelName || 'Unknown',
          deploymentId: alert.deploymentId,
          severity: alert.severity === 'critical' ? ('critical' as const) : ('warning' as const),
        }
      })
      .filter((m) => m.id) // Remove invalid entries

    // Deployments with elevated error rate
    const deploymentsWithErrors = deploymentStore.deployments
      .map((deployment) => {
        const latestMetrics = deploymentStore.getLatestMetrics(deployment.id)
        if (!latestMetrics || latestMetrics.requestCount === 0) return null
        const deploymentErrorRate = (latestMetrics.errorCount / latestMetrics.requestCount) * 100
        if (deploymentErrorRate > 5) {
          return {
            id: deployment.id,
            modelName: deployment.modelName,
            errorRate: Math.round(deploymentErrorRate * 100) / 100,
          }
        }
        return null
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)

    // Feedback awaiting verification
    const feedbackAwaitingVerification = feedbackStore
      .getFeedbacksByStatus('pending').length

    return {
      totalModels: modelCounts,
      activeDeployments,
      trainingRuns: {
        last24h: runs24h,
        last7d: runs7d,
      },
      activeAlerts,
      overallHealthStatus,
      lifecycleCounts,
      liveSignals,
      modelsWithDrift,
      deploymentsWithErrors,
      feedbackAwaitingVerification,
      complianceStatus,
    }
  },

  refreshMetrics: () => {
    // This is a no-op since we compute metrics on-demand
    // In a real app, this might trigger a refetch
  },
}))
