import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Dataset } from '@/modules/datasets'

export type DeleteConfirmMode = 'single' | 'bulk'

interface DatasetDeleteConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Single: one dataset to delete; bulk: multiple selected */
  mode: DeleteConfirmMode
  /** For single mode: the dataset to delete */
  dataset?: Dataset | null
  /** For bulk mode: number of selected datasets */
  selectedCount?: number
  onConfirm: () => void | Promise<void>
  isDeleting?: boolean
}

export function DatasetDeleteConfirmModal({
  open,
  onOpenChange,
  mode,
  dataset,
  selectedCount = 0,
  onConfirm,
  isDeleting = false,
}: DatasetDeleteConfirmModalProps) {
  const isSingle = mode === 'single'
  const title = isSingle
    ? 'Delete dataset'
    : 'Delete selected datasets'
  const description = isSingle && dataset
    ? `Are you sure you want to delete dataset "${dataset.name}"? This action cannot be undone.`
    : `Are you sure you want to delete ${selectedCount} selected dataset(s)? This action cannot be undone.`
  const confirmLabel = isDeleting ? 'Deleting...' : isSingle ? 'Delete dataset' : `Delete ${selectedCount} dataset(s)`

  const handleConfirm = async () => {
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // Keep modal open on error; parent shows toast
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[440px] p-0 gap-0 overflow-hidden rounded-2xl border border-border/80 shadow-xl bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          {/* Header with icon and title */}
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"
                aria-hidden
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                  {title}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Footer */}
          <DialogFooter className="flex flex-row justify-end gap-3 px-6 py-4 bg-muted/30 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="min-w-[120px]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Deleting...
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
