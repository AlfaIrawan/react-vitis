import { useState, useMemo } from 'react'
import { Plus, Search, Brain } from 'lucide-react'
import { useTrainerStore } from '@/modules/trainers'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { TrainerCard } from '../components/TrainerCard'
import { TrainerFormModal } from '../components/TrainerFormModal'
import { ProjectEmptyState } from '@/modules/core-shell/components/ProjectEmptyState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'

export function TrainerListPage() {
  const { searchTrainers, getTrainersByProject } = useTrainerStore()
  const { activeProjectId, hasActiveProject } = useActiveProjectStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [frameworkFilter, setFrameworkFilter] = useState<'all' | 'pytorch' | 'tensorflow' | 'custom'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const projectTrainers = useMemo(() => {
    if (!activeProjectId) return []
    return getTrainersByProject(activeProjectId)
  }, [activeProjectId, getTrainersByProject])

  const filteredTrainers = useMemo(() => {
    let filtered = activeProjectId ? projectTrainers : []

    if (searchQuery) {
      filtered = searchTrainers(searchQuery).filter((t) =>
        activeProjectId ? t.projectId === activeProjectId : false
      )
    }

    if (frameworkFilter !== 'all') {
      filtered = filtered.filter((t) => t.framework === frameworkFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    return filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [projectTrainers, activeProjectId, searchQuery, frameworkFilter, statusFilter, searchTrainers])

  const pytorchTrainers = projectTrainers.filter((t) => t.framework === 'pytorch')
  const tensorflowTrainers = projectTrainers.filter((t) => t.framework === 'tensorflow')
  const customTrainers = projectTrainers.filter((t) => t.framework === 'custom')
  const activeTrainers = projectTrainers.filter((t) => t.status === 'active')

  if (!hasActiveProject()) {
    return <ProjectEmptyState moduleName="Trainers" />
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 min-h-[calc(100vh-14rem)]">
      <PageHeader
        title="Trainer"
        description="Trainer mendefinisikan script atau logic untuk melatih model."
        right={
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!hasActiveProject()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Trainer
          </Button>
        }
      />

      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search trainers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Framework:</span>
              <Button
                variant={frameworkFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFrameworkFilter('all')}
              >
                All ({projectTrainers.length})
              </Button>
              <Button
                variant={frameworkFilter === 'pytorch' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFrameworkFilter('pytorch')}
              >
                PyTorch ({pytorchTrainers.length})
              </Button>
              <Button
                variant={frameworkFilter === 'tensorflow' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFrameworkFilter('tensorflow')}
              >
                TensorFlow ({tensorflowTrainers.length})
              </Button>
              <Button
                variant={frameworkFilter === 'custom' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFrameworkFilter('custom')}
              >
                Custom ({customTrainers.length})
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Button
                variant={statusFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({projectTrainers.length})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active ({activeTrainers.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col min-h-0">
      {filteredTrainers.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 flex-col">
          {projectTrainers.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Belum ada trainer yang dikonfigurasi.
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Buat trainer untuk mendefinisikan script atau logic training model.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Trainer
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No trainers found
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
          {filteredTrainers.map((trainer) => (
            <TrainerCard key={trainer.id} trainer={trainer} />
          ))}
          </div>
        </div>
      )}
      </div>

      <TrainerFormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  )
}
