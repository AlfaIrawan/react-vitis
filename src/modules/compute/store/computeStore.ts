import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ComputeType = 'local' | 'docker' | 'kubernetes' | 'managed'
export type ComputeStatus = 'available' | 'busy' | 'unavailable'

export interface ComputeResource {
  cpu?: string // e.g., "4 cores"
  gpu?: string // e.g., "1x NVIDIA A100"
  memory?: string // e.g., "16GB"
}

export interface Compute {
  id: string
  name: string
  type: ComputeType
  status: ComputeStatus
  resources?: ComputeResource
  description?: string
  projectId: string // REQUIRED: Project-First enforcement - compute belongs to exactly one project
  createdAt: string
  updatedAt: string
}

interface ComputeState {
  computes: Compute[]
  addCompute: (
    compute: Omit<
      Compute,
      'id' | 'status' | 'createdAt' | 'updatedAt'
    >
  ) => Compute
  updateCompute: (id: string, updates: Partial<Compute>) => void
  deleteCompute: (id: string) => void
  getCompute: (id: string) => Compute | undefined
  getComputesByProject: (projectId: string) => Compute[]
  searchComputes: (query: string) => Compute[]
}

// Flag to enable/disable mock data for development/demo purposes
const USE_MOCK_COMPUTES = true

// Mock initial data for Compute module
const mockComputes: Compute[] = USE_MOCK_COMPUTES
  ? [
      {
        id: 'compute-mock-1',
        name: 'Local Development Machine',
        type: 'local',
        status: 'available',
        resources: {
          cpu: '8 cores',
          gpu: '1x NVIDIA RTX 3080',
          memory: '32GB',
        },
        description: 'Local machine untuk development dan testing',
        projectId: 'project-mock-1',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'compute-mock-2',
        name: 'Docker Container',
        type: 'docker',
        status: 'available',
        resources: {
          cpu: '4 cores',
          memory: '16GB',
        },
        description: 'Docker container untuk training',
        projectId: 'project-mock-1',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'compute-mock-3',
        name: 'Kubernetes Cluster',
        type: 'kubernetes',
        status: 'available',
        resources: {
          cpu: '16 cores',
          gpu: '2x NVIDIA A100',
          memory: '64GB',
        },
        description: 'Kubernetes cluster untuk production training',
        projectId: 'project-mock-2',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'compute-mock-4',
        name: 'Managed Cloud Compute',
        type: 'managed',
        status: 'busy',
        resources: {
          cpu: '32 cores',
          gpu: '4x NVIDIA V100',
          memory: '128GB',
        },
        description: 'Managed cloud compute untuk large-scale training',
        projectId: 'project-mock-2',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ]
  : []

// Initial computes: use mock data if enabled, otherwise empty array
const initialComputes: Compute[] = mockComputes

export const useComputeStore = create<ComputeState>()(
  persist(
    (set, get) => ({
      // Initialize with mock data if enabled, otherwise start empty
      computes: initialComputes,

      addCompute: (computeData) => {
        // Project-First Enforcement: projectId is required
        if (!computeData.projectId) {
          throw new Error('PROJECT_CONTEXT_REQUIRED: Compute must belong to a project')
        }

        const newCompute: Compute = {
          id: `compute-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...computeData,
          status: computeData.status || 'available',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          computes: [...state.computes, newCompute],
        }))

        return newCompute
      },

      updateCompute: (id, updates) => {
        set((state) => ({
          computes: state.computes.map((compute) =>
            compute.id === id
              ? { ...compute, ...updates, updatedAt: new Date().toISOString() }
              : compute
          ),
        }))
      },

      deleteCompute: (id) => {
        set((state) => ({
          computes: state.computes.filter((compute) => compute.id !== id),
        }))
      },

      getCompute: (id) => {
        return get().computes.find((c) => c.id === id)
      },

      getComputesByProject: (projectId) => {
        return get().computes.filter((compute) =>
          compute.projectId === projectId
        )
      },

      searchComputes: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().computes.filter(
          (compute) =>
            compute.name.toLowerCase().includes(lowerQuery) ||
            compute.description?.toLowerCase().includes(lowerQuery) ||
            compute.type.toLowerCase().includes(lowerQuery)
        )
      },
    }),
    {
      name: 'compute-storage',
      // Initialize with mock data on first load if enabled and storage is empty
      onRehydrateStorage: () => (state) => {
        if (USE_MOCK_COMPUTES) {
          const stored = localStorage.getItem('compute-storage')
          if (!stored || (state && state.computes.length === 0)) {
            if (state) {
              state.computes = [...mockComputes]
            }
          }
        }
      },
    }
  )
)
