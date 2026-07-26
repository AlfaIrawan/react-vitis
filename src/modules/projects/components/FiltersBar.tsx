import { ArrowUpDown, Folder, FileText, CheckCircle, Archive, List, Search, FolderPlus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type TypeFilter = 'all' | 'folders' | 'projects'
export type SortOrder = 'name-asc' | 'name-desc'

interface FiltersBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: 'all' | 'active' | 'archived'
  onStatusFilterChange: (filter: 'all' | 'active' | 'archived') => void
  typeFilter: TypeFilter
  onTypeFilterChange: (filter: TypeFilter) => void
  sortOrder: SortOrder
  onSortOrderChange: (order: SortOrder) => void
  totalProjects: number
  activeProjects: number
  archivedProjects: number
  totalFolders: number
  onCreateFolder?: () => void
  onCreateProject?: () => void
  /** Bar seleksi (X project/folder selected + Move to Folder + Clear) — ditampilkan di dalam panel search */
  selectionBar?: React.ReactNode
  /** Mode folder: sembunyikan Type filter (All/Folders/Projects), hanya tampilkan Status filter dan Create Project */
  folderMode?: boolean
}

export function FiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortOrder,
  onSortOrderChange,
  totalProjects,
  activeProjects,
  archivedProjects,
  totalFolders,
  onCreateFolder,
  onCreateProject,
  selectionBar,
  folderMode = false,
}: FiltersBarProps) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-border/50">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={folderMode ? 'Search projects...' : 'Search projects and folders...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 pt-2 border-t border-border/50">
          {/* Type Filter — hidden in folder mode */}
          {!folderMode && (
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-[60px]">
              <List className="w-4 h-4" />
              <span>Type</span>
            </div>
            <div className="flex items-center gap-1.5 bg-muted/30 rounded-lg p-1 flex-1">
              <button
                onClick={() => onTypeFilterChange('all')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  typeFilter === 'all'
                    ? 'bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                )}
              >
                <span>All</span>
                <span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                  {totalProjects + totalFolders}
                </span>
              </button>
              <button
                onClick={() => onTypeFilterChange('folders')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  typeFilter === 'folders'
                    ? 'bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                )}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Folders</span>
                <span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                  {totalFolders}
                </span>
              </button>
              <button
                onClick={() => onTypeFilterChange('projects')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  typeFilter === 'projects'
                    ? 'bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Projects</span>
                <span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                  {totalProjects}
                </span>
              </button>
            </div>
          </div>
          )}

          {/* Divider — hide when folder mode (no Type filter before it) */}
          {!folderMode && <div className="hidden lg:block w-px h-8 bg-border" />}

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-[70px]">
              <CheckCircle className="w-4 h-4" />
              <span>Status</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onStatusFilterChange('all')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  statusFilter === 'all'
                    ? 'bg-primary text-white shadow-sm hover:bg-primary/90 hover:text-white [&_span]:text-white'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                All
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-white/20">
                  {totalProjects}
                </span>
              </button>
              <button
                onClick={() => onStatusFilterChange('active')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  statusFilter === 'active'
                    ? 'bg-primary text-white shadow-sm hover:bg-primary/90 hover:text-white [&_span]:text-white'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />
                Active
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-white/20">
                  {activeProjects}
                </span>
              </button>
              <button
                onClick={() => onStatusFilterChange('archived')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  statusFilter === 'archived'
                    ? 'bg-primary text-white shadow-sm hover:bg-primary/90 hover:text-white [&_span]:text-white'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <Archive className="w-3.5 h-3.5 inline mr-1.5" />
                Archived
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-white/20">
                  {archivedProjects}
                </span>
              </button>
            </div>
          </div>

          {/* Selection bar: sebaris dengan filter, di kiri New Folder */}
          {selectionBar && (
            <>
              <div className="hidden lg:block w-px h-8 bg-border" />
              {selectionBar}
            </>
          )}

          {/* Action Buttons */}
          <div className="hidden lg:block w-px h-8 bg-border" />
          <div className="flex items-center gap-2">
            {!folderMode && onCreateFolder && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateFolder}
                className="gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">New Folder</span>
              </Button>
            )}
            {onCreateProject && (
              <Button
                size="sm"
                onClick={onCreateProject}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Project</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
