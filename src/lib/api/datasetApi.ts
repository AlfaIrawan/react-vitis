/**
 * Dataset service API client.
 * Uses python-dataset-service-fastapi (http://localhost:8600).
 * Falls back to python-connector-service-fastapi (http://localhost:8400) for backward compatibility.
 */

import type { Dataset, DatasetType, DatasetStatus, DatasetSchema } from '@/modules/datasets'

const DATASET_API_BASE_URL = import.meta.env.VITE_DATASET_API_URL ?? 'http://localhost:8600/v1/datasets'
const CONNECTOR_API_BASE_URL = import.meta.env.VITE_CONNECTOR_API_URL ?? 'http://localhost:8400/v1/connectors'

// Lookup table IDs (from dataset service seed data)
const LOOKUP_IDS = {
  datasetType: {
    database: '550e8400-e29b-41d4-a716-446655440201', // database
    file: '550e8400-e29b-41d4-a716-446655440202', // file
    objectStorage: '550e8400-e29b-41d4-a716-446655440203', // object-storage
  },
  datasetStatus: {
    active: '550e8400-e29b-41d4-a716-446655440211', // active
    inactive: '550e8400-e29b-41d4-a716-446655440212', // inactive
    archived: '550e8400-e29b-41d4-a716-446655440213', // archived
  },
  // Connector service lookup IDs (for backward compatibility)
  connectorType: {
    dataSource: '550e8400-e29b-41d4-a716-446655440002', // data-source
  },
  connectorStatus: {
    connected: '550e8400-e29b-41d4-a716-446655440011', // connected
  },
  dataSourceType: {
    relationalDatabase: '550e8400-e29b-41d4-a716-446655440031', // relational-database
  },
}

// Backend API response format (from dataset service)
interface BackendDatasetResponse {
  id: string
  project_id: string
  name: string
  type_id: string
  type_code: string // 'database', 'file', 'object-storage'
  status_id: string
  status_code: string // 'active', 'inactive', 'archived'
  description?: string
  connector_id?: string | null
  connection_string?: string
  username?: string
  // password is not in response (encrypted in database)
  query?: string
  table_name?: string
  label_column?: string
  label_classes?: string[]
  created_by: string
  created_date: string
  created_from: string
  updated_by?: string
  updated_date?: string
  updated_from?: string
  schema_fields?: Array<{
    id: string
    dataset_id: string
    field_name: string
    field_type_id: string
    field_type_code: string
    description?: string
    display_order: number
    is_label: boolean
  }>
}

// Backend API response format (from connector service - for backward compatibility)
interface BackendConnectorResponse {
  id: string
  project_id: string
  name: string
  type_id: string
  status_id: string
  connection_method_id: string
  data_source_type_id?: string
  connection_string?: string
  username?: string
  password?: string // Never actually returned from backend
  description?: string
  created_by: string
  created_date: string
  created_from: string
  updated_by?: string
  updated_date?: string
  updated_from?: string
}

interface DatasetListResponse {
  datasets: BackendDatasetResponse[]
  total: number
  page: number
  page_size: number
}

interface ConnectorListResponse {
  connectors: BackendConnectorResponse[]
  total: number
  page: number
  page_size: number
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    let errorMessage = text
    try {
      const errorData = JSON.parse(text)
      if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map((e: any) => e.msg || e.loc?.join('.') || JSON.stringify(e)).join(', ')
      } else if (errorData.detail) {
        errorMessage = errorData.detail
      }
    } catch {
      // Use text as-is if not JSON
    }
    throw new Error(errorMessage || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// Helper function to convert dataset service response to frontend dataset format
function backendDatasetToDataset(backend: BackendDatasetResponse): Dataset {
  // Convert schema fields if available
  let schema: DatasetSchema | undefined = undefined
  if (backend.schema_fields && backend.schema_fields.length > 0) {
    schema = {
      fields: backend.schema_fields.map(field => ({
        name: field.field_name,
        type: field.field_type_code,
        description: field.description,
      })),
      labelInfo: backend.label_column ? {
        column: backend.label_column,
        classes: backend.label_classes || [],
      } : undefined,
    }
  } else if (backend.label_column) {
    // If no schema fields but has label info, create minimal schema
    schema = {
      fields: [],
      labelInfo: {
        column: backend.label_column,
        classes: backend.label_classes || [],
      },
    }
  }
  
  return {
    id: backend.id,
    name: backend.name,
    type: backend.type_code as DatasetType, // 'database', 'file', 'object-storage'
    status: backend.status_code as DatasetStatus, // 'active', 'inactive', 'archived'
    schema,
    description: backend.description,
    connectorId: backend.connector_id ?? undefined,
    connectionString: backend.connection_string,
    username: backend.username,
    password: undefined, // Never returned from backend (encrypted)
    query: backend.query,
    tableName: backend.table_name,
    projectId: backend.project_id,
    createdAt: backend.created_date,
    updatedAt: backend.updated_date || backend.created_date,
  }
}

// Helper function to convert connector service response to frontend dataset format (for backward compatibility)
function connectorToDataset(connector: BackendConnectorResponse): Dataset {
  // Determine type based on data_source_type_id
  let type: DatasetType = 'file'
  if (connector.data_source_type_id === LOOKUP_IDS.dataSourceType.relationalDatabase) {
    type = 'database'
  }
  
  // Determine status based on status_id
  let status: DatasetStatus = 'inactive'
  if (connector.status_id === LOOKUP_IDS.connectorStatus.connected) {
    status = 'active'
  }
  
  return {
    id: connector.id,
    name: connector.name || 'Unnamed Dataset',
    type,
    status,
    schema: undefined, // Not stored in connector
    description: connector.description || undefined,
    connectionString: connector.connection_string || undefined,
    username: connector.username || undefined,
    password: undefined, // Never returned from backend
    query: undefined, // Not stored in connector
    tableName: undefined, // Not stored in connector
    projectId: connector.project_id || '',
    createdAt: connector.created_date || new Date().toISOString(),
    updatedAt: connector.updated_date || connector.created_date || new Date().toISOString(),
  }
}

// Helper function to convert frontend dataset to dataset service request format
function datasetToBackendDataset(dataset: Partial<Dataset>): any {
  const backend: any = {
    project_id: dataset.projectId!,
    // name and description are no longer stored - get from connector via connector_id
  }
  
  // Set type_id based on type
  if (dataset.type === 'database') {
    backend.type_id = LOOKUP_IDS.datasetType.database
  } else if (dataset.type === 'file') {
    backend.type_id = LOOKUP_IDS.datasetType.file
  } else if (dataset.type === 'object-storage') {
    backend.type_id = LOOKUP_IDS.datasetType.objectStorage
  } else {
    backend.type_id = LOOKUP_IDS.datasetType.file // default
  }
  
  // Set status_id based on status
  if (dataset.status === 'active') {
    backend.status_id = LOOKUP_IDS.datasetStatus.active
  } else if (dataset.status === 'inactive') {
    backend.status_id = LOOKUP_IDS.datasetStatus.inactive
  } else if (dataset.status === 'archived') {
    backend.status_id = LOOKUP_IDS.datasetStatus.archived
  } else {
    backend.status_id = LOOKUP_IDS.datasetStatus.active // default
  }
  
  // Add database-specific fields
  if (dataset.type === 'database') {
    // Use connector_id instead of connection_string/username/password
    // connector_id should be set when creating/updating dataset
    backend.connector_id = (dataset as any).connectorId || null
    backend.query = dataset.query || null
    backend.table_name = dataset.tableName || null
  }
  
  // Add label information if schema has labelInfo
  if (dataset.schema?.labelInfo) {
    backend.label_column = dataset.schema.labelInfo.column || null
    backend.label_classes = dataset.schema.labelInfo.classes || null
  }
  
  return backend
}

export interface FetchDatasetsParams {
  project_id?: string
  page?: number
  page_size?: number
}

/**
 * Fetch datasets from Connector Service (for listing page).
 * This uses Connector Service as the primary source for dataset listings.
 */
export async function fetchDatasets(params?: FetchDatasetsParams): Promise<Dataset[]> {
  let datasets: Dataset[] = []
  
  try {
    const searchParams = new URLSearchParams()
    if (params?.project_id) {
      searchParams.append('project_id', params.project_id)
    }
    // Filter by data-source type (datasets are data-source connectors)
    searchParams.append('type_id', LOOKUP_IDS.connectorType.dataSource)
    searchParams.append('page', String(params?.page ?? 1))
    searchParams.append('page_size', String(params?.page_size ?? 100))

    const url = `${CONNECTOR_API_BASE_URL}?${searchParams.toString()}`
    console.log('[DatasetAPI] Fetching datasets from Connector Service:', url)
    
    const response = await fetch(url)
    
    if (response.ok) {
      const result = await handleResponse<ConnectorListResponse>(response)
      console.log('[DatasetAPI] Connector Service Response:', result)
      const connectors = result.connectors || []
      console.log('[DatasetAPI] Number of connectors found:', connectors.length)
      
      datasets = connectors
        .map((connector: any) => {
          try {
            return connectorToDataset(connector)
          } catch (err) {
            console.error('[DatasetAPI] Error converting connector:', err, connector)
            return null
          }
        })
        .filter((dataset: Dataset | null): dataset is Dataset => dataset !== null)
    } else {
      console.error('[DatasetAPI] Connector Service error:', response.status, response.statusText)
      // Return empty array instead of throwing to allow UI to show empty state
    }
  } catch (connectorServiceError) {
    console.error('[DatasetAPI] Connector Service fetch error:', connectorServiceError)
    // Return empty array instead of throwing to allow UI to show empty state
  }

  console.log('[DatasetAPI] Final datasets:', datasets.length)
  return datasets
}

/**
 * Fetch a single dataset by ID (for detail page).
 * Uses fallback mechanism: Dataset Service first, then Connector Service.
 */
export async function fetchDataset(id: string): Promise<Dataset | null> {
  try {
    // Try Dataset Service first (for datasets created in Dataset Service)
    const response = await fetch(`${DATASET_API_BASE_URL}/${id}`)
    
    if (response.ok) {
      const backendResult = await handleResponse<BackendDatasetResponse>(response)
      if (backendResult && backendResult.id) {
        return backendDatasetToDataset(backendResult)
      }
    }
    
    // Fallback to Connector Service (for backward compatibility with connectors)
    const connectorResponse = await fetch(`${CONNECTOR_API_BASE_URL}/${id}`)
    
    if (connectorResponse.status === 404) {
      return null
    }
    
    if (connectorResponse.ok) {
      const connectorResult = await handleResponse<BackendConnectorResponse>(connectorResponse)
      if (connectorResult && connectorResult.id) {
        return connectorToDataset(connectorResult)
      }
    }
    
    return null
  } catch (error) {
    console.error('[DatasetAPI] Failed to fetch dataset:', error)
    throw error
  }
}

/**
 * Create a connector in Connector Service (helper function for Option B).
 * This is used when user provides connectionString/username/password directly in dataset form.
 */
export async function createConnectorForDataset(params: {
  projectId: string
  name: string
  description?: string
  connectionString: string
  username?: string
  password?: string
}): Promise<string> {
  // Lookup IDs for Connector Service
  const CONNECTOR_LOOKUP_IDS = {
    type: {
      dataSource: '550e8400-e29b-41d4-a716-446655440002', // data-source
    },
    status: {
      connected: '550e8400-e29b-41d4-a716-446655440011', // connected
    },
    connectionMethod: {
      connectionString: '550e8400-e29b-41d4-a716-446655440023', // connection-string
    },
    dataSourceType: {
      relationalDatabase: '550e8400-e29b-41d4-a716-446655440031', // relational-database
    },
  }

  const connectorPayload = {
    project_id: params.projectId,
    name: params.name,
    type_id: CONNECTOR_LOOKUP_IDS.type.dataSource,
    status_id: CONNECTOR_LOOKUP_IDS.status.connected,
    connection_method_id: CONNECTOR_LOOKUP_IDS.connectionMethod.connectionString,
    data_source_type_id: CONNECTOR_LOOKUP_IDS.dataSourceType.relationalDatabase,
    connection_string: params.connectionString,
    username: params.username || null,
    password: params.password || null,
    description: params.description || null,
  }

  const response = await fetch(CONNECTOR_API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(connectorPayload),
  })

  const connectorResult = await handleResponse<BackendConnectorResponse>(response)
  
  if (!connectorResult || !connectorResult.id) {
    throw new Error('Failed to create connector: Invalid response from server')
  }

  return connectorResult.id
}

export interface CreateDatasetPayload {
  projectId: string
  type: DatasetType
  status?: DatasetStatus
  connectorId?: string  // Required for database type - name/description will be fetched from connector
  query?: string
  tableName?: string
  schema?: DatasetSchema
}

/**
 * Create a new dataset.
 */
export async function createDataset(payload: CreateDatasetPayload): Promise<Dataset> {
  if (!payload.projectId) {
    throw new Error('PROJECT_CONTEXT_REQUIRED: Dataset must belong to a project')
  }

  // Convert dataset to backend format
  const backendData = datasetToBackendDataset({
    ...payload,
    status: payload.status || 'active',
  })

  const response = await fetch(DATASET_API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(backendData),
  })

  const backendResult = await handleResponse<BackendDatasetResponse>(response)
  
  // Validate backend response before converting
  if (!backendResult || !backendResult.id) {
    throw new Error('Invalid dataset response from server')
  }
  
  return backendDatasetToDataset(backendResult)
}

export interface UpdateDatasetPayload {
  name?: string
  description?: string
  type?: DatasetType
  status?: DatasetStatus
  connectionString?: string
  username?: string
  password?: string
  query?: string
  tableName?: string
  schema?: DatasetSchema
}

/**
 * Update a dataset.
 */
export async function updateDataset(id: string, payload: UpdateDatasetPayload): Promise<Dataset> {
  // Convert dataset updates to backend format
  const backendUpdates: any = {}
  // name and description are no longer stored - get from connector via connector_id
  // Use connector_id instead of connection_string/username/password
  if ((payload as any).connectorId !== undefined) backendUpdates.connector_id = (payload as any).connectorId
  if (payload.query !== undefined) backendUpdates.query = payload.query
  if (payload.tableName !== undefined) backendUpdates.table_name = payload.tableName
  if (payload.type !== undefined) {
    if (payload.type === 'database') {
      backendUpdates.type_id = LOOKUP_IDS.datasetType.database
    } else if (payload.type === 'file') {
      backendUpdates.type_id = LOOKUP_IDS.datasetType.file
    } else if (payload.type === 'object-storage') {
      backendUpdates.type_id = LOOKUP_IDS.datasetType.objectStorage
    }
  }
  if (payload.status !== undefined) {
    if (payload.status === 'active') {
      backendUpdates.status_id = LOOKUP_IDS.datasetStatus.active
    } else if (payload.status === 'inactive') {
      backendUpdates.status_id = LOOKUP_IDS.datasetStatus.inactive
    } else if (payload.status === 'archived') {
      backendUpdates.status_id = LOOKUP_IDS.datasetStatus.archived
    }
  }
  if (payload.schema?.labelInfo) {
    backendUpdates.label_column = payload.schema.labelInfo.column || null
    backendUpdates.label_classes = payload.schema.labelInfo.classes || null
  }

  const response = await fetch(`${DATASET_API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(backendUpdates),
  })

  const backendResult = await handleResponse<BackendDatasetResponse>(response)
  
  // Validate backend response before converting
  if (!backendResult || !backendResult.id) {
    throw new Error('Invalid dataset response from server')
  }
  
  return backendDatasetToDataset(backendResult)
}

/**
 * Delete a dataset.
 * Tries Dataset Service first; if the dataset is not found (404), tries Connector Service
 * because the list may show connectors (from Connector Service) whose IDs are not in Dataset Service.
 */
export async function deleteDataset(id: string): Promise<void> {
  // 1) Try Dataset Service first (for datasets created in Dataset Service)
  const datasetResponse = await fetch(`${DATASET_API_BASE_URL}/${id}`, {
    method: 'DELETE',
  })

  if (datasetResponse.ok) {
    return
  }

  // 2) If not found in Dataset Service, try Connector Service (list is from Connector Service)
  if (datasetResponse.status === 404) {
    const connectorResponse = await fetch(`${CONNECTOR_API_BASE_URL}/${id}`, {
      method: 'DELETE',
    })
    if (connectorResponse.ok) {
      return
    }
    if (connectorResponse.status !== 404) {
      const text = await connectorResponse.text()
      throw new Error(text || `HTTP ${connectorResponse.status}`)
    }
  }

  // Both services returned error (e.g. 404) — surface Dataset Service message
  const text = await datasetResponse.text()
  let errorMessage = text
  try {
    const errorData = JSON.parse(text)
    if (errorData.detail != null) {
      errorMessage = typeof errorData.detail === 'string' ? errorData.detail : String(errorData.detail)
    }
  } catch {
    // use text as-is
  }
  throw new Error(errorMessage || `HTTP ${datasetResponse.status}`)
}

/**
 * Get datasets by project ID (helper function for compatibility).
 * This is a convenience wrapper around fetchDatasets.
 */
export async function getDatasetsByProject(projectId: string): Promise<Dataset[]> {
  return fetchDatasets({ project_id: projectId })
}
