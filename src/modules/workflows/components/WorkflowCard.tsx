import { Copy, Trash2, ExternalLink, Eye, Code, MoreVertical, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import type { WorkflowDefinition, WorkflowGroup } from '../types'
import { cn } from '@/lib/utils'

interface WorkflowCardProps {
  workflow: WorkflowDefinition
  group?: WorkflowGroup | null
  isReferenced?: boolean
  onOpen: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onViewJSON?: () => void
  onAssignToGroup?: (groupId: string | undefined) => void
  availableGroups?: WorkflowGroup[]
  showGroupActions?: boolean
}

export function WorkflowCard({
  workflow,
  group,
  isReferenced = false,
  onOpen,
  onDuplicate,
  onDelete,
  onViewJSON,
  onAssignToGroup,
  availableGroups = [],
  showGroupActions = true,
}: WorkflowCardProps) {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer',
        isReferenced && 'border border-slate-500/20'
      )}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            'p-2 rounded-lg flex-shrink-0',
            isReferenced
              ? 'bg-slate-500/10'
              : 'bg-blue-500/10'
          )}>
            <Workflow className={cn(
              'w-5 h-5',
              isReferenced ? 'text-slate-600' : 'text-blue-600'
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1.5 truncate">
              {workflow.name}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-medium',
                isReferenced
                  ? 'bg-slate-500/10 text-slate-600'
                  : 'bg-blue-500/10 text-blue-600'
              )}>
                {isReferenced ? 'Referenced' : 'Owner'}
              </span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-medium',
                  workflow.status === 'published'
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {workflow.status}
              </span>
              <span className="text-[10px] text-muted-foreground">v{workflow.version}</span>
              {group && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/10 text-slate-600">
                  {group.name}
                </span>
              )}
            </div>
            {isReferenced && (
              <p className="text-[10px] text-muted-foreground">
                Owner: Project {workflow.ownerProjectId}
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen() }}>
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              {isReferenced ? 'View (read-only)' : 'Open'}
            </DropdownMenuItem>
            {!isReferenced && onDuplicate && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate() }}>
                <Copy className="w-3.5 h-3.5 mr-2" />
                Duplicate
              </DropdownMenuItem>
            )}
            {isReferenced && onViewJSON && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewJSON() }}>
                <Code className="w-3.5 h-3.5 mr-2" />
                Inspect JSON
              </DropdownMenuItem>
            )}
            {!isReferenced && onDelete && (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/20">
        <div className="flex items-center gap-2">
          <span>{workflow.nodes.length} nodes</span>
          <span>•</span>
          <span>{workflow.edges.length} edges</span>
        </div>
        <span>Updated {new Date(workflow.updatedAt).toLocaleDateString()}</span>
      </div>

      {showGroupActions && !isReferenced && onAssignToGroup && (
        <div className="mt-3 pt-3 border-t border-border/20">
          <select
            value={workflow.groupId || ''}
            onChange={(e) => {
              e.stopPropagation()
              onAssignToGroup(e.target.value || undefined)
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-7 px-2 text-xs rounded-md border border-input bg-background"
          >
            <option value="">Ungrouped</option>
            {availableGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
