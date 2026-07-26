import { useState, useMemo } from 'react'
import { Search, Filter, Package } from 'lucide-react'
import { useDeploymentStore } from '@/modules/deployment'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { DeploymentCard } from '../components/DeploymentCard'
import { ProjectEmptyState } from '@/modules/core-shell/components/ProjectEmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useModelStore } from '@/modules/models'
import { PageHeader } from '@/components/layout/PageHeader'

export function DeploymentsPage() {
  const {
    deployments,
    getDeploymentsByProject,
    activateDeployment,
    pauseDeployment,
    retireDeployment,
  } = useDeploymentStore()
  
  const { activeProjectId, hasActiveProject } = useActiveProjectStore()
  const { models, getModelsByProject } = useModelStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'retired'>('all')
  const [retireDialog, setRetireDialog] = useState<{ open: boolean; deploymentId: string | null }>({
    open: false,
    deploymentId: null,
  })

  // Project-First Enforcement: Filter deployments by active project
  const projectDeployments = useMemo(() => {
    if (!activeProjectId) return []
    return getDeploymentsByProject(activeProjectId)
  }, [activeProjectId, getDeploymentsByProject])

  // Filter deployments
  const filteredDeployments = useMemo(() => {
    // Start with project-scoped deployments
    let filtered = activeProjectId ? projectDeployments : []

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (d) =>
          d.modelName.toLowerCase().includes(query) ||
          d.modelVersion.toLowerCase().includes(query) ||
          d.endpoint.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter)
    }

    return filtered
  }, [projectDeployments, activeProjectId, searchQuery, statusFilter])

  // Only show models with status 'production' for deployment (project-scoped)
  const productionModels = useMemo(() => {
    if (!activeProjectId) return []
    const projectModels = getModelsByProject(activeProjectId)
    return projectModels.filter((m) => m.status === 'production')
  }, [activeProjectId, models, getModelsByProject])

  // Project-First Enforcement: Show empty state if no active project
  if (!hasActiveProject()) {
    return <ProjectEmptyState moduleName="Deployments" />
  }

  const handleActivate = (id: string) => {
    activateDeployment(id)
  }

  const handlePause = (id: string) => {
    pauseDeployment(id)
  }

  const handleRetire = (id: string) => {
    setRetireDialog({ open: true, deploymentId: id })
  }

  const confirmRetire = () => {
    if (retireDialog.deploymentId) {
      retireDeployment(retireDialog.deploymentId)
      setRetireDialog({ open: false, deploymentId: null })
    }
  }

  const statusCounts = useMemo(() => {
    return {
      all: deployments.length,
      active: deployments.filter((d) => d.status === 'active').length,
      paused: deployments.filter((d) => d.status === 'paused').length,
      retired: deployments.filter((d) => d.status === 'retired').length,
    }
  }, [deployments])

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 min-h-[calc(100vh-14rem)]">
      {/* Header */}
      <PageHeader
        title="Deployments"
        description="Manage and monitor AI model deployments. Only Production models can be deployed."
      />

      {/* Search and Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search deployments by model name, version, or endpoint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setStatusFilter('all')}
            >
              All ({statusCounts.all})
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setStatusFilter('active')}
            >
              Active ({statusCounts.active})
            </Button>
            <Button
              variant={statusFilter === 'paused' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setStatusFilter('paused')}
            >
              Paused ({statusCounts.paused})
            </Button>
            <Button
              variant={statusFilter === 'retired' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setStatusFilter('retired')}
            >
              Retired ({statusCounts.retired})
            </Button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      {productionModels.length === 0 && (
        <div className="glass-panel rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/10 shrink-0">
          <p className="text-sm text-yellow-400">
            No Production models available. Promote models to Production status in Model Registry to enable deployment.
          </p>
        </div>
      )}

      {/* Deployments Grid */}
      <div className="flex flex-1 flex-col min-h-0">
      {filteredDeployments.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No deployments found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'No deployments match your search criteria.'
                : 'No deployments yet. Deploy a Production model to get started.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-auto flex-1 min-h-0">
          {filteredDeployments.map((deployment) => (
            <DeploymentCard
              key={deployment.id}
              deployment={deployment}
              onActivate={handleActivate}
              onPause={handlePause}
              onRetire={handleRetire}
            />
          ))}
          </div>
        </div>
      )}
      </div>

      {/* Retire Confirmation Dialog */}
      <Dialog open={retireDialog.open} onOpenChange={(open) => setRetireDialog({ open, deploymentId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retire Deployment</DialogTitle>
            <DialogDescription>
              Are you sure you want to retire this deployment? This action will stop the model from serving requests.
              The deployment can be reactivated later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetireDialog({ open: false, deploymentId: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRetire}>
              Retire Deployment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
