import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TrainerFramework = 'pytorch' | 'tensorflow' | 'custom'
export type TrainerTask = 'classification' | 'regression' | 'nlp' | 'cv' | 'other'
export type TrainerStatus = 'active' | 'inactive' | 'archived'

export interface Trainer {
  id: string
  name: string
  framework: TrainerFramework
  task: TrainerTask
  entryPointScript: string // Path to training script
  version: string
  status: TrainerStatus
  defaultHyperparameters?: Record<string, string> // Default hyperparameters
  description?: string
  projectId: string // REQUIRED: Project-First enforcement - trainer belongs to exactly one project
  baseModelId: string // REQUIRED: Trainer MUST reference 1 Base Model
  createdAt: string
  updatedAt: string
}

interface TrainerState {
  trainers: Trainer[]
  addTrainer: (
    trainer: Omit<
      Trainer,
      'id' | 'status' | 'createdAt' | 'updatedAt'
    >
  ) => Trainer
  updateTrainer: (id: string, updates: Partial<Trainer>) => void
  deleteTrainer: (id: string) => void
  getTrainer: (id: string) => Trainer | undefined
  getTrainersByProject: (projectId: string) => Trainer[]
  searchTrainers: (query: string) => Trainer[]
}

// Flag to enable/disable mock data for development/demo purposes
const USE_MOCK_TRAINERS = true

// Mock initial data for Trainer module
const mockTrainers: Trainer[] = USE_MOCK_TRAINERS
  ? [
      {
        id: 'trainer-mock-1',
        name: 'BERT Fine-tuning Trainer',
        framework: 'pytorch',
        task: 'nlp',
        entryPointScript: 'train_bert.py',
        version: '1.0.0',
        status: 'active',
        defaultHyperparameters: {
          learning_rate: '0.0001',
          batch_size: '32',
          epochs: '10',
        },
        description: 'Trainer untuk fine-tuning BERT model',
        projectId: 'project-mock-1',
        baseModelId: 'base-model-hf-1', // References bert-base-uncased
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'trainer-mock-2',
        name: 'Vision Transformer Trainer',
        framework: 'pytorch',
        task: 'cv',
        entryPointScript: 'train_vit.py',
        version: '2.1.0',
        status: 'active',
        defaultHyperparameters: {
          learning_rate: '0.001',
          batch_size: '64',
          image_size: '224',
        },
        description: 'Trainer untuk Vision Transformer',
        projectId: 'project-mock-1',
        baseModelId: 'base-model-hf-2', // References google/vit-base-patch16-224
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'trainer-mock-3',
        name: 'Custom ML Trainer',
        framework: 'custom',
        task: 'regression',
        entryPointScript: 'train_custom.py',
        version: '1.5.0',
        status: 'active',
        defaultHyperparameters: {
          learning_rate: '0.01',
          batch_size: '128',
        },
        projectId: 'project-mock-2',
        baseModelId: 'base-model-scratch-1', // References Custom Transformer
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]
  : []

// Initial trainers: use mock data if enabled, otherwise empty array
const initialTrainers: Trainer[] = mockTrainers

export const useTrainerStore = create<TrainerState>()(
  persist(
    (set, get) => ({
      // Initialize with mock data if enabled, otherwise start empty
      trainers: initialTrainers,

      addTrainer: (trainerData) => {
        // Project-First Enforcement: projectId is required
        if (!trainerData.projectId) {
          throw new Error('PROJECT_CONTEXT_REQUIRED: Trainer must belong to a project')
        }

        // Base Model Enforcement: baseModelId is required
        if (!trainerData.baseModelId) {
          throw new Error('BASE_MODEL_REQUIRED: Trainer must reference a base model')
        }

        const newTrainer: Trainer = {
          id: `trainer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...trainerData,
          status: trainerData.status || 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          trainers: [...state.trainers, newTrainer],
        }))

        return newTrainer
      },

      updateTrainer: (id, updates) => {
        set((state) => ({
          trainers: state.trainers.map((trainer) =>
            trainer.id === id
              ? { ...trainer, ...updates, updatedAt: new Date().toISOString() }
              : trainer
          ),
        }))
      },

      deleteTrainer: (id) => {
        set((state) => ({
          trainers: state.trainers.filter((trainer) => trainer.id !== id),
        }))
      },

      getTrainer: (id) => {
        return get().trainers.find((t) => t.id === id)
      },

      getTrainersByProject: (projectId) => {
        return get().trainers.filter((trainer) =>
          trainer.projectId === projectId
        )
      },

      searchTrainers: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().trainers.filter(
          (trainer) =>
            trainer.name.toLowerCase().includes(lowerQuery) ||
            trainer.description?.toLowerCase().includes(lowerQuery) ||
            trainer.framework.toLowerCase().includes(lowerQuery) ||
            trainer.task.toLowerCase().includes(lowerQuery)
        )
      },
    }),
    {
      name: 'trainer-storage',
      // Initialize with mock data on first load if enabled and storage is empty
      onRehydrateStorage: () => (state) => {
        if (USE_MOCK_TRAINERS) {
          const stored = localStorage.getItem('trainer-storage')
          if (!stored || (state && state.trainers.length === 0)) {
            if (state) {
              state.trainers = [...mockTrainers]
            }
          }
        }
      },
    }
  )
)
