import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DeploymentStatus = 'active' | 'paused' | 'retired'

export type Environment = 'production' | 'staging' | 'development'

export type DriftStatus = 'normal' | 'warning' | 'alert'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface DeploymentConfig {
  autoscaling: 'on' | 'off'
  replicas: number
  timeout: string // e.g., "500ms", "1s", "2s"
}

export interface AlertThreshold {
  metric: 'error_rate' | 'p95_latency' | 'p99_latency' | 'avg_latency' | 'request_count'
  operator: '>' | '<' | '>=' | '<='
  value: number
  unit?: string // e.g., '%', 'ms'
  severity: AlertSeverity
}

export interface Deployment {
  id: string
  projectId: string // REQUIRED: Project-First enforcement - deployment belongs to exactly one project
  modelId: string
  modelName: string
  modelVersion: string
  versionId: string
  status: DeploymentStatus
  environment: Environment
  endpoint: string // Read-only endpoint URL
  config: DeploymentConfig // Read-only deployment configuration
  alertThresholds: AlertThreshold[] // Read-only alert thresholds (informational)
  createdAt: string
  activatedAt: string | null
  pausedAt: string | null
  retiredAt: string | null
}

export interface InferenceMetrics {
  deploymentId: string
  timestamp: string
  requestCount: number
  successCount: number
  errorCount: number
  avgLatency: number // in milliseconds
  p95Latency: number // in milliseconds
  p99Latency: number // in milliseconds
  confidenceDistribution?: {
    high: number // > 0.9
    medium: number // 0.7 - 0.9
    low: number // < 0.7
  }
}

export interface InferenceLog {
  id: string
  deploymentId: string
  timestamp: string
  modelVersion: string
  status: 'success' | 'error'
  latency: number // in milliseconds
  errorMessage?: string
  requestId?: string
}

export interface DriftAlert {
  id: string
  deploymentId: string
  type: 'data_drift' | 'prediction_drift'
  status: DriftStatus
  severity: AlertSeverity
  message: string
  detectedAt: string
  resolvedAt: string | null
}

interface DeploymentState {
  deployments: Deployment[]
  inferenceMetrics: Record<string, InferenceMetrics[]> // key: deploymentId
  inferenceLogs: InferenceLog[]
  driftAlerts: DriftAlert[]
  
  // Actions
  addDeployment: (deployment: Omit<Deployment, 'id' | 'createdAt' | 'activatedAt' | 'pausedAt' | 'retiredAt'>) => Deployment
  getDeploymentsByModel: (modelId: string) => Deployment[]
  getDeploymentsByProject: (projectId: string) => Deployment[]
  getDeployment: (id: string) => Deployment | undefined
  activateDeployment: (id: string) => void
  pauseDeployment: (id: string) => void
  retireDeployment: (id: string) => void
  getLatestMetrics: (deploymentId: string) => InferenceMetrics | undefined
  getMetricsHistory: (deploymentId: string, hours: number) => InferenceMetrics[]
  getRecentLogs: (deploymentId: string, limit?: number) => InferenceLog[]
  getActiveAlerts: (deploymentId?: string) => DriftAlert[]
}

// Flag to enable/disable mock data
const USE_MOCK_DATA = true

// Mock data for Module 8 - Deployment & Inference Monitoring
// Dummy data for UI visualization only. Observational & governance-oriented.
const mockDeployments: Deployment[] = USE_MOCK_DATA
  ? [
      {
        id: 'deployment-1',
        projectId: 'project-mock-1',
        modelId: 'model-mock-1',
        modelName: 'Sentiment Analysis BERT Model',
        modelVersion: 'v2',
        versionId: 'version-mock-1-2',
        status: 'active',
        environment: 'production',
        endpoint: 'https://api.example.com/inference/v2/sentiment-bert',
        config: {
          autoscaling: 'on',
          replicas: 3,
          timeout: '500ms',
        },
        alertThresholds: [
          {
            metric: 'error_rate',
            operator: '>',
            value: 5,
            unit: '%',
            severity: 'warning',
          },
          {
            metric: 'p99_latency',
            operator: '>',
            value: 500,
            unit: 'ms',
            severity: 'warning',
          },
        ],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        activatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        pausedAt: null,
        retiredAt: null,
      },
      {
        id: 'deployment-2',
        projectId: 'project-mock-2',
        modelId: 'model-mock-2',
        modelName: 'Image Classification Vision Transformer',
        modelVersion: 'v1',
        versionId: 'version-mock-2-1',
        status: 'paused',
        environment: 'staging',
        endpoint: 'https://api.example.com/inference/v1/vision-transformer',
        config: {
          autoscaling: 'off',
          replicas: 2,
          timeout: '1s',
        },
        alertThresholds: [
          {
            metric: 'error_rate',
            operator: '>',
            value: 3,
            unit: '%',
            severity: 'warning',
          },
          {
            metric: 'p99_latency',
            operator: '>',
            value: 1000,
            unit: 'ms',
            severity: 'warning',
          },
          {
            metric: 'p95_latency',
            operator: '>',
            value: 800,
            unit: 'ms',
            severity: 'warning',
          },
        ],
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        activatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        pausedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        retiredAt: null,
      },
    ]
  : []

// Mock inference metrics (last 24 hours, sampled hourly)
const generateMockMetrics = (deploymentId: string, hours: number = 24): InferenceMetrics[] => {
  const metrics: InferenceMetrics[] = []
  const now = Date.now()
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now - i * 60 * 60 * 1000).toISOString()
    const baseRequestCount = 1000 + Math.random() * 500
    const errorRate = 0.01 + Math.random() * 0.03 // 1-4% error rate
    const requestCount = Math.floor(baseRequestCount)
    const errorCount = Math.floor(requestCount * errorRate)
    const successCount = requestCount - errorCount
    
    metrics.push({
      deploymentId,
      timestamp,
      requestCount,
      successCount,
      errorCount,
      avgLatency: 120 + Math.random() * 80, // 120-200ms
      p95Latency: 200 + Math.random() * 100, // 200-300ms
      p99Latency: 300 + Math.random() * 150, // 300-450ms
      confidenceDistribution: {
        high: Math.floor(requestCount * (0.6 + Math.random() * 0.2)), // 60-80%
        medium: Math.floor(requestCount * (0.15 + Math.random() * 0.1)), // 15-25%
        low: Math.floor(requestCount * (0.05 + Math.random() * 0.1)), // 5-15%
      },
    })
  }
  
  return metrics
}

const initialMetrics: Record<string, InferenceMetrics[]> = USE_MOCK_DATA
  ? {
      'deployment-1': generateMockMetrics('deployment-1', 24),
      'deployment-2': generateMockMetrics('deployment-2', 24),
    }
  : {}

// Mock inference logs (last 100 entries)
const generateMockLogs = (deploymentId: string, count: number = 100): InferenceLog[] => {
  const logs: InferenceLog[] = []
  const now = Date.now()
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now - i * 60000 - Math.random() * 3600000).toISOString()
    const isError = Math.random() < 0.03 // 3% error rate
    const latency = 100 + Math.random() * 200 // 100-300ms
    
    logs.push({
      id: `log-${deploymentId}-${i}`,
      deploymentId,
      timestamp,
      modelVersion: deploymentId === 'deployment-1' ? 'v2' : 'v1',
      status: isError ? 'error' : 'success',
      latency: Math.floor(latency),
      errorMessage: isError ? 'Model prediction timeout' : undefined,
      requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
    })
  }
  
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

const initialLogs: InferenceLog[] = USE_MOCK_DATA
  ? [
      ...generateMockLogs('deployment-1', 50),
      ...generateMockLogs('deployment-2', 50),
    ]
  : []

// Mock drift alerts
const mockDriftAlerts: DriftAlert[] = USE_MOCK_DATA
  ? [
      {
        id: 'alert-1',
        deploymentId: 'deployment-1',
        type: 'data_drift',
        status: 'warning',
        severity: 'warning',
        message: 'Input feature distribution shift detected. Monitoring required.',
        detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resolvedAt: null,
      },
      {
        id: 'alert-2',
        deploymentId: 'deployment-1',
        type: 'prediction_drift',
        status: 'normal',
        severity: 'info',
        message: 'Prediction confidence distribution within expected range.',
        detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'alert-3',
        deploymentId: 'deployment-2',
        type: 'data_drift',
        status: 'normal',
        severity: 'info',
        message: 'Model performance stable. No drift detected.',
        detectedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        resolvedAt: null,
      },
    ]
  : []

export const useDeploymentStore = create<DeploymentState>()(
  persist(
    (set, get) => ({
      deployments: mockDeployments,
      inferenceMetrics: initialMetrics,
      inferenceLogs: initialLogs,
      driftAlerts: mockDriftAlerts,

      addDeployment: (deploymentData) => {
        // Project-First Enforcement: projectId is required
        if (!deploymentData.projectId) {
          throw new Error('PROJECT_CONTEXT_REQUIRED: Deployment must belong to a project')
        }

        const newDeployment: Deployment = {
          id: `deployment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...deploymentData,
          createdAt: new Date().toISOString(),
          activatedAt: null,
          pausedAt: null,
          retiredAt: null,
        }

        set((state) => ({
          deployments: [...state.deployments, newDeployment],
        }))

        return newDeployment
      },

      getDeploymentsByModel: (modelId) => {
        return get().deployments.filter((d) => d.modelId === modelId)
      },

      getDeploymentsByProject: (projectId) => {
        return get().deployments.filter((d) => d.projectId === projectId)
      },

      getDeployment: (id) => {
        return get().deployments.find((d) => d.id === id)
      },

      activateDeployment: (id) => {
        set((state) => ({
          deployments: state.deployments.map((d) =>
            d.id === id
              ? {
                  ...d,
                  status: 'active' as DeploymentStatus,
                  activatedAt: new Date().toISOString(),
                  pausedAt: null,
                }
              : d
          ),
        }))
      },

      pauseDeployment: (id) => {
        set((state) => ({
          deployments: state.deployments.map((d) =>
            d.id === id
              ? {
                  ...d,
                  status: 'paused' as DeploymentStatus,
                  pausedAt: new Date().toISOString(),
                }
              : d
          ),
        }))
      },

      retireDeployment: (id) => {
        set((state) => ({
          deployments: state.deployments.map((d) =>
            d.id === id
              ? {
                  ...d,
                  status: 'retired' as DeploymentStatus,
                  retiredAt: new Date().toISOString(),
                }
              : d
          ),
        }))
      },

      getLatestMetrics: (deploymentId) => {
        const metrics = get().inferenceMetrics[deploymentId]
        if (!metrics || metrics.length === 0) return undefined
        return metrics[metrics.length - 1]
      },

      getMetricsHistory: (deploymentId, hours) => {
        const metrics = get().inferenceMetrics[deploymentId] || []
        const cutoffTime = Date.now() - hours * 60 * 60 * 1000
        return metrics.filter((m) => new Date(m.timestamp).getTime() >= cutoffTime)
      },

      getRecentLogs: (deploymentId, limit = 100) => {
        const logs = get().inferenceLogs.filter((log) => log.deploymentId === deploymentId)
        return logs.slice(0, limit)
      },

      getActiveAlerts: (deploymentId) => {
        const alerts = get().driftAlerts
        const filtered = deploymentId
          ? alerts.filter((a) => a.deploymentId === deploymentId)
          : alerts
        return filtered.filter((a) => a.status !== 'normal' || a.resolvedAt === null)
      },
    }),
    {
      name: 'deployment-storage',
    }
  )
)
