import { AlertTriangle, Shield, CheckCircle } from 'lucide-react'
import { usePortfolioStore } from '../store/portfolioStore'
import { PortfolioModelCard } from './PortfolioModelCard'
import { cn } from '@/lib/utils'

export function RiskHeatmap() {
  const { getRiskHeatmap } = usePortfolioStore()
  const heatmap = getRiskHeatmap()
  
  const total = heatmap.highRisk + heatmap.mediumRisk + heatmap.lowRisk
  const highRiskPercent = total > 0 ? (heatmap.highRisk / total) * 100 : 0
  const mediumRiskPercent = total > 0 ? (heatmap.mediumRisk / total) * 100 : 0
  const lowRiskPercent = total > 0 ? (heatmap.lowRisk / total) * 100 : 0
  
  return (
    <div className="glass-card p-6 rounded-xl">
      <h2 className="text-lg font-semibold text-foreground mb-4">AI Risk Heatmap</h2>
      
      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-4 rounded-lg border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-2xl font-bold text-red-500">{heatmap.highRisk}</span>
          </div>
          <div className="text-sm text-muted-foreground">High Risk</div>
          <div className="mt-2 h-2 bg-red-500/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all"
              style={{ width: `${highRiskPercent}%` }}
            />
          </div>
        </div>
        
        <div className="glass-panel p-4 rounded-lg border border-yellow-500/30">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-bold text-yellow-500">{heatmap.mediumRisk}</span>
          </div>
          <div className="text-sm text-muted-foreground">Medium Risk</div>
          <div className="mt-2 h-2 bg-yellow-500/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 rounded-full transition-all"
              style={{ width: `${mediumRiskPercent}%` }}
            />
          </div>
        </div>
        
        <div className="glass-panel p-4 rounded-lg border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold text-green-500">{heatmap.lowRisk}</span>
          </div>
          <div className="text-sm text-muted-foreground">Low Risk</div>
          <div className="mt-2 h-2 bg-green-500/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${lowRiskPercent}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Models Requiring Attention */}
      {heatmap.modelsRequiringAttention.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-foreground mb-3">
            Models Requiring Attention ({heatmap.modelsRequiringAttention.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {heatmap.modelsRequiringAttention.slice(0, 6).map((model) => (
              <PortfolioModelCard key={model.id} model={model} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
