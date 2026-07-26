import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DatasetSelectionActionBarProps {
  selectedCount: number
  onClear: () => void
  onDeleteSelected: () => void
  className?: string
  /** When true, render inline in filter panel (no sticky card). */
  inline?: boolean
}

export function DatasetSelectionActionBar({
  selectedCount,
  onClear,
  onDeleteSelected,
  className,
  inline = false,
}: DatasetSelectionActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        inline
          ? 'flex items-center gap-2 shrink-0'
          : 'sticky bottom-4 z-40 glass-card rounded-xl p-4 shadow-lg border-2 border-primary/20',
        className
      )}
    >
      <div className={inline ? 'flex items-center gap-2' : 'flex items-center justify-between'}>
        <span className="text-sm font-medium text-foreground">
          {selectedCount} {selectedCount === 1 ? 'dataset' : 'datasets'} selected
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear
          </Button>
          <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete selected
          </Button>
        </div>
      </div>
    </div>
  )
}
