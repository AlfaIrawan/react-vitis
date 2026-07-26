import { useState, useMemo } from 'react'
import { Plus, Search, Server } from 'lucide-react'
import { useComputeStore } from '@/modules/compute'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { ComputeCard } from '../components/ComputeCard'
import { ComputeFormModal } from '../components/ComputeFormModal'
import { ProjectEmptyState } from '@/modules/core-shell/components/ProjectEmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'

export function ComputeListPage() {
  const { searchComputes, getComputesByProject } = useComputeStore()
  const { activeProjectId, hasActiveProject } = useActiveProjectStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'local' | 'docker' | 'kubernetes' | 'managed'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'busy' | 'unavailable'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const projectComputes = useMemo(() => {
    if (!activeProjectId) return []
    return getComputesByProject(activeProjectId)
  }, [activeProjectId, getComputesByProject])

  const filteredComputes = useMemo(() => {
    let filtered = activeProjectId ? projectComputes : []

    if (searchQuery) {
      filtered = searchComputes(searchQuery).filter((c) =>
        activeProjectId ? c.projectId === activeProjectId : false
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((c) => c.type === typeFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }

    return filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [projectComputes, activeProjectId, searchQuery, typeFilter, statusFilter, searchComputes])

  const localComputes = projectComputes.filter((c) => c.type === 'local')
  const dockerComputes = projectComputes.filter((c) => c.type === 'docker')
  const kubernetesComputes = projectComputes.filter((c) => c.type === 'kubernetes')
  const managedComputes = projectComputes.filter((c) => c.type === 'managed')
  const availableComputes = projectComputes.filter((c) => c.status === 'available')

  if (!hasActiveProject()) {
    return <ProjectEmptyState moduleName="Compute" />
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 min-h-[calc(100vh-14rem)]">
      <PageHeader
        title="Compute"
        description="Compute menentukan environment dan resource tempat trainer dijalankan."
        right={
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!hasActiveProject()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Compute
          </Button>
        }
      />

      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search compute environments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Type:</span>
              <Button
                variant={typeFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTypeFilter('all')}
              >
                All ({projectComputes.length})
              </Button>
              <Button
                variant={typeFilter === 'local' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTypeFilter('local')}
              >
                <Server className="w-3.5 h-3.5 mr-1.5" />
                Local ({localComputes.length})
              </Button>
              <Button
                variant={typeFilter === 'docker' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTypeFilter('docker')}
              >
                Docker ({dockerComputes.length})
              </Button>
              <Button
                variant={typeFilter === 'kubernetes' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTypeFilter('kubernetes')}
              >
                Kubernetes ({kubernetesComputes.length})
              </Button>
              <Button
                variant={typeFilter === 'managed' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTypeFilter('managed')}
              >
                Managed ({managedComputes.length})
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Button
                variant={statusFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({projectComputes.length})
              </Button>
              <Button
                variant={statusFilter === 'available' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('available')}
              >
                Available ({availableComputes.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col min-h-0">
      {filteredComputes.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 flex-col">
          {projectComputes.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
              <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Belum ada compute environment yang dikonfigurasi.
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tambahkan compute environment untuk menentukan tempat trainer dijalankan.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Compute
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No compute environments found
              </h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-auto flex-1 min-h-0">
          {filteredComputes.map((compute) => (
            <ComputeCard key={compute.id} compute={compute} />
          ))}
          </div>
        </div>
      )}
      </div>

      <ComputeFormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  )
}
