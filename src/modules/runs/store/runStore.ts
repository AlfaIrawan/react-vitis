import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useProjectStore } from '@/modules/projects'
import { fetchDataset, fetchDatasets, type Dataset } from '@/modules/datasets'
import { useTrainerStore } from '@/modules/trainers'
import { useComputeStore } from '@/modules/compute'

export type RunStatus = 'draft' | 'ready' | 'blocked' | 'completed' | 'failed' | 'cancelled'
export type RunPurpose = 'fine-tuning' | 'pretraining' | 'evaluation' | 'data-prep'

// Result data for completed/failed/cancelled runs
export interface RunResultData {
  // Final metrics
  finalAccuracy?: number
  validationAccuracy?: number
  finalLoss?: number
  totalEpochs: number
  completedEpochs: number
  
  // Epoch-based metrics for charts (epoch -> metrics)
  epochMetrics?: Array<{
    epoch: number
    trainLoss?: number
    valLoss?: number
    trainAcc?: number
    valAcc?: number
  }>
  
  // Evaluation metrics (optional, depends on task type)
  confusionMatrix?: number[][]
  rocAuc?: number
  precision?: number
  recall?: number
  f1Score?: number
  
  // Timing
  startTime: string
  endTime: string
  durationSeconds: number
  
  // Error info (for failed runs)
  errorMessage?: string
  errorSummary?: string
  
  // Artifacts
  artifacts?: Array<{
    name: string
    type: 'model' | 'metrics' | 'config' | 'logs'
    size: number
    path: string
  }>
}

export interface RunDraft {
  id: string
  name: string
  projectId: string
  datasetId: string // REQUIRED: Dataset for training data
  trainerId: string // REQUIRED: Trainer defines training logic/script
  computeId: string // REQUIRED: Compute environment for execution
  purpose: RunPurpose
  parameters: Record<string, string>
  tags: string[]
  notes?: string
  status: RunStatus
  validationErrors: string[]
  createdAt: string
  updatedAt: string
  // Result data (only for FINAL status runs)
  resultData?: RunResultData
}

interface RunState {
  runs: RunDraft[]
  // Cache for datasets (used for validation)
  _datasetCache: Map<string, Dataset>
  _datasetsByProjectCache: Map<string, Dataset[]>
  addRun: (run: Omit<RunDraft, 'id' | 'status' | 'validationErrors' | 'createdAt' | 'updatedAt'>) => Promise<RunDraft>
  updateRun: (id: string, updates: Partial<Omit<RunDraft, 'id' | 'status' | 'validationErrors'>>) => Promise<void>
  deleteRun: (id: string) => void
  getRun: (id: string) => RunDraft | undefined
  searchRuns: (query: string) => RunDraft[]
  validateRun: (run: Partial<RunDraft>) => { status: RunStatus; errors: string[] }
  setRunResultData: (id: string, status: 'completed' | 'failed' | 'cancelled', resultData: RunResultData) => void
  // Helper functions for dataset access (using cache)
  _getDataset: (id: string) => Dataset | undefined
  _getDatasetsByProject: (projectId: string) => Dataset[]
  _refreshDatasetCache: (projectId?: string) => Promise<void>
}

// Flag to enable/disable mock data for development/demo purposes
const USE_MOCK_RUNS = true

// Validation function to determine run status
function validateRunDraft(
  run: Partial<RunDraft>,
  getProject: (id: string) => any,
  getDataset: (id: string) => any,
  getTrainer: (id: string) => any,
  getCompute: (id: string) => any,
  getDatasetsByProject: (projectId: string) => any[],
  getTrainersByProject: (projectId: string) => any[],
  getComputesByProject: (projectId: string) => any[]
): { status: RunStatus; errors: string[] } {
  const errors: string[] = []

  // Check required fields
  if (!run.name || !run.name.trim()) {
    errors.push('Run name wajib diisi')
  }

  if (!run.projectId) {
    errors.push('Project belum dipilih')
  } else {
    const project = getProject(run.projectId)
    if (!project) {
      errors.push('Project tidak ditemukan')
    } else {
      // Check if project has required resources
      const projectDatasets = getDatasetsByProject(run.projectId)
      const projectTrainers = getTrainersByProject(run.projectId)
      const projectComputes = getComputesByProject(run.projectId)

      if (projectDatasets.length === 0) {
        errors.push('Project belum memiliki dataset yang tersedia')
      }
      if (projectTrainers.length === 0) {
        errors.push('Project belum memiliki trainer yang tersedia')
      }
      if (projectComputes.length === 0) {
        errors.push('Project belum memiliki compute environment yang tersedia')
      }
    }
  }

  if (!run.datasetId) {
    errors.push('Dataset belum dipilih')
  } else {
    const dataset = getDataset(run.datasetId)
    if (!dataset) {
      errors.push('Dataset tidak ditemukan')
    }
  }

  if (!run.trainerId) {
    errors.push('Trainer belum dipilih')
  } else {
    const trainer = getTrainer(run.trainerId)
    if (!trainer) {
      errors.push('Trainer tidak ditemukan')
    }
  }

  if (!run.computeId) {
    errors.push('Compute environment belum dipilih')
  } else {
    const compute = getCompute(run.computeId)
    if (!compute) {
      errors.push('Compute environment tidak ditemukan')
    }
  }

  // Determine status
  if (errors.length === 0) {
    return { status: 'ready', errors: [] }
  } else if (run.name && run.projectId && run.datasetId && run.trainerId && run.computeId) {
    // Has basic fields but has validation errors
    return { status: 'blocked', errors }
  } else {
    // Missing required fields
    return { status: 'draft', errors }
  }
}

// Mock initial data for Module 4 - Run Setup (PRE-Training)
// These are dummy run drafts for UI visualization only.
// NO training execution, NO trainer API calls, NO log streaming, NO metrics.
const mockRuns: RunDraft[] = USE_MOCK_RUNS
  ? [
      {
        id: 'run-mock-1',
        name: 'Fine-tune BERT for Sentiment',
        projectId: 'project-mock-1',
        datasetId: 'dataset-mock-1',
        trainerId: 'trainer-mock-1',
        computeId: 'compute-mock-1',
        purpose: 'fine-tuning',
        parameters: {
          learning_rate: '0.0001',
          batch_size: '32',
          epochs: '10',
        },
        tags: ['bert', 'nlp', 'sentiment'],
        notes: 'Fine-tuning BERT model untuk analisis sentimen bahasa Indonesia',
        status: 'ready',
        validationErrors: [],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        id: 'run-mock-2',
        name: 'Pretrain Vision Transformer',
        projectId: 'project-mock-2',
        datasetId: 'dataset-mock-3',
        trainerId: 'trainer-mock-3',
        computeId: 'compute-mock-3',
        purpose: 'pretraining',
        parameters: {
          learning_rate: '0.001',
          batch_size: '64',
        },
        tags: ['vision', 'transformer'],
        status: 'draft',
        validationErrors: [],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      {
        id: 'run-mock-3',
        name: 'Evaluate Recommendation Model',
        projectId: 'project-mock-3',
        purpose: 'evaluation',
        parameters: {},
        tags: [],
        status: 'blocked',
        validationErrors: [
          'Project belum memiliki dataset yang tersedia',
          'Dataset belum dipilih',
          'Trainer belum dipilih',
          'Compute environment belum dipilih',
        ],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
      },
    ]
  : []

// Initial runs: use mock data if enabled, otherwise empty array
const initialRuns: RunDraft[] = mockRuns

export const useRunStore = create<RunState>()(
  persist(
    (set, get) => ({
      // Initialize with mock data if enabled, otherwise start empty
      // Note: persist middleware will override this with stored data if it exists
      runs: initialRuns,
      // Cache for datasets (not persisted - Map cannot be serialized)
      _datasetCache: new Map<string, Dataset>(),
      _datasetsByProjectCache: new Map<string, Dataset[]>(),

      // Helper functions for dataset access (using cache)
      _getDataset: (id: string) => {
        return get()._datasetCache.get(id)
      },

      _getDatasetsByProject: (projectId: string) => {
        return get()._datasetsByProjectCache.get(projectId) || []
      },

      _refreshDatasetCache: async (projectId?: string) => {
        if (projectId) {
          try {
            const datasets = await fetchDatasets({ project_id: projectId })
            const cache = new Map<string, Dataset>()
            datasets.forEach((d) => cache.set(d.id, d))
            set((state) => ({
              _datasetCache: new Map([...state._datasetCache, ...cache]),
              _datasetsByProjectCache: new Map(state._datasetsByProjectCache).set(projectId, datasets),
            }))
          } catch (error) {
            console.error('[RunStore] Failed to refresh dataset cache:', error)
          }
        }
      },

      addRun: async (runData) => {
        // Project-First Enforcement: projectId is required
        if (!runData.projectId) {
          throw new Error('PROJECT_CONTEXT_REQUIRED: Run must belong to a project')
        }

        // Get validation dependencies
        const projectStore = useProjectStore.getState()
        const trainerStore = useTrainerStore.getState()
        const computeStore = useComputeStore.getState()

        // Refresh dataset cache if needed
        if (runData.projectId) {
          await get()._refreshDatasetCache(runData.projectId)
        }

        // Validate the run
        const validation = validateRunDraft(
          runData,
          projectStore.getProject,
          get()._getDataset,
          trainerStore.getTrainer,
          computeStore.getCompute,
          get()._getDatasetsByProject,
          trainerStore.getTrainersByProject,
          computeStore.getComputesByProject
        )

        const newRun: RunDraft = {
          id: `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...runData,
          status: validation.status,
          validationErrors: validation.errors,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          runs: [...state.runs, newRun],
        }))

        return newRun
      },

      updateRun: async (id, updates) => {
        const run = get().runs.find((r) => r.id === id)
        if (!run) return

        const updatedRun = { ...run, ...updates }

        // Re-validate
        const projectStore = useProjectStore.getState()
        const trainerStore = useTrainerStore.getState()
        const computeStore = useComputeStore.getState()

        // Refresh dataset cache if needed
        if (updatedRun.projectId) {
          await get()._refreshDatasetCache(updatedRun.projectId)
        }

        const validation = validateRunDraft(
          updatedRun,
          projectStore.getProject,
          get()._getDataset,
          trainerStore.getTrainer,
          computeStore.getCompute,
          get()._getDatasetsByProject,
          trainerStore.getTrainersByProject,
          computeStore.getComputesByProject
        )

        set((state) => ({
          runs: state.runs.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...updates,
                  status: validation.status,
                  validationErrors: validation.errors,
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        }))
      },

      deleteRun: (id) => {
        set((state) => ({
          runs: state.runs.filter((run) => run.id !== id),
        }))
      },

      getRun: (id) => {
        return get().runs.find((r) => r.id === id)
      },

      searchRuns: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().runs.filter(
          (run) =>
            run.name.toLowerCase().includes(lowerQuery) ||
            run.notes?.toLowerCase().includes(lowerQuery) ||
            run.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
        )
      },

      validateRun: (run) => {
        const projectStore = useProjectStore.getState()
        const trainerStore = useTrainerStore.getState()
        const computeStore = useComputeStore.getState()

        // Note: This is synchronous validation, so it uses cached data
        // For fresh data, call _refreshDatasetCache first
        return validateRunDraft(
          run,
          projectStore.getProject,
          get()._getDataset,
          trainerStore.getTrainer,
          computeStore.getCompute,
          get()._getDatasetsByProject,
          trainerStore.getTrainersByProject,
          computeStore.getComputesByProject
        )
      },

      setRunResultData: (id, status, resultData) => {
        set((state) => ({
          runs: state.runs.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status,
                  resultData,
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        }))
      },
    }),
    {
      name: 'run-storage',
      partialize: (state) => ({
        runs: state.runs,
        // Exclude Map caches from persistence (Map cannot be serialized)
      }),
      // Initialize with mock data on first load if enabled and storage is empty
      onRehydrateStorage: () => (state) => {
        // If no state exists or runs array is empty, and mock data is enabled
        // Initialize with mock data (only on first load)
        if (USE_MOCK_RUNS) {
          const stored = localStorage.getItem('run-storage')
          if (!stored || (state && state.runs.length === 0)) {
            // First time load or empty storage - use mock data
            if (state) {
              state.runs = [...mockRuns]
            }
          }
        }
      },
    }
  )
)
