import { useState, useRef, useEffect } from 'react'
import { useComputeStore, type Compute, type ComputeType } from '@/modules/compute'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { useToast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ComputeFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  compute?: Compute | null
}

export function ComputeFormModal({
  open,
  onOpenChange,
  compute,
}: ComputeFormModalProps) {
  const { addCompute, updateCompute } = useComputeStore()
  const { activeProjectId, hasActiveProject } = useActiveProjectStore()
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    type: 'local' as ComputeType,
    cpu: '',
    gpu: '',
    memory: '',
    description: '',
  })
  const [errors, setErrors] = useState<{ name?: string }>({})
  const nameInputRef = useRef<HTMLInputElement>(null)

  const isEditMode = !!compute

  useEffect(() => {
    if (open) {
      if (compute) {
        setFormData({
          name: compute.name,
          type: compute.type,
          cpu: compute.resources?.cpu || '',
          gpu: compute.resources?.gpu || '',
          memory: compute.resources?.memory || '',
          description: compute.description || '',
        })
      } else {
        setFormData({
          name: '',
          type: 'local',
          cpu: '',
          gpu: '',
          memory: '',
          description: '',
        })
      }
      setErrors({})
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [open, compute])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasActiveProject()) {
      addToast({
        title: 'Project Required',
        description: 'Please select or create a project before creating a compute environment.',
        variant: 'error',
      })
      return
    }

    const newErrors: typeof errors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Compute name is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const resources = {
      ...(formData.cpu && { cpu: formData.cpu }),
      ...(formData.gpu && { gpu: formData.gpu }),
      ...(formData.memory && { memory: formData.memory }),
    }

    if (isEditMode && compute) {
      updateCompute(compute.id, {
        name: formData.name.trim(),
        type: formData.type,
        resources: Object.keys(resources).length > 0 ? resources : undefined,
        description: formData.description.trim() || undefined,
      })

      addToast({
        title: 'Compute diperbarui',
        description: `Compute "${formData.name.trim()}" telah diperbarui.`,
        variant: 'success',
      })
    } else {
      const newCompute = addCompute({
        name: formData.name.trim(),
        type: formData.type,
        resources: Object.keys(resources).length > 0 ? resources : undefined,
        description: formData.description.trim() || undefined,
        projectId: activeProjectId!,
      })

      addToast({
        title: 'Compute dibuat',
        description: `Compute "${newCompute.name}" telah dibuat.`,
        variant: 'success',
      })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogClose />
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Compute' : 'Add Compute'}</DialogTitle>
          <DialogDescription>
            Compute menentukan environment dan resource tempat trainer dijalankan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Compute Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              ref={nameInputRef}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) setErrors({ ...errors, name: undefined })
              }}
              placeholder="Enter compute name"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              Type <span className="text-destructive">*</span>
            </Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ComputeType })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="local">Local</option>
              <option value="docker">Docker</option>
              <option value="kubernetes">Kubernetes</option>
              <option value="managed">Managed</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpu">CPU</Label>
              <Input
                id="cpu"
                value={formData.cpu}
                onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                placeholder="e.g., 4 cores"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpu">GPU</Label>
              <Input
                id="gpu"
                value={formData.gpu}
                onChange={(e) => setFormData({ ...formData, gpu: e.target.value })}
                placeholder="e.g., 1x NVIDIA A100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memory">Memory</Label>
              <Input
                id="memory"
                value={formData.memory}
                onChange={(e) => setFormData({ ...formData, memory: e.target.value })}
                placeholder="e.g., 16GB"
              />
            </div>
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name.trim() || !hasActiveProject()}>
              {isEditMode ? 'Update Compute' : 'Add Compute'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
