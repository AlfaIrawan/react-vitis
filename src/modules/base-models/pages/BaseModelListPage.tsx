import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Plus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/PageHeader'
import { Select } from '@/components/ui/select'
import { BaseModelCard } from '../components/BaseModelCard'
import { EmptyState } from '../components/EmptyState'
import { fetchBaseModels, deleteBaseModel, startBaseModelDownload } from '@/lib/api/baseModelApi'
import type { BaseModelListItem } from '@/lib/api/baseModelApi'
import { useProjectStore } from '@/modules/projects'
import { ProjectEmptyState } from '@/modules/core-shell/components/ProjectEmptyState'
import type { BaseModelSourceType, BaseModelFramework, BaseModelTask, BaseModelRiskLevel, BaseModelRuntimeScope } from '@/modules/base-models'
import { RegisterBaseModelModal } from '../components/RegisterBaseModelModal'
import { useToast } from '@/components/ui/toast'
import { notifyEvent } from '@/lib/api/notificationApi'

export function BaseModelListPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const { getProject } = useProjectStore()
  const { addToast } = useToast()
  const [baseModels, setBaseModels] = useState<BaseModelListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [sourceTypeFilter, setSourceTypeFilter] = useState<BaseModelSourceType | 'all'>('all')
  const [frameworkFilter, setFrameworkFilter] = useState<BaseModelFramework | 'all'>('all')
  const [taskFilter, setTaskFilter] = useState<BaseModelTask | 'all'>('all')
  const [riskLevelFilter, setRiskLevelFilter] = useState<BaseModelRiskLevel | 'all'>('all')
  const [runtimeScopeFilter, setRuntimeScopeFilter] = useState<BaseModelRuntimeScope | 'all'>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all')
  const [selectedBaseModelIds, setSelectedBaseModelIds] = useState<Set<string>>(new Set())

  const loadBaseModels = useCallback(async (silent = false) => {
    if (!projectId) return
    if (!silent) {
      setIsLoading(true)
      setError(null)
    }
    try {
      const { items } = await fetchBaseModels({
        project_id: projectId,
        page: 1,
        page_size: 200,
        visibility: visibilityFilter !== 'all' ? visibilityFilter : undefined,
      })
      setBaseModels(items)
    } catch (e) {
      if (silent) return // keep current list, no blink
      const msg = e instanceof Error ? e.message : 'Failed to load base models'
      const isNotFoundOrNetwork =
        msg.includes('Not Found') ||
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('Load failed')
      setError(
        isNotFoundOrNetwork
          ? 'Tidak dapat terhubung ke Base Model service. Pastikan python-base-model-service-fastapi berjalan (default: http://localhost:8502) dan CORS diizinkan.'
          : msg
      )
      setBaseModels([])
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [projectId, visibilityFilter])

  useEffect(() => {
    loadBaseModels()
  }, [loadBaseModels])

  // Poll list while any model is downloading — silent refresh so no loading blink
  const hasAnyDownloading = baseModels.some((bm) => bm.download_status_code === 'downloading')
  useEffect(() => {
    if (!hasAnyDownloading || !projectId) return
    const interval = setInterval(() => loadBaseModels(true), 1500)
    return () => clearInterval(interval)
  }, [hasAnyDownloading, projectId, loadBaseModels])

  // Project-First Enforcement: Require project context
  if (!projectId) {
    return <ProjectEmptyState moduleName="Base Models" />
  }
  getProject(projectId)

  const filteredBaseModels = useMemo(() => {
    let results = baseModels

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      results = results.filter(
        (bm) =>
          bm.name.toLowerCase().includes(q) ||
          bm.description?.toLowerCase().includes(q) ||
          bm.task.toLowerCase().includes(q) ||
          bm.framework.toLowerCase().includes(q) ||
          bm.source_name?.toLowerCase().includes(q)
      )
    }

    if (sourceTypeFilter !== 'all') results = results.filter((bm) => bm.source_type === sourceTypeFilter)
    if (frameworkFilter !== 'all') results = results.filter((bm) => bm.framework === frameworkFilter)
    if (taskFilter !== 'all') results = results.filter((bm) => bm.task === taskFilter)
    if (riskLevelFilter !== 'all') results = results.filter((bm) => bm.risk_level === riskLevelFilter)
    if (runtimeScopeFilter !== 'all') results = results.filter((bm) => bm.runtime_scope === runtimeScopeFilter)
    if (visibilityFilter !== 'all') results = results.filter((bm) => (bm.visibility ?? 'private') === visibilityFilter)

    return results
  }, [baseModels, searchQuery, sourceTypeFilter, frameworkFilter, taskFilter, riskLevelFilter, runtimeScopeFilter, visibilityFilter])

  // Prune selection when list/filters change (keep only IDs that still exist in filtered list)
  const filteredIds = useMemo(() => new Set(filteredBaseModels.map((bm) => bm.id)), [filteredBaseModels])
  useEffect(() => {
    setSelectedBaseModelIds((prev) => {
      if (prev.size === 0) return prev
      const kept = Array.from(prev).filter((id) => filteredIds.has(id))
      return kept.length === prev.size ? prev : new Set(kept)
    })
  }, [filteredIds])

  const handleDelete = async (bm: BaseModelListItem) => {
    if (!window.confirm(`Hapus base model "${bm.name}"?`)) return
    try {
      await deleteBaseModel(bm.id)
      addToast({ title: 'Base model dihapus', description: `"${bm.name}" telah dihapus.`, variant: 'success' })
      notifyEvent({ type_code: 'project', title: 'Base model dihapus', body: `"${bm.name}" telah dihapus.` })
      loadBaseModels()
    } catch (e) {
      addToast({
        title: 'Gagal menghapus',
        description: e instanceof Error ? e.message : 'Terjadi kesalahan.',
        variant: 'error',
      })
    }
  }

  const handleRetryDownload = async (baseModelId: string) => {
    try {
      await startBaseModelDownload(baseModelId)
      addToast({
        title: 'Download dimulai',
        description: 'Progress dapat dilihat di card atau halaman detail.',
        variant: 'success',
      })
      loadBaseModels()
    } catch (e) {
      addToast({
        title: 'Gagal memulai download',
        description: e instanceof Error ? e.message : 'Terjadi kesalahan.',
        variant: 'error',
      })
    }
  }

  // Selection: tanpa Shift = single selection, dengan Shift = multi-select (seperti halaman Projects)
  const handleSelectBaseModel = useCallback((baseModelId: string, selected: boolean, shiftKey?: boolean) => {
    if (shiftKey) {
      setSelectedBaseModelIds((prev) => {
        const next = new Set(prev)
        if (selected) next.add(baseModelId)
        else next.delete(baseModelId)
        return next
      })
    } else {
      if (selected) {
        setSelectedBaseModelIds(new Set([baseModelId]))
      } else {
        setSelectedBaseModelIds((prev) => {
          const next = new Set(prev)
          next.delete(baseModelId)
          return next
        })
      }
    }
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedBaseModelIds(new Set())
  }, [])

  // Klik di luar card → auto deselect
  useEffect(() => {
    if (selectedBaseModelIds.size === 0) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-base-model-card]')) return
      handleClearSelection()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedBaseModelIds.size, handleClearSelection])

  const handleDeleteSelected = useCallback(async () => {
    if (selectedBaseModelIds.size === 0) return
    if (!window.confirm(`Hapus ${selectedBaseModelIds.size} base model yang dipilih?`)) return
    const ids = Array.from(selectedBaseModelIds)
    try {
      for (const id of ids) {
        await deleteBaseModel(id)
      }
      addToast({
        title: 'Base models dihapus',
        description: `${ids.length} base model telah dihapus.`,
        variant: 'success',
      })
      notifyEvent({ type_code: 'project', title: 'Base models dihapus', body: `${ids.length} base model telah dihapus.` })
      setSelectedBaseModelIds(new Set())
      loadBaseModels()
    } catch (e) {
      addToast({
        title: 'Gagal menghapus',
        description: e instanceof Error ? e.message : 'Terjadi kesalahan.',
        variant: 'error',
      })
    }
  }, [selectedBaseModelIds, addToast, loadBaseModels])

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 min-h-[calc(100vh-14rem)]">
      <PageHeader
        title="Base Models"
        description="Foundation models used as starting point for training and fine-tuning. Base models are project-scoped and cannot be shared across projects."
        right={
          <Button onClick={() => setShowRegisterModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Register Base Model
          </Button>
        }
      />

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search base models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select
              value={sourceTypeFilter}
              onChange={(e) => setSourceTypeFilter(e.target.value as any)}
              className="w-[140px]"
            >
              <option value="all">All Sources</option>
              <option value="huggingface">HuggingFace</option>
              <option value="scratch">Scratch</option>
              <option value="ollama">Ollama</option>
              <option value="upload">Upload</option>
            </Select>

            <Select
              value={frameworkFilter}
              onChange={(e) => setFrameworkFilter(e.target.value as any)}
              className="w-[140px]"
            >
              <option value="all">All Frameworks</option>
              <option value="pytorch">PyTorch</option>
              <option value="tensorflow">TensorFlow</option>
              <option value="other">Other</option>
            </Select>

            <Select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value as any)}
              className="w-[140px]"
            >
              <option value="all">All Tasks</option>
              <option value="nlp">NLP</option>
              <option value="vision">Vision</option>
              <option value="multimodal">Multimodal</option>
              <option value="custom">Custom</option>
            </Select>

            <Select
              value={riskLevelFilter}
              onChange={(e) => setRiskLevelFilter(e.target.value as any)}
              className="w-[140px]"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>

            <Select
              value={runtimeScopeFilter}
              onChange={(e) => setRuntimeScopeFilter(e.target.value as any)}
              className="w-[140px]"
            >
              <option value="all">All Runtimes</option>
              <option value="cloud">Cloud</option>
              <option value="local">Local</option>
              <option value="hybrid">Hybrid</option>
            </Select>

            <Select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as 'all' | 'public' | 'private')}
              className="w-[120px]"
            >
              <option value="all">All visibility</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </Select>

            {/* Selection bar di samping filter All visibility */}
            {selectedBaseModelIds.size > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {selectedBaseModelIds.size} base model{selectedBaseModelIds.size !== 1 ? 's' : ''} selected
                </span>
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Base Models List */}
      <div className="flex flex-1 flex-col min-h-0">
      {isLoading ? (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 p-12">
          <div className="flex flex-1 items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading base models...</span>
          </div>
        </div>
      ) : error ? (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 p-8">
          <div className="flex flex-1 flex-col items-center justify-center text-center max-w-xl mx-auto">
            <p className="text-destructive font-medium mb-1">Gagal memuat base models</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={loadBaseModels}>
              Coba lagi
            </Button>
          </div>
        </div>
      ) : filteredBaseModels.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center">
          {baseModels.length === 0 ? (
            <EmptyState
              title="No base models registered"
              description="Register a base model before creating trainers or runs."
              actionLabel="Register Base Model"
              onAction={() => setShowRegisterModal(true)}
            />
          ) : (
            <EmptyState
              title="No base models found"
              description="Try adjusting your search or filter criteria."
            />
          )}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-auto flex-1 min-h-0">
          {filteredBaseModels.map((baseModel) => (
            <BaseModelCard
              key={baseModel.id}
              baseModel={baseModel}
              isSelected={selectedBaseModelIds.has(baseModel.id)}
              onSelect={handleSelectBaseModel}
              onDelete={handleDelete}
              onRetryDownload={handleRetryDownload}
            />
          ))}
          </div>
        </div>
      )}
      </div>

      <RegisterBaseModelModal
        open={showRegisterModal}
        onOpenChange={(open) => {
          setShowRegisterModal(open)
          if (!open) loadBaseModels()
        }}
        projectId={projectId}
      />
    </div>
  )
}
