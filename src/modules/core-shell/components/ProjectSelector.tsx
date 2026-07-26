import { useState } from 'react'
import { ChevronDown, FolderOpen, Plus, Check } from 'lucide-react'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { useProjectStore } from '@/modules/projects/store/projectStore'
import { CreateProjectModal } from '@/modules/projects/components/CreateProjectModal'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/**
 * Project Selector Component
 * 
 * Global project selector for Project-First enforcement.
 * Displays the currently active project and allows:
 * - Switching between projects
 * - Creating a new project
 * - Clearing selection (if needed for admin views)
 */
export function ProjectSelector() {
  const { activeProjectId, setActiveProject } = useActiveProjectStore()
  const { projects, getProject } = useProjectStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const activeProject = activeProjectId ? getProject(activeProjectId) : null
  const activeProjects = projects.filter((p) => p.status === 'active')

  const handleProjectSelect = (projectId: string) => {
    setActiveProject(projectId)
  }

  const handleCreateProject = () => {
    setIsCreateModalOpen(true)
  }

  const handleProjectCreated = (projectId: string) => {
    setActiveProject(projectId)
    setIsCreateModalOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'flex items-center gap-2 px-3 h-9 min-w-[200px] justify-between',
              !activeProject && 'border border-yellow-500/50 bg-yellow-500/10'
            )}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FolderOpen className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium truncate">
                {activeProject ? activeProject.name : 'Select Project'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px]">
          <DropdownMenuLabel>Active Project</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {activeProjects.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                No active projects found.
              </p>
              <Button
                size="sm"
                onClick={handleCreateProject}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <>
              {activeProjects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FolderOpen className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm truncate">{project.name}</span>
                  </div>
                  {activeProjectId === project.id && (
                    <Check className="w-4 h-4 shrink-0 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleCreateProject}
                className="cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Project
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onProjectCreated={handleProjectCreated}
        autoNavigate={false}
      />
    </>
  )
}
