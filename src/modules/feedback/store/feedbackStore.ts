import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FeedbackType = 'correct' | 'incorrect' | 'outcome'
export type FeedbackStatus = 'pending' | 'verified' | 'rejected'
export type FeedbackSource = 'user' | 'system' | 'manual-review'

export interface Feedback {
  id: string
  requestId: string
  timestamp: string
  modelName: string
  modelVersion: string
  prediction: string // Ringkas prediction result
  feedbackType: FeedbackType
  feedbackValue?: string // Optional label/outcome value
  comment?: string
  source: FeedbackSource
  status: FeedbackStatus
  verifiedBy?: string
  verifiedAt?: string
  // Traceability (read-only)
  linkedRunId?: string
  linkedDeploymentId?: string
}

interface FeedbackState {
  feedbacks: Feedback[]
  addFeedback: (feedback: Omit<Feedback, 'id' | 'timestamp' | 'status'>) => Feedback
  getFeedback: (id: string) => Feedback | undefined
  searchFeedbacks: (query: string) => Feedback[]
  updateFeedbackStatus: (id: string, status: FeedbackStatus, verifiedBy?: string) => void
  getFeedbacksByModel: (modelName: string) => Feedback[]
  getFeedbacksByVersion: (modelVersion: string) => Feedback[]
  getFeedbacksByStatus: (status: FeedbackStatus) => Feedback[]
}

// Flag to enable/disable mock data
const USE_MOCK_DATA = true

// Mock initial data for Module 9: Feedback & Ground Truth
const mockFeedbacks: Feedback[] = USE_MOCK_DATA
  ? [
      {
        id: 'feedback-1',
        requestId: 'req-2024-001',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        modelName: 'Sentiment Classifier',
        modelVersion: 'v2.1.0',
        prediction: 'Positive (0.92)',
        feedbackType: 'correct',
        comment: 'User confirmed positive sentiment',
        source: 'user',
        status: 'verified',
        verifiedBy: 'admin@example.com',
        verifiedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        linkedRunId: 'run-mock-1',
        linkedDeploymentId: 'deployment-1',
      },
      {
        id: 'feedback-2',
        requestId: 'req-2024-002',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        modelName: 'Sentiment Classifier',
        modelVersion: 'v2.1.0',
        prediction: 'Negative (0.78)',
        feedbackType: 'incorrect',
        feedbackValue: 'Positive',
        comment: 'Model misclassified as negative',
        source: 'user',
        status: 'pending',
        linkedRunId: 'run-mock-1',
        linkedDeploymentId: 'deployment-1',
      },
      {
        id: 'feedback-3',
        requestId: 'req-2024-003',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        modelName: 'Image Classifier',
        modelVersion: 'v1.5.2',
        prediction: 'Cat (0.95)',
        feedbackType: 'outcome',
        feedbackValue: 'Adopted',
        comment: 'User adopted the cat based on prediction',
        source: 'system',
        status: 'verified',
        verifiedBy: 'system',
        verifiedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        linkedRunId: 'run-mock-2',
        linkedDeploymentId: 'deployment-2',
      },
      {
        id: 'feedback-4',
        requestId: 'req-2024-004',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        modelName: 'Sentiment Classifier',
        modelVersion: 'v2.0.5',
        prediction: 'Neutral (0.65)',
        feedbackType: 'incorrect',
        feedbackValue: 'Positive',
        comment: 'Should be positive',
        source: 'manual-review',
        status: 'rejected',
        verifiedBy: 'reviewer@example.com',
        verifiedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        linkedRunId: 'run-mock-1',
        linkedDeploymentId: 'deployment-1',
      },
      {
        id: 'feedback-5',
        requestId: 'req-2024-005',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        modelName: 'Image Classifier',
        modelVersion: 'v1.5.2',
        prediction: 'Dog (0.88)',
        feedbackType: 'correct',
        source: 'user',
        status: 'pending',
        linkedRunId: 'run-mock-2',
        linkedDeploymentId: 'deployment-2',
      },
      {
        id: 'feedback-6',
        requestId: 'req-2024-006',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        modelName: 'Recommendation Engine',
        modelVersion: 'v3.0.1',
        prediction: 'Product A (0.91)',
        feedbackType: 'outcome',
        feedbackValue: 'Purchased',
        comment: 'User purchased recommended product',
        source: 'system',
        status: 'verified',
        verifiedBy: 'system',
        verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        linkedRunId: 'run-mock-3',
        linkedDeploymentId: 'deployment-3',
      },
      {
        id: 'feedback-7',
        requestId: 'req-2024-007',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        modelName: 'Sentiment Classifier',
        modelVersion: 'v2.1.0',
        prediction: 'Positive (0.85)',
        feedbackType: 'correct',
        source: 'user',
        status: 'verified',
        verifiedBy: 'admin@example.com',
        verifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        linkedRunId: 'run-mock-1',
        linkedDeploymentId: 'deployment-1',
      },
      {
        id: 'feedback-8',
        requestId: 'req-2024-008',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        modelName: 'Image Classifier',
        modelVersion: 'v1.5.2',
        prediction: 'Bird (0.72)',
        feedbackType: 'incorrect',
        feedbackValue: 'Airplane',
        comment: 'Model confused bird with airplane',
        source: 'manual-review',
        status: 'verified',
        verifiedBy: 'reviewer@example.com',
        verifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        linkedRunId: 'run-mock-2',
        linkedDeploymentId: 'deployment-2',
      },
    ]
  : []

const initialFeedbacks: Feedback[] = mockFeedbacks

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set, get) => ({
      feedbacks: initialFeedbacks,

      addFeedback: (feedbackData) => {
        const newFeedback: Feedback = {
          id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...feedbackData,
          timestamp: new Date().toISOString(),
          status: 'pending',
        }

        set((state) => ({
          feedbacks: [newFeedback, ...state.feedbacks],
        }))

        return newFeedback
      },

      getFeedback: (id) => {
        return get().feedbacks.find((f) => f.id === id)
      },

      searchFeedbacks: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().feedbacks.filter(
          (feedback) =>
            feedback.requestId.toLowerCase().includes(lowerQuery) ||
            feedback.modelName.toLowerCase().includes(lowerQuery) ||
            feedback.modelVersion.toLowerCase().includes(lowerQuery) ||
            feedback.prediction.toLowerCase().includes(lowerQuery)
        )
      },

      updateFeedbackStatus: (id, status, verifiedBy) => {
        set((state) => ({
          feedbacks: state.feedbacks.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status,
                  verifiedBy,
                  verifiedAt: status !== 'pending' ? new Date().toISOString() : undefined,
                }
              : f
          ),
        }))
      },

      getFeedbacksByModel: (modelName) => {
        return get().feedbacks.filter((f) => f.modelName === modelName)
      },

      getFeedbacksByVersion: (modelVersion) => {
        return get().feedbacks.filter((f) => f.modelVersion === modelVersion)
      },

      getFeedbacksByStatus: (status) => {
        return get().feedbacks.filter((f) => f.status === status)
      },
    }),
    {
      name: 'feedback-storage',
      onRehydrateStorage: () => (state) => {
        if (USE_MOCK_DATA) {
          const stored = localStorage.getItem('feedback-storage')
          if (!stored || (state && state.feedbacks.length === 0)) {
            if (state) {
              state.feedbacks = [...mockFeedbacks]
            }
          }
        }
      },
    }
  )
)
