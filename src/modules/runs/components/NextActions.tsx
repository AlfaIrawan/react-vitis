import { Package, ArrowRight, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useModelStore } from '../../models/store/modelStore'
import { useToast } from '@/components/ui/toast'
import type { RunDraft } from '../store/runStore'

interface NextActionsProps {
  run: RunDraft
  onRegisterModel?: () => void
  onPromoteToInference?: () => void
  onCreateNewRun?: () => void
}

/**
 * NextActions - Decision buttons for post-training actions
 * Module 6 - Results & Evaluation (POST-Training)
 */
export function NextActions({
  run,
  onRegisterModel,
  onPromoteToInference,
  onCreateNewRun,
}: NextActionsProps) {
  const navigate = useNavigate()
  const { registerModelFromRun, models } = useModelStore()
  const { addToast } = useToast()

  // Only show actions for completed runs
  if (run.status !== 'completed') {
    return null
  }

  // Check if model already exists for this run
  const existingModel = models.find((m) =>
    m.versions.some((v) => v.sourceRunId === run.id)
  )

  const handleRegisterModel = () => {
    if (onRegisterModel) {
      onRegisterModel()
      return
    }

    // Register model from completed run
    const model = registerModelFromRun(run)
    if (model) {
      addToast({
        title: 'Model registered successfully',
        description: `${model.name} has been added to the model registry.`,
        variant: 'success',
      })
      navigate(`/models/${model.id}`)
    } else {
      addToast({
        title: 'Registration failed',
        description: 'Unable to register model. Please ensure the run has completed successfully.',
        variant: 'error',
      })
    }
  }

  const handlePromoteToInference = () => {
    if (onPromoteToInference) {
      onPromoteToInference()
    } else {
      // Placeholder - in real app, this would promote model to inference
      console.log('Promote to inference for run:', run.id)
    }
  }

  const handleCreateNewRun = () => {
    if (onCreateNewRun) {
      onCreateNewRun()
    } else {
      // Navigate to run creation with current run's configuration
      navigate(`/runs?copyFrom=${run.id}`)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Next Actions</h2>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleRegisterModel}
          className="flex items-center gap-2"
          disabled={!!existingModel}
        >
          <Package className="w-4 h-4" />
          {existingModel ? 'Already Registered' : 'Register Model'}
        </Button>
        {existingModel && (
          <Button
            variant="outline"
            onClick={() => navigate(`/models/${existingModel.id}`)}
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            View in Registry
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handlePromoteToInference}
          className="flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          Promote to Inference
        </Button>
        <Button
          variant="outline"
          onClick={handleCreateNewRun}
          className="flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Create New Run from This Configuration
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        These actions allow you to proceed with your trained model. Model registration saves it to the model registry,
        while promotion to inference makes it available for production use.
      </p>
    </div>
  )
}
