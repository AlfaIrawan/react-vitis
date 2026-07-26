import { Code, Brain, FolderOpen } from 'lucide-react'
import type { Trainer } from '@/modules/trainers'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/modules/projects'

interface TrainerCardProps {
  trainer: Trainer
}

export function TrainerCard({ trainer }: TrainerCardProps) {
  const navigate = useNavigate()
  const { getProject } = useProjectStore()

  const getFrameworkLabel = () => {
    const frameworkLabels: Record<string, string> = {
      'pytorch': 'PyTorch',
      'tensorflow': 'TensorFlow',
      'custom': 'Custom',
    }
    return frameworkLabels[trainer.framework] || trainer.framework
  }

  const getTaskLabel = () => {
    const taskLabels: Record<string, string> = {
      'classification': 'Classification',
      'regression': 'Regression',
      'nlp': 'NLP',
      'cv': 'Computer Vision',
      'other': 'Other',
    }
    return taskLabels[trainer.task] || trainer.task
  }

  const project = getProject(trainer.projectId)
  const projectName = project?.name

  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer'
      )}
      onClick={() => navigate(`/projects/${trainer.projectId}/trainers/${trainer.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
              {trainer.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">{getFrameworkLabel()}</span>
              <span className="text-sm text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{getTaskLabel()}</span>
              <span className={`text-xs px-2 py-0.5 rounded-md ${
                trainer.status === 'active' 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {trainer.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {trainer.description && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {trainer.description}
        </p>
      )}

      <div className="text-xs text-muted-foreground mb-2">
        <div className="flex items-center gap-1.5">
          <Code className="w-3.5 h-3.5" />
          <span>{trainer.entryPointScript}</span>
        </div>
        <div className="mt-1">Version: {trainer.version}</div>
      </div>

      {projectName && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{projectName}</span>
        </div>
      )}
    </div>
  )
}
