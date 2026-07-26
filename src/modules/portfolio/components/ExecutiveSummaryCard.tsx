import { Package, TrendingUp, AlertTriangle, FileText, Download } from 'lucide-react'
import { usePortfolioStore } from '../store/portfolioStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AIHealthStatus } from '../store/portfolioStore'

interface ExecutiveSummaryCardProps {
  onExportPDF?: () => void
  onExportCSV?: () => void
}

export function ExecutiveSummaryCard({ onExportPDF, onExportCSV }: ExecutiveSummaryCardProps) {
  const { getExecutiveSummary } = usePortfolioStore()
  const summary = getExecutiveSummary()
  
  const getHealthStatusColor = (status: AIHealthStatus) => {
    switch (status) {
      case 'healthy': return 'text-green-500 bg-green-500/10 border-green-500/30'
      case 'attention_required': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30'
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Executive Summary</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>
        </div>
      </div>
      
      {/* Overall Health Status */}
      <div className={cn(
        'p-4 rounded-lg border mb-4',
        getHealthStatusColor(summary.overallAIHealthStatus)
      )}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium mb-1">Overall AI Health Status</div>
            <div className="text-2xl font-bold capitalize">
              {summary.overallAIHealthStatus.replace('_', ' ')}
            </div>
          </div>
          <Package className="w-8 h-8 opacity-50" />
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="glass-panel p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Total Models</div>
          <div className="text-2xl font-bold text-foreground">{summary.totalModels}</div>
        </div>
        
        <div className="glass-panel p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Production</div>
          <div className="text-2xl font-bold text-foreground">
            {summary.modelsByEnvironment.production}
          </div>
        </div>
        
        <div className="glass-panel p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Staging</div>
          <div className="text-2xl font-bold text-foreground">
            {summary.modelsByEnvironment.staging}
          </div>
        </div>
        
        <div className="glass-panel p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Retired</div>
          <div className="text-2xl font-bold text-foreground">
            {summary.modelsByEnvironment.retired}
          </div>
        </div>
      </div>
      
      {/* Top Models */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="glass-panel p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-foreground">Top High-Value Models</h3>
          </div>
          <div className="space-y-2">
            {summary.topHighValueModels.length > 0 ? (
              summary.topHighValueModels.map((model, idx) => (
                <div key={model.id} className="text-sm">
                  <span className="text-muted-foreground">{idx + 1}.</span>{' '}
                  <span className="text-foreground font-medium">{model.name}</span>
                  <span className="text-muted-foreground ml-2">
                    ({model.businessDomain.replace('_', ' ')})
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No high-value models identified</div>
            )}
          </div>
        </div>
        
        <div className="glass-panel p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-foreground">Top High-Risk Models</h3>
          </div>
          <div className="space-y-2">
            {summary.topHighRiskModels.length > 0 ? (
              summary.topHighRiskModels.map((model, idx) => (
                <div key={model.id} className="text-sm">
                  <span className="text-muted-foreground">{idx + 1}.</span>{' '}
                  <span className="text-foreground font-medium">{model.name}</span>
                  <span className="text-red-500 ml-2">
                    ({model.driftAlertsCount} alerts)
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No high-risk models identified</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Models Needing Decision */}
      {summary.modelsNeedingDecision.length > 0 && (
        <div className="glass-panel p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-foreground">
              Models Needing Decision ({summary.modelsNeedingDecision.length})
            </h3>
          </div>
          <div className="space-y-2">
            {summary.modelsNeedingDecision.map((model) => {
              const highPriorityRec = model.recommendations.find(r => r.priority === 'high')
              return (
                <div key={model.id} className="text-sm">
                  <span className="text-foreground font-medium">{model.name}</span>
                  {highPriorityRec && (
                    <span className="text-muted-foreground ml-2">
                      → {highPriorityRec.type} ({highPriorityRec.reason})
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Last Updated */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        Last updated: {formatDate(summary.lastUpdated)}
      </div>
    </div>
  )
}
