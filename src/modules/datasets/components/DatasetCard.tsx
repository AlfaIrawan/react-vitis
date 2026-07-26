import { Database, FolderOpen, MoreVertical, Edit, Trash2 } from 'lucide-react'
import type { Dataset } from '@/modules/datasets'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/modules/projects'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

interface DatasetCardProps {
  dataset: Dataset
  onEdit?: (dataset: Dataset) => void
  onDelete?: (dataset: Dataset) => void
  /** 'card' = default grid card, 'list' = compact row for list view */
  variant?: 'card' | 'list'
  isSelected?: boolean
  onSelect?: (datasetId: string, selected: boolean, shiftKey?: boolean) => void
  onDoubleClick?: () => void
}

export function DatasetCard({
  dataset,
  onEdit,
  onDelete,
  variant = 'card',
  isSelected = false,
  onSelect,
  onDoubleClick,
}: DatasetCardProps) {
  const navigate = useNavigate()
  const { getProject } = useProjectStore()

  // Safety check: if dataset is invalid, don't render
  if (!dataset || !dataset.id || !dataset.name) {
    return null
  }

  const getTypeLabel = () => {
    const typeLabels: Record<string, string> = {
      'database': 'Relational Database',
      'file': 'File',
      'object-storage': 'Object Storage',
    }
    return typeLabels[dataset.type] || dataset.type || 'Unknown'
  }

  const project = dataset.projectId ? getProject(dataset.projectId) : null
  const projectName = project?.name

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onEdit?.(dataset)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onDelete?.(dataset)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[role="menuitem"]')) return
    if (onSelect) onSelect(dataset.id, !isSelected, e.shiftKey)
    else navigate(`/projects/${dataset.projectId}/datasets/${dataset.id}`)
  }

  const handleCardDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[role="menuitem"]')) return
    if (onDoubleClick) onDoubleClick()
    else navigate(`/projects/${dataset.projectId}/datasets/${dataset.id}`)
  }

  if (variant === 'list') {
    return (
      <div
        className={cn(
          'glass-card rounded-xl px-4 py-3 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer'
        )}
        onClick={handleCardClick}
      >
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <Database className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {dataset.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
            <span>{getTypeLabel()}</span>
            {projectName && (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{projectName}</span>
              </>
            )}
          </div>
        </div>
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-md shrink-0',
          dataset.status === 'active'
            ? 'bg-green-500/10 text-green-500'
            : 'bg-muted text-muted-foreground'
        )}>
          {dataset.status}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div
      data-dataset-card
      className={cn(
        'glass-card rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer',
        isSelected && 'bg-primary/5'
      )}
      style={
        isSelected
          ? {
              border: '2px solid hsl(var(--primary))',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.35)',
            }
          : undefined
      }
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
              {dataset.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">{getTypeLabel()}</span>
              <span className={`text-xs px-2 py-0.5 rounded-md ${
                dataset.status === 'active' 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {dataset.status}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDelete} 
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {dataset.description && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {dataset.description}
        </p>
      )}

      {dataset.schema?.labelInfo && (
        <div className="text-xs text-muted-foreground mb-2">
          Labels: {dataset.schema.labelInfo.classes?.join(', ') || 'N/A'}
        </div>
      )}

      {projectName && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{projectName}</span>
        </div>
      )}
    </div>
  )
}
