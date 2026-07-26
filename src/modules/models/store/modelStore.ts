import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useProjectStore } from '../../projects/store/projectStore'
import type { RunDraft, RunResultData } from '../../runs/store/runStore'

export type ModelStatus = 'draft' | 'staging' | 'production' | 'archived'

export type TaskType = 'classification' | 'nlp' | 'vision' | 'regression' | 'recommendation' | 'other'

export interface ModelVersion {
  id: string
  version: string // e.g., "v1", "v2", "v3"
  modelId: string
  sourceRunId: string
  sourceRunName: string
  metrics: {
    accuracy?: number
    loss?: number
    validationAccuracy?: number
    precision?: number
    recall?: number
    f1Score?: number
    rocAuc?: number
  }
  artifacts: Array<{
    name: string
    type: 'model' | 'metrics' | 'config' | 'logs'
    size: number
    path: string
    format?: string
  }>
  configSnapshot: Record<string, any> // Immutable snapshot of run parameters
  createdAt: string
  status: 'active' | 'inactive' // Version status (active = current version)
}

export interface Model {
  id: string
  name: string
  projectId: string
  projectName: string
  taskType: TaskType
  status: ModelStatus
  currentVersionId: string | null // ID of the active version
  versions: ModelVersion[]
  createdAt: string
  updatedAt: string
}

interface ModelState {
  models: Model[]
  registerModelFromRun: (run: RunDraft) => Model | null
  getModel: (id: string) => Model | undefined
  getModelsByProject: (projectId: string) => Model[]
  searchModels: (query: string) => Model[]
  promoteModel: (modelId: string, targetStatus: 'staging' | 'production') => void
  archiveModel: (modelId: string) => void
  rollbackModel: (modelId: string, versionId: string) => void
  addVersionFromRun: (modelId: string, run: RunDraft) => ModelVersion | null
}

// Helper to infer task type from run purpose and tags
function inferTaskType(run: RunDraft): TaskType {
  const purpose = run.purpose
  const tags = run.tags.map((t) => t.toLowerCase())
  const name = run.name.toLowerCase()

  if (tags.includes('nlp') || tags.includes('bert') || tags.includes('transformer') || name.includes('sentiment') || name.includes('ner')) {
    return 'nlp'
  }
  if (tags.includes('vision') || tags.includes('image') || tags.includes('classification') || name.includes('image') || name.includes('vision')) {
    return 'vision'
  }
  if (tags.includes('classification') || name.includes('classify')) {
    return 'classification'
  }
  if (tags.includes('regression') || name.includes('regression')) {
    return 'regression'
  }
  if (tags.includes('recommendation') || tags.includes('recommend') || name.includes('recommend')) {
    return 'recommendation'
  }
  return 'other'
}

// Helper to generate version string
function generateVersionNumber(existingVersions: ModelVersion[]): string {
  if (existingVersions.length === 0) {
    return 'v1'
  }
  const versionNumbers = existingVersions
    .map((v) => {
      const match = v.version.match(/v(\d+)/)
      return match ? parseInt(match[1], 10) : 0
    })
    .filter((n) => n > 0)
  const maxVersion = versionNumbers.length > 0 ? Math.max(...versionNumbers) : 0
  return `v${maxVersion + 1}`
}

// Flag to enable/disable mock data for development/demo purposes
const USE_MOCK_MODELS = true

// Mock initial data for Module 7 - Model Registry & Lifecycle Management
// These are dummy models for UI visualization only.
// NO training logic, NO real-time monitoring, NO inference testing.
const mockModels: Model[] = USE_MOCK_MODELS
  ? [
      {
        id: 'model-mock-1',
        name: 'Sentiment Analysis BERT Model',
        projectId: 'project-mock-1',
        projectName: 'Sentiment Analysis Model',
        taskType: 'nlp',
        status: 'production',
        currentVersionId: 'version-mock-1-2',
        versions: [
          {
            id: 'version-mock-1-1',
            version: 'v1',
            modelId: 'model-mock-1',
            sourceRunId: 'run-mock-completed-1',
            sourceRunName: 'Fine-tune BERT for Sentiment - v1',
            metrics: {
              accuracy: 0.92,
              loss: 0.15,
              validationAccuracy: 0.89,
              precision: 0.91,
              recall: 0.90,
              f1Score: 0.905,
            },
            artifacts: [
              {
                name: 'model_weights.pth',
                type: 'model',
                size: 1024 * 1024 * 450, // 450 MB
                path: '/models/sentiment-bert/v1/model_weights.pth',
                format: 'PyTorch',
              },
              {
                name: 'config.json',
                type: 'config',
                size: 2048,
                path: '/models/sentiment-bert/v1/config.json',
                format: 'JSON',
              },
            ],
            configSnapshot: {
              learning_rate: '0.0001',
              batch_size: '32',
              epochs: '10',
            },
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            status: 'inactive',
          },
          {
            id: 'version-mock-1-2',
            version: 'v2',
            modelId: 'model-mock-1',
            sourceRunId: 'run-mock-completed-2',
            sourceRunName: 'Fine-tune BERT for Sentiment - v2',
            metrics: {
              accuracy: 0.94,
              loss: 0.12,
              validationAccuracy: 0.92,
              precision: 0.93,
              recall: 0.92,
              f1Score: 0.925,
            },
            artifacts: [
              {
                name: 'model_weights.pth',
                type: 'model',
                size: 1024 * 1024 * 450,
                path: '/models/sentiment-bert/v2/model_weights.pth',
                format: 'PyTorch',
              },
              {
                name: 'config.json',
                type: 'config',
                size: 2048,
                path: '/models/sentiment-bert/v2/config.json',
                format: 'JSON',
              },
            ],
            configSnapshot: {
              learning_rate: '0.0001',
              batch_size: '32',
              epochs: '12',
            },
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            status: 'active',
          },
        ],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      },
      {
        id: 'model-mock-2',
        name: 'Image Classification Vision Transformer',
        projectId: 'project-mock-2',
        projectName: 'Image Classification Pipeline',
        taskType: 'vision',
        status: 'staging',
        currentVersionId: 'version-mock-2-1',
        versions: [
          {
            id: 'version-mock-2-1',
            version: 'v1',
            modelId: 'model-mock-2',
            sourceRunId: 'run-mock-completed-3',
            sourceRunName: 'Pretrain Vision Transformer',
            metrics: {
              accuracy: 0.87,
              loss: 0.25,
              validationAccuracy: 0.85,
            },
            artifacts: [
              {
                name: 'model_weights.pth',
                type: 'model',
                size: 1024 * 1024 * 800, // 800 MB
                path: '/models/vision-transformer/v1/model_weights.pth',
                format: 'PyTorch',
              },
            ],
            configSnapshot: {
              learning_rate: '0.001',
              batch_size: '64',
              epochs: '20',
            },
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
            status: 'active',
          },
        ],
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
        updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      },
    ]
  : []

// Initial models: use mock data if enabled, otherwise empty array
const initialModels: Model[] = mockModels

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      // Initialize with mock data if enabled, otherwise start empty
      // Note: persist middleware will override this with stored data if it exists
      models: initialModels,

      registerModelFromRun: (run) => {
        // Only register from completed runs
        if (run.status !== 'completed' || !run.resultData) {
          return null
        }

        // Check if model already exists for this run
        const existingModel = get().models.find((m) =>
          m.versions.some((v) => v.sourceRunId === run.id)
        )
        if (existingModel) {
          // Add as new version to existing model
          return get().addVersionFromRun(existingModel.id, run) ? existingModel : null
        }

        // Create new model
        const taskType = inferTaskType(run)
        const version: ModelVersion = {
          id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          version: 'v1',
          modelId: '', // Will be set after model creation
          sourceRunId: run.id,
          sourceRunName: run.name,
          metrics: {
            accuracy: run.resultData.finalAccuracy,
            loss: run.resultData.finalLoss,
            validationAccuracy: run.resultData.validationAccuracy,
            precision: run.resultData.precision,
            recall: run.resultData.recall,
            f1Score: run.resultData.f1Score,
            rocAuc: run.resultData.rocAuc,
          },
          artifacts: run.resultData.artifacts || [],
          configSnapshot: run.parameters,
          createdAt: new Date().toISOString(),
          status: 'active',
        }

        const modelId = `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        version.modelId = modelId

        // Get project name
        const projectStore = useProjectStore.getState()
        const project = projectStore.getProject(run.projectId)

        const newModel: Model = {
          id: modelId,
          name: run.name,
          projectId: run.projectId,
          projectName: project?.name || 'Unknown Project',
          taskType,
          status: 'draft',
          currentVersionId: version.id,
          versions: [version],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          models: [...state.models, newModel],
        }))

        return newModel
      },

      addVersionFromRun: (modelId, run) => {
        if (run.status !== 'completed' || !run.resultData) {
          return null
        }

        const model = get().models.find((m) => m.id === modelId)
        if (!model) {
          return null
        }

        // Deactivate current version
        const updatedVersions = model.versions.map((v) => ({
          ...v,
          status: 'inactive' as const,
        }))

        const newVersion: ModelVersion = {
          id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          version: generateVersionNumber(model.versions),
          modelId,
          sourceRunId: run.id,
          sourceRunName: run.name,
          metrics: {
            accuracy: run.resultData.finalAccuracy,
            loss: run.resultData.finalLoss,
            validationAccuracy: run.resultData.validationAccuracy,
            precision: run.resultData.precision,
            recall: run.resultData.recall,
            f1Score: run.resultData.f1Score,
            rocAuc: run.resultData.rocAuc,
          },
          artifacts: run.resultData.artifacts || [],
          configSnapshot: run.parameters,
          createdAt: new Date().toISOString(),
          status: 'active',
        }

        set((state) => ({
          models: state.models.map((m) =>
            m.id === modelId
              ? {
                  ...m,
                  versions: [...updatedVersions, newVersion],
                  currentVersionId: newVersion.id,
                  updatedAt: new Date().toISOString(),
                }
              : m
          ),
        }))

        return newVersion
      },

      getModel: (id) => {
        return get().models.find((m) => m.id === id)
      },

      getModelsByProject: (projectId) => {
        return get().models.filter((m) => m.projectId === projectId)
      },

      searchModels: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().models.filter(
          (model) =>
            model.name.toLowerCase().includes(lowerQuery) ||
            model.projectName.toLowerCase().includes(lowerQuery) ||
            model.taskType.toLowerCase().includes(lowerQuery)
        )
      },

      promoteModel: (modelId, targetStatus) => {
        set((state) => ({
          models: state.models.map((m) =>
            m.id === modelId && m.status !== 'archived'
              ? {
                  ...m,
                  status: targetStatus,
                  updatedAt: new Date().toISOString(),
                }
              : m
          ),
        }))
      },

      archiveModel: (modelId) => {
        set((state) => ({
          models: state.models.map((m) =>
            m.id === modelId
              ? {
                  ...m,
                  status: 'archived',
                  updatedAt: new Date().toISOString(),
                }
              : m
          ),
        }))
      },

      rollbackModel: (modelId, versionId) => {
        set((state) => ({
          models: state.models.map((m) => {
            if (m.id !== modelId) return m

            const updatedVersions = m.versions.map((v) => ({
              ...v,
              status: v.id === versionId ? ('active' as const) : ('inactive' as const),
            }))

            return {
              ...m,
              versions: updatedVersions,
              currentVersionId: versionId,
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },
    }),
    {
      name: 'model-storage',
      // Initialize with mock data on first load if enabled and storage is empty
      onRehydrateStorage: () => (state) => {
        // If no state exists or models array is empty, and mock data is enabled
        // Initialize with mock data (only on first load)
        if (USE_MOCK_MODELS) {
          const stored = localStorage.getItem('model-storage')
          if (!stored || (state && state.models.length === 0)) {
            // First time load or empty storage - use mock data
            if (state) {
              state.models = [...mockModels]
            }
          }
        }
      },
    }
  )
)
