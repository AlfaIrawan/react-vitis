import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { useRunStore } from '@/modules/runs'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { RunCard } from '@/modules/runs'
import { RunFormModal } from '@/modules/runs'
import { ProjectEmptyState } from '@/modules/core-shell/components/ProjectEmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import type { RunDraft, RunStatus } from '@/modules/runs'

export function RunListPage() {
  const { runs, searchRuns } = useRunStore()
  const { activeProjectId, hasActiveProject } = useActiveProjectStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RunStatus>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRun, setEditingRun] = useState<RunDraft | null>(null)

  // Project-First Enforcement: Filter runs by active project
  const projectRuns = useMemo(() => {
    if (!activeProjectId) return []
    return runs.filter((r) => r.projectId === activeProjectId)
  }, [runs, activeProjectId])

  const filteredRuns = useMemo(() => {
    // Start with project-scoped runs
    let filtered = activeProjectId ? projectRuns : []

    // Apply search
    if (searchQuery) {
      const searchResults = searchRuns(searchQuery)
      filtered = searchResults.filter((r) =>
        activeProjectId ? r.projectId === activeProjectId : false
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter)
    }

    return filtered.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [projectRuns, activeProjectId, searchQuery, statusFilter, searchRuns])

  // Counts for active project only
  const draftRuns = projectRuns.filter((r) => r.status === 'draft')
  const readyRuns = projectRuns.filter((r) => r.status === 'ready')
  const blockedRuns = projectRuns.filter((r) => r.status === 'blocked')

  // Project-First Enforcement: Show empty state if no active project
  if (!hasActiveProject()) {
    return <ProjectEmptyState moduleName="Executions" />
  }

  const handleEdit = (run: RunDraft) => {
    setEditingRun(run)
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setEditingRun(null)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 min-h-[calc(100vh-14rem)]">
      {/* Header */}
      <PageHeader
        title="Executions"
        description="Jalankan dan pantau instansi alur orkestrasi (bukan pelatihan model)."
        right={
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!hasActiveProject()}
          >
          <Plus className="w-4 h-4 mr-2" />
          New execution
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search executions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({projectRuns.length})
            </Button>
            <Button
              variant={statusFilter === 'draft' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('draft')}
            >
              Draft ({draftRuns.length})
            </Button>
            <Button
              variant={statusFilter === 'ready' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('ready')}
            >
              Ready ({readyRuns.length})
            </Button>
            <Button
              variant={statusFilter === 'blocked' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('blocked')}
            >
              Blocked ({blockedRuns.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Run List */}
      <div className="flex flex-1 flex-col min-h-0">
      {filteredRuns.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 flex-col">
          {projectRuns.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
              <p className="text-lg font-medium text-foreground mb-2">
                Belum ada run
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Buat run untuk menyiapkan training.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Run
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
              <p className="text-lg font-medium text-foreground mb-2">
                No runs found
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-auto flex-1 min-h-0">
          {filteredRuns.map((run) => (
            <RunCard key={run.id} run={run} onEdit={handleEdit} />
          ))}
          </div>
        </div>
      )}
      </div>

      {/* Create/Edit Run Modal */}
      <RunFormModal
        open={isCreateModalOpen || !!editingRun}
        onOpenChange={handleCloseModal}
        run={editingRun || undefined}
      />
    </div>
  )
}
