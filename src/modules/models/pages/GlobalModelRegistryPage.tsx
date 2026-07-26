import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, Filter } from 'lucide-react'
import { useModelStore } from '../store/modelStore'
import { useProjectStore } from '../../projects/store/projectStore'
import { ModelCard } from '../components/ModelCard'
import { EmptyState } from '../components/EmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import type { ModelStatus } from '../store/modelStore'

/**
 * Global Models Registry Page
 * 
 * Enterprise-level read-only view of all models across all projects.
 * Provides cross-project visibility and oversight.
 * 
 * Features:
 * - Filter by Project, Environment (status), Risk
 * - Read-only access (no create/modify actions)
 * - Cross-project lineage visibility
 */
export function GlobalModelRegistryPage() {
  const navigate = useNavigate()
  const { models, searchModels } = useModelStore()
  const { projects } = useProjectStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ModelStatus>('all')

  // Enrich models with project names
  const enrichedModels = useMemo(() => {
    return models.map((model) => {
      const project = projects.find((p) => p.id === model.projectId)
      return {
        ...model,
        projectName: project?.name || 'Unknown Project',
      }
    })
  }, [models, projects])

  // Filter models
  const filteredModels = useMemo(() => {
    let filtered = enrichedModels

    // Apply search
    if (searchQuery) {
      const searchResults = searchModels(searchQuery)
      const searchIds = new Set(searchResults.map((m) => m.id))
      filtered = filtered.filter((m) => searchIds.has(m.id))
    }

    // Apply project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter((m) => m.projectId === projectFilter)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((m) => m.status === statusFilter)
    }

    return filtered.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [enrichedModels, searchQuery, projectFilter, statusFilter, searchModels])

  const statusCounts = useMemo(() => {
    return {
      all: enrichedModels.length,
      draft: enrichedModels.filter((m) => m.status === 'draft').length,
      staging: enrichedModels.filter((m) => m.status === 'staging').length,
      production: enrichedModels.filter((m) => m.status === 'production').length,
      archived: enrichedModels.filter((m) => m.status === 'archived').length,
    }
  }, [enrichedModels])

  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    enrichedModels.forEach((m) => {
      counts[m.projectId] = (counts[m.projectId] || 0) + 1
    })
    return counts
  }, [enrichedModels])

  const handleModelClick = (model: typeof enrichedModels[0]) => {
    // Navigate to project-scoped model view
    navigate(`/projects/${model.projectId}/models/${model.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Models' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Model Registry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Global read-only registry of all models across projects. Cross-project visibility and oversight.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/20">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Read-only</span>
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
            <Filter className="w-4 h-4 text-muted-foreground" />
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

          {projects.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Project:</span>
              <Button
                variant={projectFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setProjectFilter('all')}
              >
                All Projects
              </Button>
              {projects.map((project) => (
                <Button
                  key={project.id}
                  variant={projectFilter === project.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setProjectFilter(project.id)}
                >
                  {project.name} ({projectCounts[project.id] || 0})
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Model List */}
      {filteredModels.length === 0 ? (
        <div className="glass-card rounded-2xl">
          {enrichedModels.length === 0 ? (
            <EmptyState
              title="No models registered"
              description="Models will appear here once they are created within projects."
            />
          ) : (
            <EmptyState
              title="No models found"
              description="Try adjusting your search or filter criteria."
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              onClick={() => handleModelClick(model)}
              className="cursor-pointer"
            >
              <ModelCard model={model} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
