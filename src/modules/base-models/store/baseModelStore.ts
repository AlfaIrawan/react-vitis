import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BaseModelSourceType = 'huggingface' | 'scratch' | 'ollama' | 'upload'
export type BaseModelFramework = 'pytorch' | 'tensorflow' | 'other'
export type BaseModelTask = 'nlp' | 'vision' | 'multimodal' | 'custom'
export type BaseModelRiskLevel = 'low' | 'medium' | 'high'
export type BaseModelRuntimeScope = 'cloud' | 'local' | 'hybrid'

export interface BaseModelOrigin {
  huggingface_repo?: string | null
  ollama_model?: string | null
  revision?: string | null
  sha?: string | null
  author?: string | null
  org?: string | null
  local_cache?: string | null
}

export interface BaseModelGovernance {
  documentation_required: boolean
  bias_required: boolean
  explainability_required: boolean
  external_dependency?: boolean
  license_acknowledged?: boolean
}

export interface BaseModel {
  id: string
  projectId: string // REQUIRED: Project-First enforcement - base model belongs to exactly one project
  name: string
  description?: string
  source_type: BaseModelSourceType
  source_reference: string // HuggingFace repo ID, Ollama model name, or 'scratch'
  framework: BaseModelFramework
  task: BaseModelTask
  architecture?: string // Architecture type for scratch models
  parameters?: Record<string, any> // Optional parameters
  origin: BaseModelOrigin
  runtime_scope: BaseModelRuntimeScope
  license: string
  risk_level: BaseModelRiskLevel
  governance: BaseModelGovernance
  created_by: string
  created_at: string
  updated_at?: string
  download_status?: 'pending' | 'downloading' | 'completed' | 'failed'
  download_progress?: number
  local_path?: string
  downloaded_at?: string
  deprecated?: boolean
  // Architecture details (for scratch models)
  architecture_type?: 'transformer' | 'cnn' | 'lstm' | 'custom'
  input_type?: 'text' | 'image' | 'tabular'
  initialization?: 'random' | 'xavier' | 'he' | 'custom'
  custom_init_script?: string
  // Ollama-specific
  quantization?: string
}

interface BaseModelState {
  baseModels: BaseModel[]
  addBaseModel: (baseModel: Omit<BaseModel, 'id' | 'created_at' | 'updated_at'>) => BaseModel
  updateBaseModel: (id: string, updates: Partial<BaseModel>) => void
  deleteBaseModel: (id: string) => void
  deprecateBaseModel: (id: string) => void
  getBaseModel: (id: string) => BaseModel | undefined
  getBaseModelsByProject: (projectId: string) => BaseModel[]
  searchBaseModels: (projectId: string, query: string) => BaseModel[]
  filterBaseModels: (projectId: string, filters: {
    source_type?: BaseModelSourceType
    framework?: BaseModelFramework
    task?: BaseModelTask
    risk_level?: BaseModelRiskLevel
    runtime_scope?: BaseModelRuntimeScope
  }) => BaseModel[]
}

// Flag to enable/disable mock data
const USE_MOCK_BASE_MODELS = true

// Mock initial data
const mockBaseModels: BaseModel[] = USE_MOCK_BASE_MODELS
  ? [
      {
        id: 'base-model-hf-1',
        projectId: 'project-mock-1',
        name: 'bert-base-uncased',
        description: 'BERT base model for NLP tasks',
        source_type: 'huggingface',
        source_reference: 'bert-base-uncased',
        framework: 'pytorch',
        task: 'nlp',
        origin: {
          huggingface_repo: 'bert-base-uncased',
          author: 'Google',
          org: 'google',
          revision: 'main',
          sha: 'abc123def456',
        },
        runtime_scope: 'cloud',
        license: 'Apache 2.0',
        risk_level: 'low',
        governance: {
          documentation_required: true,
          bias_required: true,
          explainability_required: true,
          external_dependency: true,
          license_acknowledged: true,
        },
        created_by: 'user-1',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'base-model-hf-2',
        projectId: 'project-mock-2',
        name: 'google/vit-base-patch16-224',
        description: 'Vision Transformer for image classification',
        source_type: 'huggingface',
        source_reference: 'google/vit-base-patch16-224',
        framework: 'pytorch',
        task: 'vision',
        origin: {
          huggingface_repo: 'google/vit-base-patch16-224',
          author: 'Google',
          org: 'google',
          revision: 'main',
        },
        runtime_scope: 'cloud',
        license: 'Apache 2.0',
        risk_level: 'low',
        governance: {
          documentation_required: true,
          bias_required: true,
          explainability_required: true,
          external_dependency: true,
          license_acknowledged: true,
        },
        created_by: 'user-1',
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'base-model-ollama-1',
        projectId: 'project-mock-1',
        name: 'llama3:8b',
        description: 'Llama 3 8B model from Ollama',
        source_type: 'ollama',
        source_reference: 'llama3:8b',
        framework: 'pytorch',
        task: 'nlp',
        origin: {
          ollama_model: 'llama3:8b',
        },
        runtime_scope: 'local',
        license: 'Meta Llama 3 Community License',
        risk_level: 'medium',
        governance: {
          documentation_required: true,
          bias_required: true,
          explainability_required: true,
          external_dependency: false,
          license_acknowledged: true,
        },
        created_by: 'user-1',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        quantization: 'Q4_0',
      },
      {
        id: 'base-model-scratch-1',
        projectId: 'project-mock-2',
        name: 'Custom Transformer',
        description: 'Custom transformer architecture from scratch',
        source_type: 'scratch',
        source_reference: 'scratch',
        framework: 'pytorch',
        task: 'nlp',
        architecture: 'transformer',
        origin: {},
        runtime_scope: 'hybrid',
        license: 'Proprietary',
        risk_level: 'high',
        governance: {
          documentation_required: true,
          bias_required: true,
          explainability_required: true,
          external_dependency: false,
        },
        created_by: 'user-1',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        architecture_type: 'transformer',
        input_type: 'text',
        initialization: 'xavier',
      },
    ]
  : []

const initialBaseModels: BaseModel[] = mockBaseModels

export const useBaseModelStore = create<BaseModelState>()(
  persist(
    (set, get) => ({
      baseModels: initialBaseModels,

      addBaseModel: (baseModelData) => {
        // Project-First Enforcement: projectId is required
        if (!baseModelData.projectId) {
          throw new Error('PROJECT_CONTEXT_REQUIRED: Base Model must belong to a project')
        }

        const newBaseModel: BaseModel = {
          id: `base-model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...baseModelData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        set((state) => ({
          baseModels: [...state.baseModels, newBaseModel],
        }))

        return newBaseModel
      },

      updateBaseModel: (id, updates) => {
        set((state) => ({
          baseModels: state.baseModels.map((bm) =>
            bm.id === id
              ? { ...bm, ...updates, updated_at: new Date().toISOString() }
              : bm
          ),
        }))
      },

      deleteBaseModel: (id) => {
        set((state) => ({
          baseModels: state.baseModels.filter((bm) => bm.id !== id),
        }))
      },

      deprecateBaseModel: (id) => {
        set((state) => ({
          baseModels: state.baseModels.map((bm) =>
            bm.id === id ? { ...bm, deprecated: true, updated_at: new Date().toISOString() } : bm
          ),
        }))
      },

      getBaseModel: (id) => {
        return get().baseModels.find((bm) => bm.id === id && !bm.deprecated)
      },

      getBaseModelsByProject: (projectId) => {
        return get().baseModels.filter((bm) => bm.projectId === projectId && !bm.deprecated)
      },

      searchBaseModels: (projectId, query) => {
        const lowerQuery = query.toLowerCase()
        return get()
          .baseModels.filter((bm) => bm.projectId === projectId && !bm.deprecated)
          .filter(
            (bm) =>
              bm.name.toLowerCase().includes(lowerQuery) ||
              bm.description?.toLowerCase().includes(lowerQuery) ||
              bm.task.toLowerCase().includes(lowerQuery) ||
              bm.framework.toLowerCase().includes(lowerQuery) ||
              bm.license.toLowerCase().includes(lowerQuery)
          )
      },

      filterBaseModels: (projectId, filters) => {
        return get()
          .baseModels.filter((bm) => bm.projectId === projectId && !bm.deprecated)
          .filter((bm) => {
            if (filters.source_type && bm.source_type !== filters.source_type) return false
            if (filters.framework && bm.framework !== filters.framework) return false
            if (filters.task && bm.task !== filters.task) return false
            if (filters.risk_level && bm.risk_level !== filters.risk_level) return false
            if (filters.runtime_scope && bm.runtime_scope !== filters.runtime_scope) return false
            return true
          })
      },
    }),
    {
      name: 'base-model-storage',
      onRehydrateStorage: () => (state) => {
        if (USE_MOCK_BASE_MODELS) {
          const stored = localStorage.getItem('base-model-storage')
          if (!stored || (state && state.baseModels.length === 0)) {
            if (state) {
              state.baseModels = [...mockBaseModels]
            }
          }
        }
      },
    }
  )
)
