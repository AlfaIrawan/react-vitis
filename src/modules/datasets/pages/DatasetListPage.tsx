import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Search, Database, Loader2, Filter, List, LayoutGrid, GripVertical, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { type Dataset, fetchDatasets, deleteDataset } from '@/modules/datasets'
import { notifyEvent } from '@/lib/api/notificationApi'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { DatasetCard } from '../components/DatasetCard'
import { DatasetFormModal } from '../components/DatasetFormModal'
import { DatasetDeleteConfirmModal } from '../components/DatasetDeleteConfirmModal'
import { DatasetSelectionActionBar } from '../components/DatasetSelectionActionBar'
import { ProjectEmptyState } from '@/modules/core-shell/components/ProjectEmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tooltip } from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/toast'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

function formatDateModified(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

const LIST_GRID_COLS = 'auto minmax(0,1fr) minmax(0,2fr) 120px 90px 40px'

function DatasetListRow({
  dataset,
  onEdit,
  onDelete,
  onOpen,
  formatDate,
  isSelected,
  onSelect,
}: {
  dataset: Dataset
  onEdit: (dataset: Dataset) => void
  onDelete: (dataset: Dataset) => void
  onOpen: () => void
  formatDate: (dateStr: string) => string
  isSelected?: boolean
  onSelect?: (datasetId: string, selected: boolean, shiftKey?: boolean) => void
}) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(dataset)
  }
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(dataset)
  }
  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) return
    if (onSelect) onSelect(dataset.id, !isSelected, e.shiftKey)
    else onOpen()
  }
  const handleRowDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) return
    onOpen()
  }
  return (
    <div
      data-dataset-row
      className={cn(
        'grid gap-2 px-4 py-2.5 items-center text-sm cursor-pointer transition-colors',
        'hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
        isSelected && 'border-l-4 border-l-primary bg-primary/5'
      )}
      style={{ gridTemplateColumns: LIST_GRID_COLS }}
      onClick={handleRowClick}
      onDoubleClick={handleRowDoubleClick}
    >
      <div className="flex items-center touch-none shrink-0">
        <GripVertical className="w-4 h-4 text-muted-foreground" aria-hidden />
      </div>
      <div className="font-medium text-foreground truncate min-w-0">{dataset.name}</div>
      <div className="text-muted-foreground truncate min-w-0">
        {dataset.description || '—'}
      </div>
      <div className="text-muted-foreground text-xs shrink-0">
        {formatDate(dataset.updatedAt || dataset.createdAt)}
      </div>
      <div className="shrink-0">
        <span
          className={cn(
            'inline-flex px-2 py-0.5 rounded text-xs font-medium',
            dataset.status === 'active'
              ? 'bg-green-500/15 text-green-700 dark:text-green-400'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {dataset.status === 'active' ? 'Active' : dataset.status}
        </span>
      </div>
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function DatasetListPage() {
  const navigate = useNavigate()
  const { activeProjectId, hasActiveProject } = useActiveProjectStore()
  const { addToast } = useToast()
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'database' | 'file' | 'object-storage'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null)
  const [showFiltersPanel, setShowFiltersPanel] = useState(true)
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmMode, setDeleteConfirmMode] = useState<'single' | 'bulk'>('single')
  const [deleteConfirmDataset, setDeleteConfirmDataset] = useState<Dataset | null>(null)
  const [isDeletingDataset, setIsDeletingDataset] = useState(false)

  const handleSelectDataset = useCallback((datasetId: string, selected: boolean, shiftKey?: boolean) => {
    if (shiftKey) {
      setSelectedDatasetIds((prev) => {
        const next = new Set(prev)
        if (selected) next.add(datasetId)
        else next.delete(datasetId)
        return next
      })
    } else {
      if (selected) {
        setSelectedDatasetIds(new Set([datasetId]))
      } else {
        setSelectedDatasetIds((prev) => {
          const next = new Set(prev)
          next.delete(datasetId)
          return next
        })
      }
    }
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedDatasetIds(new Set())
  }, [])

  // Fetch datasets when component mounts or project changes
  useEffect(() => {
    console.log('[DatasetListPage] activeProjectId:', activeProjectId)
    if (activeProjectId) {
      console.log('[DatasetListPage] Fetching datasets for project:', activeProjectId)
      setIsLoading(true)
      fetchDatasets({ project_id: activeProjectId })
        .then((data) => {
          setDatasets(data)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error('[DatasetListPage] Failed to fetch datasets:', error)
          setDatasets([])
          setIsLoading(false)
        })
    } else {
      console.log('[DatasetListPage] No active project, skipping fetch')
      setDatasets([])
    }
  }, [activeProjectId])

  // Project-First Enforcement: Filter datasets by active project
  const projectDatasets = useMemo(() => {
    if (!activeProjectId) {
      console.log('[DatasetListPage] No active project, returning empty array')
      return []
    }
    const filtered = datasets.filter((d) => d.projectId === activeProjectId)
    console.log('[DatasetListPage] Filtered datasets for project', activeProjectId, ':', filtered.length, 'datasets')
    return filtered
  }, [activeProjectId, datasets])

  const filteredDatasets = useMemo(() => {
    let filtered = activeProjectId ? projectDatasets : []

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      filtered = filtered.filter((d) =>
        d.name.toLowerCase().includes(lowerQuery) ||
        d.description?.toLowerCase().includes(lowerQuery) ||
        d.type.toLowerCase().includes(lowerQuery)
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((d) => d.type === typeFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter)
    }

    return filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [projectDatasets, activeProjectId, searchQuery, typeFilter, statusFilter])

  const databaseDatasets = projectDatasets.filter((d) => d.type === 'database')
  const fileDatasets = projectDatasets.filter((d) => d.type === 'file')
  const objectStorageDatasets = projectDatasets.filter((d) => d.type === 'object-storage')
  const activeDatasets = projectDatasets.filter((d) => d.status === 'active')

  const handleDeleteSelected = useCallback(() => {
    if (selectedDatasetIds.size === 0) return
    setDeleteConfirmMode('bulk')
    setDeleteConfirmDataset(null)
    setDeleteConfirmOpen(true)
  }, [selectedDatasetIds.size])

  const handleConfirmDelete = useCallback(async () => {
    if (deleteConfirmMode === 'single' && deleteConfirmDataset) {
      setIsDeletingDataset(true)
      try {
        await deleteDataset(deleteConfirmDataset.id)
        addToast({
          title: 'Dataset deleted',
          description: `Dataset "${deleteConfirmDataset.name}" has been deleted.`,
          variant: 'success',
        })
        notifyEvent({
          type_code: 'dataset',
          title: 'Dataset deleted',
          body: `Dataset "${deleteConfirmDataset.name}" has been deleted.`,
        })
        if (activeProjectId) {
          const data = await fetchDatasets({ project_id: activeProjectId })
          setDatasets(data)
        }
      } catch (error: any) {
        addToast({
          title: 'Failed to delete dataset',
          description: error?.message || 'An error occurred while deleting the dataset.',
          variant: 'error',
        })
        throw error
      } finally {
        setIsDeletingDataset(false)
      }
      return
    }
    if (deleteConfirmMode === 'bulk' && selectedDatasetIds.size > 0) {
      const ids = Array.from(selectedDatasetIds)
      setIsDeletingDataset(true)
      try {
        for (const id of ids) {
          await deleteDataset(id)
        }
        addToast({
          title: 'Dataset deleted',
          description: `${ids.length} dataset(s) have been deleted.`,
          variant: 'success',
        })
        notifyEvent({
          type_code: 'dataset',
          title: 'Dataset deleted',
          body: `${ids.length} dataset(s) have been deleted.`,
        })
        setSelectedDatasetIds(new Set())
        if (activeProjectId) {
          const data = await fetchDatasets({ project_id: activeProjectId })
          setDatasets(data)
        }
      } catch (error: any) {
        addToast({
          title: 'Failed to delete dataset',
          description: error?.message || 'An error occurred.',
          variant: 'error',
        })
        throw error
      } finally {
        setIsDeletingDataset(false)
      }
    }
  }, [deleteConfirmMode, deleteConfirmDataset, selectedDatasetIds, activeProjectId, addToast])

  const handleOpenDeleteConfirm = useCallback((dataset: Dataset) => {
    setDeleteConfirmMode('single')
    setDeleteConfirmDataset(dataset)
    setDeleteConfirmOpen(true)
  }, [])

  // Clear selection when filtered list no longer contains selected items
  useEffect(() => {
    if (selectedDatasetIds.size === 0) return
    const filteredIds = new Set(filteredDatasets.map((d) => d.id))
    const stillSelected = Array.from(selectedDatasetIds).filter((id) => filteredIds.has(id))
    if (stillSelected.length === selectedDatasetIds.size) return
    setSelectedDatasetIds(new Set(stillSelected))
  }, [filteredDatasets, selectedDatasetIds])

  // Esc to clear selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedDatasetIds.size > 0) {
        setSelectedDatasetIds(new Set())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedDatasetIds.size])

  const handleEdit = (dataset: Dataset) => {
    setEditingDataset(dataset)
  }

  const handleDelete = (dataset: Dataset) => {
    handleOpenDeleteConfirm(dataset)
  }

  const handleCloseEditModal = (open: boolean) => {
    if (!open) {
      setEditingDataset(null)
    }
  }

  if (!hasActiveProject()) {
    return <ProjectEmptyState moduleName="Datasets" />
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 min-h-[calc(100vh-14rem)]">
      <PageHeader
        title="Dataset"
        description="Datasets are the data sources used to train and evaluate your models. Add or connect datasets from relational databases, files, or object storage; each dataset can be referenced by Trainers and Runs so your pipeline has consistent, versioned access to the data it needs for training and validation."
        right={
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 p-1.5 shadow-sm">
            <Tooltip content={showFiltersPanel ? 'Hide search & filter panel' : 'Show search & filter panel'} side="bottom">
              <button
                type="button"
                onClick={() => setShowFiltersPanel((v) => !v)}
                className={cn(
                  'flex items-center justify-center rounded-lg p-2.5 text-muted-foreground transition-all duration-200 hover:bg-background hover:text-foreground hover:shadow-sm',
                  showFiltersPanel && 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                )}
                aria-label={showFiltersPanel ? 'Hide panel' : 'Show panel'}
              >
                <Filter className="h-5 w-5" strokeWidth={2} />
              </button>
            </Tooltip>
            <Tooltip content={layout === 'grid' ? 'Show as list' : 'Show as grid'} side="bottom">
              <button
                type="button"
                onClick={() => setLayout((v) => (v === 'grid' ? 'list' : 'grid'))}
                className={cn(
                  'flex items-center justify-center rounded-lg p-2.5 text-muted-foreground transition-all duration-200 hover:bg-background hover:text-foreground hover:shadow-sm',
                  layout === 'grid' && 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                )}
                aria-label={layout === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              >
                {layout === 'grid' ? (
                  <List className="h-5 w-5" strokeWidth={2} />
                ) : (
                  <LayoutGrid className="h-5 w-5" strokeWidth={2} />
                )}
              </button>
            </Tooltip>
          </div>
        }
      />

      {showFiltersPanel && (
      <div className="glass-card rounded-2xl p-4" data-filters-panel>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search datasets"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Type:</span>
                <Button
                  variant={typeFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTypeFilter('all')}
                >
                  All ({projectDatasets.length})
                </Button>
                <Button
                  variant={typeFilter === 'database' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTypeFilter('database')}
                >
                  <Database className="w-3.5 h-3.5 mr-1.5" />
                  Relational Database ({databaseDatasets.length})
                </Button>
                <Button
                  variant={typeFilter === 'file' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTypeFilter('file')}
                >
                  File ({fileDatasets.length})
                </Button>
                <Button
                  variant={typeFilter === 'object-storage' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTypeFilter('object-storage')}
                >
                  Object Storage ({objectStorageDatasets.length})
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All ({projectDatasets.length})
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  Active ({activeDatasets.length})
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selectedDatasetIds.size > 0 && (
                <>
                  <div className="hidden sm:block w-px h-8 bg-border self-center" />
                  <DatasetSelectionActionBar
                    inline
                    selectedCount={selectedDatasetIds.size}
                    onClear={handleClearSelection}
                    onDeleteSelected={handleDeleteSelected}
                  />
                </>
              )}
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={!hasActiveProject()}
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Dataset
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}

      <div
        className={cn('flex flex-1 flex-col min-h-0', layout === 'list' || layout === 'grid' ? 'min-h-0' : '')}
        onClick={(e) => {
          const target = e.target as HTMLElement
          if (target.closest('[data-dataset-card]') || target.closest('[data-dataset-row]') || target.closest('[data-filters-panel]')) return
          if (selectedDatasetIds.size > 0) handleClearSelection()
        }}
      >
      {isLoading ? (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 p-12">
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Loading datasets...</span>
          </div>
        </div>
      ) : filteredDatasets.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 flex-col">
          {projectDatasets.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
              <img
                src="/images/dataset.png"
                alt=""
                className="mx-auto mb-0 h-64 w-auto max-w-[480px] object-contain block"
              />
              <h3 className="text-lg font-semibold text-foreground mb-2 -mt-3">
                No dataset has been configured yet.
              </h3>
              <p className="text-sm text-muted-foreground">
                Create a dataset to store training and evaluation data sources.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No datasets found
              </h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      ) : layout === 'list' ? (
        <div className="glass-card rounded-xl border border-border/50 overflow-hidden flex flex-1 min-h-0 flex-col">
          <div
            className="grid gap-2 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30 items-center shrink-0"
            style={{ gridTemplateColumns: LIST_GRID_COLS }}
          >
            <div className="w-4" />
            <div>Name</div>
            <div>Description</div>
            <div>Date modified</div>
            <div>Status</div>
            <div />
          </div>
          <div className="divide-y divide-border/50 flex-1 min-h-0 overflow-auto">
            {filteredDatasets
              .filter((dataset) => dataset && dataset.id && dataset.name)
              .map((dataset) => (
                <DatasetListRow
                  key={dataset.id}
                  dataset={dataset}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onOpen={() => navigate(`/projects/${dataset.projectId}/datasets/${dataset.id}`)}
                  formatDate={formatDateModified}
                  isSelected={selectedDatasetIds.has(dataset.id)}
                  onSelect={handleSelectDataset}
                />
              ))}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-auto flex-1 min-h-0">
          {filteredDatasets
            .filter((dataset) => dataset && dataset.id && dataset.name)
            .map((dataset) => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isSelected={selectedDatasetIds.has(dataset.id)}
                onSelect={handleSelectDataset}
                onDoubleClick={() => navigate(`/projects/${dataset.projectId}/datasets/${dataset.id}`)}
              />
            ))}
          </div>
        </div>
      )}
      </div>

      <DatasetFormModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open)
          if (!open && activeProjectId) {
            // Refresh datasets after create
            fetchDatasets({ project_id: activeProjectId })
              .then(setDatasets)
              .catch((error) => {
                console.error('[DatasetListPage] Failed to refresh datasets:', error)
              })
          }
        }}
      />
      <DatasetFormModal
        open={!!editingDataset}
        onOpenChange={(open) => {
          handleCloseEditModal(open)
          if (!open && activeProjectId) {
            // Refresh datasets after update
            fetchDatasets({ project_id: activeProjectId })
              .then(setDatasets)
              .catch((error) => {
                console.error('[DatasetListPage] Failed to refresh datasets:', error)
              })
          }
        }}
        dataset={editingDataset}
      />

      <DatasetDeleteConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open)
          if (!open) setDeleteConfirmDataset(null)
        }}
        mode={deleteConfirmMode}
        dataset={deleteConfirmDataset}
        selectedCount={selectedDatasetIds.size}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeletingDataset}
      />
    </div>
  )
}
