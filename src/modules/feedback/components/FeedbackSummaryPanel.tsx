import { useFeedbackStore } from '../store/feedbackStore'
import { CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react'

export function FeedbackSummaryPanel() {
  const { feedbacks } = useFeedbackStore()

  const total = feedbacks.length
  const verified = feedbacks.filter((f) => f.status === 'verified').length
  const pending = feedbacks.filter((f) => f.status === 'pending').length
  const incorrect = feedbacks.filter((f) => f.feedbackType === 'incorrect').length

  const verifiedPercentage = total > 0 ? Math.round((verified / total) * 100) : 0
  const incorrectPercentage = total > 0 ? Math.round((incorrect / total) * 100) : 0

  // Group by model version
  const feedbacksByVersion = feedbacks.reduce((acc, f) => {
    const key = `${f.modelName} ${f.modelVersion}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topVersions = Object.entries(feedbacksByVersion)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <div className="glass-card rounded-2xl p-4">
      <h2 className="text-base font-semibold text-foreground mb-4">Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Feedback */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Total Feedback</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{total}</p>
        </div>

        {/* Verified Percentage */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <span>Verified</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{verifiedPercentage}%</p>
          <p className="text-xs text-muted-foreground">{verified} of {total}</p>
        </div>

        {/* Pending */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            <span>Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{pending}</p>
        </div>

        {/* Incorrect Predictions */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span>Incorrect</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{incorrectPercentage}%</p>
          <p className="text-xs text-muted-foreground">{incorrect} predictions</p>
        </div>
      </div>

      {/* Top Model Versions */}
      {topVersions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/20">
          <p className="text-xs text-muted-foreground mb-2">Feedback by Model Version</p>
          <div className="space-y-1.5">
            {topVersions.map(([version, count]) => (
              <div key={version} className="flex items-center justify-between text-xs">
                <span className="text-foreground font-mono truncate flex-1">{version}</span>
                <span className="text-muted-foreground ml-2">{count} feedback</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
