import { useNavigate } from 'react-router-dom'
import { Package, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioModel, RiskLevel, KPIStatus, AdoptionSignal, UsageTrend } from '../store/portfolioStore'

interface PortfolioModelCardProps {
  model: PortfolioModel
}

export function PortfolioModelCard({ model }: PortfolioModelCardProps) {
  const navigate = useNavigate()
  
  const getRiskBadgeColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'high': return 'bg-red-500/20 text-red-500 border-red-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-500 border-green-500/30'
    }
  }
  
  const getEnvironmentBadgeColor = (env: string) => {
    switch (env) {
      case 'production': return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      case 'staging': return 'bg-purple-500/20 text-purple-500 border-purple-500/30'
      case 'retired': return 'bg-gray-500/20 text-gray-500 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30'
    }
  }
  
  const getKPIStatusIcon = (status?: KPIStatus) => {
    switch (status) {
      case 'on_track': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'at_risk': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'unknown': return <XCircle className="w-4 h-4 text-gray-500" />
      default: return null
    }
  }
  
  const getUsageTrendIcon = (trend?: UsageTrend) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'stable': return <Minus className="w-4 h-4 text-gray-500" />
      default: return null
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  return (
    <div
      onClick={() => navigate(`/models/${model.modelId}`)}
      className="glass-card p-4 rounded-xl cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground truncate">{model.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-2 py-1 rounded-md text-xs font-medium border',
            getRiskBadgeColor(model.riskLevel)
          )}>
            {model.riskLevel.toUpperCase()}
          </span>
          <span className={cn(
            'px-2 py-1 rounded-md text-xs font-medium border',
            getEnvironmentBadgeColor(model.environment)
          )}>
            {model.environment}
          </span>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Domain:</span>
          <span className="text-foreground font-medium capitalize">
            {model.businessDomain.replace('_', ' ')}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Owner:</span>
          <span className="text-foreground font-medium truncate ml-2">
            {model.businessOwner}
          </span>
        </div>
        
        {model.businessObjective && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">KPI Status:</span>
              <div className="flex items-center gap-1">
                {getKPIStatusIcon(model.businessObjective.currentKPIStatus)}
                <span className="text-foreground font-medium capitalize">
                  {model.businessObjective.currentKPIStatus.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Adoption:</span>
              <div className="flex items-center gap-1">
                {getUsageTrendIcon(model.businessObjective.usageTrend)}
                <span className="text-foreground font-medium capitalize">
                  {model.businessObjective.adoptionSignal}
                </span>
              </div>
            </div>
          </>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Last Activity:</span>
          <span className="text-foreground font-medium">
            {formatDate(model.lastActivityDate)}
          </span>
        </div>
        
        {model.driftAlertsCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Drift Alerts:</span>
            <span className="text-red-500 font-medium">
              {model.driftAlertsCount}
            </span>
          </div>
        )}
      </div>
      
      {model.recommendations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/20">
          <div className="text-xs text-muted-foreground mb-1">Recommendations:</div>
          <div className="flex flex-wrap gap-1">
            {model.recommendations.slice(0, 2).map((rec, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20"
              >
                {rec.type}
              </span>
            ))}
            {model.recommendations.length > 2 && (
              <span className="px-2 py-0.5 rounded text-xs text-muted-foreground">
                +{model.recommendations.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
