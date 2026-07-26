import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Database, Edit, Play, Table2, Code, FileText, Settings, RefreshCw, Loader2, ChevronRight, ChevronDown, Search, Folder, PanelLeftClose, PanelRightClose, ArrowUpDown, ArrowUp, ArrowDown, Download, X } from 'lucide-react'
import { type Dataset, fetchDataset, updateDataset } from '@/modules/datasets'
import { useProjectStore } from '@/modules/projects'
import { DatasetFormModal } from '../components/DatasetFormModal'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'

interface ColumnInfo {
  name: string
  data_type: string
  nullable?: boolean
  default?: string
}

interface TableInfo {
  name: string
  type: 'table' | 'view'
  rowCount?: number
  columns?: ColumnInfo[]
}

export function DatasetDetailPage() {
  const { id, projectId } = useParams<{ id: string; projectId: string }>()
  const navigate = useNavigate()
  const { getProject } = useProjectStore()
  const { addToast } = useToast()
  
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [isLoadingDataset, setIsLoadingDataset] = useState(false)
  const project = projectId ? getProject(projectId) : undefined
  
  // Fetch dataset when component mounts or id changes
  useEffect(() => {
    if (id) {
      setIsLoadingDataset(true)
      fetchDataset(id)
        .then((data) => {
          setDataset(data)
          setIsLoadingDataset(false)
        })
        .catch((error) => {
          console.error('[DatasetDetailPage] Failed to fetch dataset:', error)
          setDataset(null)
          setIsLoadingDataset(false)
          addToast({
            title: 'Failed to load dataset',
            description: error.message || 'Dataset not found',
            variant: 'error',
          })
        })
    }
  }, [id, addToast])
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'query'>('preview') // Toggle between Data Preview and SQL Query
  const [showTablesPanel, setShowTablesPanel] = useState(true) // Show/hide tables sidebar
  const [showRightPanel, setShowRightPanel] = useState(true) // Show/hide right sidebar (Overview + Schema)
  
  // Tables list states
  const [tables, setTables] = useState<TableInfo[]>([])
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [tablesError, setTablesError] = useState<string | null>(null)
  const [tableSearch, setTableSearch] = useState('')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [loadingColumns, setLoadingColumns] = useState<Set<string>>(new Set())
  
  // Data preview states
  const [sqlQuery, setSqlQuery] = useState(dataset?.query || '')
  const [isFetchingData, setIsFetchingData] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [previewColumns, setPreviewColumns] = useState<string[]>([])
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [rowCount, setRowCount] = useState<number>(0)
  const [limit, setLimit] = useState(100)
  const [previewFilter, setPreviewFilter] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
  // Update local state when dataset changes
  useEffect(() => {
    if (dataset) {
      setSqlQuery(dataset.query || '')
      if (dataset.tableName) {
        setSelectedTable(dataset.tableName)
      }
    }
  }, [dataset])

  // Auto-load tables when page opens for database type
  useEffect(() => {
    if (dataset?.type === 'database' && (dataset.id || dataset.connectionString)) {
      loadTables()
    }
  }, [dataset?.id, dataset?.connectionString])

  // Auto-load data when table or limit changes
  useEffect(() => {
    if (selectedTable && dataset?.type === 'database') {
      loadTableData(selectedTable)
    }
  }, [selectedTable, limit])

  // Reset sort/filter when switching table
  useEffect(() => {
    setSortColumn(null)
    setSortDir('asc')
    setPreviewFilter('')
  }, [selectedTable])

  // Filtered + sorted preview data (client-side)
  const filteredAndSortedData = useMemo(() => {
    let rows = previewData
    const q = previewFilter.trim().toLowerCase()
    if (q) {
      rows = rows.filter((row) =>
        previewColumns.some((col) => {
          const v = row[col]
          return v != null && String(v).toLowerCase().includes(q)
        })
      )
    }
    if (!sortColumn) return rows
    return [...rows].sort((a, b) => {
      const va = a[sortColumn]
      const vb = b[sortColumn]
      const anum = typeof va === 'number' || (typeof va === 'string' && /^-?\d+(\.\d+)?$/.test(va))
      const bnum = typeof vb === 'number' || (typeof vb === 'string' && /^-?\d+(\.\d+)?$/.test(vb))
      let cmp: number
      if (anum && bnum) {
        cmp = (Number(va) || 0) - (Number(vb) || 0)
      } else {
        const sa = va == null ? '' : String(va)
        const sb = vb == null ? '' : String(vb)
        cmp = sa.localeCompare(sb, undefined, { numeric: true })
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [previewData, previewColumns, previewFilter, sortColumn, sortDir])

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(col)
      setSortDir('asc')
    }
  }

  const exportPreviewCsv = () => {
    if (previewColumns.length === 0 || filteredAndSortedData.length === 0) return
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v)
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const header = previewColumns.map(escape).join(',')
    const body = filteredAndSortedData
      .map((row) => previewColumns.map((c) => escape(row[c])).join(','))
      .join('\n')
    const csv = `${header}\n${body}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTable || 'export'}_preview.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const limitPresets = [50, 100, 250, 500, 1000]

  // Helper function to create request body with fallback logic
  const createRequestBody = (additionalFields: Record<string, any> = {}): any => {
    if (!dataset?.id) {
      throw new Error('Dataset must have an id')
    }
    // Important: Dataset Service endpoints prioritize `dataset_id` when provided.
    // If this "dataset" is actually a Connector Service record (no `connectorId` field),
    // sending `dataset_id` would incorrectly trigger the Dataset DB lookup and return 404.
    if (dataset.type === 'database' && !dataset.connectorId) {
      return {
        connector_id: dataset.id,
        ...additionalFields,
      }
    }
    return {
      dataset_id: dataset.id,
      ...(dataset.type === 'database' && dataset.connectorId ? { connector_id: dataset.connectorId } : {}),
      ...additionalFields,
    }
  }

  // Helper function to handle API call with connector_id fallback
  const callWithFallback = async (
    url: string,
    requestBody: any,
    errorHandler?: (error: any) => void
  ): Promise<any> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    let result: any
    try {
      result = await response.json()
    } catch (jsonError) {
      throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`)
    }

    // If dataset_id fails with 404 and this is a database dataset, try connector_id as fallback.
    // - For Dataset Service records: use dataset.connectorId
    // - For Connector Service fallback records: dataset.id is the connector id
    if (!response.ok && response.status === 404 && dataset?.type === 'database') {
      console.log('[DatasetDetailPage] Dataset not found in Dataset Service, trying connector_id as fallback')
      const connectorId = dataset.connectorId || dataset.id
      const fallbackRequestBody = {
        connector_id: connectorId,
        ...Object.fromEntries(Object.entries(requestBody).filter(([key]) => key !== 'dataset_id')),
      }
      
      const fallbackResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fallbackRequestBody),
      })
      
      let fallbackResult: any
      try {
        fallbackResult = await fallbackResponse.json()
      } catch {
        throw new Error(`Invalid response from server (fallback): ${fallbackResponse.status} ${fallbackResponse.statusText}`)
      }

      if (fallbackResponse.ok && fallbackResult.success !== false) return fallbackResult

      // If fallback failed, prefer surfacing fallback error (usually connector auth/not-found)
      if (!fallbackResponse.ok) {
        const detail = fallbackResult?.detail ?? fallbackResult?.message ?? fallbackResult
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
      }
    }

    if (!response.ok) {
      if (errorHandler) {
        errorHandler(result)
      }
      // Extract error message
      let errorMessage = 'Request failed'
      if (typeof result === 'string') {
        errorMessage = result
      } else if (result) {
        if (result.detail) {
          errorMessage = typeof result.detail === 'string' ? result.detail : JSON.stringify(result.detail)
        } else if (result.message) {
          errorMessage = typeof result.message === 'string' ? result.message : JSON.stringify(result.message)
        } else if (Array.isArray(result.detail)) {
          errorMessage = result.detail.map((e: any) => 
            typeof e === 'string' ? e : (e.msg || JSON.stringify(e))
          ).join(', ')
        } else {
          errorMessage = JSON.stringify(result)
        }
      }
      throw new Error(errorMessage)
    }

    if (result.success === false) {
      const errorMessage = typeof result.message === 'string' ? result.message : JSON.stringify(result.message)
      throw new Error(errorMessage || 'Request failed')
    }

    return result
  }

  const loadTables = async () => {
    if (!dataset) return

    setIsLoadingTables(true)
    setTablesError(null)

    try {
      const requestBody = createRequestBody()
      const result = await callWithFallback('http://localhost:8600/v1/datasets/tables', requestBody)

      const tableList: TableInfo[] = (result.tables || []).map((t: any) => ({
        name: typeof t === 'string' ? t : t.name,
        type: typeof t === 'string' ? 'table' : (t.type || 'table'),
        rowCount: typeof t === 'string' ? undefined : t.row_count,
        columns: t.columns ? t.columns.map((col: any) => ({
          name: col.name,
          data_type: col.data_type || 'UNKNOWN',
          nullable: col.nullable,
          default: col.default,
        })) : undefined,
      }))

      setTables(tableList)

      // Auto-select first table if none selected
      if (tableList.length > 0 && !selectedTable) {
        setSelectedTable(tableList[0].name)
      }
    } catch (error: any) {
      console.error('Failed to load tables:', error)
      // Extract error message properly
      let errorMessage = 'Failed to load tables'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.message) {
        errorMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error.message)
      } else if (error) {
        errorMessage = JSON.stringify(error)
      }
      
      setTablesError(errorMessage)
      
      // Don't show toast for network errors on initial load
      if (!errorMessage.includes('Failed to fetch') && !errorMessage.includes('NetworkError')) {
        addToast({
          title: 'Failed to Load Tables',
          description: errorMessage,
          variant: 'error',
        })
      }
    } finally {
      setIsLoadingTables(false)
    }
  }

  const loadTableData = async (tableName: string) => {
    if (!dataset) return

    setIsFetchingData(true)
    setPreviewError(null)

    try {
      const query = `SELECT * FROM ${tableName}`
      
      const requestBody = createRequestBody({
        query: query,
        limit: limit,
      })
      
      const result = await callWithFallback('http://localhost:8600/v1/datasets/query', requestBody)

      setPreviewData(result.data || [])
      setPreviewColumns(result.columns || Object.keys(result.data?.[0] || {}))
      setRowCount(result.row_count || result.data?.length || 0)
    } catch (error: any) {
      console.error('Failed to load table data:', error)
      let errorMessage = 'Failed to load data'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.message) {
        errorMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error.message)
      }
      setPreviewError(errorMessage)
      setPreviewData([])
      setPreviewColumns([])
    } finally {
      setIsFetchingData(false)
    }
  }

  const executeCustomQuery = async () => {
    if (!dataset || !sqlQuery.trim()) return

    setIsFetchingData(true)
    setPreviewError(null)

    try {
      const requestBody = createRequestBody({
        query: sqlQuery.trim(),
      })

      const result = await callWithFallback('http://localhost:8600/v1/datasets/query', requestBody)

      setPreviewData(result.data || [])
      setPreviewColumns(result.columns || Object.keys(result.data?.[0] || {}))
      setRowCount(result.row_count || result.data?.length || 0)
      setSelectedTable(null) // Clear table selection when custom query is run

      addToast({
        title: 'Query Executed',
        description: `Returned ${result.data?.length || 0} rows`,
        variant: 'success',
      })
    } catch (error: any) {
      console.error('Failed to execute query:', error)
      let errorMessage = 'Failed to execute query'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.message) {
        errorMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error.message)
      }
      
      setPreviewError(errorMessage)
      setPreviewData([])
      setPreviewColumns([])
      
      addToast({
        title: 'Query Failed',
        description: errorMessage,
        variant: 'error',
      })
    } finally {
      setIsFetchingData(false)
    }
  }

  const loadTableColumns = async (tableName: string) => {
    if (!dataset) return

    // Check if columns already loaded
    const table = tables.find(t => t.name === tableName)
    if (table?.columns && table.columns.length > 0) {
      return // Already loaded
    }

    setLoadingColumns(prev => new Set(prev).add(tableName))

    try {
      const requestBody = createRequestBody({
        table_name: tableName,
      })

      const result = await callWithFallback('http://localhost:8600/v1/datasets/columns', requestBody)

      // Update the table with columns
      setTables(prevTables => 
        prevTables.map(t => 
          t.name === tableName 
            ? { ...t, columns: result.columns || [] }
            : t
        )
      )
    } catch (error: any) {
      console.error('Failed to load columns:', error)
      // Don't show toast for column loading errors, just log
    } finally {
      setLoadingColumns(prev => {
        const newSet = new Set(prev)
        newSet.delete(tableName)
        return newSet
      })
    }
  }

  const handleSaveQuery = async () => {
    if (!dataset || dataset.type !== 'database') return

    try {
      await updateDataset(dataset.id, {
        query: sqlQuery.trim() || undefined,
        tableName: selectedTable || undefined,
      })

      // Refresh dataset to get updated data
      // Refresh dataset after update
      const refreshed = await fetchDataset(dataset.id)
      if (refreshed) {
        setDataset(refreshed)
      }

      addToast({
        title: 'Query Saved',
        description: 'SQL query and table selection have been saved.',
        variant: 'success',
      })
    } catch (error: any) {
      addToast({
        title: 'Failed to Save Query',
        description: error.message || 'An error occurred while saving the query.',
        variant: 'error',
      })
    }
  }

  // Filter tables by search
  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(tableSearch.toLowerCase())
  )

  if (!dataset) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/projects/${projectId}/datasets`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Datasets
        </Button>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Dataset not found</p>
        </div>
      </div>
    )
  }

  const getTypeLabel = () => {
    const typeLabels: Record<string, string> = {
      'database': 'Relational Database',
      'file': 'File',
      'object-storage': 'Object Storage',
    }
    return typeLabels[dataset.type] || dataset.type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/projects/${projectId}/datasets`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Database className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">{dataset.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-md ${
                dataset.status === 'active' 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {dataset.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {getTypeLabel()}
              {dataset.description && ` • ${dataset.description}`}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span>Created: {formatDate(dataset.createdAt)}</span>
              <span>Updated: {formatDate(dataset.updatedAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dataset.type === 'database' && (
              <>
                <Tooltip content={showTablesPanel ? "Hide Tables Panel" : "Show Tables Panel"} side="bottom">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTablesPanel(!showTablesPanel)}
                  >
                    {showTablesPanel ? (
                      <PanelLeftClose className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    {showTablesPanel ? 'Hide Tables' : 'Show Tables'}
                  </Button>
                </Tooltip>
                <Tooltip content={showRightPanel ? "Hide Right Panel" : "Show Right Panel"} side="bottom">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRightPanel(!showRightPanel)}
                  >
                  {showRightPanel ? (
                    <PanelRightClose className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  {showRightPanel ? 'Hide Info' : 'Show Info'}
                  </Button>
                </Tooltip>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Left (Data Preview + SQL Query) | Right (Overview + Schema) */}
      <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
        {/* Left Side: Data Preview + SQL Query */}
        {dataset.type === 'database' ? (
          <div className="flex-1 flex gap-4 min-w-0">
            {/* Tables Sidebar */}
            {showTablesPanel && (
              <div className="w-64 flex-shrink-0 glass-card rounded-xl overflow-hidden flex flex-col">
                <div className="p-3 border-b border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">
                      Tables ({tables.length})
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={loadTables}
                      disabled={isLoadingTables}
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", isLoadingTables && "animate-spin")} />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search tables..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {isLoadingTables ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : tablesError ? (
                    <div className="p-4 text-center">
                      <p className="text-xs text-destructive mb-2">{tablesError}</p>
                      <Button variant="outline" size="sm" onClick={loadTables}>
                        Retry
                      </Button>
                    </div>
                  ) : filteredTables.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      {tables.length === 0 ? 'No tables found' : 'No matching tables'}
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredTables.map((table) => {
                        const isExpanded = expandedTables.has(table.name)
                        const isSelected = selectedTable === table.name
                        const columnCount = table.columns?.length || 0
                        
                        return (
                          <div key={table.name} className="mb-0.5">
                            {/* Table Header */}
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const newExpanded = new Set(expandedTables)
                                  if (isExpanded) {
                                    newExpanded.delete(table.name)
                                  } else {
                                    newExpanded.add(table.name)
                                    // Load columns when expanding
                                    if (!table.columns || table.columns.length === 0) {
                                      loadTableColumns(table.name)
                                    }
                                  }
                                  setExpandedTables(newExpanded)
                                }}
                                className="p-0.5 hover:bg-muted/50 rounded transition-colors flex-shrink-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                )}
                              </button>
                              <button
                                onClick={() => setSelectedTable(table.name)}
                                className={cn(
                                  "flex-1 flex items-center gap-1.5 px-1.5 py-1 text-left rounded transition-colors",
                                  isSelected
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-muted/50 text-foreground"
                                )}
                              >
                                <Folder className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="text-xs font-medium truncate">{table.name}</span>
                              </button>
                            </div>
                            
                            {/* Columns Folder (when expanded) */}
                            {isExpanded && (
                              <div className="ml-5 mt-0.5">
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-xs text-muted-foreground">
                                  <Folder className="h-3 w-3 flex-shrink-0" />
                                  {loadingColumns.has(table.name) ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      <span>Loading columns...</span>
                                    </>
                                  ) : (
                                    <span>columns {columnCount}</span>
                                  )}
                                </div>
                                
                                {/* Column List */}
                                {table.columns && table.columns.length > 0 && (
                                  <div className="ml-4 mt-0.5 space-y-0">
                                    {table.columns.map((column) => (
                                      <div
                                        key={column.name}
                                        className="flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/30 rounded"
                                      >
                                        <div className="w-2.5 h-2.5 border border-border/50 rounded-sm flex-shrink-0" />
                                        <span className="font-mono">{column.name}</span>
                                        <span className="text-muted-foreground/70">({column.data_type})</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {!loadingColumns.has(table.name) && (!table.columns || table.columns.length === 0) && (
                                  <div className="ml-4 mt-0.5 px-1.5 py-0.5 text-[10px] text-muted-foreground/70">
                                    No columns found
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

              <div className="flex-1 flex flex-col min-w-0">
                {/* Data Preview Panel */}
                {viewMode === 'preview' && (
                  <div className="flex-1 glass-card rounded-xl overflow-hidden flex flex-col">
                <div className="p-3 border-b border-border/50 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {selectedTable ? selectedTable : 'Select a table'}
                      </span>
                      {rowCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({rowCount} rows)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        {limitPresets.map((n) => (
                          <Button
                            key={n}
                            variant={limit === n ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 min-w-0 px-2 text-xs"
                            onClick={() => setLimit(n)}
                            disabled={!selectedTable || isFetchingData}
                          >
                            {n}
                          </Button>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">Limit</span>
                      <Input
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(Math.min(1000, Math.max(1, parseInt(e.target.value) || 100)))}
                        className="w-16 h-7 text-xs"
                        min={1}
                        max={1000}
                        title="Row limit"
                      />
                      <Tooltip content="Refresh data" side="bottom">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => selectedTable && loadTableData(selectedTable)}
                          disabled={!selectedTable || isFetchingData}
                        >
                          {isFetchingData ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </Tooltip>
                      {previewData.length > 0 && (
                        <Tooltip content="Export filtered view as CSV" side="bottom">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7"
                            onClick={exportPreviewCsv}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            CSV
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  {previewData.length > 0 && (
                    <div className="relative max-w-xs">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        type="search"
                        placeholder="Filter rows..."
                        value={previewFilter}
                        onChange={(e) => setPreviewFilter(e.target.value)}
                        className="pl-8 pr-8 h-8 text-xs"
                      />
                      {previewFilter && (
                        <Tooltip content="Clear filter" side="bottom">
                          <button
                            type="button"
                            onClick={() => setPreviewFilter('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-auto min-h-0">
                  {isFetchingData ? (
                    <div className="flex items-center justify-center h-full min-h-[200px]">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading data...</p>
                      </div>
                    </div>
                  ) : previewError ? (
                    <div className="flex items-center justify-center h-full min-h-[200px]">
                      <div className="text-center p-4">
                        <p className="text-sm text-destructive mb-2">{previewError}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => selectedTable && loadTableData(selectedTable)}
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  ) : !selectedTable ? (
                    <div className="flex items-center justify-center h-full min-h-[200px]">
                      <div className="text-center">
                        <Table2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Select a table from the sidebar to preview data
                        </p>
                      </div>
                    </div>
                  ) : previewData.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[200px]">
                      <p className="text-sm text-muted-foreground">No data found</p>
                    </div>
                  ) : filteredAndSortedData.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[200px]">
                      <p className="text-sm text-muted-foreground">No rows match &quot;{previewFilter}&quot;</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse min-w-max">
                        <thead className="bg-muted/60 sticky top-0 z-10 shadow-sm">
                          <tr>
                            {previewColumns.map((col) => {
                              const isSort = sortColumn === col
                              return (
                                <th
                                  key={col}
                                  className={cn(
                                    'px-4 py-2.5 text-left font-medium text-foreground whitespace-nowrap border-b border-border/50 cursor-pointer select-none hover:bg-muted/80 transition-colors',
                                    isSort && 'bg-muted'
                                  )}
                                  onClick={() => handleSort(col)}
                                >
                                  <Tooltip content={`Sort by ${col}`} side="top">
                                    <span className="inline-flex items-center gap-1">
                                    {col}
                                    {isSort ? (
                                      sortDir === 'asc' ? (
                                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                                      ) : (
                                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                                      )
                                    ) : (
                                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                                    )}
                                    </span>
                                  </Tooltip>
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAndSortedData.map((row, idx) => (
                            <tr
                              key={idx}
                              className={cn(
                                'border-b border-border/20 hover:bg-muted/40 transition-colors',
                                idx % 2 === 1 && 'bg-muted/10'
                              )}
                            >
                              {previewColumns.map((col) => {
                                const v = row[col]
                                const isNum = typeof v === 'number' || (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v))
                                return (
                                  <td
                                    key={col}
                                    className={cn(
                                      'px-4 py-2 text-foreground/90 whitespace-nowrap max-w-[280px] truncate border-b border-border/10',
                                      isNum && 'font-mono text-right tabular-nums'
                                    )}
                                    title={String(v ?? '')}
                                  >
                                    {v === null || v === undefined ? (
                                      <span className="text-muted-foreground/50 italic">null</span>
                                    ) : (
                                      String(v)
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {previewData.length > 0 && (
                  <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground border-t border-border/50 flex items-center justify-between flex-wrap gap-2">
                    <span>
                      Showing {filteredAndSortedData.length} of {previewData.length} rows
                      {previewFilter && ` (filtered from ${previewData.length})`}
                      {rowCount > previewData.length && ` • ${rowCount} total in DB`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* SQL Query View */}
            {viewMode === 'query' && (
              <div className="flex-1 glass-card rounded-xl overflow-hidden flex flex-col min-h-0">
                <div className="p-4 border-b border-border/50 flex-shrink-0">
                  <h2 className="text-base font-semibold text-foreground mb-4">Custom SQL Query</h2>
                  
                  <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sqlQuery">SQL Query</Label>
                  <Textarea
                    id="sqlQuery"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="SELECT * FROM table_name WHERE condition FETCH FIRST 100 ROWS ONLY"
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a SQL query to preview data from the database. This query will be used for data preview and training.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={executeCustomQuery}
                    disabled={isFetchingData || !sqlQuery.trim()}
                  >
                    {isFetchingData ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Execute Query
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveQuery}
                    disabled={!sqlQuery.trim()}
                  >
                    Save Query
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSqlQuery('')}
                    disabled={!sqlQuery.trim()}
                  >
                    Clear
                  </Button>
                </div>
                  </div>
                </div>

                {/* Query Results */}
                <div className="flex-1 overflow-hidden flex flex-col p-4 min-h-0">
                  {previewError && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 mb-4">
                      {previewError}
                    </div>
                  )}

                  {previewData.length > 0 && (
                    <div className="border rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
                        <div className="overflow-auto flex-1">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0">
                              <tr>
                                {previewColumns.map((col) => (
                                  <th key={col} className="px-4 py-2 text-left font-medium text-foreground whitespace-nowrap">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.map((row, idx) => (
                                <tr key={idx} className="border-t border-border/50 hover:bg-muted/30">
                                  {previewColumns.map((col) => (
                                    <td key={col} className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                                      {row[col] === null ? (
                                        <span className="text-muted-foreground/50 italic">null</span>
                                      ) : (
                                        String(row[col])
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground border-t">
                          Showing {previewData.length} row{previewData.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 glass-card rounded-xl p-4 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Data preview is only available for database datasets.</p>
          </div>
        )}

        {/* Right Sidebar: Tabs + Overview + Schema */}
        {showRightPanel && (
          <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          {/* Toggle Buttons for Preview/Query (only for database type) */}
          {dataset.type === 'database' && (
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('preview')}
                className="flex-1"
              >
                <Table2 className="w-4 h-4 mr-2" />
                Data Preview
              </Button>
              <Button
                variant={viewMode === 'query' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('query')}
                className="flex-1"
              >
                <Code className="w-4 h-4 mr-2" />
                SQL Query
              </Button>
            </div>
          )}

          {/* Overview Section */}
          <div className="glass-card rounded-xl p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Overview
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Dataset Name</p>
                <p className="text-sm font-medium text-foreground">{dataset.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="text-sm font-medium text-foreground">{getTypeLabel()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <span className={`text-xs px-2 py-0.5 rounded-md ${
                  dataset.status === 'active' 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {dataset.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Project</p>
                <p className="text-sm font-medium text-foreground">
                  {project ? project.name : 'N/A'}
                </p>
              </div>
            </div>

            {dataset.type === 'database' && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <h3 className="text-xs font-semibold text-foreground mb-3">Connection Details</h3>
                <div className="space-y-3">
                  {dataset.connectionString && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Connection String</p>
                      <p className="text-xs font-mono text-foreground break-all bg-muted/50 p-2 rounded">
                        {dataset.connectionString}
                      </p>
                    </div>
                  )}
                  {dataset.username && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Username</p>
                      <p className="text-sm font-medium text-foreground">{dataset.username}</p>
                    </div>
                  )}
                  {dataset.password && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Password</p>
                      <p className="text-sm font-mono text-foreground">
                        {'•'.repeat(12)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Schema Section */}
          <div className="glass-card rounded-xl p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Schema
            </h2>
            
            {dataset.schema ? (
              <div className="space-y-3">
                {dataset.schema.fields && dataset.schema.fields.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-foreground mb-2">Fields</h3>
                    <div className="space-y-1.5">
                      {dataset.schema.fields.map((field, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-foreground">{field.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {field.type}
                            </span>
                          </div>
                          {field.description && (
                            <p className="text-[10px] text-muted-foreground">{field.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dataset.schema.labelInfo && (
                  <div>
                    <h3 className="text-xs font-semibold text-foreground mb-2">Label Information</h3>
                    <div className="space-y-1.5">
                      {dataset.schema.labelInfo.column && (
                        <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Label Column</p>
                          <p className="text-xs font-medium text-foreground">
                            {dataset.schema.labelInfo.column}
                          </p>
                        </div>
                      )}
                      {dataset.schema.labelInfo.classes && dataset.schema.labelInfo.classes.length > 0 && (
                        <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-[10px] text-muted-foreground mb-1">Classes</p>
                          <div className="flex flex-wrap gap-1.5">
                            {dataset.schema.labelInfo.classes.map((cls, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                              >
                                {cls}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No schema defined for this dataset.
              </p>
            )}
          </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <DatasetFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        dataset={dataset}
      />
    </div>
  )
}
