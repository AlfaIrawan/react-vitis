import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { WorkflowGroup } from '../types'

interface WorkflowGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: WorkflowGroup | null
  projectId: string
  onSave: (group: WorkflowGroup) => void
}

export function WorkflowGroupModal({
  open,
  onOpenChange,
  group,
  projectId,
  onSave,
}: WorkflowGroupModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (group) {
        setName(group.name)
        setDescription(group.description || '')
      } else {
        setName('')
        setDescription('')
      }
      setError(null)
    }
  }, [open, group])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Group name is required')
      return
    }

    try {
      if (group) {
        // Update existing group
        const updated: WorkflowGroup = {
          ...group,
          name: name.trim(),
          description: description.trim() || undefined,
          updatedAt: new Date().toISOString(),
        }
        onSave(updated)
      } else {
        // Create new group
        const newGroup: Omit<WorkflowGroup, 'id' | 'projectId' | 'createdAt' | 'updatedAt'> = {
          name: name.trim(),
          description: description.trim() || undefined,
        }
        // The actual creation will be handled by parent component
        onSave(newGroup as any)
      }
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save group')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {group ? 'Edit Workflow Group' : 'Create Workflow Group'}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-xs">
              Group Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Pipelines"
              className="h-7 text-xs mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-xs">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this group..."
              className="h-16 text-xs mt-1 resize-none"
            />
          </div>

          {error && (
            <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {group ? 'Save Changes' : 'Create Group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
