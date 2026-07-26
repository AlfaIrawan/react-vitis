import { useState, useMemo } from 'react'
import { Plus, Search, Database, Cpu } from 'lucide-react'
import { useConnectorStore } from '@/modules/connectors'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { ConnectorCard } from '@/modules/connectors'
import { ConnectorFormModal } from '@/modules/connectors'
import { ProjectEmptyState } from '@/modules/core-shell/components/ProjectEmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'

/**
 * ConnectorListPage - List all available connectors
 * 
 * This page is for CONFIGURATION ONLY. It does NOT execute, test, or monitor connectors.
 * All actions are non-operational (create, configure, view).
 * 
 * Scope: Module 3 - Connector Management (non-operational)
 */
export function ConnectorListPage() {
  const { searchConnectors, getConnectorsByProject } = useConnectorStore()
  const { activeProjectId, hasActiveProject } = useActiveProjectStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'engine' | 'data-source'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'not-connected'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Project-First Enforcement: Filter connectors by active project
  const projectConnectors = useMemo(() => {
    if (!activeProjectId) return []
    return getConnectorsByProject(activeProjectId)
  }, [activeProjectId, getConnectorsByProject])

  const filteredConnectors = useMemo(() => {
    // Start with project-scoped connectors
    let filtered = activeProjectId ? projectConnectors : []

    // Apply search
    if (searchQuery) {
      filtered = searchConnectors(searchQuery).filter((c) =>
        activeProjectId ? c.projectId === activeProjectId : false
      )
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((c) => c.type === typeFilter)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }

    return filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [projectConnectors, activeProjectId, searchQuery, typeFilter, statusFilter, searchConnectors])

  // Counts for active project only
  const engineConnectors = projectConnectors.filter((c) => c.type === 'engine')
  const dataSourceConnectors = projectConnectors.filter((c) => c.type === 'data-source')
  const connectedConnectors = projectConnectors.filter((c) => c.status === 'connected')
  const notConnectedConnectors = projectConnectors.filter((c) => c.status === 'not-connected')

  // Project-First Enforcement: Show empty state if no active project
  if (!hasActiveProject()) {
    return <ProjectEmptyState moduleName="Integrations" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Integrations"
        description="Konektor ke aplikasi, API, antrean pesan, dan sumber data untuk orkestrasi proses."
        right={
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!hasActiveProject()}
          >
          <Plus className="w-4 h-4 mr-2" />
          Create Connector
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search connectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Type:</span>
              <Button
                variant={typeFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTypeFilter('all')}
              >
                All ({projectConnectors.length})
              </Button>
              <Button
                variant={typeFilter === 'engine' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTypeFilter('engine')}
              >
                <Cpu className="w-3.5 h-3.5 mr-1.5" />
                Engine ({engineConnectors.length})
              </Button>
              <Button
                variant={typeFilter === 'data-source' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTypeFilter('data-source')}
              >
                <Database className="w-3.5 h-3.5 mr-1.5" />
                Data Source ({dataSourceConnectors.length})
              </Button>
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Button
                variant={statusFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({projectConnectors.length})
              </Button>
              <Button
                variant={statusFilter === 'connected' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('connected')}
              >
                Connected ({connectedConnectors.length})
              </Button>
              <Button
                variant={statusFilter === 'not-connected' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('not-connected')}
              >
                Not Connected ({notConnectedConnectors.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Connector List */}
      {filteredConnectors.length === 0 ? (
        <div className="glass-card rounded-2xl">
          {projectConnectors.length === 0 ? (
            <div className="p-12 text-center">
              <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Belum ada connector yang dikonfigurasi.
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Buat connector untuk menghubungkan project dengan engine atau data source.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Connector
              </Button>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No connectors found
              </h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnectors.map((connector) => (
            <ConnectorCard key={connector.id} connector={connector} />
          ))}
        </div>
      )}

      {/* Create Connector Modal */}
      <ConnectorFormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  )
}
