import { FolderOpen, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CreateProjectModal } from '@/modules/projects/components/CreateProjectModal'
import { useState } from 'react'

/**
 * ProjectEmptyState Component
 * 
 * Displays when accessing project-scoped lifecycle modules without an active project.
 * Provides clear guidance and CTAs to create or select a project.
 * 
 * Project-First Enforcement: This component enforces that all lifecycle entities
 * (Connectors, Runs, Models, Deployments) must belong to a Project.
 */
interface ProjectEmptyStateProps {
  moduleName: string
  description?: string
}

export function ProjectEmptyState({ moduleName, description }: ProjectEmptyStateProps) {
  const navigate = useNavigate()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const defaultDescription = description || 
    `This section is project-scoped. All ${moduleName.toLowerCase()} must belong to a project.`

  return (
    <>
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <FolderOpen className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3">
          Project Context Required
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-2">
          {defaultDescription}
        </p>
        <p className="text-xs text-muted-foreground/70 max-w-md mb-6">
          Select or create a project from the top navigation to get started.
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="default"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
          <Button
            onClick={() => navigate('/projects')}
            variant="outline"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Select Existing Project
          </Button>
        </div>
      </div>

      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        autoNavigate={false}
      />
    </>
  )
}
