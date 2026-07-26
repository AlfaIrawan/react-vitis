import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PolicyScope = 'model' | 'deployment' | 'organization'
export type PolicyCategory = 'data_usage' | 'bias' | 'explainability' | 'monitoring' | 'retention'
export type PolicyStatus = 'active' | 'deprecated'
export type RiskLevel = 'low' | 'medium' | 'high'
export type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant'

export interface Policy {
  id: string
  name: string
  scope: PolicyScope
  category: PolicyCategory
  status: PolicyStatus
  effectiveDate: string
  owner: string
  description?: string
}

export interface ModelGovernance {
  modelId: string
  modelName: string
  version: string
  environment: 'production' | 'staging' | 'development'
  policiesApplied: string[] // Policy IDs
  riskLevel: RiskLevel
}

export interface AuditTrailEntry {
  id: string
  modelId: string
  modelName: string
  versionId: string
  version: string
  runId: string | null
  runName: string | null
  deploymentId: string | null
  deploymentEndpoint: string | null
  feedbackIds: string[]
  timestamp: string
  snapshot: {
    modelStatus: string
    deploymentStatus: string | null
    policies: string[]
  }
}

export interface ComplianceReadiness {
  modelId: string
  modelName: string
  version: string
  checks: {
    modelDocumentationAvailable: boolean
    trainingLineageRecorded: boolean
    deploymentMonitored: boolean
    feedbackTraceable: boolean
    policiesAttached: boolean
  }
  overallStatus: ComplianceStatus
}

interface GovernanceState {
  // Read-only data
  policies: Policy[]
  modelGovernance: ModelGovernance[]
  auditTrail: AuditTrailEntry[]
  complianceReadiness: ComplianceReadiness[]
  
  // Computed getters (read-only)
  getTotalModelsGoverned: () => number
  getActiveDeploymentsCovered: () => number
  getPoliciesApplied: () => number
  getLastAuditSnapshot: () => string | null
  getComplianceStatus: () => ComplianceStatus
  getPolicy: (id: string) => Policy | undefined
  getModelGovernance: (modelId: string) => ModelGovernance | undefined
  getAuditTrailForModel: (modelId: string) => AuditTrailEntry[]
  getComplianceForModel: (modelId: string) => ComplianceReadiness | undefined
}

// Flag to enable/disable mock data
const USE_MOCK_DATA = true

// Mock policies (read-only)
const mockPolicies: Policy[] = USE_MOCK_DATA
  ? [
      {
        id: 'policy-1',
        name: 'Data Usage Policy - PII Protection',
        scope: 'organization',
        category: 'data_usage',
        status: 'active',
        effectiveDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'Data Governance Team',
        description: 'Ensures all models comply with PII protection requirements',
      },
      {
        id: 'policy-2',
        name: 'Bias Detection & Mitigation',
        scope: 'model',
        category: 'bias',
        status: 'active',
        effectiveDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'AI Ethics Committee',
        description: 'Requires bias testing and mitigation strategies for all models',
      },
      {
        id: 'policy-3',
        name: 'Model Explainability Standard',
        scope: 'model',
        category: 'explainability',
        status: 'active',
        effectiveDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'ML Engineering',
        description: 'All production models must provide explainability features',
      },
      {
        id: 'policy-4',
        name: 'Continuous Monitoring Requirement',
        scope: 'deployment',
        category: 'monitoring',
        status: 'active',
        effectiveDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'DevOps Team',
        description: 'All deployments must have active monitoring and alerting',
      },
      {
        id: 'policy-5',
        name: 'Model Retention Policy',
        scope: 'organization',
        category: 'retention',
        status: 'active',
        effectiveDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'Data Governance Team',
        description: 'Defines retention periods for models and training artifacts',
      },
      {
        id: 'policy-6',
        name: 'Legacy Bias Policy (Deprecated)',
        scope: 'model',
        category: 'bias',
        status: 'deprecated',
        effectiveDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'AI Ethics Committee',
        description: 'Replaced by policy-2',
      },
    ]
  : []

// Mock model governance coverage
const mockModelGovernance: ModelGovernance[] = USE_MOCK_DATA
  ? [
      {
        modelId: 'model-mock-1',
        modelName: 'Sentiment Analysis BERT Model',
        version: 'v2',
        environment: 'production',
        policiesApplied: ['policy-1', 'policy-2', 'policy-3', 'policy-4'],
        riskLevel: 'low',
      },
      {
        modelId: 'model-mock-2',
        modelName: 'Image Classification Vision Transformer',
        version: 'v1',
        environment: 'staging',
        policiesApplied: ['policy-1', 'policy-2', 'policy-3'],
        riskLevel: 'medium',
      },
    ]
  : []

// Mock audit trail
const mockAuditTrail: AuditTrailEntry[] = USE_MOCK_DATA
  ? [
      {
        id: 'audit-1',
        modelId: 'model-mock-1',
        modelName: 'Sentiment Analysis BERT Model',
        versionId: 'version-mock-1-2',
        version: 'v2',
        runId: 'run-mock-1',
        runName: 'Sentiment Training Run v2',
        deploymentId: 'deployment-1',
        deploymentEndpoint: 'https://api.example.com/inference/v2/sentiment-bert',
        feedbackIds: ['feedback-1', 'feedback-2'],
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        snapshot: {
          modelStatus: 'production',
          deploymentStatus: 'active',
          policies: ['policy-1', 'policy-2', 'policy-3', 'policy-4'],
        },
      },
      {
        id: 'audit-2',
        modelId: 'model-mock-2',
        modelName: 'Image Classification Vision Transformer',
        versionId: 'version-mock-2-1',
        version: 'v1',
        runId: 'run-mock-2',
        runName: 'Vision Transformer Training',
        deploymentId: 'deployment-2',
        deploymentEndpoint: 'https://api.example.com/inference/v1/vision-transformer',
        feedbackIds: ['feedback-3'],
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        snapshot: {
          modelStatus: 'staging',
          deploymentStatus: 'paused',
          policies: ['policy-1', 'policy-2', 'policy-3'],
        },
      },
    ]
  : []

// Mock compliance readiness
const mockComplianceReadiness: ComplianceReadiness[] = USE_MOCK_DATA
  ? [
      {
        modelId: 'model-mock-1',
        modelName: 'Sentiment Analysis BERT Model',
        version: 'v2',
        checks: {
          modelDocumentationAvailable: true,
          trainingLineageRecorded: true,
          deploymentMonitored: true,
          feedbackTraceable: true,
          policiesAttached: true,
        },
        overallStatus: 'compliant',
      },
      {
        modelId: 'model-mock-2',
        modelName: 'Image Classification Vision Transformer',
        version: 'v1',
        checks: {
          modelDocumentationAvailable: true,
          trainingLineageRecorded: true,
          deploymentMonitored: false,
          feedbackTraceable: true,
          policiesAttached: true,
        },
        overallStatus: 'partial',
      },
    ]
  : []

export const useGovernanceStore = create<GovernanceState>()(
  persist(
    (set, get) => ({
      policies: mockPolicies,
      modelGovernance: mockModelGovernance,
      auditTrail: mockAuditTrail,
      complianceReadiness: mockComplianceReadiness,

      // Read-only getters
      getTotalModelsGoverned: () => {
        return get().modelGovernance.length
      },

      getActiveDeploymentsCovered: () => {
        return get().modelGovernance.filter((mg) => mg.environment === 'production').length
      },

      getPoliciesApplied: () => {
        const uniquePolicies = new Set<string>()
        get().modelGovernance.forEach((mg) => {
          mg.policiesApplied.forEach((pid) => uniquePolicies.add(pid))
        })
        return uniquePolicies.size
      },

      getLastAuditSnapshot: () => {
        const trail = get().auditTrail
        if (trail.length === 0) return null
        const sorted = [...trail].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        return sorted[0].timestamp
      },

      getComplianceStatus: () => {
        const readiness = get().complianceReadiness
        if (readiness.length === 0) return 'non_compliant'
        const allCompliant = readiness.every((r) => r.overallStatus === 'compliant')
        const anyCompliant = readiness.some((r) => r.overallStatus === 'compliant')
        if (allCompliant) return 'compliant'
        if (anyCompliant) return 'partial'
        return 'non_compliant'
      },

      getPolicy: (id) => {
        return get().policies.find((p) => p.id === id)
      },

      getModelGovernance: (modelId) => {
        return get().modelGovernance.find((mg) => mg.modelId === modelId)
      },

      getAuditTrailForModel: (modelId) => {
        return get().auditTrail.filter((entry) => entry.modelId === modelId)
      },

      getComplianceForModel: (modelId) => {
        return get().complianceReadiness.find((c) => c.modelId === modelId)
      },
    }),
    {
      name: 'governance-storage',
    }
  )
)
