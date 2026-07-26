import { TrendingUp, RefreshCw, Pause, Trash2, Eye } from 'lucide-react'
import { usePortfolioStore } from '../store/portfolioStore'
import { PortfolioModelCard } from './PortfolioModelCard'
import { cn } from '@/lib/utils'

export function LifecycleInsights() {
  const { getLifecycleRecommendations } = usePortfolioStore()
  const recommendations = getLifecycleRecommendations()
  
  const recommendationSections = [
    {
      type: 'scale' as const,
      label: 'Scale Candidates',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      models: recommendations.scale
    },
    {
      type: 'retrain' as const,
      label: 'Retraining Candidates',
      icon: RefreshCw,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      models: recommendations.retrain
    },
    {
      type: 'freeze' as const,
      label: 'Freeze Candidates',
      icon: Pause,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      models: recommendations.freeze
    },
    {
      type: 'retire' as const,
      label: 'Retirement Candidates',
      icon: Trash2,
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      models: recommendations.retire
    },
    {
      type: 'review' as const,
      label: 'Review Required',
      icon: Eye,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      models: recommendations.review
    }
  ]
  
  return (
    <div className="glass-card p-6 rounded-xl">
      <h2 className="text-lg font-semibold text-foreground mb-4">Lifecycle Decision Insights</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Recommendations only. No operational actions are performed from this module.
      </p>
      
      <div className="space-y-6">
        {recommendationSections.map((section) => {
          if (section.models.length === 0) return null
          
          const Icon = section.icon
          
          return (
            <div key={section.type}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={cn('w-5 h-5', section.color)} />
                <h3 className="text-md font-semibold text-foreground">
                  {section.label} ({section.models.length})
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.models.map((model) => {
                  const modelRecommendation = model.recommendations.find(r => r.type === section.type)
                  if (!modelRecommendation) return null
                  
                  return (
                    <div
                      key={model.id}
                      className="glass-panel p-4 rounded-lg border border-border/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground">{model.name}</h4>
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          modelRecommendation.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                          modelRecommendation.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-gray-500/20 text-gray-500'
                        )}>
                          {modelRecommendation.priority}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {modelRecommendation.reason}
                      </p>
                      
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium mb-1">Evidence:</div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {modelRecommendation.evidence.map((evidence, idx) => (
                            <li key={idx}>{evidence}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      
      {recommendationSections.every(s => s.models.length === 0) && (
        <div className="text-center py-8 text-muted-foreground">
          No lifecycle recommendations at this time.
        </div>
      )}
    </div>
  )
}
