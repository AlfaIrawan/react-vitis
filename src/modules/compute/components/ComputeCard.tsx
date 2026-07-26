import { Server, Cpu, FolderOpen } from 'lucide-react'
import type { Compute } from '@/modules/compute'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/modules/projects'

interface ComputeCardProps {
  compute: Compute
}

export function ComputeCard({ compute }: ComputeCardProps) {
  const navigate = useNavigate()
  const { getProject } = useProjectStore()

  const getTypeLabel = () => {
    const typeLabels: Record<string, string> = {
      'local': 'Local',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'managed': 'Managed',
    }
    return typeLabels[compute.type] || compute.type
  }

  const getStatusColor = () => {
    switch (compute.status) {
      case 'available':
        return 'bg-green-500/10 text-green-500'
      case 'busy':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'unavailable':
        return 'bg-red-500/10 text-red-500'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const project = getProject(compute.projectId)
  const projectName = project?.name

  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer'
      )}
      onClick={() => navigate(`/projects/${compute.projectId}/compute/${compute.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
              {compute.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">{getTypeLabel()}</span>
              <span className={`text-xs px-2 py-0.5 rounded-md ${getStatusColor()}`}>
                {compute.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {compute.description && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {compute.description}
        </p>
      )}

      {compute.resources && (
        <div className="text-xs text-muted-foreground mb-2 space-y-1">
          {compute.resources.cpu && (
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>{compute.resources.cpu}</span>
            </div>
          )}
          {compute.resources.gpu && (
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>{compute.resources.gpu}</span>
            </div>
          )}
          {compute.resources.memory && (
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              <span>{compute.resources.memory}</span>
            </div>
          )}
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
