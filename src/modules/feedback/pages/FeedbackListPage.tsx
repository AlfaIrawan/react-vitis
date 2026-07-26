import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useFeedbackStore } from '../store/feedbackStore'
import { FeedbackStatusBadge } from '../components/FeedbackStatusBadge'
import { FeedbackTypeBadge } from '../components/FeedbackTypeBadge'
import { FeedbackSummaryPanel } from '../components/FeedbackSummaryPanel'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { FeedbackStatus, FeedbackType, FeedbackSource } from '../store/feedbackStore'

const ITEMS_PER_PAGE = 10

export function FeedbackListPage() {
  const navigate = useNavigate()
  const { feedbacks, searchFeedbacks } = useFeedbackStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [modelFilter, setModelFilter] = useState<string>('all')
  const [versionFilter, setVersionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | FeedbackType>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | FeedbackSource>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Get unique models and versions for filters
  const uniqueModels = useMemo(() => {
    const models = new Set(feedbacks.map((f) => f.modelName))
    return Array.from(models).sort()
  }, [feedbacks])

  const uniqueVersions = useMemo(() => {
    const versions = new Set(feedbacks.map((f) => `${f.modelName} ${f.modelVersion}`))
    return Array.from(versions).sort()
  }, [feedbacks])

  // Filter feedbacks
  const filteredFeedbacks = useMemo(() => {
    let filtered = searchQuery ? searchFeedbacks(searchQuery) : feedbacks

    if (modelFilter !== 'all') {
      filtered = filtered.filter((f) => f.modelName === modelFilter)
    }

    if (versionFilter !== 'all') {
      const [modelName, version] = versionFilter.split(' ')
      filtered = filtered.filter(
        (f) => f.modelName === modelName && f.modelVersion === version
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((f) => f.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((f) => f.feedbackType === typeFilter)
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter((f) => f.source === sourceFilter)
    }

    return filtered.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }, [feedbacks, searchQuery, modelFilter, versionFilter, statusFilter, typeFilter, sourceFilter, searchFeedbacks])

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
      all: feedbacks.length,
      pending: feedbacks.filter((f) => f.status === 'pending').length,
      verified: feedbacks.filter((f) => f.status === 'verified').length,
      rejected: feedbacks.filter((f) => f.status === 'rejected').length,
    }
  }, [feedbacks])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-foreground">Feedback & Ground Truth</h1>
          <span className="text-xs px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground border border-border/20">
            🔒 Observational & governance module (read-only)
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Observability pasca deployment dan traceability feedback sebagai referensi peningkatan model di siklus berikutnya.
        </p>
      </div>

      {/* Summary Panel */}
      <FeedbackSummaryPanel />

      {/* Search and Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by Request ID, Model, or Version..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Model Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Model:</span>
              <select
                value={modelFilter}
                onChange={(e) => {
                  setModelFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="text-xs px-2 py-1 rounded-md bg-accent/30 border border-border/20 text-foreground"
              >
                <option value="all">All Models</option>
                {uniqueModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            {/* Version Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Version:</span>
              <select
                value={versionFilter}
                onChange={(e) => {
                  setVersionFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="text-xs px-2 py-1 rounded-md bg-accent/30 border border-border/20 text-foreground"
              >
                <option value="all">All Versions</option>
                {uniqueVersions.map((version) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setStatusFilter('all')
                  setCurrentPage(1)
                }}
              >
                All ({statusCounts.all})
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setStatusFilter('pending')
                  setCurrentPage(1)
                }}
              >
                Pending ({statusCounts.pending})
              </Button>
              <Button
                variant={statusFilter === 'verified' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setStatusFilter('verified')
                  setCurrentPage(1)
                }}
              >
                Verified ({statusCounts.verified})
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setStatusFilter('rejected')
                  setCurrentPage(1)
                }}
              >
                Rejected ({statusCounts.rejected})
              </Button>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Type:</span>
              <Button
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setTypeFilter('all')
                  setCurrentPage(1)
                }}
              >
                All
              </Button>
              <Button
                variant={typeFilter === 'correct' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setTypeFilter('correct')
                  setCurrentPage(1)
                }}
              >
                Correct
              </Button>
              <Button
                variant={typeFilter === 'incorrect' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setTypeFilter('incorrect')
                  setCurrentPage(1)
                }}
              >
                Incorrect
              </Button>
              <Button
                variant={typeFilter === 'outcome' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setTypeFilter('outcome')
                  setCurrentPage(1)
                }}
              >
                Outcome
              </Button>
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Source:</span>
              <Button
                variant={sourceFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setSourceFilter('all')
                  setCurrentPage(1)
                }}
              >
                All
              </Button>
              <Button
                variant={sourceFilter === 'user' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setSourceFilter('user')
                  setCurrentPage(1)
                }}
              >
                User
              </Button>
              <Button
                variant={sourceFilter === 'system' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setSourceFilter('system')
                  setCurrentPage(1)
                }}
              >
                System
              </Button>
              <Button
                variant={sourceFilter === 'manual-review' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setSourceFilter('manual-review')
                  setCurrentPage(1)
                }}
              >
                Manual
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border/20">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Request ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Version
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Prediction
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Feedback Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {paginatedFeedbacks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No feedback found
                  </td>
                </tr>
              ) : (
                paginatedFeedbacks.map((feedback) => (
                  <tr
                    key={feedback.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => navigate(`/feedback/${feedback.id}`)}
                  >
                    <td className="px-4 py-3 text-xs text-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatTimestamp(feedback.timestamp)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground font-mono">
                      {feedback.requestId}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">{feedback.modelName}</td>
                    <td className="px-4 py-3 text-xs text-foreground font-mono">
                      {feedback.modelVersion}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground max-w-xs truncate">
                      {feedback.prediction}
                    </td>
                    <td className="px-4 py-3">
                      <FeedbackTypeBadge type={feedback.feedbackType} />
                    </td>
                    <td className="px-4 py-3">
                      <FeedbackStatusBadge status={feedback.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                      {feedback.source.replace('-', ' ')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/20">
            <div className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredFeedbacks.length)} of{' '}
              {filteredFeedbacks.length} feedback
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
