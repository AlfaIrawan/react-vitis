import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Share2, Edit, Filter, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { SelectionActionBar } from './SelectionActionBar'
import { ProjectsSection } from './ProjectsSection'
import { FiltersBar } from './FiltersBar'
import { useProjectStore, useFolderStore } from '@/modules/projects'
import { useToast } from '@/components/ui/toast'
import { notifyEvent } from '@/lib/api/notificationApi'
import type { Folder, Project } from '@/modules/projects'
import type { SortOrder } from './FiltersBar'
import type { LayoutMode } from './FoldersSection'

interface FolderViewProps {
  folder: Folder
  onBack: () => void
  onShare: (folder: Folder) => void
  onRename?: (folder: Folder) => void
  selectedProjectIds: Set<string>
  onSelectProject: (projectId: string, selected: boolean, shiftKey?: boolean) => void
  onMoveSelectedToFolder: (folderId: string | null) => void
  onClearSelection: () => void
  sortOrder: SortOrder
  onSortOrderChange: (order: SortOrder) => void
  /** Sama seperti di luar folder: drag state dan urutan untuk reorder, create project di folder ini */
  isDragActive?: boolean
  draggedProjectIds?: Set<string>
  orderedProjectIds?: string[]
  onCreateProject?: () => void
  layout?: LayoutMode
  /** Mirip halaman root: icon dan panel search & filter */
  showFiltersPanel?: boolean
  onShowFiltersPanelChange?: (show: boolean) => void
  onLayoutChange?: (layout: LayoutMode) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  statusFilter?: 'all' | 'active' | 'archived'
  onStatusFilterChange?: (filter: 'all' | 'active' | 'archived') => void
  /** Project yang sudah di-filter oleh parent (search + status); jika tidak ada, pakai semua project di folder */
  projects?: Project[]
  totalProjects?: number
  activeProjects?: number
  archivedProjects?: number
  selectionBar?: React.ReactNode
}

export function FolderView({
  folder,
  onBack,
  onShare,
  onRename,
  selectedProjectIds,
  onSelectProject,
  onMoveSelectedToFolder,
  onClearSelection,
  sortOrder,
  onSortOrderChange,
  isDragActive = false,
  draggedProjectIds,
  orderedProjectIds,
  onCreateProject,
  layout = 'grid',
  showFiltersPanel = true,
  onShowFiltersPanelChange,
  onLayoutChange,
  searchQuery = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
  projects: projectsProp,
  totalProjects: totalProjectsProp,
  activeProjects: activeProjectsProp,
  archivedProjects: archivedProjectsProp,
  selectionBar,
}: FolderViewProps) {
  const { getProjectsByFolder } = useProjectStore()
  const { updateFolder, isFolderNameUnique } = useFolderStore()
  const { addToast } = useToast()
  const allFolderProjects = getProjectsByFolder(folder.id)
  const projects = projectsProp ?? allFolderProjects

  const totalProjects = totalProjectsProp ?? allFolderProjects.length
  const activeProjects = activeProjectsProp ?? allFolderProjects.filter((p) => p.status === 'active').length
  const archivedProjects = archivedProjectsProp ?? allFolderProjects.filter((p) => p.status === 'archived').length

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(folder.name)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setRenameValue(folder.name)
  }, [folder.name])

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [isRenaming])

  const saveRename = async () => {
    const trimmed = renameValue.trim()
    if (trimmed === '' || trimmed === folder.name) {
      setIsRenaming(false)
      return
    }
    if (trimmed.length < 3) {
      addToast({ title: 'Nama folder minimal 3 karakter', variant: 'error' })
      return
    }
    if (trimmed.length > 40) {
      addToast({ title: 'Nama folder maksimal 40 karakter', variant: 'error' })
      return
    }
    if (!isFolderNameUnique(trimmed, folder.id, folder.parentId ?? null)) {
      addToast({ title: 'Nama folder sudah dipakai', variant: 'error' })
      return
    }
    try {
      await updateFolder(folder.id, { name: trimmed })
      addToast({ title: 'Folder diubah', description: `Menjadi "${trimmed}".`, variant: 'success' })
      notifyEvent({ type_code: 'folder', title: 'Folder diubah', body: `Menjadi "${trimmed}".` })
      setIsRenaming(false)
    } catch (e) {
      addToast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Gagal mengubah folder',
        variant: 'error',
      })
    }
  }

  const cancelRename = () => {
    setRenameValue(folder.name)
    setIsRenaming(false)
  }

  const displayName = isRenaming ? renameValue : folder.name

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Projects', onClick: onBack },
          { label: displayName },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={saveRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') {
                    cancelRename()
                    e.currentTarget.blur()
                  }
                }}
                className="text-2xl font-bold text-foreground w-full min-w-0 px-2 py-1 rounded border border-primary/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Folder name"
              />
            ) : (
              <h1 className="text-2xl font-bold text-foreground truncate">{folder.name}</h1>
            )}
            {!isRenaming && folder.description && (
              <p className="text-sm text-muted-foreground mt-1">{folder.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onShowFiltersPanelChange && (
            <Tooltip content={showFiltersPanel ? 'Hide search & filter panel' : 'Show search & filter panel'} side="bottom">
              <button
                type="button"
                onClick={() => onShowFiltersPanelChange(!showFiltersPanel)}
                className={cn(
                  'flex items-center justify-center rounded-lg p-2.5 text-muted-foreground transition-all duration-200 hover:bg-background hover:text-foreground hover:shadow-sm',
                  showFiltersPanel && 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                )}
                aria-label={showFiltersPanel ? 'Hide panel' : 'Show panel'}
              >
                <Filter className="w-5 h-5" />
              </button>
            </Tooltip>
          )}
          {onLayoutChange && (
            <Tooltip content={layout === 'grid' ? 'Show as list' : 'Show as grid'} side="bottom">
              <button
                type="button"
                onClick={() => onLayoutChange(layout === 'grid' ? 'list' : 'grid')}
                className={cn(
                  'flex items-center justify-center rounded-lg p-2.5 text-muted-foreground transition-all duration-200 hover:bg-background hover:text-foreground hover:shadow-sm',
                  layout === 'grid' && 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                )}
                aria-label={layout === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              >
                {layout === 'grid' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
              </button>
            </Tooltip>
          )}
          <Button variant="outline" size="sm" onClick={() => onShare(folder)}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          {onRename && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRenaming(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Rename
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters — sama seperti halaman root */}
      {showFiltersPanel && onSearchChange && onStatusFilterChange && (
        <FiltersBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          typeFilter="projects"
          onTypeFilterChange={() => {}}
          sortOrder={sortOrder}
          onSortOrderChange={onSortOrderChange}
          totalProjects={totalProjects}
          activeProjects={activeProjects}
          archivedProjects={archivedProjects}
          totalFolders={0}
          onCreateProject={onCreateProject}
          selectionBar={selectionBar}
          folderMode
        />
      )}

      {/* Projects Section — kemampuan sama seperti di luar folder: sort, drag/reorder, create */}
      <ProjectsSection
        projects={projects}
        onSelectProject={onSelectProject}
        selectedProjectIds={selectedProjectIds}
        showCheckbox={true}
        sortOrder={sortOrder}
        onSortOrderChange={onSortOrderChange}
        showSortControl={true}
        showDropZone={false}
        onCreateProject={onCreateProject}
        isDragActive={isDragActive}
        draggedProjectIds={draggedProjectIds}
        orderedProjectIds={orderedProjectIds}
        layout={layout}
      />

      {/* Selection Action Bar */}
      <SelectionActionBar
        selectedProjectCount={selectedProjectIds.size}
        selectedFolderCount={0}
        onClear={onClearSelection}
        onMoveToFolder={onMoveSelectedToFolder}
      />
    </div>
  )
}
