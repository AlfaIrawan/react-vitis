import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Loader2, Scale, Library, Tag, Brain, FileText, Files, File, Download, Lock, Globe, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Select } from '@/components/ui/select'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

/** Schema untuk Model Card: default + izinkan style pada span (warna dari Hugging Face README). */
const modelCardSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...((defaultSchema.attributes as Record<string, unknown[]>).span ?? []), 'style'],
  },
}
import {
  fetchBaseModelDetail,
  fetchBaseModelReadme,
  fetchBaseModelFiles,
  fetchBaseModelVersions,
  fetchBaseModelStats,
  fetchFileDownloadUrl,
  deleteBaseModel,
} from '@/lib/api/baseModelApi'
import type { BaseModelDetail, BaseModelFileItem, ModelVersionResponse, BaseModelStatsResponse } from '@/lib/api/baseModelApi'
import { useProjectStore } from '@/modules/projects'
import { ProjectEmptyState } from '@/modules/core-shell/components/ProjectEmptyState'
import { useToast } from '@/components/ui/toast'
import { notifyEvent } from '@/lib/api/notificationApi'
import { cn } from '@/lib/utils'

/** Mini sparkline (no real time-series; visual only). */
function SparklineChart({ value, className }: { value: number; className?: string }) {
  const w = 80
  const h = 40
  const pad = 2
  const points = 12
  const seed = value * 0.1
  const ys = Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1)
    const wave = Math.sin(t * Math.PI * 2 + seed) * 0.3 + (1 - t) * 0.4
    return pad + (1 - wave) * (h - pad * 2)
  })
  const xs = Array.from({ length: points }, (_, i) => pad + (i / (points - 1)) * (w - pad * 2))
  const line = xs.map((x, i) => `${x},${ys[i]}`).join(' ')
  const area = `${line} ${w - pad},${h - pad} ${pad},${h - pad}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('overflow-visible', className)} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={line}
      />
      <polygon fill="url(#sparkline-fill)" points={area.replace(/ /g, ' ')} />
    </svg>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatTimeAgo(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  const now = new Date()
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (sec < 60) return 'Baru saja'
  if (sec < 3600) return `${Math.floor(sec / 60)} menit lalu`
  if (sec < 86400) return `${Math.floor(sec / 3600)} jam lalu`
  if (sec < 2592000) return `${Math.floor(sec / 86400)} hari lalu`
  if (sec < 31536000) return `${Math.floor(sec / 2592000)} bulan lalu`
  return `${Math.floor(sec / 31536000)} tahun lalu`
}

/** Parse YAML frontmatter from README (--- ... ---) and return metadata + body. */
function parseReadmeFrontmatter(content: string): {
  license?: string
  library_name?: string
  pipeline_tag: string[]
  base_model?: string
  body: string
} {
  const result = { license: undefined as string | undefined, library_name: undefined as string | undefined, pipeline_tag: [] as string[], base_model: undefined as string | undefined, body: content }
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return result
  const yamlBlock = match[1]
  const body = content.slice(match[0].length).trimStart()
  result.body = body
  let inTags = false
  for (const line of yamlBlock.split(/\r?\n/)) {
    const tagListMatch = line.match(/^\s*-\s+(.+)$/)
    if (inTags && tagListMatch) {
      result.pipeline_tag.push(tagListMatch[1].trim())
      continue
    }
    inTags = false
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (!kv) continue
    const [, key, value] = kv
    const v = value.trim()
    if (key === 'license') result.license = v
    else if (key === 'library_name') result.library_name = v
    else if (key === 'pipeline_tag') result.pipeline_tag.push(v)
    else if (key === 'base_model') result.base_model = v
    else if (key === 'tags') inTags = true
  }
  return result
}

export function BaseModelDetailPage() {
  const { id: projectId, baseModelId } = useParams<{ id: string; baseModelId: string }>()
  const navigate = useNavigate()
  const { getProject } = useProjectStore()
  const { addToast } = useToast()
  const [detail, setDetail] = useState<BaseModelDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [readmeContent, setReadmeContent] = useState<string | null>(null)
  const [readmeLoading, setReadmeLoading] = useState(false)
  const [metadataTab, setMetadataTab] = useState<'model-card' | 'files-versions'>('model-card')
  const [modelFiles, setModelFiles] = useState<BaseModelFileItem[] | null>(null)
  const [filesLoading, setFilesLoading] = useState(false)
  const [versions, setVersions] = useState<ModelVersionResponse[] | null>(null)
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [stats, setStats] = useState<BaseModelStatsResponse | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null)
  const [fileListForConvertCheck, setFileListForConvertCheck] = useState<BaseModelFileItem[] | null>(null)

  const loadDetail = useCallback(async () => {
    if (!baseModelId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBaseModelDetail(baseModelId)
      setDetail(data ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load base model')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [baseModelId])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  useEffect(() => {
    if (!baseModelId) return
    let cancelled = false
    setVersionsLoading(true)
    setVersions(null)
    fetchBaseModelVersions(baseModelId)
      .then((list) => {
        if (!cancelled) setVersions(list ?? [])
      })
      .catch(() => {
        if (!cancelled) setVersions([])
      })
      .finally(() => {
        if (!cancelled) setVersionsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [baseModelId])

  useEffect(() => {
    if (!baseModelId) return
    let cancelled = false
    setStatsLoading(true)
    setStats(null)
    fetchBaseModelStats(baseModelId)
      .then((s) => {
        if (!cancelled) setStats(s ?? null)
      })
      .catch(() => {
        if (!cancelled) setStats(null)
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [baseModelId])

  useEffect(() => {
    if (metadataTab !== 'files-versions' || !baseModelId) {
      setModelFiles(null)
      return
    }
    let cancelled = false
    setFilesLoading(true)
    setModelFiles(null)
    fetchBaseModelFiles(baseModelId, selectedVersion || undefined)
      .then((list) => {
        if (!cancelled) setModelFiles(list ?? [])
      })
      .catch(() => {
        if (!cancelled) setModelFiles([])
      })
      .finally(() => {
        if (!cancelled) setFilesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [metadataTab, baseModelId, selectedVersion])

  // Load file list for GGUF convert check (tanpa perlu buka tab Files and Versions)
  useEffect(() => {
    if (!baseModelId || !detail) {
      setFileListForConvertCheck(null)
      return
    }
    let cancelled = false
    fetchBaseModelFiles(baseModelId, selectedVersion || undefined)
      .then((list) => {
        if (!cancelled) setFileListForConvertCheck(list ?? null)
      })
      .catch(() => {
        if (!cancelled) setFileListForConvertCheck(null)
      })
    return () => { cancelled = true }
  }, [baseModelId, detail, selectedVersion])

  /** Model bisa di-convert ke GGUF jika ada file weight: .safetensors atau pytorch_model.bin */
  const canConvertToGGUF = useMemo(() => {
    if (!fileListForConvertCheck || fileListForConvertCheck.length === 0) return false
    return fileListForConvertCheck.some(
      (f) =>
        f.name.toLowerCase().endsWith('.safetensors') ||
        f.name === 'pytorch_model.bin'
    )
  }, [fileListForConvertCheck])

  useEffect(() => {
    if (!baseModelId || !detail) {
      setReadmeContent(null)
      return
    }
    let cancelled = false
    setReadmeLoading(true)
    setReadmeContent(null)
    fetchBaseModelReadme(baseModelId, selectedVersion || undefined)
      .then((content) => {
        if (!cancelled) setReadmeContent(content)
      })
      .finally(() => {
        if (!cancelled) setReadmeLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [baseModelId, detail, selectedVersion])

  if (!projectId) {
    return <ProjectEmptyState moduleName="Base Models" />
  }

  const project = getProject(projectId)

  const readmeMeta = useMemo(
    () => (readmeContent ? parseReadmeFrontmatter(readmeContent) : null),
    [readmeContent]
  )

  const handleDownloadFile = async (fileName: string) => {
    if (!baseModelId) return
    setDownloadingFile(fileName)
    try {
      const result = await fetchFileDownloadUrl(baseModelId, fileName, {
        version: selectedVersion || undefined,
        expiry: 3600,
      })
      if (result?.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer')
        addToast({ title: 'Download started', description: fileName, variant: 'success' })
      } else {
        addToast({ title: 'Download failed', description: 'Could not get download URL', variant: 'error' })
      }
    } catch (e) {
      addToast({
        title: 'Download failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'error',
      })
    } finally {
      setDownloadingFile(null)
    }
  }

  const handleDelete = async () => {
    if (!baseModelId || !detail) return
    if (!window.confirm(`Hapus base model "${detail.master.name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    try {
      await deleteBaseModel(baseModelId)
      addToast({ title: 'Base model dihapus', variant: 'success' })
      notifyEvent({ type_code: 'project', title: 'Base model dihapus', body: `"${detail.master.name}" telah dihapus.` })
      navigate(`/projects/${projectId}/base-models`)
    } catch (e) {
      addToast({
        title: 'Gagal menghapus',
        description: e instanceof Error ? e.message : 'Terjadi kesalahan.',
        variant: 'error',
      })
    }
  }

  const handleConvertToGGUF = () => {
    addToast({
      title: 'Convert to GGUF',
      description: 'Fitur konversi ke GGUF akan segera hadir. Backend endpoint dapat ditambahkan untuk memicu proses konversi.',
      variant: 'default',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Projects', href: '/projects' },
            { label: project?.name || 'Project', href: `/projects/${projectId}` },
            { label: 'Base Models', href: `/projects/${projectId}/base-models` },
            { label: '...' },
          ]}
        />
        <div className="glass-card rounded-2xl p-12 flex items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading base model...</span>
        </div>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Projects', href: '/projects' },
            { label: project?.name || 'Project', href: `/projects/${projectId}` },
            { label: 'Base Models', href: `/projects/${projectId}/base-models` },
            { label: 'Not Found' },
          ]}
        />
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">{error || 'Base model not found'}</p>
            <Button onClick={() => navigate(`/projects/${projectId}/base-models`)} className="mt-4">
              Back to Base Models
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (detail.master.project_id !== projectId) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Projects', href: '/projects' },
            { label: project?.name || 'Project', href: `/projects/${projectId}` },
            { label: 'Base Models', href: `/projects/${projectId}/base-models` },
            { label: 'Not Found' },
          ]}
        />
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Base model not found in this project</p>
            <Button onClick={() => navigate(`/projects/${projectId}/base-models`)} className="mt-4">
              Back to Base Models
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const master = detail.master
  const sourceCode = (master.source_code || '').toLowerCase()
  const sourceTypeBadge: Record<string, { label: string; className: string }> = {
    huggingface: { label: 'HuggingFace', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
    scratch: { label: 'Scratch', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    ollama: { label: 'Ollama', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    upload: { label: 'Upload', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  }
  const badge = sourceTypeBadge[sourceCode] || { label: master.source_name, className: '' }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project?.name || 'Project', href: `/projects/${projectId}` },
          { label: 'Base Models', href: `/projects/${projectId}/base-models` },
          { label: master.name },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(`/projects/${projectId}/base-models`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{master.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{master.description || 'Base model details'}</p>
            <div className="flex flex-wrap gap-2 mt-2 items-center">
              {master.visibility && (
                <Badge
                  variant="outline"
                  className={cn(
                    master.visibility === 'public'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30'
                  )}
                >
                  {master.visibility === 'public' ? (
                    <Globe className="h-3.5 w-3.5 mr-1 shrink-0" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 mr-1 shrink-0" />
                  )}
                  {master.visibility === 'public' ? 'Public' : 'Private'}
                </Badge>
              )}
            </div>
            {readmeMeta && (readmeMeta.license || readmeMeta.library_name || readmeMeta.pipeline_tag.length > 0 || readmeMeta.base_model) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {readmeMeta.license && (
                  <Badge variant="secondary" className="text-xs font-medium rounded-md gap-1.5 py-1.5">
                    <Scale className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    License: {readmeMeta.license}
                  </Badge>
                )}
                {readmeMeta.library_name && (
                  <Badge variant="secondary" className="text-xs font-medium rounded-md gap-1.5 py-1.5 capitalize">
                    <Library className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    {readmeMeta.library_name}
                  </Badge>
                )}
                {readmeMeta.pipeline_tag.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs font-medium rounded-md gap-1.5 py-1.5">
                    <Tag className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    {t}
                  </Badge>
                ))}
                {readmeMeta.base_model && (
                  <Badge variant="secondary" className="text-xs font-medium rounded-md gap-1.5 py-1.5">
                    <Brain className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    Base: {readmeMeta.base_model}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canConvertToGGUF && (
            <Button variant="outline" onClick={handleConvertToGGUF} className="shrink-0">
              <Package className="mr-2 h-4 w-4" />
              Convert to GGUF
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete} className="shrink-0">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="px-8 pt-3 pb-6 sm:px-10 sm:pt-4 sm:pb-8">
              {metadataTab === 'model-card' && (
                <>
                  {readmeLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memuat README…
                    </div>
                  )}
                  {metadataTab === 'model-card' && !readmeLoading && readmeContent && readmeMeta && (
                    <div className="text-sm overflow-auto max-h-[70vh] [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mt-2 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_a]:text-primary [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_tbody_tr:hover]:bg-muted/30">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize(modelCardSanitizeSchema)]}>
                        {readmeMeta.body}
                      </ReactMarkdown>
                    </div>
                  )}
                  {metadataTab === 'model-card' && !readmeLoading && readmeContent === null && detail?.download && (
                    <p className="text-sm text-muted-foreground py-2">README tidak tersedia.</p>
                  )}
                  {metadataTab === 'model-card' && !readmeLoading && readmeContent === null && !detail?.download && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <p className="text-base font-semibold mt-1">{master.name}</p>
                      </div>
                      {master.description && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Description</label>
                          <p className="text-sm mt-1">{master.description}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Source</label>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className={cn('text-xs', badge.className)}>
                            {badge.label}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground pt-2">
                        Download model terlebih dahulu untuk menampilkan README dari repositori.
                      </p>
                    </div>
                  )}
                </>
              )}
              {metadataTab === 'files-versions' && (
                <>
                  {filesLoading ? (
                    <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memuat daftar file…
                    </div>
                  ) : !modelFiles || modelFiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Tidak ada file. Download model terlebih dahulu.
                    </p>
                  ) : (
                    <div className="border border-border/60 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/60 bg-muted/40">
                            <th className="text-left font-medium text-foreground px-3 py-2">Name</th>
                            <th className="text-left font-medium text-foreground px-3 py-2 w-24">Size</th>
                            <th className="text-left font-medium text-foreground px-3 py-2 w-28">Last modified</th>
                            <th className="text-right font-medium text-foreground px-3 py-2 w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modelFiles.map((f) => (
                            <tr key={f.name} className="border-b border-border/40 hover:bg-muted/20">
                              <td className="px-3 py-2">
                                <span className="flex items-center gap-2">
                                  <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <span className="font-medium text-foreground">{f.name}</span>
                                </span>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{formatFileSize(f.size)}</td>
                              <td className="px-3 py-2 text-muted-foreground">{formatTimeAgo(f.last_modified)}</td>
                              <td className="px-3 py-2 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownloadFile(f.name)
                                  }}
                                  disabled={downloadingFile === f.name}
                                >
                                  {downloadingFile === f.name ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 flex flex-col">
          <div className="flex gap-2">
            <Button
              variant={metadataTab === 'model-card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetadataTab('model-card')}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Model Card
            </Button>
            <Button
              variant={metadataTab === 'files-versions' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetadataTab('files-versions')}
              className="flex-1"
            >
              <Files className="w-4 h-4 mr-2" />
              Files and Versions
            </Button>
          </div>
          <div className="space-y-4 flex flex-col">
            <div className="glass-card rounded-xl p-4">
              {statsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : stats ? (
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Total downloads
                    </p>
                    <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
                      {stats.total_downloads.toLocaleString()}
                    </p>
                    {stats.last_downloaded_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last {formatTimeAgo(stats.last_downloaded_at)}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 w-20 h-10 flex items-end">
                    <SparklineChart value={stats.total_downloads} className="w-full h-full text-primary" />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Total downloads
                  </p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">0</p>
                </div>
              )}
            </div>
            {(versions && versions.length > 0) && (
              <div className="glass-card rounded-xl p-4">
                <h2 className="text-sm font-semibold text-foreground mb-2">Version</h2>
                <Select
                  value={selectedVersion ?? ''}
                  onChange={(e) => setSelectedVersion(e.target.value || null)}
                  className="w-full"
                >
                  <option value="">Current / fallback</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.version_tag}>
                      {v.version_tag}
                    </option>
                  ))}
                </Select>
                {versionsLoading && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                  </p>
                )}
              </div>
            )}
            <div className="glass-card rounded-xl p-4">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Metadata
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(master.created_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {master.updated_date && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Updated</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(master.updated_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created by</p>
                  <p className="text-sm font-medium text-foreground">{master.created_by}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
