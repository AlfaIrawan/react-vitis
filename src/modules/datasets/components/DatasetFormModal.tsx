import { useState, useRef, useEffect, useMemo } from 'react'
import { type Dataset, type DatasetType, createDataset, updateDataset } from '@/modules/datasets'
import { createConnectorForDataset } from '@/lib/api/datasetApi'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { useToast } from '@/components/ui/toast'
import { notifyEvent } from '@/lib/api/notificationApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { TestTube, CheckCircle2, XCircle, Loader2, Plus, Database, X, FileText, Cloud, ArrowLeft, ChevronRight, ChevronDown, GitBranch, Clock, Boxes, Key, FileJson, Table, Search as SearchIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type DataSourceVariant = string

interface DataSourceOption {
  id: DataSourceVariant
  label: string
  type: DatasetType
  connectionPlaceholder?: string
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  database: Database,
  graph: GitBranch,
  clock: Clock,
  boxes: Boxes,
  key: Key,
  fileJson: FileJson,
  table: Table,
  search: SearchIcon,
  file: FileText,
}

interface DataSourceCategory {
  id: string
  label: string
  iconKey: string
  description: string
  options: DataSourceOption[]
}

const DATA_SOURCE_CATEGORIES: DataSourceCategory[] = [
  {
    id: 'sql',
    label: 'SQL / Relational Database',
    iconKey: 'database',
    description: 'Structured data stored in tables with rows and columns. Best for transactional and analytical workloads.',
    options: [
      { id: 'postgresql', label: 'PostgreSQL', type: 'database', connectionPlaceholder: 'postgresql://localhost:5432/dbname' },
      { id: 'mysql', label: 'MySQL', type: 'database', connectionPlaceholder: 'mysql://localhost:3306/dbname' },
      { id: 'mariadb', label: 'MariaDB', type: 'database', connectionPlaceholder: 'mariadb://localhost:3306/dbname' },
      { id: 'oracle', label: 'Oracle Database', type: 'database', connectionPlaceholder: 'jdbc:oracle:thin:@//localhost:1521/FREEPDB1' },
      { id: 'mssql', label: 'Microsoft SQL Server', type: 'database', connectionPlaceholder: 'jdbc:sqlserver://localhost:1433;databaseName=dbname' },
    ],
  },
  {
    id: 'graph',
    label: 'Graph Database',
    iconKey: 'graph',
    description: 'Data stored as nodes and edges. Ideal for relationships, networks, and connected data.',
    options: [
      { id: 'neo4j', label: 'Neo4j', type: 'database', connectionPlaceholder: 'bolt://localhost:7687' },
      { id: 'tigergraph', label: 'TigerGraph', type: 'database' },
      { id: 'janusgraph', label: 'JanusGraph', type: 'database' },
      { id: 'arangodb', label: 'ArangoDB', type: 'database' },
      { id: 'orientdb', label: 'OrientDB', type: 'database' },
    ],
  },
  {
    id: 'timeseries',
    label: 'Time-Series Database',
    iconKey: 'clock',
    description: 'Optimized for time-stamped data such as metrics, logs, and sensor data.',
    options: [
      { id: 'influxdb', label: 'InfluxDB', type: 'database' },
      { id: 'timescaledb', label: 'TimescaleDB', type: 'database' },
      { id: 'prometheus', label: 'Prometheus', type: 'database' },
      { id: 'questdb', label: 'QuestDB', type: 'database' },
      { id: 'opentsdb', label: 'OpenTSDB', type: 'database' },
    ],
  },
  {
    id: 'vector',
    label: 'Vector Database',
    iconKey: 'boxes',
    description: 'Stores high-dimensional vectors for similarity search, embeddings, and AI/ML use cases.',
    options: [
      { id: 'milvus', label: 'Milvus', type: 'database' },
      { id: 'weaviate', label: 'Weaviate', type: 'database' },
      { id: 'qdrant', label: 'Qdrant', type: 'database' },
      { id: 'chroma', label: 'Chroma', type: 'database' },
      { id: 'faiss', label: 'FAISS', type: 'database' },
    ],
  },
  {
    id: 'keyvalue',
    label: 'Key-Value Database',
    iconKey: 'key',
    description: 'Simple storage that maps keys to values. Suited for caching and session data.',
    options: [
      { id: 'redis', label: 'Redis', type: 'database', connectionPlaceholder: 'redis://localhost:6379' },
    ],
  },
  {
    id: 'document',
    label: 'Document Database',
    iconKey: 'fileJson',
    description: 'Stores data as documents (e.g. JSON). Flexible schema for varied or nested structures.',
    options: [
      { id: 'mongodb', label: 'MongoDB', type: 'database', connectionPlaceholder: 'mongodb://localhost:27017' },
      { id: 'couchbase', label: 'Couchbase', type: 'database' },
    ],
  },
  {
    id: 'columnfamily',
    label: 'Column-Family Database',
    iconKey: 'table',
    description: 'Wide-column stores optimized for large-scale, distributed data with high write throughput.',
    options: [
      { id: 'cassandra', label: 'Apache Cassandra', type: 'database' },
      { id: 'hbase', label: 'HBase', type: 'database' },
    ],
  },
  {
    id: 'search',
    label: 'Search Engine Database',
    iconKey: 'search',
    description: 'Built for full-text search, indexing, and fast retrieval of unstructured or semi-structured data.',
    options: [
      { id: 'elasticsearch', label: 'Elasticsearch', type: 'database', connectionPlaceholder: 'http://localhost:9200' },
      { id: 'solr', label: 'Apache Solr', type: 'database' },
    ],
  },
  {
    id: 'files',
    label: 'Files',
    iconKey: 'file',
    description: 'Connect datasets from file uploads, local file system, or files in a folder.',
    options: [
      { id: 'upload-files', label: 'Upload your files', type: 'file' },
      { id: 'server-filesystem', label: "Server's File System", type: 'file' },
      { id: 'files-in-folder', label: 'Files in Folder', type: 'file' },
    ],
  },
]

interface DatasetFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dataset?: Dataset | null
}

export function DatasetFormModal({
  open,
  onOpenChange,
  dataset,
}: DatasetFormModalProps) {
  const { activeProjectId, hasActiveProject } = useActiveProjectStore()
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    type: 'database' as DatasetType,
    description: '',
    connectionString: '',
    username: '',
    password: '',
    query: '',
    tableName: '',
  })
  const [errors, setErrors] = useState<{ name?: string; connectionString?: string }>({})
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState<string>('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'selectType' | 'form'>('selectType')
  const [selectedVariant, setSelectedVariant] = useState<DataSourceVariant | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['sql']))
  const [typeSearchQuery, setTypeSearchQuery] = useState('')

  const toggleGroup = (categoryId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const typeSearchLower = typeSearchQuery.trim().toLowerCase()
  const filteredCategories = useMemo(() => {
    if (!typeSearchLower) return DATA_SOURCE_CATEGORIES.map((cat) => ({ category: cat, optionsToShow: cat.options }))
    return DATA_SOURCE_CATEGORIES.filter((cat) => {
      const catMatch =
        cat.label.toLowerCase().includes(typeSearchLower) || cat.description.toLowerCase().includes(typeSearchLower)
      const optionMatch = cat.options.some((o) => o.label.toLowerCase().includes(typeSearchLower))
      return catMatch || optionMatch
    }).map((cat) => {
      const catMatch =
        cat.label.toLowerCase().includes(typeSearchLower) || cat.description.toLowerCase().includes(typeSearchLower)
      const optionsToShow = catMatch
        ? cat.options
        : cat.options.filter((o) => o.label.toLowerCase().includes(typeSearchLower))
      return { category: cat, optionsToShow }
    })
  }, [typeSearchLower])

  const isEditMode = !!dataset

  const selectedOption = selectedVariant
    ? (() => {
        for (const cat of DATA_SOURCE_CATEGORIES) {
          const opt = cat.options.find((o) => o.id === selectedVariant)
          if (opt) return opt
        }
        return null
      })()
    : null

  useEffect(() => {
    if (open) {
      if (dataset) {
        setStep('form')
        setSelectedVariant(null)
        setFormData({
          name: dataset.name,
          type: dataset.type,
          description: dataset.description || '',
          connectionString: dataset.connectionString || '',
          username: dataset.username || '',
          password: dataset.password || '',
          query: dataset.query || '',
          tableName: dataset.tableName || '',
        })
      } else {
        setStep('selectType')
        setSelectedVariant(null)
        setTypeSearchQuery('')
        setFormData({
          name: '',
          type: 'database',
          description: '',
          connectionString: '',
          username: '',
          password: '',
          query: '',
          tableName: '',
        })
      }
      setErrors({})
      setConnectionStatus('idle')
      setConnectionMessage('')
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [open, dataset])

  // Close on Escape
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onOpenChange(false)
    }
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [open, onOpenChange])

  const handleTestConnection = async () => {
    if (!formData.connectionString.trim()) {
      addToast({
        title: 'Connection String Required',
        description: 'Please enter a connection string before testing.',
        variant: 'error',
      })
      return
    }

    setIsTestingConnection(true)
    setConnectionStatus('idle')
    setConnectionMessage('')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      // Call connector service API for database connection test
      // NOTE: Using connector service endpoint since dataset service is separate
      const response = await fetch('http://localhost:8400/v1/connectors/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection_string: formData.connectionString.trim(),
          username: formData.username.trim() || null,
          password: formData.password || null,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || result.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      if (result.success) {
        setConnectionStatus('success')
        const dbInfo = result.database_type 
          ? `${result.database_type.toUpperCase()}${result.database_version ? ` - ${result.database_version.substring(0, 50)}...` : ''}`
          : ''
        setConnectionMessage(result.message + (dbInfo ? ` (${dbInfo})` : ''))
        addToast({
          title: 'Connection Successful',
          description: result.message,
          variant: 'success',
        })
      } else {
        throw new Error(result.message || 'Connection failed')
      }
    } catch (error: any) {
      setConnectionStatus('error')
      let errorMessage: string
      
      if (error.name === 'AbortError') {
        errorMessage = 'Connection timeout. Please check if the database server is reachable.'
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMessage = 'Cannot reach the backend service. Please ensure the connector service is running on port 8400.'
      } else {
        errorMessage = error.message || 'Failed to connect to database. Please check your connection string and credentials.'
      }
      
      setConnectionMessage(errorMessage)
      addToast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'error',
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasActiveProject()) {
      addToast({
        title: 'Project Required',
        description: 'Please select or create a project before creating a dataset.',
        variant: 'error',
      })
      return
    }

    const newErrors: typeof errors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Dataset name is required'
    }

    if (formData.type === 'database' && !formData.connectionString.trim()) {
      newErrors.connectionString = 'Connection string is required for database type'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      if (isEditMode && dataset) {
        await updateDataset(dataset.id, {
          name: formData.name.trim(),
          type: formData.type,
          description: formData.description.trim() || undefined,
          connectionString: formData.type === 'database' ? formData.connectionString.trim() || undefined : undefined,
          username: formData.type === 'database' ? formData.username.trim() || undefined : undefined,
          password: formData.type === 'database' ? formData.password.trim() || undefined : undefined,
          query: formData.type === 'database' ? formData.query.trim() || undefined : undefined,
          tableName: formData.type === 'database' ? formData.tableName.trim() || undefined : undefined,
        })

        addToast({
          title: 'Dataset diperbarui',
          description: `Dataset "${formData.name.trim()}" telah diperbarui.`,
          variant: 'success',
        })
        notifyEvent({
          type_code: 'dataset',
          title: 'Dataset diperbarui',
          body: `Dataset "${formData.name.trim()}" telah diperbarui.`,
        })
      } else {
        // Option B: If user provides connectionString/username/password, create connector first
        let connectorId: string | undefined = undefined
        
        if (formData.type === 'database' && formData.connectionString.trim()) {
          try {
            // Create connector in Connector Service first
            connectorId = await createConnectorForDataset({
              projectId: activeProjectId!,
              name: formData.name.trim(),
              description: formData.description.trim() || undefined,
              connectionString: formData.connectionString.trim(),
              username: formData.username.trim() || undefined,
              password: formData.password.trim() || undefined,
            })
            
            addToast({
              title: 'Connector created',
              description: 'Connector created successfully. Creating dataset...',
              variant: 'success',
            })
          } catch (connectorError: any) {
            addToast({
              title: 'Failed to create connector',
              description: connectorError.message || 'An error occurred while creating the connector.',
              variant: 'error',
            })
            throw connectorError
          }
        }

        // Create dataset with connector_id
        const newDataset = await createDataset({
          type: formData.type,
          connectorId: connectorId, // Use connector_id from created connector
          query: formData.type === 'database' ? formData.query.trim() || undefined : undefined,
          tableName: formData.type === 'database' ? formData.tableName.trim() || undefined : undefined,
          projectId: activeProjectId!,
        })

        addToast({
          title: 'Dataset created',
          description: `Dataset "${newDataset.name}" has been created.`,
          variant: 'success',
        })
        notifyEvent({
          type_code: 'dataset',
          title: 'Dataset created',
          body: `Dataset "${newDataset.name}" has been created.`,
        })
      }

      onOpenChange(false)
    } catch (error: any) {
      addToast({
        title: isEditMode ? 'Failed to update dataset' : 'Failed to create dataset',
        description: error.message || 'An error occurred while saving the dataset.',
        variant: 'error',
      })
    }
  }

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[1050] bg-black/20 backdrop-blur-sm transition-opacity',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', top: 0, left: 0 }}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
        role="button"
        tabIndex={-1}
      />

      {/* Slide-out drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-screen w-[480px] z-[1100] transition-all duration-300',
          'backdrop-blur-xl bg-background/95 border-l border-border shadow-2xl',
          open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        )}
        style={{
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.1)',
          margin: 0,
          padding: 0,
        }}
        data-dataset-form-open={open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border backdrop-blur-sm">
          <div className="flex-1 min-w-0">
            {step === 'form' && !isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep('selectType')
                  setSelectedVariant(null)
                  setTypeSearchQuery('')
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Choose another type
              </Button>
            )}
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              {isEditMode ? (
                <Database className="w-6 h-6 text-primary" />
              ) : step === 'selectType' ? (
                <Plus className="w-6 h-6 text-primary" />
              ) : (
                <Plus className="w-6 h-6 text-primary" />
              )}
              {isEditMode ? 'Edit Dataset' : step === 'selectType' ? 'Create Dataset' : 'Create Dataset'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {step === 'selectType'
                ? 'Choose a data source type from the categories below, then continue to the next step to enter connection details and name your dataset.'
                : 'Datasets store information about your data sources for training and evaluation.'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-5rem)]">
          {step === 'selectType' && !isEditMode ? (
            <div className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search data source type..."
                  value={typeSearchQuery}
                  onChange={(e) => setTypeSearchQuery(e.target.value)}
                  className="pl-9"
                  aria-label="Search data source type"
                />
              </div>
              <div className="space-y-4">
                {filteredCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No data source type matches &quot;{typeSearchQuery.trim()}&quot;. Try another term.
                  </p>
                ) : (
                filteredCategories.map(({ category, optionsToShow }) => {
                  const IconComponent = CATEGORY_ICONS[category.iconKey] ?? Database
                  const isExpanded = expandedGroups.has(category.id)
                  return (
                    <div
                      key={category.id}
                      className="rounded-xl border border-border/80 bg-muted/30 backdrop-blur-sm overflow-hidden shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(category.id)}
                        className={cn(
                          'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                          'hover:bg-muted/50'
                        )}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground">{category.label}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-border/60">
                          <ul className="space-y-1 pt-3">
                            {optionsToShow.map((option) => (
                              <li key={option.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      type: option.type,
                                      connectionString: option.connectionPlaceholder ?? prev.connectionString,
                                    }))
                                    setSelectedVariant(option.id)
                                    setStep('form')
                                    setTimeout(() => nameInputRef.current?.focus(), 80)
                                  }}
                                  className={cn(
                                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all',
                                    'text-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20'
                                  )}
                                >
                                  <span>{option.label}</span>
                                  <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })
                )}
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          {selectedOption && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Data source: </span>
              <span className="font-medium text-foreground">{selectedOption.label}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              Dataset Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              ref={nameInputRef}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) setErrors({ ...errors, name: undefined })
              }}
              placeholder="Enter dataset name"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          {formData.type === 'database' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="connectionString">
                  Connection String <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="connectionString"
                  value={formData.connectionString}
                  onChange={(e) => {
                    setFormData({ ...formData, connectionString: e.target.value })
                    if (errors.connectionString) setErrors({ ...errors, connectionString: undefined })
                    // Reset connection status when connection string changes
                    if (connectionStatus !== 'idle') {
                      setConnectionStatus('idle')
                      setConnectionMessage('')
                    }
                  }}
                  placeholder={selectedOption?.connectionPlaceholder ?? "e.g., postgresql://localhost:5432/dbname or jdbc:oracle:thin:@//localhost:1521/FREEPDB1"}
                  className={errors.connectionString ? 'border-destructive' : ''}
                />
                {errors.connectionString && (
                  <p className="text-sm text-destructive">{errors.connectionString}</p>
                )}
                {connectionStatus !== 'idle' && connectionMessage && (
                  <div
                    className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                      connectionStatus === 'success'
                        ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}
                  >
                    {connectionStatus === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{connectionMessage}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value })
                    // Reset connection status when credentials change
                    if (connectionStatus !== 'idle') {
                      setConnectionStatus('idle')
                      setConnectionMessage('')
                    }
                  }}
                  placeholder="Enter database username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    // Reset connection status when credentials change
                    if (connectionStatus !== 'idle') {
                      setConnectionStatus('idle')
                      setConnectionMessage('')
                    }
                  }}
                  placeholder="Enter database password"
                />
              </div>
            </>
          )}

          {/* Helper text for database type */}
          {formData.type === 'database' && !isEditMode && connectionStatus !== 'success' && formData.connectionString.trim() && (
            <p className="text-xs text-muted-foreground">
              Test connection must succeed before the dataset can be created.
            </p>
          )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
              <div>
                {formData.type === 'database' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection || !formData.connectionString.trim()}
                  >
                    {isTestingConnection ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !formData.name.trim() ||
                    !hasActiveProject() ||
                    (formData.type === 'database' && !formData.connectionString.trim()) ||
                    (formData.type === 'database' && !isEditMode && connectionStatus !== 'success')
                  }
                >
                  {isEditMode ? 'Update Dataset' : 'Create Dataset'}
                </Button>
              </div>
            </div>
          </form>
          )}
        </div>
      </div>
    </>
  )
}
