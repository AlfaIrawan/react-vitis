import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target } from 'lucide-react'
import { usePortfolioStore } from '../store/portfolioStore'
import { cn } from '@/lib/utils'

export function ValueRealizationPanel() {
  const { getValueRealizationMetrics } = usePortfolioStore()
  const metrics = getValueRealizationMetrics()
  
  const kpiCards = [
    {
      label: 'Total Models',
      value: metrics.totalModels,
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'KPIs On Track',
      value: metrics.onTrackKPIs,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      subtitle: `${Math.round((metrics.onTrackKPIs / metrics.totalModels) * 100)}% of total`
    },
    {
      label: 'KPIs At Risk',
      value: metrics.atRiskKPIs,
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      subtitle: `${Math.round((metrics.atRiskKPIs / metrics.totalModels) * 100)}% of total`
    },
    {
      label: 'High Adoption',
      value: metrics.highAdoptionModels,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: 'High Cost Models',
      value: metrics.highCostModels,
      icon: DollarSign,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      subtitle: 'Review candidates'
    }
  ]
  
  return (
    <div className="glass-card p-6 rounded-xl">
      <h2 className="text-lg font-semibold text-foreground mb-4">Value Realization</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="glass-panel p-4 rounded-lg border border-border/20"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn('w-5 h-5', card.color)} />
                <span className="text-2xl font-bold text-foreground">{card.value}</span>
              </div>
              <div className="text-sm text-muted-foreground">{card.label}</div>
              {card.subtitle && (
                <div className="text-xs text-muted-foreground mt-1">{card.subtitle}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
