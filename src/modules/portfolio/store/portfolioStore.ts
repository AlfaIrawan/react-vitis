import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useModelStore } from '../../models/store/modelStore'
import { useDeploymentStore } from '../../deployment/store/deploymentStore'
import { useFeedbackStore } from '../../feedback/store/feedbackStore'
import { useGovernanceStore } from '../../governance/store/governanceStore'

export type BusinessDomain = 'fraud_detection' | 'customer_service' | 'recommendation' | 'sentiment_analysis' | 'risk_assessment' | 'other'
export type Environment = 'production' | 'staging' | 'retired'
export type RiskLevel = 'low' | 'medium' | 'high'
export type KPICategory = 'fraud_reduction' | 'sla_improvement' | 'cost_reduction' | 'revenue_increase' | 'accuracy_improvement' | 'other'
export type KPIStatus = 'on_track' | 'at_risk' | 'unknown'
export type AdoptionSignal = 'low' | 'medium' | 'high'
export type UsageTrend = 'increasing' | 'stable' | 'decreasing'
export type CostTier = 'low' | 'medium' | 'high'
export type LifecycleRecommendationType = 'scale' | 'retrain' | 'freeze' | 'retire' | 'review'
export type AIHealthStatus = 'healthy' | 'attention_required' | 'critical'

export interface BusinessObjective {
  category: KPICategory
  targetKPI: string // Qualitative or quantitative
  currentKPIStatus: KPIStatus
  adoptionSignal: AdoptionSignal
  usageTrend: UsageTrend
  estimatedCostTier: CostTier
}

export interface PortfolioModel {
  id: string
  name: string
  businessDomain: BusinessDomain
  useCase: string
  businessOwner: string
  environment: Environment
  riskLevel: RiskLevel
  lastActivityDate: string
  
  // Value realization
  businessObjective?: BusinessObjective
  
  // Risk signals (aggregated)
  driftAlertsCount: number
  feedbackQualityScore: number // 0-100, based on % incorrect feedback
  governanceComplianceStatus: 'compliant' | 'partial' | 'non_compliant'
  operationalStability: {
    errorRate: number // percentage
    avgLatency: number // milliseconds
    status: 'stable' | 'degraded' | 'critical'
  }
  
  // Lifecycle insights
  recommendations: LifecycleRecommendation[]
  
  // Metadata
  modelId: string
  modelVersion: string
  deploymentId?: string
}

export interface LifecycleRecommendation {
  type: LifecycleRecommendationType
  priority: 'high' | 'medium' | 'low'
  reason: string
  evidence: string[]
}

export interface ExecutiveSummary {
  totalModels: number
  modelsByEnvironment: Record<Environment, number>
  topHighValueModels: PortfolioModel[]
  topHighRiskModels: PortfolioModel[]
  modelsNeedingDecision: PortfolioModel[]
  overallAIHealthStatus: AIHealthStatus
  lastUpdated: string
}

interface PortfolioState {
  // Computed portfolio data
  getPortfolioModels: () => PortfolioModel[]
  getPortfolioModel: (id: string) => PortfolioModel | undefined
  getFilteredPortfolioModels: (filters: {
    domain?: BusinessDomain
    environment?: Environment
    riskLevel?: RiskLevel
    businessOwner?: string
  }) => PortfolioModel[]
  
  // Value realization
  getValueRealizationMetrics: () => {
    totalModels: number
    onTrackKPIs: number
    atRiskKPIs: number
    highAdoptionModels: number
    highCostModels: number
  }
  
  // Risk aggregation
  getRiskHeatmap: () => {
    highRisk: number
    mediumRisk: number
    lowRisk: number
    modelsRequiringAttention: PortfolioModel[]
  }
  
  // Lifecycle insights
  getLifecycleRecommendations: () => {
    scale: PortfolioModel[]
    retrain: PortfolioModel[]
    freeze: PortfolioModel[]
    retire: PortfolioModel[]
    review: PortfolioModel[]
  }
  
  // Executive summary
  getExecutiveSummary: () => ExecutiveSummary
}

// Helper to compute risk level from aggregated signals
function computeRiskLevel(
  driftAlertsCount: number,
  feedbackQualityScore: number,
  complianceStatus: 'compliant' | 'partial' | 'non_compliant',
  operationalStability: { errorRate: number; avgLatency: number; status: 'stable' | 'degraded' | 'critical' }
): RiskLevel {
  let riskScore = 0
  
  // Drift alerts (0-3 points)
  if (driftAlertsCount > 5) riskScore += 3
  else if (driftAlertsCount > 2) riskScore += 2
  else if (driftAlertsCount > 0) riskScore += 1
  
  // Feedback quality (0-2 points)
  if (feedbackQualityScore < 50) riskScore += 2
  else if (feedbackQualityScore < 70) riskScore += 1
  
  // Compliance (0-2 points)
  if (complianceStatus === 'non_compliant') riskScore += 2
  else if (complianceStatus === 'partial') riskScore += 1
  
  // Operational stability (0-3 points)
  if (operationalStability.status === 'critical') riskScore += 3
  else if (operationalStability.status === 'degraded') riskScore += 2
  else if (operationalStability.errorRate > 5) riskScore += 1
  
  if (riskScore >= 6) return 'high'
  if (riskScore >= 3) return 'medium'
  return 'low'
}

// Helper to compute feedback quality score
function computeFeedbackQualityScore(modelName: string, modelVersion: string): number {
  const feedbackStore = useFeedbackStore.getState()
  const feedbacks = feedbackStore.getFeedbacksByModel(modelName)
  const versionFeedbacks = feedbacks.filter(f => f.modelVersion === modelVersion)
  
  if (versionFeedbacks.length === 0) return 100 // No feedback = assume good
  
  const incorrectCount = versionFeedbacks.filter(f => f.feedbackType === 'incorrect').length
  const qualityScore = ((versionFeedbacks.length - incorrectCount) / versionFeedbacks.length) * 100
  return Math.round(qualityScore)
}

// Helper to compute operational stability
function computeOperationalStability(deploymentId: string): {
  errorRate: number
  avgLatency: number
  status: 'stable' | 'degraded' | 'critical'
} {
  const deploymentStore = useDeploymentStore.getState()
  const metrics = deploymentStore.getMetricsHistory(deploymentId, 24)
  
  if (metrics.length === 0) {
    return { errorRate: 0, avgLatency: 0, status: 'stable' }
  }
  
  const latest = metrics[metrics.length - 1]
  const errorRate = latest.requestCount > 0 
    ? (latest.errorCount / latest.requestCount) * 100 
    : 0
  const avgLatency = latest.avgLatency
  
  let status: 'stable' | 'degraded' | 'critical' = 'stable'
  if (errorRate > 10 || avgLatency > 1000) status = 'critical'
  else if (errorRate > 5 || avgLatency > 500) status = 'degraded'
  
  return { errorRate, avgLatency, status }
}

// Helper to generate lifecycle recommendations
function generateLifecycleRecommendations(model: PortfolioModel): LifecycleRecommendation[] {
  const recommendations: LifecycleRecommendation[] = []
  
  // High cost, low adoption → review
  if (model.businessObjective?.estimatedCostTier === 'high' && 
      model.businessObjective?.adoptionSignal === 'low') {
    recommendations.push({
      type: 'review',
      priority: 'high',
      reason: 'High cost with low adoption suggests business relevance review needed',
      evidence: [
        `Cost tier: ${model.businessObjective.estimatedCostTier}`,
        `Adoption: ${model.businessObjective.adoptionSignal}`
      ]
    })
  }
  
  // Frequent drift alerts → retrain
  if (model.driftAlertsCount > 3) {
    recommendations.push({
      type: 'retrain',
      priority: 'high',
      reason: 'Frequent drift alerts indicate model performance degradation',
      evidence: [
        `${model.driftAlertsCount} drift alerts detected`,
        `Risk level: ${model.riskLevel}`
      ]
    })
  }
  
  // Idle > 90 days → retire
  const daysSinceActivity = (Date.now() - new Date(model.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceActivity > 90 && model.environment !== 'retired') {
    recommendations.push({
      type: 'retire',
      priority: 'medium',
      reason: 'No activity for over 90 days suggests retirement candidate',
      evidence: [
        `Last activity: ${Math.round(daysSinceActivity)} days ago`,
        `Environment: ${model.environment}`
      ]
    })
  }
  
  // Stable + high adoption → scale
  if (model.businessObjective?.usageTrend === 'stable' && 
      model.businessObjective?.adoptionSignal === 'high' &&
      model.operationalStability.status === 'stable') {
    recommendations.push({
      type: 'scale',
      priority: 'medium',
      reason: 'Stable performance with high adoption suggests scaling opportunity',
      evidence: [
        `Adoption: ${model.businessObjective.adoptionSignal}`,
        `Usage trend: ${model.businessObjective.usageTrend}`,
        `Operational status: ${model.operationalStability.status}`
      ]
    })
  }
  
  // High risk → freeze
  if (model.riskLevel === 'high' && model.environment === 'production') {
    recommendations.push({
      type: 'freeze',
      priority: 'high',
      reason: 'High risk model in production requires immediate attention',
      evidence: [
        `Risk level: ${model.riskLevel}`,
        `Drift alerts: ${model.driftAlertsCount}`,
        `Compliance: ${model.governanceComplianceStatus}`
      ]
    })
  }
  
  return recommendations
}

// Helper to infer business domain from model name/type
function inferBusinessDomain(modelName: string, taskType: string): BusinessDomain {
  const name = modelName.toLowerCase()
  const type = taskType.toLowerCase()
  
  if (name.includes('fraud') || name.includes('fraud detection')) return 'fraud_detection'
  if (name.includes('customer') || name.includes('service') || name.includes('support')) return 'customer_service'
  if (name.includes('recommend') || name.includes('recommendation')) return 'recommendation'
  if (name.includes('sentiment') || name.includes('nlp') || type === 'nlp') return 'sentiment_analysis'
  if (name.includes('risk') || name.includes('assessment')) return 'risk_assessment'
  return 'other'
}

// Mock business objectives (in real app, this would come from external system)
const mockBusinessObjectives: Record<string, BusinessObjective> = {
  'model-mock-1': {
    category: 'fraud_reduction',
    targetKPI: 'Reduce fraud incidents by 30%',
    currentKPIStatus: 'on_track',
    adoptionSignal: 'high',
    usageTrend: 'stable',
    estimatedCostTier: 'medium'
  },
  'model-mock-2': {
    category: 'sla_improvement',
    targetKPI: 'Improve response time by 25%',
    currentKPIStatus: 'on_track',
    adoptionSignal: 'medium',
    usageTrend: 'increasing',
    estimatedCostTier: 'low'
  },
  'model-mock-3': {
    category: 'cost_reduction',
    targetKPI: 'Reduce operational costs by 15%',
    currentKPIStatus: 'at_risk',
    adoptionSignal: 'low',
    usageTrend: 'decreasing',
    estimatedCostTier: 'high'
  }
}

// Mock business owners (in real app, this would come from external system)
const mockBusinessOwners: Record<string, string> = {
  'model-mock-1': 'Risk Management Team',
  'model-mock-2': 'Customer Service Department',
  'model-mock-3': 'Operations Team'
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      getPortfolioModels: () => {
        const modelStore = useModelStore.getState()
        const deploymentStore = useDeploymentStore.getState()
        const governanceStore = useGovernanceStore.getState()
        
        const models = modelStore.models
        const deployments = deploymentStore.deployments
        const driftAlerts = deploymentStore.driftAlerts
        
        return models
          .map((model): PortfolioModel | null => {
            const currentVersion = model.versions.find(v => v.id === model.currentVersionId || v.status === 'active')
            if (!currentVersion) {
              // Skip models without active version
              return null
            }
          
          // Find deployment for this model
          const deployment = deployments.find(d => d.modelId === model.id)
          const deploymentId = deployment?.id
          
          // Aggregate drift alerts
          const modelDriftAlerts = deploymentId 
            ? driftAlerts.filter(a => a.deploymentId === deploymentId && a.status !== 'normal')
            : []
          
          // Compute feedback quality
          const feedbackQualityScore = computeFeedbackQualityScore(model.name, currentVersion.version)
          
          // Get governance compliance
          const modelGovernance = governanceStore.getModelGovernance(model.id)
          const complianceStatus = modelGovernance 
            ? (governanceStore.getComplianceForModel(model.id)?.overallStatus || 'non_compliant')
            : 'non_compliant'
          
          // Compute operational stability
          const operationalStability = deploymentId 
            ? computeOperationalStability(deploymentId)
            : { errorRate: 0, avgLatency: 0, status: 'stable' as const }
          
          // Compute risk level
          const riskLevel = computeRiskLevel(
            modelDriftAlerts.length,
            feedbackQualityScore,
            complianceStatus,
            operationalStability
          )
          
          // Get business objective (mock for now)
          const businessObjective = mockBusinessObjectives[model.id]
          const businessOwner = mockBusinessOwners[model.id] || 'Unknown'
          
          // Determine environment from deployment or model status
          let environment: Environment = 'staging'
          if (deployment) {
            environment = deployment.environment === 'production' ? 'production' : 
                         deployment.environment === 'staging' ? 'staging' : 'staging'
          } else if (model.status === 'archived') {
            environment = 'retired'
          } else if (model.status === 'production') {
            environment = 'production'
          }
          
          // Last activity date (from deployment or model update)
          const lastActivityDate = deployment?.activatedAt || model.updatedAt || model.createdAt
          
          const portfolioModel: PortfolioModel = {
            id: `portfolio-${model.id}`,
            name: model.name,
            businessDomain: inferBusinessDomain(model.name, model.taskType),
            useCase: `${model.taskType} - ${model.projectName}`,
            businessOwner,
            environment,
            riskLevel,
            lastActivityDate,
            businessObjective,
            driftAlertsCount: modelDriftAlerts.length,
            feedbackQualityScore,
            governanceComplianceStatus: complianceStatus,
            operationalStability,
            recommendations: [],
            modelId: model.id,
            modelVersion: currentVersion.version,
            deploymentId
          }
          
          // Generate lifecycle recommendations
          portfolioModel.recommendations = generateLifecycleRecommendations(portfolioModel)
          
          return portfolioModel
        }).filter((m): m is PortfolioModel => m !== null)
      },
      
      getPortfolioModel: (id) => {
        const models = get().getPortfolioModels()
        return models.find(m => m.id === id)
      },
      
      getFilteredPortfolioModels: (filters) => {
        const models = get().getPortfolioModels()
        return models.filter(model => {
          if (filters.domain && model.businessDomain !== filters.domain) return false
          if (filters.environment && model.environment !== filters.environment) return false
          if (filters.riskLevel && model.riskLevel !== filters.riskLevel) return false
          if (filters.businessOwner && model.businessOwner !== filters.businessOwner) return false
          return true
        })
      },
      
      getValueRealizationMetrics: () => {
        const models = get().getPortfolioModels()
        const onTrackKPIs = models.filter(m => m.businessObjective?.currentKPIStatus === 'on_track').length
        const atRiskKPIs = models.filter(m => m.businessObjective?.currentKPIStatus === 'at_risk').length
        const highAdoptionModels = models.filter(m => m.businessObjective?.adoptionSignal === 'high').length
        const highCostModels = models.filter(m => m.businessObjective?.estimatedCostTier === 'high').length
        
        return {
          totalModels: models.length,
          onTrackKPIs,
          atRiskKPIs,
          highAdoptionModels,
          highCostModels
        }
      },
      
      getRiskHeatmap: () => {
        const models = get().getPortfolioModels()
        const highRisk = models.filter(m => m.riskLevel === 'high').length
        const mediumRisk = models.filter(m => m.riskLevel === 'medium').length
        const lowRisk = models.filter(m => m.riskLevel === 'low').length
        const modelsRequiringAttention = models.filter(m => 
          m.riskLevel === 'high' || 
          m.driftAlertsCount > 3 || 
          m.operationalStability.status === 'critical' ||
          m.governanceComplianceStatus === 'non_compliant'
        )
        
        return {
          highRisk,
          mediumRisk,
          lowRisk,
          modelsRequiringAttention
        }
      },
      
      getLifecycleRecommendations: () => {
        const models = get().getPortfolioModels()
        return {
          scale: models.filter(m => m.recommendations.some(r => r.type === 'scale')),
          retrain: models.filter(m => m.recommendations.some(r => r.type === 'retrain')),
          freeze: models.filter(m => m.recommendations.some(r => r.type === 'freeze')),
          retire: models.filter(m => m.recommendations.some(r => r.type === 'retire')),
          review: models.filter(m => m.recommendations.some(r => r.type === 'review'))
        }
      },
      
      getExecutiveSummary: () => {
        const models = get().getPortfolioModels()
        const modelsByEnvironment: Record<Environment, number> = {
          production: models.filter(m => m.environment === 'production').length,
          staging: models.filter(m => m.environment === 'staging').length,
          retired: models.filter(m => m.environment === 'retired').length
        }
        
        // Top 5 high-value models (high adoption + on track KPI)
        const topHighValueModels = models
          .filter(m => m.businessObjective?.adoptionSignal === 'high' && 
                      m.businessObjective?.currentKPIStatus === 'on_track')
          .slice(0, 5)
        
        // Top 3 high-risk models
        const topHighRiskModels = models
          .filter(m => m.riskLevel === 'high')
          .slice(0, 3)
        
        // Models needing decision (have high-priority recommendations)
        const modelsNeedingDecision = models
          .filter(m => m.recommendations.some(r => r.priority === 'high'))
          .slice(0, 10)
        
        // Overall AI health status
        const riskHeatmap = get().getRiskHeatmap()
        let overallAIHealthStatus: AIHealthStatus = 'healthy'
        if (riskHeatmap.highRisk > models.length * 0.2 || riskHeatmap.modelsRequiringAttention.length > models.length * 0.3) {
          overallAIHealthStatus = 'critical'
        } else if (riskHeatmap.highRisk > 0 || riskHeatmap.modelsRequiringAttention.length > 0) {
          overallAIHealthStatus = 'attention_required'
        }
        
        return {
          totalModels: models.length,
          modelsByEnvironment,
          topHighValueModels,
          topHighRiskModels,
          modelsNeedingDecision,
          overallAIHealthStatus,
          lastUpdated: new Date().toISOString()
        }
      }
    }),
    {
      name: 'portfolio-storage',
    }
  )
)
