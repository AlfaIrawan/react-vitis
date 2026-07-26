// Module 11: AI Portfolio & Value Management
// This module provides strategic oversight for executives, AI CoE, Enterprise Architecture, and Governance stakeholders.
// Read-only, insight-driven, and non-operational.

export { PortfolioOverviewPage } from './pages/PortfolioOverviewPage'
export { ExecutiveSummaryPage } from './pages/ExecutiveSummaryPage'
export { usePortfolioStore } from './store/portfolioStore'
export type {
  PortfolioModel,
  BusinessDomain,
  Environment,
  RiskLevel,
  KPICategory,
  KPIStatus,
  AdoptionSignal,
  UsageTrend,
  CostTier,
  LifecycleRecommendationType,
  AIHealthStatus,
  ExecutiveSummary
} from './store/portfolioStore'
