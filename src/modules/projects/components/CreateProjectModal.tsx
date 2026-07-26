import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  X,
  Plus,
  Brain,
  Image,
  TrendingUp,
  ShoppingCart,
  Database,
  Code,
  Sparkles,
  BarChart3,
  Zap,
  Package,
  Rocket,
  Cpu,
  FileText
} from 'lucide-react'
import { useProjectStore } from '@/modules/projects'
import { useToast } from '@/components/ui/toast'
import { notifyEvent } from '@/lib/api/notificationApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  autoNavigate?: boolean
  onProjectCreated?: (projectId: string) => void
  /** Jika dari "Add Project" di folder, project akan dibuat di dalam folder ini. */
  initialFolderId?: string | null
}

export function CreateProjectModal({
  open,
  onOpenChange,
  autoNavigate = true,
  onProjectCreated,
  initialFolderId = null,
}: CreateProjectModalProps) {
  const navigate = useNavigate()
  const { addProject } = useProjectStore()
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    iconName: '',
    borderColor: '',
  })
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  
  const availableColors = [
    '#3b82f6', // blue-500
    '#a855f7', // purple-500
    '#10b981', // emerald-500
    '#f97316', // orange-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
    '#f43f5e', // rose-500
    '#f59e0b', // amber-500
    '#84cc16', // lime-500
    '#8b5cf6', // violet-500
  ]
  
  const availableIcons = [
    { name: 'brain', label: 'Brain', icon: Brain },
    { name: 'image', label: 'Image', icon: Image },
    { name: 'trending-up', label: 'Trending Up', icon: TrendingUp },
    { name: 'shopping-cart', label: 'Shopping Cart', icon: ShoppingCart },
    { name: 'database', label: 'Database', icon: Database },
    { name: 'code', label: 'Code', icon: Code },
    { name: 'sparkles', label: 'Sparkles', icon: Sparkles },
    { name: 'bar-chart-3', label: 'Chart', icon: BarChart3 },
    { name: 'zap', label: 'Zap', icon: Zap },
    { name: 'package', label: 'Package', icon: Package },
    { name: 'rocket', label: 'Rocket', icon: Rocket },
    { name: 'cpu', label: 'CPU', icon: Cpu },
    { name: 'file-text', label: 'Document', icon: FileText },
  ]
  const [errors, setErrors] = useState<{ name?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  // Autofocus on open
  useEffect(() => {
    if (open && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({ name: '', description: '', iconName: '', borderColor: '' })
      setTags([])
      setTagInput('')
      setErrors({})
      setSubmitting(false)
    }
  }, [open])

  const handleAddTag = (value: string) => {
    const newTag = value.trim().toLowerCase()
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
    }
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag(tagInput)
    } else if (e.key === ',' || e.key === ' ') {
      e.preventDefault()
      handleAddTag(tagInput)
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      // Remove last tag when pressing backspace on empty input
      setTags(tags.slice(0, -1))
    }
  }

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Auto-add tag when comma is typed
    if (value.includes(',')) {
      const parts = value.split(',')
      parts.forEach((part, index) => {
        if (index < parts.length - 1) {
          handleAddTag(part)
        } else {
          setTagInput(part)
        }
      })
    } else {
      setTagInput(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setErrors({ name: 'Project name is required' })
      nameInputRef.current?.focus()
      return
    }

    setSubmitting(true)
    try {
      const newProject = await addProject({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        iconName: formData.iconName || undefined,
        borderColor: formData.borderColor || undefined,
        folderId: initialFolderId ?? undefined,
      })

      onOpenChange(false)
      addToast({
        title: 'Project berhasil dibuat',
        description: `Project "${newProject.name}" telah dibuat.`,
        variant: 'success',
      })
      notifyEvent({
        type_code: 'project',
        title: 'Project berhasil dibuat',
        body: `Project "${newProject.name}" telah dibuat.`,
      })
      if (onProjectCreated) onProjectCreated(newProject.id)
      if (autoNavigate) navigate(`/projects/${newProject.id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create project'
      addToast({ title: 'Error', description: msg, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const isSubmitDisabled = !formData.name.trim()

  // Handle ESC key to close
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
  }, [open, onOpenChange])

  return (
    <>
      {/* Overlay backdrop - covers entire screen including topbar */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 bottom-0 bg-black/20 backdrop-blur-sm z-[1050] transition-opacity",
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        style={{
          margin: 0,
          padding: 0,
          width: '100vw',
          height: '100vh',
          top: 0,
          left: 0,
        }}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
        role="button"
        tabIndex={-1}
      />

      {/* Slide-out panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-screen w-[480px] transform z-[1100] transition-all duration-300",
          "backdrop-blur-xl bg-background/95 border-l border-border shadow-2xl",
          open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        )}
        style={{
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.1)',
          margin: 0,
          padding: 0,
        }}
        data-create-project-open={open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Plus className="w-6 h-6 text-primary" />
              Create Project
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Projects are workspaces for managing AI training pipelines, experiments, and models. Create folders, organize projects, and track status from a single place.
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)}
            aria-label="Close create project"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-5rem)]">
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              ref={nameInputRef}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) setErrors({})
              }}
              placeholder="Enter project name"
              className={errors.name ? 'border-destructive' : ''}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional project description"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <div className="grid grid-cols-8 gap-2 p-3 border border-input rounded-md bg-background">
              {availableIcons.map((iconOption) => {
                const IconComponent = iconOption.icon
                const isSelected = formData.iconName === iconOption.name
                return (
                  <button
                    key={iconOption.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, iconName: iconOption.name })}
                    className={cn(
                      'p-2 rounded-lg border transition-all',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted'
                    )}
                  >
                    <Tooltip content={iconOption.label} side="bottom">
                      <span className="inline-flex"><IconComponent className={cn(
                        'w-5 h-5 mx-auto',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )} /></span>
                    </Tooltip>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Pilih icon untuk project card (opsional)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="borderColor">Border Color</Label>
            <div className="grid grid-cols-6 gap-2.5 p-3 border border-input rounded-md bg-background">
              {availableColors.map((color) => {
                const isSelected = formData.borderColor === color
                return (
                  <Tooltip key={color} content={color} side="bottom">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, borderColor: color })}
                      className={cn(
                        'w-full h-10 rounded-lg border-2 transition-all',
                        isSelected
                          ? 'border-foreground ring-2 ring-primary ring-offset-2'
                          : 'border-border hover:border-primary/50'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  </Tooltip>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Pilih warna border untuk project card (opsional)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div 
              className="flex flex-wrap gap-2 p-2 min-h-[42px] border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
              onClick={() => tagInputRef.current?.focus()}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-muted rounded-md text-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveTag(tag)
                    }}
                    className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                id="tags"
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagKeyDown}
                onBlur={() => {
                  if (tagInput.trim()) {
                    handleAddTag(tagInput)
                  }
                }}
                placeholder={tags.length === 0 ? "Type and press Enter to add tags" : ""}
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter, comma, or space to add a tag
            </p>
          </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitDisabled || submitting}>
                {submitting ? 'Creating…' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
