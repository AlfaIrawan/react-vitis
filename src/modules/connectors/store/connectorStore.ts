import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ConnectorType = 'engine' | 'data-source'
export type ConnectorStatus = 'connected' | 'not-connected'

export type ConnectionMethod = 
  | 'api-endpoint'     // Engine & Data Source (API/Data API/Object Storage)
  | 'cli-command'      // Engine & Data Source (File System)
  | 'connection-string' // Data Source (Relational Database)

export type DataSourceType = 
  | 'relational-database'
  | 'object-storage'
  | 'file-system'
  | 'data-api'

export interface ConnectorAuth {
  type?: 'token' | 'username-password'
  token?: string // masked
  username?: string
  password?: string // masked
}

export interface Connector {
  id: string
  name: string
  type: ConnectorType
  status: ConnectorStatus
  connectionMethod: ConnectionMethod
  dataSourceType?: DataSourceType // Only for data-source connectors
  apiEndpoint?: string
  cliCommand?: string
  connectionString?: string // For relational-database data source type
  auth?: ConnectorAuth
  projectId: string // REQUIRED: Project-First enforcement - connector belongs to exactly one project
  lastChecked?: string // ISO date string, optional
  createdAt: string
  updatedAt: string
}

interface ConnectorState {
  connectors: Connector[]
  addConnector: (
    connector: Omit<
      Connector,
      'id' | 'status' | 'createdAt' | 'updatedAt'
    >
  ) => Connector
  updateConnector: (id: string, updates: Partial<Connector>) => void
  deleteConnector: (id: string) => void
  getConnector: (id: string) => Connector | undefined
  getConnectorsByProject: (projectId: string) => Connector[]
  searchConnectors: (query: string) => Connector[]
}

// Flag to enable/disable mock data for development/demo purposes
const USE_MOCK_CONNECTORS = true

// Mock initial data for Module 3 - Connector Management
// These are dummy connectors for UI visualization only.
// NO training logic, execution, or engine integration.
const mockConnectors: Connector[] = USE_MOCK_CONNECTORS
  ? [
      {
        id: 'connector-mock-1',
        name: 'Core Banking REST API',
        type: 'engine',
        status: 'connected',
        connectionMethod: 'api-endpoint',
        apiEndpoint: 'https://api.bank.internal/v1',
        projectId: 'project-mock-1',
        lastChecked: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'connector-mock-2',
        name: 'Operational Data Store',
        type: 'data-source',
        status: 'connected',
        dataSourceType: 'relational-database',
        connectionMethod: 'connection-string',
        connectionString: 'postgresql://localhost:5432/orchestration_ops',
        auth: {
          type: 'username-password',
          username: 'admin',
        },
        projectId: 'project-mock-1',
        lastChecked: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'connector-mock-3',
        name: 'Object Storage',
        type: 'data-source',
        status: 'not-connected',
        dataSourceType: 'object-storage',
        connectionMethod: 'api-endpoint',
        apiEndpoint: 'https://storage.example.com/bucket-name',
        auth: {
          type: 'token',
        },
        projectId: 'project-mock-3',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]
  : []

// Initial connectors: use mock data if enabled, otherwise empty array
const initialConnectors: Connector[] = mockConnectors

export const useConnectorStore = create<ConnectorState>()(
  persist(
    (set, get) => ({
      // Initialize with mock data if enabled, otherwise start empty
      // Note: persist middleware will override this with stored data if it exists
      connectors: initialConnectors,

      addConnector: (connectorData) => {
        // Project-First Enforcement: projectId is required
        if (!connectorData.projectId) {
          throw new Error('PROJECT_CONTEXT_REQUIRED: Connector must belong to a project')
        }

        const newConnector: Connector = {
          id: `connector-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...connectorData,
          status: connectorData.status || 'not-connected',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          connectors: [...state.connectors, newConnector],
        }))

        return newConnector
      },

      updateConnector: (id, updates) => {
        set((state) => ({
          connectors: state.connectors.map((connector) =>
            connector.id === id
              ? { ...connector, ...updates, updatedAt: new Date().toISOString() }
              : connector
          ),
        }))
      },

      deleteConnector: (id) => {
        set((state) => ({
          connectors: state.connectors.filter((connector) => connector.id !== id),
        }))
      },

      getConnector: (id) => {
        return get().connectors.find((c) => c.id === id)
      },

      getConnectorsByProject: (projectId) => {
        return get().connectors.filter((connector) =>
          connector.projectId === projectId
        )
      },

      searchConnectors: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().connectors.filter(
          (connector) =>
            connector.name.toLowerCase().includes(lowerQuery) ||
            connector.type.toLowerCase().includes(lowerQuery)
        )
      },
    }),
    {
      name: 'vitis-connector-storage',
      // Initialize with mock data on first load if enabled and storage is empty
      onRehydrateStorage: () => (state) => {
        // If no state exists or connectors array is empty, and mock data is enabled
        // Initialize with mock data (only on first load)
        if (USE_MOCK_CONNECTORS) {
          const stored = localStorage.getItem('vitis-connector-storage')
          if (!stored || (state && state.connectors.length === 0)) {
            // First time load or empty storage - use mock data
            if (state) {
              state.connectors = [...mockConnectors]
            }
          }
        }
      },
    }
  )
)
