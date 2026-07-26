export type DatasetType = 'database' | 'file' | 'object-storage'
export type DatasetStatus = 'active' | 'inactive' | 'archived'

export interface DatasetSchema {
  fields: Array<{
    name: string
    type: string
    description?: string
  }>
  labelInfo?: {
    column?: string
    classes?: string[]
  }
}

export interface Dataset {
  id: string
  name: string
  type: DatasetType
  status: DatasetStatus
  schema?: DatasetSchema
  description?: string
  /**
   * For database-type datasets in Dataset Service, this points to the underlying
   * Connector Service record used for connections/queries.
   */
  connectorId?: string
  // Connection details for relational database type
  connectionString?: string
  username?: string
  password?: string
  // Data query configuration for database type
  query?: string // SQL query for fetching data (optional, defaults to SELECT * FROM table)
  tableName?: string // Table name for quick preview (optional)
  projectId: string // REQUIRED: Project-First enforcement - dataset belongs to exactly one project
  createdAt: string
  updatedAt: string
}
