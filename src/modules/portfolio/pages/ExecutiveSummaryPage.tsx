import { ExecutiveSummaryCard } from '../components/ExecutiveSummaryCard'
import { usePortfolioStore } from '../store/portfolioStore'

export function ExecutiveSummaryPage() {
  const { getExecutiveSummary } = usePortfolioStore()
  const summary = getExecutiveSummary()
  
  const handleExportPDF = () => {
    // In a real implementation, this would call an API to generate PDF
    // For now, we'll create a simple text-based export
    const content = generatePDFContent(summary)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-portfolio-executive-summary-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  const handleExportCSV = () => {
    const { getPortfolioModels } = usePortfolioStore.getState()
    const models = getPortfolioModels()
    
    // Generate CSV content
    const headers = [
      'Model Name',
      'Business Domain',
      'Use Case',
      'Business Owner',
      'Environment',
      'Risk Level',
      'KPI Status',
      'Adoption',
      'Cost Tier',
      'Drift Alerts',
      'Last Activity'
    ]
    
    const rows = models.map(model => [
      model.name,
      model.businessDomain.replace('_', ' '),
      model.useCase,
      model.businessOwner,
      model.environment,
      model.riskLevel,
      model.businessObjective?.currentKPIStatus || 'unknown',
      model.businessObjective?.adoptionSignal || 'unknown',
      model.businessObjective?.estimatedCostTier || 'unknown',
      model.driftAlertsCount.toString(),
      new Date(model.lastActivityDate).toLocaleDateString()
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-portfolio-summary-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Executive Summary</h1>
        <p className="text-muted-foreground">
          Board-ready snapshot of AI portfolio health, value, and risk
        </p>
      </div>
      
      {/* Executive Summary Card */}
      <ExecutiveSummaryCard
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
      />
    </div>
  )
}

function generatePDFContent(summary: ReturnType<typeof usePortfolioStore.getState>['getExecutiveSummary']): string {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return `
AI PORTFOLIO & VALUE MANAGEMENT
Executive Summary Report
Generated: ${formatDate(summary.lastUpdated)}

═══════════════════════════════════════════════════════════════

OVERALL AI HEALTH STATUS: ${summary.overallAIHealthStatus.toUpperCase().replace('_', ' ')}

═══════════════════════════════════════════════════════════════

PORTFOLIO OVERVIEW
───────────────────────────────────────────────────────────────
Total Models: ${summary.totalModels}
  • Production: ${summary.modelsByEnvironment.production}
  • Staging: ${summary.modelsByEnvironment.staging}
  • Retired: ${summary.modelsByEnvironment.retired}

═══════════════════════════════════════════════════════════════

TOP 5 HIGH-VALUE MODELS
───────────────────────────────────────────────────────────────
${summary.topHighValueModels.length > 0
  ? summary.topHighValueModels.map((model, idx) => 
      `${idx + 1}. ${model.name} (${model.businessDomain.replace('_', ' ')})\n   Owner: ${model.businessOwner}\n   KPI Status: ${model.businessObjective?.currentKPIStatus || 'unknown'}\n   Adoption: ${model.businessObjective?.adoptionSignal || 'unknown'}`
    ).join('\n\n')
  : 'No high-value models identified'}

═══════════════════════════════════════════════════════════════

TOP 3 HIGH-RISK MODELS
───────────────────────────────────────────────────────────────
${summary.topHighRiskModels.length > 0
  ? summary.topHighRiskModels.map((model, idx) => 
      `${idx + 1}. ${model.name}\n   Drift Alerts: ${model.driftAlertsCount}\n   Compliance: ${model.governanceComplianceStatus}\n   Operational Status: ${model.operationalStability.status}`
    ).join('\n\n')
  : 'No high-risk models identified'}

═══════════════════════════════════════════════════════════════

MODELS NEEDING DECISION
───────────────────────────────────────────────────────────────
${summary.modelsNeedingDecision.length > 0
  ? summary.modelsNeedingDecision.map((model) => {
      const highPriorityRec = model.recommendations.find(r => r.priority === 'high')
      return `${model.name}\n  Recommendation: ${highPriorityRec?.type || 'review'}\n  Reason: ${highPriorityRec?.reason || 'Review required'}`
    }).join('\n\n')
  : 'No models requiring immediate decision'}

═══════════════════════════════════════════════════════════════

This is a read-only strategic oversight report.
No operational actions are performed from this module.

═══════════════════════════════════════════════════════════════
`.trim()
}
