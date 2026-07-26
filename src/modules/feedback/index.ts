// Module 9: Feedback & Ground Truth
// This module provides post-deployment observability and feedback collection.
// Read-only, non-blocking, no ML logic, no auto model improvement processes.

export { FeedbackListPage } from './pages/FeedbackListPage'
export { GlobalFeedbackInboxPage } from './pages/GlobalFeedbackInboxPage'
export { FeedbackDetailPage } from './pages/FeedbackDetailPage'
export { FeedbackSubmissionPage } from './pages/FeedbackSubmissionPage'
export { FeedbackStatusBadge } from './components/FeedbackStatusBadge'
export { FeedbackTypeBadge } from './components/FeedbackTypeBadge'
export { FeedbackSummaryPanel } from './components/FeedbackSummaryPanel'
export { useFeedbackStore } from './store/feedbackStore'
export type {
  Feedback,
  FeedbackType,
  FeedbackStatus,
  FeedbackSource,
} from './store/feedbackStore'
