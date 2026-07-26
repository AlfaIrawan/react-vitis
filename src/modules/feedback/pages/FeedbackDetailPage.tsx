import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Package, Link2, Rocket, User, Bot, FileCheck } from 'lucide-react'
import { useFeedbackStore } from '../store/feedbackStore'
import { FeedbackStatusBadge } from '../components/FeedbackStatusBadge'
import { FeedbackTypeBadge } from '../components/FeedbackTypeBadge'
import { Button } from '@/components/ui/button'

export function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getFeedback } = useFeedbackStore()

  const feedback = id ? getFeedback(id) : undefined

  if (!feedback) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/feedback')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feedback
        </Button>
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">Feedback not found</p>
        </div>
      </div>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'user':
        return User
      case 'system':
        return Bot
      case 'manual-review':
        return FileCheck
      default:
        return User
    }
  }

  const SourceIcon = getSourceIcon(feedback.source)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate('/feedback')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl font-bold text-foreground">Feedback Details</h1>
              <FeedbackStatusBadge status={feedback.status} />
              <span className="text-xs px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground border border-border/20">
                🔒 Read-only
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimestamp(feedback.timestamp)}</span>
              </div>
              <span>•</span>
              <span className="font-mono">{feedback.requestId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inference Summary */}
      <div className="glass-card rounded-2xl p-4">
        <h2 className="text-base font-semibold text-foreground mb-4">Inference Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Request ID</p>
            <p className="text-sm font-medium text-foreground font-mono">{feedback.requestId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Timestamp</p>
            <p className="text-sm font-medium text-foreground">{formatTimestamp(feedback.timestamp)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Model Name</p>
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">{feedback.modelName}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Model Version</p>
            <p className="text-sm font-medium text-foreground font-mono">{feedback.modelVersion}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Prediction Result</p>
            <p className="text-sm font-medium text-foreground">{feedback.prediction}</p>
          </div>
        </div>
      </div>

      {/* Feedback Information */}
      <div className="glass-card rounded-2xl p-4">
        <h2 className="text-base font-semibold text-foreground mb-4">Feedback Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Feedback Type</p>
            <FeedbackTypeBadge type={feedback.feedbackType} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Source</p>
            <div className="flex items-center gap-2">
              <SourceIcon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground capitalize">
                {feedback.source.replace('-', ' ')}
              </span>
            </div>
          </div>
          {feedback.feedbackValue && (
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Feedback Value / Outcome</p>
              <p className="text-sm font-medium text-foreground">{feedback.feedbackValue}</p>
            </div>
          )}
          {feedback.comment && (
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Comment</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{feedback.comment}</p>
            </div>
          )}
        </div>
      </div>

      {/* Verification Status */}
      <div className="glass-card rounded-2xl p-4">
        <h2 className="text-base font-semibold text-foreground mb-4">Verification Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <FeedbackStatusBadge status={feedback.status} />
          </div>
          {feedback.verifiedBy && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Verified By</p>
              <p className="text-sm font-medium text-foreground">{feedback.verifiedBy}</p>
            </div>
          )}
          {feedback.verifiedAt && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Verified At</p>
              <p className="text-sm font-medium text-foreground">
                {formatTimestamp(feedback.verifiedAt)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Traceability (Read-only) */}
      <div className="glass-card rounded-2xl p-4">
        <h2 className="text-base font-semibold text-foreground mb-4">Traceability</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feedback.linkedRunId && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Linked Run</p>
              <div className="flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground font-mono">
                  {feedback.linkedRunId}
                </p>
              </div>
            </div>
          )}
          {feedback.linkedDeploymentId && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Linked Deployment</p>
              <div className="flex items-center gap-2">
                <Rocket className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground font-mono">
                  {feedback.linkedDeploymentId}
                </p>
              </div>
            </div>
          )}
          {!feedback.linkedRunId && !feedback.linkedDeploymentId && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">No traceability links available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
