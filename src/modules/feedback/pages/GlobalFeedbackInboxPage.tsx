import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, Clock, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useFeedbackStore } from '@/modules/feedback'
import { useProjectStore } from '@/modules/projects'
import { FeedbackStatusBadge } from '@/modules/feedback'
import { FeedbackTypeBadge } from '@/modules/feedback'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PageHeader } from '@/components/layout/PageHeader'
import type { FeedbackStatus, FeedbackType } from '@/modules/feedback'

const ITEMS_PER_PAGE = 10

/**
 * Global Feedback Inbox Page
 * 
 * Enterprise-level read-only view of all feedback across all projects.
 * Provides cross-project triage, oversight, and prioritization.
 * 
 * Features:
 * - Cross-project visibility
 * - Filter by Project, Model, Status, Type
 * - Read-only or review actions only
 * - Oversight & prioritization
 */
export function GlobalFeedbackInboxPage() {
  useNavigate();
  const { feedbacks, searchFeedbacks } = useFeedbackStore()
  const { projects } = useProjectStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [projectFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | FeedbackType>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Enrich feedbacks with project information
  const enrichedFeedbacks = useMemo(() => {
    return feedbacks.map((feedback) => {
      // Find project by matching model name (simplified - in real app would have direct project link)
      const project = projects.find((p) => {
        // This is a simplified lookup - in real app, feedback would have projectId
        return true // Placeholder
      })
      return {
        ...feedback,
        projectName: project?.name || 'Unknown Project',
      }
    })
  }, [feedbacks, projects])

  // Get unique models for filters
  useMemo(() => {
    const models = new Set(enrichedFeedbacks.map((f) => f.modelName))
    return Array.from(models).sort()
  }, [enrichedFeedbacks]);
  // Filter feedbacks
  const filteredFeedbacks = useMemo(() => {
    let filtered = searchQuery ? searchFeedbacks(searchQuery) : enrichedFeedbacks

    if (projectFilter !== 'all') {
      // Filter by project (simplified - would need projectId in feedback)
      // For now, we'll skip this filter
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((f) => f.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((f) => f.feedbackType === typeFilter)
    }

    return filtered.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }, [enrichedFeedbacks, searchQuery, projectFilter, statusFilter, typeFilter, searchFeedbacks])

  // Pagination
  const totalPages = Math.ceil(filteredFeedbacks.length / ITEMS_PER_PAGE)
  const paginatedFeedbacks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredFeedbacks.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredFeedbacks, currentPage])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusCounts = useMemo(() => {
    return {
      all: enrichedFeedbacks.length,
      pending: enrichedFeedbacks.filter((f) => f.status === 'pending').length,
      verified: enrichedFeedbacks.filter((f) => f.status === 'verified').length,
      rejected: enrichedFeedbacks.filter((f) => f.status === 'rejected').length,
    }
  }, [enrichedFeedbacks])

  const handleFeedbackClick = (feedback: typeof enrichedFeedbacks[0]) => {
    // Navigate to project-scoped feedback view if we can determine project
    // For now, navigate to feedback detail (would need projectId in feedback)
    // navigate(`/projects/${feedback.projectId}/feedback/${feedback.id}`)
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Feedback' }]} />

      {/* Header */}
      <PageHeader
        title="Feedback Inbox"
        description="Global read-only inbox of all feedback across projects. Cross-project triage and oversight."
        right={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/20">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Read-only</span>
          </div>
        }
      />

      {/* Search and Filters */}
      <div className="glass-card rounded-xl p-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Status:</span>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({statusCounts.all})
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              Pending ({statusCounts.pending})
            </Button>
            <Button
              variant={statusFilter === 'verified' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('verified')}
            >
              Verified ({statusCounts.verified})
            </Button>
            <Button
              variant={statusFilter === 'rejected' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('rejected')}
            >
              Rejected ({statusCounts.rejected})
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Type:</span>
            <Button
              variant={typeFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('all')}
            >
              All
            </Button>
            <Button
              variant={typeFilter === 'correct' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('correct')}
            >
              Correct
            </Button>
            <Button
              variant={typeFilter === 'incorrect' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('incorrect')}
            >
              Incorrect
            </Button>
            <Button
              variant={typeFilter === 'outcome' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('outcome')}
            >
              Outcome
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      {filteredFeedbacks.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">No feedback found</p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="divide-y divide-border/20">
              {paginatedFeedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="p-4 hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => handleFeedbackClick(feedback)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {feedback.modelName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          v{feedback.modelVersion}
                        </span>
                        <FeedbackStatusBadge status={feedback.status} />
                        <FeedbackTypeBadge type={feedback.feedbackType} />
                      </div>
                      <p className="text-sm text-foreground mb-1">
                        <span className="font-medium">Prediction:</span> {feedback.prediction}
                      </p>
                      {feedback.comment && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {feedback.comment}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimestamp(feedback.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredFeedbacks.length)} of{' '}
                {filteredFeedbacks.length} feedback items
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
