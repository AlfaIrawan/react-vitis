import { useState, useMemo, useEffect } from 'react'
import { Search } from 'lucide-react'
import { useModelStore } from '../store/modelStore'
import { useProjectStore } from '../../projects/store/projectStore'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { ModelCard } from '../components/ModelCard'
import { EmptyState } from '../components/EmptyState'
import { ProjectEmptyState } from '@/modules/core-shell/components/ProjectEmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { ModelStatus } from '../store/modelStore'

export function ModelRegistryPage() {
  const { models, searchModels, getModelsByProject } = useModelStore()
  const { getProject } = useProjectStore()
  const { activeProjectId, hasActiveProject } = useActiveProjectStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ModelStatus>('all')

  // Populate project names
  useEffect(() => {
    models.forEach((model) => {
      const project = getProject(model.projectId)
      if (project && !model.projectName) {
        // Update model with project name (this is a workaround since we can't directly update)
        // In a real app, this would be handled differently
      }
    })
  }, [models, getProject])

  // Project-First Enforcement: Filter models by active project
  const projectModels = useMemo(() => {
    if (!activeProjectId) return []
    return getModelsByProject(activeProjectId)
  }, [activeProjectId, getModelsByProject])

  const filteredModels = useMemo(() => {
    // Start with project-scoped models
    let filtered = activeProjectId ? projectModels : []

    // Apply search
    if (searchQuery) {
      const searchResults = searchModels(searchQuery)
      filtered = searchResults.filter((m) =>
        activeProjectId ? m.projectId === activeProjectId : false
      )
    }

    // Update project names in filtered results
    filtered = filtered.map((model) => {
      const project = getProject(model.projectId)
      return {
        ...model,
        projectName: project?.name || 'Unknown Project',
      }
    })

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((m) => m.status === statusFilter)
    }

    return filtered.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [projectModels, activeProjectId, searchQuery, statusFilter, searchModels, getProject])

  const statusCounts = useMemo(() => {
    return {
      all: projectModels.length,
      draft: projectModels.filter((m) => m.status === 'draft').length,
      staging: projectModels.filter((m) => m.status === 'staging').length,
      production: projectModels.filter((m) => m.status === 'production').length,
      archived: projectModels.filter((m) => m.status === 'archived').length,
    }
  }, [projectModels])

  // Project-First Enforcement: Show empty state if no active project
  if (!hasActiveProject()) {
    return <ProjectEmptyState moduleName="Models" />
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 min-h-[calc(100vh-14rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Model Registry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tempat resmi untuk menyimpan dan mengelola model AI yang telah dilatih.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search models by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Status:</span>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({statusCounts.all})
            </Button>
            <Button
              variant={statusFilter === 'draft' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('draft')}
            >
              Draft ({statusCounts.draft})
            </Button>
            <Button
              variant={statusFilter === 'staging' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('staging')}
            >
              Staging ({statusCounts.staging})
            </Button>
            <Button
              variant={statusFilter === 'production' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('production')}
            >
              Production ({statusCounts.production})
            </Button>
            <Button
              variant={statusFilter === 'archived' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('archived')}
            >
              Archived ({statusCounts.archived})
            </Button>
          </div>
        </div>
      </div>

      {/* Model List */}
      <div className="flex flex-1 flex-col min-h-0">
      {filteredModels.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center">
          {models.length === 0 ? (
            <EmptyState
              title="Belum ada model terdaftar"
              description="Model akan tersedia setelah training selesai."
            />
          ) : (
            <EmptyState
              title="No models found"
              description="Try adjusting your search or filter criteria."
            />
          )}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-auto flex-1 min-h-0">
          {filteredModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
