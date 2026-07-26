import { useState, useRef, useEffect } from 'react'
import { useTrainerStore, type Trainer, type TrainerFramework, type TrainerTask } from '@/modules/trainers'
import { useBaseModelStore } from '@/modules/base-models'
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

interface TrainerFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainer?: Trainer | null
}

export function TrainerFormModal({
  open,
  onOpenChange,
  trainer,
}: TrainerFormModalProps) {
  const { addTrainer, updateTrainer } = useTrainerStore()
  const { getBaseModelsByProject } = useBaseModelStore()
  const { activeProjectId, hasActiveProject } = useActiveProjectStore()
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    framework: 'pytorch' as TrainerFramework,
    task: 'classification' as TrainerTask,
    entryPointScript: '',
    version: '1.0.0',
    description: '',
    baseModelId: '',
  })
  const [errors, setErrors] = useState<{ name?: string; entryPointScript?: string; baseModelId?: string }>({})
  const nameInputRef = useRef<HTMLInputElement>(null)

  const isEditMode = !!trainer

  useEffect(() => {
    if (open) {
      if (trainer) {
        setFormData({
          name: trainer.name,
          framework: trainer.framework,
          task: trainer.task,
          entryPointScript: trainer.entryPointScript,
          version: trainer.version,
          description: trainer.description || '',
          baseModelId: trainer.baseModelId || '',
        })
      } else {
        setFormData({
          name: '',
          framework: 'pytorch',
          task: 'classification',
          entryPointScript: '',
          version: '1.0.0',
          description: '',
          baseModelId: '',
        })
      }
      setErrors({})
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [open, trainer])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasActiveProject()) {
      addToast({
        title: 'Project Required',
        description: 'Please select or create a project before creating a trainer.',
        variant: 'error',
      })
      return
    }

    const newErrors: typeof errors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Trainer name is required'
    }
    if (!formData.entryPointScript.trim()) {
      newErrors.entryPointScript = 'Entry point script is required'
    }
    if (!formData.baseModelId) {
      newErrors.baseModelId = 'Base Model is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (isEditMode && trainer) {
      updateTrainer(trainer.id, {
        name: formData.name.trim(),
        framework: formData.framework,
        task: formData.task,
        entryPointScript: formData.entryPointScript.trim(),
        version: formData.version.trim(),
        description: formData.description.trim() || undefined,
        baseModelId: formData.baseModelId,
      })

      addToast({
        title: 'Trainer diperbarui',
        description: `Trainer "${formData.name.trim()}" telah diperbarui.`,
        variant: 'success',
      })
    } else {
      const newTrainer = addTrainer({
        name: formData.name.trim(),
        framework: formData.framework,
        task: formData.task,
        entryPointScript: formData.entryPointScript.trim(),
        version: formData.version.trim(),
        description: formData.description.trim() || undefined,
        projectId: activeProjectId!,
        baseModelId: formData.baseModelId,
      })

      addToast({
        title: 'Trainer dibuat',
        description: `Trainer "${newTrainer.name}" telah dibuat.`,
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
          <DialogTitle>{isEditMode ? 'Edit Trainer' : 'Create Trainer'}</DialogTitle>
          <DialogDescription>
            Trainer mendefinisikan script atau logic untuk melatih model. Trainer TIDAK menyimpan data atau menentukan infra.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Trainer Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              ref={nameInputRef}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) setErrors({ ...errors, name: undefined })
              }}
              placeholder="Enter trainer name"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="framework">
                Framework <span className="text-destructive">*</span>
              </Label>
              <select
                id="framework"
                value={formData.framework}
                onChange={(e) => setFormData({ ...formData, framework: e.target.value as TrainerFramework })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="pytorch">PyTorch</option>
                <option value="tensorflow">TensorFlow</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task">
                Task <span className="text-destructive">*</span>
              </Label>
              <select
                id="task"
                value={formData.task}
                onChange={(e) => setFormData({ ...formData, task: e.target.value as TrainerTask })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="classification">Classification</option>
                <option value="regression">Regression</option>
                <option value="nlp">NLP</option>
                <option value="cv">Computer Vision</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseModelId">
              Base Model <span className="text-destructive">*</span>
            </Label>
            <select
              id="baseModelId"
              value={formData.baseModelId}
              onChange={(e) => {
                setFormData({ ...formData, baseModelId: e.target.value })
                if (errors.baseModelId) setErrors({ ...errors, baseModelId: undefined })
              }}
              disabled={!activeProjectId}
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${
                errors.baseModelId ? 'border-destructive' : ''
              } ${!activeProjectId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {!activeProjectId
                  ? 'Select a project first'
                  : getBaseModelsByProject(activeProjectId).length === 0
                  ? 'No base models available - register one first'
                  : 'Select base model'}
              </option>
              {activeProjectId &&
                getBaseModelsByProject(activeProjectId).map((baseModel) => (
                  <option key={baseModel.id} value={baseModel.id}>
                    {baseModel.name} ({baseModel.source_type})
                  </option>
                ))}
            </select>
            {errors.baseModelId && (
              <p className="text-sm text-destructive">{errors.baseModelId}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Base model to use as starting point for training. Register base models in the Base Models section.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entryPointScript">
              Entry Point Script <span className="text-destructive">*</span>
            </Label>
            <Input
              id="entryPointScript"
              value={formData.entryPointScript}
              onChange={(e) => {
                setFormData({ ...formData, entryPointScript: e.target.value })
                if (errors.entryPointScript) setErrors({ ...errors, entryPointScript: undefined })
              }}
              placeholder="e.g., train_bert.py"
              className={errors.entryPointScript ? 'border-destructive' : ''}
            />
            {errors.entryPointScript && (
              <p className="text-sm text-destructive">{errors.entryPointScript}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Path ke script training yang akan dijalankan
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">
              Version <span className="text-destructive">*</span>
            </Label>
            <Input
              id="version"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="e.g., 1.0.0"
            />
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
            <Button type="submit" disabled={!formData.name.trim() || !formData.entryPointScript.trim() || !hasActiveProject()}>
              {isEditMode ? 'Update Trainer' : 'Create Trainer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
