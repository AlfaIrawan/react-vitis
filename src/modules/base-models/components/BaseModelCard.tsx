import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Brain, MoreVertical, Eye, Trash2, Download, Loader2, Lock, Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BaseModelListItem } from '@/lib/api/baseModelApi'

interface BaseModelCardProps {
  baseModel: BaseModelListItem
  isSelected?: boolean
  onSelect?: (baseModelId: string, selected: boolean, shiftKey?: boolean) => void
  onDelete?: (baseModel: BaseModelListItem) => void
  onRetryDownload?: (baseModelId: string) => void | Promise<void>
}

export function BaseModelCard({ baseModel, isSelected = false, onSelect, onDelete, onRetryDownload }: BaseModelCardProps) {
  const { id: projectId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isRetrying, setIsRetrying] = useState(false)
  const supportsDownload = ['huggingface', 'ollama'].includes(baseModel.source_type)
  const hasDownloadInfo = baseModel.download_status_code != null
  const isDownloading = baseModel.download_status_code === 'downloading'
  const isFailed = baseModel.download_status_code === 'failed'
  const isCompleted = baseModel.download_status_code === 'completed'
  const progress = baseModel.download_progress ?? 0
  const showDownloadSection = supportsDownload || hasDownloadInfo
  const showAsDownloading = isDownloading || isRetrying
  const displayProgress = isRetrying ? 0 : progress

  const getSourceTypeBadge = (sourceType: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      huggingface: { label: 'HuggingFace', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
      scratch: { label: 'Scratch', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
      ollama: { label: 'Ollama', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
      upload: { label: 'Upload', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
    }
    return variants[sourceType] || { label: sourceType, className: '' }
  }

  const getRiskLevelBadge = (riskLevel: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      low: { label: 'Low', className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
      medium: { label: 'Medium', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
      high: { label: 'High', className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    }
    return variants[riskLevel] || { label: riskLevel, className: '' }
  }

  const sourceTypeBadge = getSourceTypeBadge(baseModel.source_type)
  const riskLevelBadge = getRiskLevelBadge(baseModel.risk_level)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(baseModel)
  }

  const handleRetryDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onRetryDownload || isRetrying) return
    setIsRetrying(true)
    try {
      await onRetryDownload(baseModel.id)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[role="menuitem"]')) return
    if (onSelect) {
      onSelect(baseModel.id, !isSelected, e.shiftKey)
    } else {
      navigate(`/projects/${projectId}/base-models/${baseModel.id}`)
    }
  }

  const handleCardDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[role="menuitem"]')) return
    navigate(`/projects/${projectId}/base-models/${baseModel.id}`)
  }

  // NOTE:
  // `.glass-card` mendefinisikan `box-shadow` custom di CSS, sehingga utility Tailwind `ring-*`/`shadow-*`
  // (yang juga mengandalkan `box-shadow`) bisa tidak terlihat. Untuk state selected kita pakai inline style
  // agar indikator biru selalu muncul (mirip ProjectCard).
  const selectedStyle: React.CSSProperties | undefined = isSelected
    ? {
        border: '2px solid hsl(var(--primary))',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.35), 0 20px 40px rgba(0, 0, 0, 0.15)',
      }
    : undefined

  return (
    <div
      data-base-model-card
      className={cn(
        'glass-card rounded-xl p-4 transition-all duration-200 overflow-hidden group cursor-pointer select-none outline-none focus:outline-none',
        // Focus indicator (keyboard) pakai outline agar tidak ketimpa box-shadow `.glass-card`
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
        isSelected && 'bg-primary/10'
      )}
      style={selectedStyle}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
    >
      <div>
        {/* Header: icon + name + menu */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {baseModel.name}
            </h3>
            {baseModel.description ? (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{baseModel.description}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5 italic">No description</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => navigate(`/projects/${projectId}/base-models/${baseModel.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags: source, visibility, task, framework, risk */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge variant="secondary" className={cn('text-[10px] font-medium', sourceTypeBadge.className)}>
            {sourceTypeBadge.label}
          </Badge>
          {baseModel.visibility && (
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] font-medium',
                baseModel.visibility === 'public'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
              )}
            >
              {baseModel.visibility === 'public' ? (
                <Globe className="h-2.5 w-2.5 mr-0.5 inline" />
              ) : (
                <Lock className="h-2.5 w-2.5 mr-0.5 inline" />
              )}
              {baseModel.visibility === 'public' ? 'Public' : 'Private'}
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px] font-medium">
            {baseModel.task}
          </Badge>
          <Badge variant="secondary" className="text-[10px] font-medium">
            {baseModel.framework}
          </Badge>
          <Badge variant="secondary" className={cn('text-[10px] font-medium', riskLevelBadge.className)}>
            {riskLevelBadge.label}
          </Badge>
        </div>

        {/* License & Runtime — single line */}
        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
          <span>License: {baseModel.license}</span>
          <span>·</span>
          <span className="capitalize">Runtime: {baseModel.runtime_scope}</span>
        </div>

        {/* Download status & progress — always show for HuggingFace/Ollama so progress is visible */}
        {showDownloadSection && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground shrink-0">Download</span>
              <span
                className={cn(
                  'text-[11px] font-medium shrink-0',
                  showAsDownloading && 'text-primary',
                  isCompleted && !showAsDownloading && 'text-green-600 dark:text-green-400',
                  isFailed && !showAsDownloading && 'text-destructive'
                )}
              >
                {showAsDownloading && (isRetrying ? 'Starting…' : `${displayProgress}%`)}
                {isCompleted && !showAsDownloading && (baseModel.download_status_name ?? 'Completed')}
                {isFailed && !showAsDownloading && (baseModel.download_status_name ?? 'Failed')}
                {!hasDownloadInfo && !showAsDownloading && '—'}
                {hasDownloadInfo && !showAsDownloading && !isCompleted && !isFailed &&
                  (baseModel.download_status_name ?? baseModel.download_status_code ?? '—')}
              </span>
            </div>
            {showAsDownloading && (
              <div className="w-full rounded-full h-2 bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-[width] duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, displayProgress))}%` }}
                />
              </div>
            )}
            {isFailed && !isRetrying && baseModel.download_error_message && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 bg-muted/50 rounded px-2 py-1">
                {baseModel.download_error_message}
              </p>
            )}
            {isFailed && onRetryDownload && !isRetrying && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRetryDownload(e)
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download ulang
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
