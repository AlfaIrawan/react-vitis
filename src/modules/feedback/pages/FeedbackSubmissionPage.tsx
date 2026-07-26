import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { useFeedbackStore } from '../store/feedbackStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast'
import type { FeedbackType } from '../store/feedbackStore'

export function FeedbackSubmissionPage() {
  const navigate = useNavigate()
  const { addFeedback } = useFeedbackStore()
  const { addToast } = useToast()

  const [requestId, setRequestId] = useState('')
  const [feedbackType, setFeedbackType] = useState<FeedbackType | ''>('')
  const [feedbackValue, setFeedbackValue] = useState('')
  const [comment, setComment] = useState('')
  const [modelName, setModelName] = useState('')
  const [modelVersion, setModelVersion] = useState('')
  const [prediction, setPrediction] = useState('')

  const feedbackTypeLabels = {
    correct: 'Correct',
    incorrect: 'Incorrect',
    outcome: 'Outcome',
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!requestId || !feedbackType || !modelName || !modelVersion || !prediction) {
      addToast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'error',
      })
      return
    }

    const newFeedback = addFeedback({
      requestId,
      modelName,
      modelVersion,
      prediction,
      feedbackType,
      feedbackValue: feedbackValue || undefined,
      comment: comment || undefined,
      source: 'user',
    })

    addToast({
      title: 'Feedback Submitted',
      description: 'Your feedback has been submitted successfully.',
      variant: 'success',
    })

    // Reset form
    setRequestId('')
    setFeedbackType('')
    setFeedbackValue('')
    setComment('')
    setModelName('')
    setModelVersion('')
    setPrediction('')

    // Navigate to detail page
    navigate(`/feedback/${newFeedback.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/feedback')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feedback
        </Button>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-foreground">Submit Feedback</h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground border border-border/20">
              🔒 Observational module
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Kumpulkan feedback dari inference request sebagai referensi evaluasi (opsional).
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="glass-card rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request ID */}
          <div className="space-y-2">
            <Label htmlFor="requestId">
              Request ID <span className="text-red-400">*</span>
            </Label>
            <Input
              id="requestId"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              placeholder="req-2024-001"
              required
            />
          </div>

          {/* Model Name */}
          <div className="space-y-2">
            <Label htmlFor="modelName">
              Model Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Sentiment Classifier"
              required
            />
          </div>

          {/* Model Version */}
          <div className="space-y-2">
            <Label htmlFor="modelVersion">
              Model Version <span className="text-red-400">*</span>
            </Label>
            <Input
              id="modelVersion"
              value={modelVersion}
              onChange={(e) => setModelVersion(e.target.value)}
              placeholder="v2.1.0"
              required
            />
          </div>

          {/* Prediction */}
          <div className="space-y-2">
            <Label htmlFor="prediction">
              Prediction <span className="text-red-400">*</span>
            </Label>
            <Input
              id="prediction"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              placeholder="Positive (0.92)"
              required
            />
          </div>

          {/* Feedback Type */}
          <div className="space-y-2">
            <Label htmlFor="feedbackType">
              Feedback Type <span className="text-red-400">*</span>
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!feedbackType}
                >
                  {feedbackType ? feedbackTypeLabels[feedbackType] : 'Select feedback type'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFeedbackType('correct')}>
                  Correct
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFeedbackType('incorrect')}>
                  Incorrect
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFeedbackType('outcome')}>
                  Outcome
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Feedback Value (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="feedbackValue">Feedback Value / Outcome (Optional)</Label>
            <Input
              id="feedbackValue"
              value={feedbackValue}
              onChange={(e) => setFeedbackValue(e.target.value)}
              placeholder="Actual label or outcome value"
            />
          </div>

          {/* Comment (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Additional comments or notes..."
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => navigate('/feedback')}>
              Cancel
            </Button>
            <Button type="submit">
              <Send className="w-4 h-4 mr-2" />
              Submit Feedback
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
