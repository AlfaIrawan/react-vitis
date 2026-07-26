import { useState, useRef, useEffect } from 'react'
import { useRunStore, type RunDraft, type RunPurpose } from '@/modules/runs'
import { useProjectStore } from '@/modules/projects'
import { fetchDatasets, type Dataset } from '@/modules/datasets'
import { useTrainerStore } from '@/modules/trainers'
import { useComputeStore } from '@/modules/compute'
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
import { KeyValueEditor } from '@/modules/runs'

interface RunFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  run?: RunDraft | null // If provided, edit mode; otherwise, create mode
}

/**
 * RunFormModal - Modal for creating/editing run draft configuration
 *
 * This modal is for DRAFT CONFIGURATION ONLY. It does NOT execute training,
 * call trainer APIs, or stream logs.
 *
 * Scope: Module 4 - Run Setup (PRE-Training)
 * 
 * Run WAJIB memilih:
 * - Dataset (data)
 * - Trainer (training logic/script)
 * - Compute (execution environment)
 */
export function RunFormModal({
  open,
  onOpenChange,
  run,
}: RunFormModalProps) {
  const { addRun, updateRun } = useRunStore()
  const { projects, getProject } = useProjectStore()
  // Datasets will be fetched via API
  const { getTrainersByProject } = useTrainerStore()
  const { getComputesByProject } = useComputeStore()
  const { activeProjectId } = useActiveProjectStore()
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    datasetId: '',
    trainerId: '',
    computeId: '',
    purpose: 'fine-tuning' as RunPurpose,
    parameters: {} as Record<string, string>,
    tags: '',
    notes: '',
  })
  const [errors, setErrors] = useState<{ 
    name?: string
    projectId?: string
    datasetId?: string
    trainerId?: string
    computeId?: string
  }>({})
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([])
  const nameInputRef = useRef<HTMLInputElement>(null)

  const isEditMode = !!run

  // Initialize form data when modal opens or run changes
  useEffect(() => {
    if (open) {
      if (run) {
        // Edit mode: populate with existing run data
        setFormData({
          name: run.name,
          projectId: run.projectId,
          datasetId: run.datasetId || '',
          trainerId: run.trainerId || '',
          computeId: run.computeId || '',
          purpose: run.purpose,
          parameters: run.parameters || {},
          tags: run.tags?.join(', ') || '',
          notes: run.notes || '',
        })
      } else {
        // Create mode: auto-inherit active project (Project-First enforcement)
        setFormData({
          name: '',
          projectId: activeProjectId || '',
          datasetId: '',
          trainerId: '',
          computeId: '',
          purpose: 'fine-tuning',
          parameters: {},
          tags: '',
          notes: '',
        })
      }
      setErrors({})
      // Autofocus on name input
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [open, run, activeProjectId])

  // Fetch datasets when project changes
  useEffect(() => {
    if (formData.projectId) {
      fetchDatasets({ project_id: formData.projectId })
        .then(setAvailableDatasets)
        .catch((error) => {
          console.error('[RunFormModal] Failed to fetch datasets:', error)
          setAvailableDatasets([])
        })
    } else {
      setAvailableDatasets([])
    }
  }, [formData.projectId])

  // Get available resources for selected project
  const availableTrainers = formData.projectId
    ? getTrainersByProject(formData.projectId)
    : []
  const availableComputes = formData.projectId
    ? getComputesByProject(formData.projectId)
    : []

  // Get all projects for dropdown
  const activeProjects = projects.filter((p) => p.status === 'active')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation - Run WAJIB memilih Dataset, Trainer, dan Compute
    const newErrors: typeof errors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Run name is required'
    }
    if (!formData.projectId) {
      newErrors.projectId = 'Project is required. Please select or create a project from the top navigation.'
    }
    if (!formData.datasetId) {
      newErrors.datasetId = 'Dataset is required'
    }
    if (!formData.trainerId) {
      newErrors.trainerId = 'Trainer is required'
    }
    if (!formData.computeId) {
      newErrors.computeId = 'Compute environment is required'
    }

    // Project-First Enforcement: reject creation without active project
    if (!isEditMode && !activeProjectId) {
      addToast({
        title: 'Project Required',
        description: 'Please select or create a project from the top navigation before creating a run.',
        variant: 'error',
      })
      return
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Parse tags (comma-separated)
    const tags = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    if (isEditMode && run) {
      // Update existing run
      await updateRun(run.id, {
        name: formData.name.trim(),
        projectId: formData.projectId,
        datasetId: formData.datasetId,
        trainerId: formData.trainerId,
        computeId: formData.computeId,
        purpose: formData.purpose,
        parameters: formData.parameters,
        tags,
        notes: formData.notes.trim() || undefined,
      })

      addToast({
        title: 'Run draft diperbarui',
        description: `Run "${formData.name.trim()}" telah diperbarui.`,
        variant: 'success',
      })
    } else {
      // Create new run
      const newRun = await addRun({
        name: formData.name.trim(),
        projectId: formData.projectId,
        datasetId: formData.datasetId,
        trainerId: formData.trainerId,
        computeId: formData.computeId,
        purpose: formData.purpose,
        parameters: formData.parameters,
        tags,
        notes: formData.notes.trim() || undefined,
      })

      addToast({
        title: 'Run draft dibuat',
        description: `Run "${newRun.name}" telah dibuat.`,
        variant: 'success',
      })
    }

    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const isSubmitDisabled = !formData.name.trim() || !formData.projectId || !formData.datasetId || !formData.trainerId || !formData.computeId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogClose />
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Run Draft' : 'Create Run'}</DialogTitle>
          <DialogDescription>
            Run ini adalah draft konfigurasi. Training belum dijalankan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section A: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Basic Info</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">
                Run Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                ref={nameInputRef}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (errors.name) setErrors({ ...errors, name: undefined })
                }}
                placeholder="Enter run name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">
                Project <span className="text-destructive">*</span>
              </Label>
              {isEditMode ? (
                <select
                  id="project"
                  value={formData.projectId}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      projectId: e.target.value,
                      engineConnectorId: '', // Reset connectors when project changes
                      dataSourceConnectorId: '',
                    })
                    if (errors.projectId) setErrors({ ...errors, projectId: undefined })
                  }}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.projectId ? 'border-destructive' : ''
                  }`}
                >
                  <option value="">Select a project</option>
                  {activeProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm items-center">
                  {formData.projectId ? (
                    <span className="text-foreground">
                      {getProject(formData.projectId)?.name || 'Unknown Project'}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      No active project selected. Please select a project from the top navigation.
                    </span>
                  )}
                </div>
              )}
              {errors.projectId && (
                <p className="text-sm text-destructive">{errors.projectId}</p>
              )}
              {!isEditMode && !formData.projectId && (
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  Please select or create a project from the top navigation to create a run.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this run"
                rows={3}
              />
            </div>
          </div>

          {/* Section B: Select Dataset, Trainer, and Compute (WAJIB) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Select Resources (Required)</h3>
            <p className="text-xs text-muted-foreground">
              Run WAJIB memilih Dataset (data), Trainer (training logic), dan Compute (execution environment).
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="dataset">
                Dataset <span className="text-destructive">*</span>
              </Label>
              <select
                id="dataset"
                value={formData.datasetId}
                onChange={(e) => {
                  setFormData({ ...formData, datasetId: e.target.value })
                  if (errors.datasetId) setErrors({ ...errors, datasetId: undefined })
                }}
                disabled={!formData.projectId}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.datasetId ? 'border-destructive' : ''
                }`}
              >
                <option value="">
                  {!formData.projectId
                    ? 'Select a project first'
                    : availableDatasets.length === 0
                    ? 'No datasets available'
                    : 'Select dataset'}
                </option>
                {availableDatasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.type})
                  </option>
                ))}
              </select>
              {errors.datasetId && (
                <p className="text-sm text-destructive">{errors.datasetId}</p>
              )}
              {formData.projectId && availableDatasets.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Project ini belum memiliki dataset. Buat dataset terlebih dahulu.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="trainer">
                Trainer <span className="text-destructive">*</span>
              </Label>
              <select
                id="trainer"
                value={formData.trainerId}
                onChange={(e) => {
                  setFormData({ ...formData, trainerId: e.target.value })
                  if (errors.trainerId) setErrors({ ...errors, trainerId: undefined })
                }}
                disabled={!formData.projectId}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.trainerId ? 'border-destructive' : ''
                }`}
              >
                <option value="">
                  {!formData.projectId
                    ? 'Select a project first'
                    : availableTrainers.length === 0
                    ? 'No trainers available'
                    : 'Select trainer'}
                </option>
                {availableTrainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name} ({trainer.framework})
                  </option>
                ))}
              </select>
              {errors.trainerId && (
                <p className="text-sm text-destructive">{errors.trainerId}</p>
              )}
              {formData.projectId && availableTrainers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Project ini belum memiliki trainer. Buat trainer terlebih dahulu.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="compute">
                Compute <span className="text-destructive">*</span>
              </Label>
              <select
                id="compute"
                value={formData.computeId}
                onChange={(e) => {
                  setFormData({ ...formData, computeId: e.target.value })
                  if (errors.computeId) setErrors({ ...errors, computeId: undefined })
                }}
                disabled={!formData.projectId}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.computeId ? 'border-destructive' : ''
                }`}
              >
                <option value="">
                  {!formData.projectId
                    ? 'Select a project first'
                    : availableComputes.length === 0
                    ? 'No compute environments available'
                    : 'Select compute environment'}
                </option>
                {availableComputes.map((compute) => (
                  <option key={compute.id} value={compute.id}>
                    {compute.name} ({compute.type})
                  </option>
                ))}
              </select>
              {errors.computeId && (
                <p className="text-sm text-destructive">{errors.computeId}</p>
              )}
              {formData.projectId && availableComputes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Project ini belum memiliki compute environment. Tambahkan compute terlebih dahulu.
                </p>
              )}
            </div>
          </div>

          {/* Section C: Run Config */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Run Config</h3>
            
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <select
                id="purpose"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value as RunPurpose })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="fine-tuning">Fine-tuning</option>
                <option value="pretraining">Pretraining</option>
                <option value="evaluation">Evaluation</option>
                <option value="data-prep">Data Prep</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {formData.purpose === 'fine-tuning' && 'Melatih ulang model dengan data spesifik.'}
                {formData.purpose === 'pretraining' && 'Melatih model dari awal dengan data besar.'}
                {formData.purpose === 'evaluation' && 'Menguji performa model tanpa training.'}
                {formData.purpose === 'data-prep' && 'Menyiapkan atau membersihkan data.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Parameters</Label>
              <KeyValueEditor
                value={formData.parameters}
                onChange={(params) => setFormData({ ...formData, parameters: params })}
                placeholder={{ key: 'Parameter name', value: 'Parameter value' }}
              />
              <p className="text-xs text-muted-foreground">
                Optional key-value parameters for the run configuration.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Comma-separated tags (e.g., nlp, vision, research)"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple tags with commas
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isEditMode ? 'Update Draft' : 'Create Run'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
