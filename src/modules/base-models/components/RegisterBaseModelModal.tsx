import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Search, Upload, Cloud, Server, ExternalLink, Info, Database, Code, FileText, Tag, Cpu, Link2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { notifyEvent } from '@/lib/api/notificationApi'
import {
  createBaseModel,
  fetchBaseModelDetail,
  getBaseModelDownloadWsUrl,
  type DownloadProgressWsMessage,
  LOOKUP_SOURCE_IDS,
  LOOKUP_TASK_IDS,
  LOOKUP_FRAMEWORK_IDS,
  LOOKUP_LICENSE_IDS,
  LOOKUP_ARCHITECTURE_IDS,
} from '@/lib/api/baseModelApi'
import type {
  BaseModelSourceType,
  BaseModelFramework,
  BaseModelTask,
  BaseModelRiskLevel,
  BaseModelRuntimeScope,
} from '@/modules/base-models'
import { cn } from '@/lib/utils'

interface RegisterBaseModelModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string // REQUIRED: Project context
}

type Step = 1 | 2 | 3

export function RegisterBaseModelModal({ open, onOpenChange, projectId }: RegisterBaseModelModalProps) {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [sourceType, setSourceType] = useState<BaseModelSourceType | ''>('')
  
  // Local Ollama host from Settings (global configuration)
  const [localOllamaHost, setLocalOllamaHost] = useState<string>('http://localhost:11434')

  // Basic Information (only for scratch models)
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    description: '',
    task: 'nlp' as BaseModelTask,
    framework: 'pytorch' as BaseModelFramework,
    owner: '',
  })

  // Scratch-specific
  const [scratchInfo, setScratchInfo] = useState({
    architectureType: 'transformer' as 'transformer' | 'cnn' | 'lstm' | 'custom',
    inputType: 'text' as 'text' | 'image' | 'tabular',
    initialization: 'xavier' as 'random' | 'xavier' | 'he' | 'custom',
    customInitScript: '',
  })

  // HuggingFace (with auto-populated metadata)
  const [hfInfo, setHfInfo] = useState({
    repoId: '',
    revision: '',
    license: '',
    // Auto-populated from HF metadata
    name: '',
    description: '',
    task: 'nlp' as BaseModelTask,
    framework: 'pytorch' as BaseModelFramework,
  })

  // Ollama (with auto-populated metadata)
  const [ollamaInfo, setOllamaInfo] = useState({
    modelName: '',
    quantization: '',
    connectionType: 'local' as 'local' | 'cloud', // local or cloud
    cloudHost: '',
    searchQuery: '',
    // Auto-populated from Ollama
    name: '',
    description: '',
    task: 'nlp' as BaseModelTask,
    framework: 'pytorch' as BaseModelFramework,
  })

  // Upload Manual
  const [uploadInfo, setUploadInfo] = useState({
    file: null as File | null,
    fileName: '',
    name: '',
    description: '',
    task: 'nlp' as BaseModelTask,
    framework: 'pytorch' as BaseModelFramework,
    license: '',
  })

  // Mock local Ollama models (in real app, fetch from Settings/Ollama)
  const [localOllamaModels, setLocalOllamaModels] = useState<string[]>([])
  const [cloudOllamaModels, setCloudOllamaModels] = useState<string[]>([])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloadStatusName, setDownloadStatusName] = useState<string>('')
  const [showErrorDetails, setShowErrorDetails] = useState(false)

  const handleRequestClose = () => {
    if (isDownloading) {
      if (window.confirm('Download akan tetap berjalan di belakang. Tutup modal?')) {
        onOpenChange(false)
      }
    } else {
      onOpenChange(false)
    }
  }

  /** Turn long/technical backend errors into a short user-facing message. */
  const getDownloadErrorDisplay = (raw: string | null) => {
    if (!raw) return { short: null, isLong: false }
    const lower = raw.toLowerCase()
    let short: string
    if (lower.includes('getaddrinfo failed') || lower.includes('nameresolutionerror') || lower.includes('failed to resolve')) {
      short = 'Network error: Could not reach Hugging Face (DNS/network). Check internet, VPN, or firewall.'
    } else if (lower.includes('read timed out') || lower.includes('timed out')) {
      short = 'Download timed out. Connection was too slow or dropped. Try again or use a faster network.'
    } else if (lower.includes('maxretryerror') || lower.includes('max retries')) {
      short = 'Download failed after retries (network or server). Try again later.'
    } else if (raw.length > 120) {
      short = raw.slice(0, 117) + '...'
    } else {
      short = raw
    }
    return { short, isLong: raw.length > 120 }
  }

  useEffect(() => {
    if (open) {
      // Reset form when modal opens
      setStep(1)
      setSourceType('')
      setBasicInfo({
        name: '',
        description: '',
        task: 'nlp',
        framework: 'pytorch',
        owner: '',
      })
      setHfInfo({ 
        repoId: '', 
        revision: '', 
        license: '',
        name: '',
        description: '',
        task: 'nlp',
        framework: 'pytorch',
      })
      setScratchInfo({
        architectureType: 'transformer',
        inputType: 'text',
        initialization: 'xavier',
        customInitScript: '',
      })
      setOllamaInfo({ 
        modelName: '', 
        quantization: '',
        connectionType: 'local',
        cloudHost: '',
        searchQuery: '',
        name: '',
        description: '',
        task: 'nlp',
        framework: 'pytorch',
      })
      setUploadInfo({
        file: null,
        fileName: '',
        name: '',
        description: '',
        task: 'nlp',
        framework: 'pytorch',
        license: '',
      })
      setErrors({})
      setIsDownloading(false)
      setDownloadProgress(0)
      setDownloadError(null)
    }
  }, [open])

  // Load local Ollama host from Settings (global configuration)
  useEffect(() => {
    if (open && sourceType === 'ollama') {
      // Load from Settings (Platform Settings → Model Sources → Ollama)
      const savedHost = localStorage.getItem('ollama-host')
      if (savedHost) {
        setLocalOllamaHost(savedHost)
      }
    }
  }, [open, sourceType])

  // Fetch local Ollama models when Local is selected (using host from Settings)
  useEffect(() => {
    if (open && sourceType === 'ollama' && step === 2 && ollamaInfo.connectionType === 'local') {
      // Auto-fetch models from configured host in Settings
      const fetchLocalModels = async () => {
        try {
          // Real Ollama API call: Fetch models from configured host
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
          
          const response = await fetch(`${localOllamaHost}/api/tags`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          })
          
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const data = await response.json()
          
          // Parse models from Ollama API response
          // Response format: { models: [{ name: "model:tag", ... }] }
          const models = data.models?.map((model: any) => model.name) || []
          
          setLocalOllamaModels(models)
        } catch (error: any) {
          console.error('Failed to fetch local Ollama models:', error)
          setLocalOllamaModels([])
          
          const errorMessage = error.name === 'AbortError'
            ? 'Connection timeout. Please check if Ollama is running.'
            : error.message || 'Could not connect to Ollama.'
          
          addToast({
            title: 'Connection Failed',
            description: `${errorMessage} Please check Settings → Model Sources → Ollama.`,
            variant: 'error',
          })
        }
      }
      
      fetchLocalModels()
    }
  }, [open, sourceType, step, ollamaInfo.connectionType, localOllamaHost, addToast])

  // Filter models based on search query
  const filteredLocalModels = localOllamaModels.filter(model => 
    model.toLowerCase().includes(ollamaInfo.searchQuery.toLowerCase())
  )
  const filteredCloudModels = cloudOllamaModels.filter(model => 
    model.toLowerCase().includes(ollamaInfo.searchQuery.toLowerCase())
  )

  // Helper function to auto-detect task type from model name
  const detectTaskFromModelName = (modelName: string): BaseModelTask => {
    if (!modelName) return 'nlp' // Default fallback
    
    const name = modelName.toLowerCase()
    
    // Vision/Image detection keywords
    if (
      name.includes('vision') || 
      name.includes('image') || 
      name.includes('ocr') || 
      name.includes('resnet') || 
      name.includes('vit') || 
      name.includes('efficientnet') || 
      name.includes('yolo') || 
      name.includes('detection') ||
      name.includes('segmentation') ||
      name.includes('classify') ||
      name.includes('clip')
    ) {
      return 'vision'
    }
    
    // Multimodal detection keywords
    if (
      name.includes('multimodal') || 
      name.includes('vl') || // vision-language
      name.includes('vision-language') ||
      name.includes('blip') ||
      name.includes('llava') ||
      name.includes('gpt-4v') ||
      name.includes('gemini-pro-vision')
    ) {
      return 'multimodal'
    }
    
    // NLP detection keywords (most common for Ollama)
    if (
      name.includes('llama') || 
      name.includes('gpt') || 
      name.includes('bert') || 
      name.includes('mistral') ||
      name.includes('phi') ||
      name.includes('qwen') ||
      name.includes('gemma') ||
      name.includes('chat') ||
      name.includes('text') ||
      name.includes('language')
    ) {
      return 'nlp'
    }
    
    // Default to NLP for most Ollama models
    return 'nlp'
  }

  // Helper function to auto-detect framework from model name
  const detectFrameworkFromModelName = (modelName: string, sourceType: 'ollama' | 'huggingface' | 'upload' = 'ollama'): BaseModelFramework => {
    if (!modelName) {
      // Default based on source type
      return sourceType === 'huggingface' ? 'pytorch' : 'pytorch'
    }
    
    const name = modelName.toLowerCase()
    
    // Explicit TensorFlow indicators
    if (
      name.includes('tensorflow') || 
      name.includes('tf-') || 
      name.includes('-tf') ||
      name.includes('/tf/') ||
      name.includes('tf_') ||
      name.includes('_tf')
    ) {
      return 'tensorflow'
    }
    
    // Explicit PyTorch indicators
    if (
      name.includes('pytorch') || 
      name.includes('torch') ||
      name.includes('pt-') ||
      name.includes('-pt') ||
      name.includes('/pt/') ||
      name.includes('pt_') ||
      name.includes('_pt')
    ) {
      return 'pytorch'
    }
    
    // HuggingFace models: Most modern models are PyTorch-based
    // But some older models or specific repos might be TensorFlow
    if (sourceType === 'huggingface') {
      // Check for TensorFlow-specific model families
      if (
        name.includes('albert') || // Some ALBERT models are TF
        name.includes('electra') || // Some ELECTRA models are TF
        (name.includes('bert') && name.includes('tf'))
      ) {
        return 'tensorflow'
      }
      // Default to PyTorch for HuggingFace (most common)
      return 'pytorch'
    }
    
    // Ollama models: Almost all are PyTorch-based (converted to GGUF)
    // GGUF format typically comes from PyTorch models
    if (sourceType === 'ollama') {
      return 'pytorch' // Ollama uses GGUF which is primarily from PyTorch
    }
    
    // Default fallback
    return 'pytorch'
  }

  // Auto-populate metadata from HuggingFace (mock - in real app would fetch from HF API)
  const handleHfRepoChange = (repoId: string) => {
    // Mock auto-population - in real app, fetch from HuggingFace API
    const autoName = repoId || ''
    const autoDescription = repoId ? `Imported from HuggingFace: ${repoId}` : ''
    const autoTask: BaseModelTask = detectTaskFromModelName(repoId)
    const autoFramework: BaseModelFramework = detectFrameworkFromModelName(repoId, 'huggingface') // Auto-detected from model name

    setHfInfo(prev => ({
      ...prev,
      repoId,
      name: autoName,
      description: autoDescription,
      task: autoTask,
      framework: autoFramework,
    }))
  }

  // Auto-populate metadata from Ollama (mock - in real app would fetch from Ollama)
  const handleOllamaModelSelect = (modelName: string) => {
    // Auto-detect task and framework from model name
    const detectedTask = detectTaskFromModelName(modelName)
    const detectedFramework = detectFrameworkFromModelName(modelName, 'ollama')
    
    setOllamaInfo(prev => ({
      ...prev,
      modelName,
      name: modelName || '',
      description: modelName ? `${prev.connectionType === 'cloud' ? 'Cloud' : 'Local'} Ollama model: ${modelName}` : '',
      task: detectedTask, // Auto-detected from model name
      framework: detectedFramework, // Auto-detected from model name
    }))
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadInfo(prev => ({
        ...prev,
        file,
        fileName: file.name,
        name: prev.name || file.name.replace(/\.[^/.]+$/, ''), // Auto-fill name from filename
      }))
    }
  }

  // Connect to cloud Ollama
  const handleConnectCloudOllama = async () => {
    if (!ollamaInfo.cloudHost.trim()) {
      setErrors(prev => ({ ...prev, cloudHost: 'Cloud Ollama host is required' }))
      return
    }
    
    try {
      // Real Ollama API call: Fetch models from cloud Ollama host
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(`${ollamaInfo.cloudHost}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Parse models from Ollama API response
      const models = data.models?.map((model: any) => model.name) || []
      
      setCloudOllamaModels(models)
      
      if (models.length === 0) {
        addToast({
          title: 'Connected',
          description: 'Connected to cloud Ollama, but no models found.',
          variant: 'info',
        })
      } else {
        addToast({
          title: 'Connected',
          description: `Connected to cloud Ollama. Found ${models.length} model${models.length > 1 ? 's' : ''}.`,
          variant: 'success',
        })
      }
    } catch (error: any) {
      const errorMessage = error.name === 'AbortError'
        ? 'Connection timeout. Please check the cloud host URL.'
        : error.message || 'Could not connect to cloud Ollama.'
      
      addToast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'error',
      })
      setCloudOllamaModels([])
    }
  }

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!sourceType) {
      newErrors.sourceType = 'Please select a source type'
      setErrors(newErrors)
      return false
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (sourceType === 'huggingface') {
      if (!hfInfo.repoId.trim()) {
        newErrors.repoId = 'HuggingFace repo ID is required'
      }
      if (!hfInfo.license.trim()) {
        newErrors.license = 'License is required'
      }
    } else if (sourceType === 'scratch') {
      if (!basicInfo.name.trim()) {
        newErrors.name = 'Base Model Name is required'
      }
      if (!basicInfo.task) {
        newErrors.task = 'Task Type is required'
      }
      if (!basicInfo.framework) {
        newErrors.framework = 'Framework is required'
      }
    } else if (sourceType === 'ollama') {
      if (!ollamaInfo.modelName.trim()) {
        newErrors.modelName = 'Please select an Ollama model'
      }
      if (ollamaInfo.connectionType === 'cloud' && !ollamaInfo.cloudHost.trim()) {
        newErrors.cloudHost = 'Cloud Ollama host is required'
      }
    } else if (sourceType === 'upload') {
      if (!uploadInfo.file) {
        newErrors.file = 'Model file is required'
      }
      if (!uploadInfo.name.trim()) {
        newErrors.name = 'Base Model Name is required'
      }
      if (!uploadInfo.task) {
        newErrors.task = 'Task Type is required'
      }
      if (!uploadInfo.framework) {
        newErrors.framework = 'Framework is required'
      }
      if (!uploadInfo.license.trim()) {
        newErrors.license = 'License is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2)
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3)
      }
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    } else if (step === 3) {
      setStep(2)
    }
  }

  const subscribeDownloadProgress = (baseModelId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const wsUrl = getBaseModelDownloadWsUrl(baseModelId)
      let resolved = false
      const finish = (err?: Error) => {
        if (resolved) return
        resolved = true
        try {
          ws.close()
        } catch {
          // ignore
        }
        if (err) {
          setIsDownloading(false)
          reject(err)
        } else {
          setIsDownloading(false)
          setDownloadProgress(100)
          resolve()
        }
      }
      const ws = new WebSocket(wsUrl)
      ws.onopen = () => {
        // In case download already completed/failed before we connected, fetch once
        fetchBaseModelDetail(baseModelId).then((detail) => {
          if (resolved) return
          if (detail && 'download' in detail && detail.download) {
            const { download_status_code, download_progress, download_error_message } = detail.download
            setDownloadProgress(download_progress)
            if (download_status_code === 'completed') finish()
            else if (download_status_code === 'failed') {
              setDownloadError(download_error_message || 'Download failed')
              finish(new Error(download_error_message || 'Download failed'))
            }
          }
        }).catch(() => {})
      }
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as DownloadProgressWsMessage
          setDownloadProgress(msg.download_progress)
          setDownloadStatusName(msg.download_status_name || '')
          if (msg.download_status_code === 'completed') {
            finish()
          } else if (msg.download_status_code === 'failed') {
            setDownloadError(msg.download_error_message || 'Download failed')
            finish(new Error(msg.download_error_message || 'Download failed'))
          }
        } catch {
          // ignore parse errors
        }
      }
      ws.onerror = () => finish(new Error('WebSocket connection error'))
      ws.onclose = () => {
        if (!resolved) finish(new Error('Connection closed before download finished'))
      }
    })
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return

    try {
      const origin: any = {}
      let sourceReference = ''
      let runtimeScope: BaseModelRuntimeScope = 'cloud'
      let riskLevel: BaseModelRiskLevel = 'low'
      let architecture: string | undefined = undefined
      let governance: any = {
        documentation_required: true,
        bias_required: true,
        explainability_required: true,
      }

      // Determine final values based on source type
      let finalName = ''
      let finalDescription = ''
      let finalTask: BaseModelTask = 'nlp'
      let finalFramework: BaseModelFramework = 'pytorch'
      let finalLicense = ''
      let finalOwner = ''

      if (sourceType === 'huggingface') {
        sourceReference = hfInfo.repoId
        finalName = hfInfo.name || hfInfo.repoId
        finalDescription = hfInfo.description || `Imported from HuggingFace: ${hfInfo.repoId}`
        finalTask = hfInfo.task
        finalFramework = hfInfo.framework
        finalLicense = hfInfo.license
        finalOwner = basicInfo.owner || 'current-user'
        
        origin.huggingface_repo = hfInfo.repoId
        origin.revision = hfInfo.revision || 'main'
        origin.author = hfInfo.repoId.split('/')[0] || ''
        origin.org = hfInfo.repoId.split('/')[0] || ''
        origin.local_cache = `/models/huggingface/${hfInfo.repoId.replace('/', '_')}`
        governance.external_dependency = true
        governance.license_acknowledged = true
        riskLevel = 'low'
        runtimeScope = 'cloud'
      } else if (sourceType === 'scratch') {
        sourceReference = 'scratch'
        finalName = basicInfo.name
        finalDescription = basicInfo.description || undefined
        finalTask = basicInfo.task
        finalFramework = basicInfo.framework
        finalLicense = 'Proprietary'
        finalOwner = basicInfo.owner || 'current-user'
        architecture = scratchInfo.architectureType
        
        riskLevel = 'high'
        runtimeScope = 'hybrid'
        governance.documentation_required = true
        governance.bias_required = true
        governance.explainability_required = true
      } else if (sourceType === 'ollama') {
        sourceReference = ollamaInfo.modelName
        finalName = ollamaInfo.name || ollamaInfo.modelName
        finalDescription = ollamaInfo.description || `${ollamaInfo.connectionType === 'cloud' ? 'Cloud' : 'Local'} Ollama model: ${ollamaInfo.modelName}`
        finalTask = ollamaInfo.task
        finalFramework = ollamaInfo.framework
        finalLicense = 'Meta Llama 3 Community License'
        finalOwner = basicInfo.owner || 'current-user'
        
        origin.ollama_model = ollamaInfo.modelName
        origin.connection_type = ollamaInfo.connectionType
        if (ollamaInfo.connectionType === 'cloud') {
          origin.cloud_host = ollamaInfo.cloudHost
        }
        riskLevel = 'medium'
        runtimeScope = ollamaInfo.connectionType === 'cloud' ? 'cloud' : 'local'
        governance.license_acknowledged = true
      } else if (sourceType === 'upload') {
        sourceReference = uploadInfo.fileName || 'uploaded'
        finalName = uploadInfo.name
        finalDescription = uploadInfo.description || undefined
        finalTask = uploadInfo.task
        finalFramework = uploadInfo.framework
        finalLicense = uploadInfo.license
        finalOwner = basicInfo.owner || 'current-user'
        
        origin.uploaded_file = uploadInfo.fileName
        origin.file_size = uploadInfo.file?.size || 0
        riskLevel = 'high' // Manual uploads require more scrutiny
        runtimeScope = 'hybrid'
        governance.documentation_required = true
        governance.bias_required = true
        governance.explainability_required = true
      }

      const sourceId = LOOKUP_SOURCE_IDS[sourceType as keyof typeof LOOKUP_SOURCE_IDS]
      if (!sourceId) {
        throw new Error(`Invalid source type: ${sourceType}`)
      }

      const taskId = LOOKUP_TASK_IDS[finalTask] || LOOKUP_TASK_IDS.nlp
      const frameworkId = LOOKUP_FRAMEWORK_IDS[finalFramework] || LOOKUP_FRAMEWORK_IDS.pytorch
      const licenseId = LOOKUP_LICENSE_IDS[finalLicense] || LOOKUP_LICENSE_IDS['apache-2.0']
      const architectureId = architecture ? LOOKUP_ARCHITECTURE_IDS[architecture] : undefined

      const payload: import('@/lib/api/baseModelApi').BaseModelCreatePayload = {
        project_id: projectId,
        name: finalName,
        description: finalDescription || undefined,
        source_id: sourceId,
        architecture_id: architectureId || undefined,
        task_ids: [taskId],
        framework_ids: [frameworkId],
        license_ids: [licenseId],
      }

      if (sourceType === 'huggingface') {
        payload.huggingface = {
          hf_repo_id: hfInfo.repoId,
          hf_revision: hfInfo.revision || undefined,
        }
      } else if (sourceType === 'ollama') {
        const hostUrl = ollamaInfo.connectionType === 'cloud' ? ollamaInfo.cloudHost : localOllamaHost
        payload.ollama = {
          ollama_model_name: ollamaInfo.modelName,
          ollama_host_url: hostUrl || 'http://localhost:11434',
          ollama_host_type: ollamaInfo.connectionType === 'cloud' ? 'cloud' : 'local',
        }
      } else if (sourceType === 'scratch') {
        payload.scratch = {
          scratch_input_format: scratchInfo.inputType || undefined,
          scratch_init_method: scratchInfo.initialization || undefined,
        }
      } else if (sourceType === 'upload' && uploadInfo.file) {
        payload.upload = {
          upload_file_name: uploadInfo.fileName || uploadInfo.file.name,
          upload_file_path: `/uploads/${projectId}/${uploadInfo.file.name}`,
          upload_file_size_bytes: uploadInfo.file.size,
          upload_checksum: undefined,
          upload_mime_type: uploadInfo.file.type || undefined,
        }
      }

      const newBaseModel = await createBaseModel(payload)

      if (sourceType === 'huggingface') {
        setIsDownloading(true)
        setDownloadProgress(0)
        setDownloadError(null)
        setDownloadStatusName('Downloading')
        try {
          await subscribeDownloadProgress(newBaseModel.id)
          addToast({
            title: 'Base Model Registered',
            description: `${newBaseModel.name} has been registered and downloaded successfully.`,
            variant: 'success',
          })
          notifyEvent({ type_code: 'project', title: 'Base Model Registered', body: `${newBaseModel.name} telah didaftarkan dan di-download.` })
          onOpenChange(false)
        } catch (err: any) {
          addToast({
            title: 'Download failed',
            description: err.message || 'Model was registered but download failed. You can retry from the model detail page.',
            variant: 'error',
          })
        }
        return
      }

      addToast({
        title: 'Base Model Registered',
        description: `${newBaseModel.name} has been registered successfully.`,
        variant: 'success',
      })
      notifyEvent({ type_code: 'project', title: 'Base Model Registered', body: `${newBaseModel.name} telah didaftarkan.` })

      onOpenChange(false)
    } catch (error: any) {
      if (sourceType === 'huggingface') {
        setDownloadError(error.message || 'Registration failed.')
        setIsDownloading(false)
      }
      addToast({
        title: 'Error',
        description: error.message || 'Failed to register base model',
        variant: 'error',
      })
    }
  }

  const portalRoot = typeof document !== 'undefined' ? document.body : null

  const sidebarContent = (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={handleRequestClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed right-0 top-0 h-screen bg-background border-l border-border shadow-2xl transition-transform duration-300 z-[60] flex flex-col',
          'w-full sm:w-[600px] lg:w-[700px]',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">
                {step === 1 && 'Select Base Model Source'}
                {step === 2 && sourceType === 'scratch' && 'Create Base Model from Scratch'}
                {step === 2 && sourceType === 'huggingface' && 'Import from Hugging Face'}
                {step === 2 && sourceType === 'ollama' && 'Import from Ollama'}
                {step === 2 && sourceType === 'upload' && 'Upload Model Manual'}
                {step === 3 && 'Review & Confirm'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 1 && 'Choose how you want to register the base model'}
                {step === 2 && sourceType === 'scratch' && 'Define the architecture and configuration for your base model'}
                {step === 2 && sourceType === 'huggingface' && 'Import a pre-trained model from Hugging Face Hub'}
                {step === 2 && sourceType === 'ollama' && 'Select a model from your Ollama installation'}
                {step === 2 && sourceType === 'upload' && 'Upload a model file manually'}
                {step === 3 && 'Review your base model configuration before registering'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRequestClose}
              className="ml-4"
              title={isDownloading ? 'Tutup (download tetap berjalan di belakang)' : 'Tutup'}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between px-1">
            <div className={cn('flex items-center gap-2', step >= 1 ? 'text-primary' : 'text-muted-foreground')}>
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-sm font-medium">Source</span>
            </div>
            <div className="flex-1 h-px bg-border mx-2" />
            <div className={cn('flex items-center gap-2', step >= 2 ? 'text-primary' : 'text-muted-foreground')}>
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                {step > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span className="text-sm font-medium">
                {sourceType === 'scratch' ? 'Config' : 
                 sourceType === 'huggingface' ? 'Import' : 
                 sourceType === 'ollama' ? 'Select' : 
                 sourceType === 'upload' ? 'Upload' : 
                 'Details'}
              </span>
            </div>
            <div className="flex-1 h-px bg-border mx-2" />
            <div className={cn('flex items-center gap-2', step >= 3 ? 'text-primary' : 'text-muted-foreground')}>
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                3
              </div>
              <span className="text-sm font-medium">Review</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Step 1: Select Source */}
            {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-4 block">Select Base Model Source</Label>
                <div className="space-y-3">
                  <label className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                    sourceType === 'huggingface' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  )}>
                    <input
                      type="radio"
                      name="sourceType"
                      value="huggingface"
                      checked={sourceType === 'huggingface'}
                      onChange={(e) => setSourceType(e.target.value as BaseModelSourceType)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold mb-1">Import from Hugging Face</div>
                      <div className="text-sm text-muted-foreground">
                        Import a pre-trained model from Hugging Face Hub. Metadata will be auto-populated.
                      </div>
                    </div>
                  </label>

                  <label className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                    sourceType === 'scratch' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  )}>
                    <input
                      type="radio"
                      name="sourceType"
                      value="scratch"
                      checked={sourceType === 'scratch'}
                      onChange={(e) => setSourceType(e.target.value as BaseModelSourceType)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold mb-1">Create Base Model from Scratch</div>
                      <div className="text-sm text-muted-foreground">
                        Initialize a new model architecture without pre-trained weights. You'll define all details manually.
                      </div>
                    </div>
                  </label>

                  <label className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                    sourceType === 'ollama' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  )}>
                    <input
                      type="radio"
                      name="sourceType"
                      value="ollama"
                      checked={sourceType === 'ollama'}
                      onChange={(e) => setSourceType(e.target.value as BaseModelSourceType)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold mb-1">Import from Ollama</div>
                      <div className="text-sm text-muted-foreground">
                        Select from local or cloud Ollama models. Metadata will be auto-populated.
                      </div>
                    </div>
                  </label>

                  <label className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                    sourceType === 'upload' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  )}>
                    <input
                      type="radio"
                      name="sourceType"
                      value="upload"
                      checked={sourceType === 'upload'}
                      onChange={(e) => setSourceType(e.target.value as BaseModelSourceType)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold mb-1">Upload Model Manual</div>
                      <div className="text-sm text-muted-foreground">
                        Upload a model file manually (e.g., .pth, .h5, .onnx, .pb)
                      </div>
                    </div>
                  </label>
                </div>
                {errors.sourceType && <p className="text-sm text-destructive mt-2">{errors.sourceType}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Source-specific forms */}
          {step === 2 && (
            <div className="space-y-4">
              {/* HuggingFace Form */}
              {sourceType === 'huggingface' && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="repoId">
                      HuggingFace Repo ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="repoId"
                      value={hfInfo.repoId}
                      onChange={(e) => handleHfRepoChange(e.target.value)}
                      placeholder="e.g., bert-base-uncased or google/vit-base-patch16-224"
                      className={errors.repoId ? 'border-destructive' : ''}
                    />
                    {errors.repoId && <p className="text-sm text-destructive mt-1">{errors.repoId}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Model name, task, and framework will be auto-detected from the repository.
                    </p>
                  </div>

                  {/* Auto-populated preview */}
                  {hfInfo.repoId && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">Auto-detected:</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div><strong>Name:</strong> {hfInfo.name || hfInfo.repoId}</div>
                        <div><strong>Task:</strong> {hfInfo.task.toUpperCase()}</div>
                        <div><strong>Framework:</strong> {hfInfo.framework}</div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="revision">Revision / Branch (optional)</Label>
                    <Input
                      id="revision"
                      value={hfInfo.revision}
                      onChange={(e) => setHfInfo({ ...hfInfo, revision: e.target.value })}
                      placeholder="e.g., main, v1.0.0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="license">
                      License <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="license"
                      value={hfInfo.license}
                      onChange={(e) => setHfInfo({ ...hfInfo, license: e.target.value })}
                      placeholder="e.g., Apache 2.0"
                      className={errors.license ? 'border-destructive' : ''}
                    />
                    {errors.license && <p className="text-sm text-destructive mt-1">{errors.license}</p>}
                  </div>

                  <div>
                    <Label htmlFor="owner">Owner / Team (optional)</Label>
                    <Input
                      id="owner"
                      value={basicInfo.owner}
                      onChange={(e) => setBasicInfo({ ...basicInfo, owner: e.target.value })}
                      placeholder="e.g., ML Team"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      <strong>Note:</strong> License acknowledgment is required. External dependency flag will be set to TRUE.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      <strong>Download:</strong> Model will be downloaded and cached during registration to ensure stable fine-tuning.
                    </p>
                  </div>
                </div>
              )}

              {/* Scratch Form - Basic Information */}
              {sourceType === 'scratch' && (
                <>
                  <div>
                    <Label htmlFor="name">
                      Base Model Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={basicInfo.name}
                      onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                      placeholder="e.g., Custom Transformer"
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={basicInfo.description}
                      onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                      placeholder="Brief description of the base model"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="task">
                        Task Type <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        id="task"
                        value={basicInfo.task}
                        onChange={(e) => setBasicInfo({ ...basicInfo, task: e.target.value as BaseModelTask })}
                        className={errors.task ? 'border-destructive' : ''}
                      >
                        <option value="nlp">NLP</option>
                        <option value="vision">Vision</option>
                        <option value="multimodal">Multimodal</option>
                        <option value="custom">Custom</option>
                      </Select>
                      {errors.task && <p className="text-sm text-destructive mt-1">{errors.task}</p>}
                    </div>

                    <div>
                      <Label htmlFor="framework">
                        Framework <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        id="framework"
                        value={basicInfo.framework}
                        onChange={(e) => setBasicInfo({ ...basicInfo, framework: e.target.value as BaseModelFramework })}
                        className={errors.framework ? 'border-destructive' : ''}
                      >
                        <option value="pytorch">PyTorch</option>
                        <option value="tensorflow">TensorFlow</option>
                        <option value="other">Other</option>
                      </Select>
                      {errors.framework && <p className="text-sm text-destructive mt-1">{errors.framework}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="architectureType">Architecture Type</Label>
                      <Select
                        id="architectureType"
                        value={scratchInfo.architectureType}
                        onChange={(e) => setScratchInfo({ ...scratchInfo, architectureType: e.target.value as any })}
                      >
                        <option value="transformer">Transformer</option>
                        <option value="cnn">CNN</option>
                        <option value="lstm">LSTM</option>
                        <option value="custom">Custom</option>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="inputType">Input Type</Label>
                      <Select
                        id="inputType"
                        value={scratchInfo.inputType}
                        onChange={(e) => setScratchInfo({ ...scratchInfo, inputType: e.target.value as any })}
                      >
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                        <option value="tabular">Tabular</option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="initialization">Initialization</Label>
                    <Select
                      id="initialization"
                      value={scratchInfo.initialization}
                      onChange={(e) => setScratchInfo({ ...scratchInfo, initialization: e.target.value as any })}
                    >
                      <option value="random">Random</option>
                      <option value="xavier">Xavier</option>
                      <option value="he">He</option>
                      <option value="custom">Custom</option>
                    </Select>
                  </div>

                  {scratchInfo.initialization === 'custom' && (
                    <div>
                      <Label htmlFor="customInitScript">Custom Init Script (optional)</Label>
                      <Textarea
                        id="customInitScript"
                        value={scratchInfo.customInitScript}
                        onChange={(e) => setScratchInfo({ ...scratchInfo, customInitScript: e.target.value })}
                        placeholder="Path to custom initialization script"
                        rows={2}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="owner">Owner / Team (optional)</Label>
                    <Input
                      id="owner"
                      value={basicInfo.owner}
                      onChange={(e) => setBasicInfo({ ...basicInfo, owner: e.target.value })}
                      placeholder="e.g., ML Team"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      <strong>Warning:</strong> Risk Level will be set to HIGH. Documentation, bias evaluation, and explainability are required.
                    </p>
                  </div>
                </>
              )}

              {/* Ollama Form */}
              {sourceType === 'ollama' && (
                <>
                  {/* Connection Type Selection */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Connection Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                        ollamaInfo.connectionType === 'local' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      )}>
                        <input
                          type="radio"
                          name="connectionType"
                          value="local"
                          checked={ollamaInfo.connectionType === 'local'}
                          onChange={(e) => setOllamaInfo({ ...ollamaInfo, connectionType: 'local', modelName: '', cloudHost: '' })}
                          className="mt-0.5"
                        />
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4" />
                          <span className="text-sm font-medium">Local</span>
                        </div>
                      </label>

                      <label className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                        ollamaInfo.connectionType === 'cloud' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      )}>
                        <input
                          type="radio"
                          name="connectionType"
                          value="cloud"
                          checked={ollamaInfo.connectionType === 'cloud'}
                          onChange={(e) => setOllamaInfo({ ...ollamaInfo, connectionType: 'cloud', modelName: '' })}
                          className="mt-0.5"
                        />
                        <div className="flex items-center gap-2">
                          <Cloud className="w-4 h-4" />
                          <span className="text-sm font-medium">Cloud</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Cloud Ollama Connection */}
                  {ollamaInfo.connectionType === 'cloud' && (
                    <div className="space-y-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div>
                        <Label htmlFor="cloudHost">
                          Cloud Ollama Host <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Enter cloud Ollama host URL. This can be different per project/base model.
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="cloudHost"
                            value={ollamaInfo.cloudHost}
                            onChange={(e) => setOllamaInfo({ ...ollamaInfo, cloudHost: e.target.value })}
                            placeholder="e.g., https://api.ollama.cloud"
                            className={errors.cloudHost ? 'border-destructive' : ''}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleConnectCloudOllama}
                            disabled={!ollamaInfo.cloudHost.trim()}
                          >
                            Connect
                          </Button>
                        </div>
                        {errors.cloudHost && <p className="text-sm text-destructive mt-1">{errors.cloudHost}</p>}
                      </div>
                    </div>
                  )}

                  {/* Search Input */}
                  <div>
                    <Label htmlFor="searchModel">Search Models</Label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="searchModel"
                        value={ollamaInfo.searchQuery}
                        onChange={(e) => setOllamaInfo({ ...ollamaInfo, searchQuery: e.target.value })}
                        placeholder="Search models..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Local Models List */}
                  {ollamaInfo.connectionType === 'local' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Local Models</Label>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenChange(false)
                            navigate('/settings?section=model-sources')
                          }}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <span>Using host from Settings</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Host: <code className="px-1 py-0.5 bg-muted rounded text-xs">{localOllamaHost}</code>
                      </div>
                      {filteredLocalModels.length === 0 ? (
                        <div className="p-4 rounded-lg border border-border/20 bg-muted/30 text-center text-sm text-muted-foreground">
                          {ollamaInfo.searchQuery ? (
                            'No models found matching your search'
                          ) : (
                            <div className="space-y-2">
                              <p>No local models available.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenChange(false)
                                  navigate('/settings?section=model-sources')
                                }}
                                className="text-xs text-primary hover:underline"
                              >
                                Configure Ollama in Settings → Model Sources → Ollama
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {filteredLocalModels.map((model) => (
                            <label
                              key={model}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                                ollamaInfo.modelName === model ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                              )}
                            >
                              <input
                                type="radio"
                                name="ollamaModel"
                                value={model}
                                checked={ollamaInfo.modelName === model}
                                onChange={() => handleOllamaModelSelect(model)}
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{model}</div>
                                <div className="text-xs text-muted-foreground">Local</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cloud Models List */}
                  {ollamaInfo.connectionType === 'cloud' && cloudOllamaModels.length > 0 && (
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Cloud Models</Label>
                      {filteredCloudModels.length === 0 ? (
                        <div className="p-4 rounded-lg border border-border/20 bg-muted/30 text-center text-sm text-muted-foreground">
                          No models found matching your search
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {filteredCloudModels.map((model) => (
                            <label
                              key={model}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                                ollamaInfo.modelName === model ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                              )}
                            >
                              <input
                                type="radio"
                                name="ollamaModel"
                                value={model}
                                checked={ollamaInfo.modelName === model}
                                onChange={() => handleOllamaModelSelect(model)}
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{model}</div>
                                <div className="text-xs text-muted-foreground">Cloud</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {errors.modelName && <p className="text-sm text-destructive mt-2">{errors.modelName}</p>}

                  {/* Auto-populated preview */}
                  {ollamaInfo.modelName && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">Auto-detected:</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div><strong>Name:</strong> {ollamaInfo.name || ollamaInfo.modelName}</div>
                        <div><strong>Task:</strong> {ollamaInfo.task.toUpperCase()}</div>
                        <div><strong>Framework:</strong> {ollamaInfo.framework}</div>
                        <div><strong>Source:</strong> {ollamaInfo.connectionType === 'cloud' ? 'Cloud' : 'Local'}</div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="quantization">Quantization (optional)</Label>
                    <Input
                      id="quantization"
                      value={ollamaInfo.quantization}
                      onChange={(e) => setOllamaInfo({ ...ollamaInfo, quantization: e.target.value })}
                      placeholder="e.g., Q4_0 (auto-detected if empty)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="owner">Owner / Team (optional)</Label>
                    <Input
                      id="owner"
                      value={basicInfo.owner}
                      onChange={(e) => setBasicInfo({ ...basicInfo, owner: e.target.value })}
                      placeholder="e.g., ML Team"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      <strong>Note:</strong> {ollamaInfo.connectionType === 'cloud' ? 'Cloud models can be deployed to cloud infrastructure.' : 'Runtime Scope will be set to Local. Cloud deployment will be disabled.'}
                    </p>
                  </div>
                </>
              )}

              {/* Upload Model Manual Form */}
              {sourceType === 'upload' && (
                <>
                  <div>
                    <Label htmlFor="file">
                      Model File <span className="text-destructive">*</span>
                    </Label>
                    <div className="mt-2">
                      <label
                        htmlFor="file"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background/50 hover:bg-background transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Supported formats: .pth, .h5, .onnx, .pb, .pt, .ckpt
                          </p>
                        </div>
                        <input
                          id="file"
                          type="file"
                          accept=".pth,.h5,.onnx,.pb,.pt,.ckpt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {uploadInfo.fileName && (
                      <div className="mt-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-green-600 dark:text-green-400">
                          <strong>Selected:</strong> {uploadInfo.fileName}
                        </p>
                      </div>
                    )}
                    {errors.file && <p className="text-sm text-destructive mt-1">{errors.file}</p>}
                  </div>

                  <div>
                    <Label htmlFor="uploadName">
                      Base Model Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="uploadName"
                      value={uploadInfo.name}
                      onChange={(e) => setUploadInfo({ ...uploadInfo, name: e.target.value })}
                      placeholder="e.g., Custom Model v1"
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="uploadDescription">Description</Label>
                    <Textarea
                      id="uploadDescription"
                      value={uploadInfo.description}
                      onChange={(e) => setUploadInfo({ ...uploadInfo, description: e.target.value })}
                      placeholder="Brief description of the model"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="uploadTask">
                        Task Type <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        id="uploadTask"
                        value={uploadInfo.task}
                        onChange={(e) => setUploadInfo({ ...uploadInfo, task: e.target.value as BaseModelTask })}
                        className={errors.task ? 'border-destructive' : ''}
                      >
                        <option value="nlp">NLP</option>
                        <option value="vision">Vision</option>
                        <option value="multimodal">Multimodal</option>
                        <option value="custom">Custom</option>
                      </Select>
                      {errors.task && <p className="text-sm text-destructive mt-1">{errors.task}</p>}
                    </div>

                    <div>
                      <Label htmlFor="uploadFramework">
                        Framework <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        id="uploadFramework"
                        value={uploadInfo.framework}
                        onChange={(e) => setUploadInfo({ ...uploadInfo, framework: e.target.value as BaseModelFramework })}
                        className={errors.framework ? 'border-destructive' : ''}
                      >
                        <option value="pytorch">PyTorch</option>
                        <option value="tensorflow">TensorFlow</option>
                        <option value="other">Other</option>
                      </Select>
                      {errors.framework && <p className="text-sm text-destructive mt-1">{errors.framework}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="uploadLicense">
                      License <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="uploadLicense"
                      value={uploadInfo.license}
                      onChange={(e) => setUploadInfo({ ...uploadInfo, license: e.target.value })}
                      placeholder="e.g., Proprietary, Apache 2.0"
                      className={errors.license ? 'border-destructive' : ''}
                    />
                    {errors.license && <p className="text-sm text-destructive mt-1">{errors.license}</p>}
                  </div>

                  <div>
                    <Label htmlFor="owner">Owner / Team (optional)</Label>
                    <Input
                      id="owner"
                      value={basicInfo.owner}
                      onChange={(e) => setBasicInfo({ ...basicInfo, owner: e.target.value })}
                      placeholder="e.g., ML Team"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Basic Information Card */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Basic Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Tag className="h-3.5 w-3.5" />
                        Model Name
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {sourceType === 'huggingface' ? (hfInfo.name || hfInfo.repoId) :
                        sourceType === 'ollama' ? (ollamaInfo.name || ollamaInfo.modelName) :
                        sourceType === 'upload' ? uploadInfo.name :
                        basicInfo.name}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <FileText className="h-3.5 w-3.5" />
                        Description
                      </div>
                      <p className="text-sm text-foreground">
                        {sourceType === 'huggingface' ? hfInfo.description :
                        sourceType === 'ollama' ? ollamaInfo.description :
                        sourceType === 'upload' ? (uploadInfo.description || '(No description)') :
                        basicInfo.description || '(No description)'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          <Cpu className="h-3.5 w-3.5" />
                          Task Type
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="mt-1 font-semibold"
                        >
                          {sourceType === 'huggingface' ? hfInfo.task.toUpperCase() :
                          sourceType === 'ollama' ? ollamaInfo.task.toUpperCase() :
                          sourceType === 'upload' ? uploadInfo.task.toUpperCase() :
                          basicInfo.task.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          <Code className="h-3.5 w-3.5" />
                          Framework
                        </div>
                        <Badge 
                          variant="outline" 
                          className="mt-1 font-semibold capitalize"
                        >
                          {sourceType === 'huggingface' ? hfInfo.framework :
                          sourceType === 'ollama' ? ollamaInfo.framework :
                          sourceType === 'upload' ? uploadInfo.framework :
                          basicInfo.framework}
                        </Badge>
                      </div>
                    </div>

                    {basicInfo.owner && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          <Database className="h-3.5 w-3.5" />
                          Owner / Team
                        </div>
                        <p className="text-sm text-foreground">{basicInfo.owner}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Source Configuration Card */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Source Configuration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Link2 className="h-3.5 w-3.5" />
                        Source Type
                      </div>
                      <Badge variant="default" className="mt-1">
                        {sourceType === 'huggingface' ? 'HuggingFace' : 
                        sourceType === 'scratch' ? 'Scratch' : 
                        sourceType === 'ollama' ? 'Ollama' : 
                        'Upload Manual'}
                      </Badge>
                    </div>

                    {sourceType === 'huggingface' && (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Repository ID
                          </div>
                          <p className="text-sm font-mono text-foreground bg-muted/50 p-2 rounded border">{hfInfo.repoId}</p>
                        </div>
                        {hfInfo.revision && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Revision
                            </div>
                            <p className="text-sm text-foreground">{hfInfo.revision}</p>
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            License
                          </div>
                          <Badge variant="outline" className="mt-1">{hfInfo.license}</Badge>
                        </div>
                      </>
                    )}

                    {sourceType === 'scratch' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Architecture
                            </div>
                            <Badge variant="secondary" className="mt-1 capitalize">{scratchInfo.architectureType}</Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Input Type
                            </div>
                            <Badge variant="secondary" className="mt-1 capitalize">{scratchInfo.inputType}</Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Initialization
                          </div>
                          <Badge variant="outline" className="mt-1 capitalize">{scratchInfo.initialization}</Badge>
                        </div>
                      </>
                    )}

                    {sourceType === 'ollama' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Connection
                            </div>
                            <Badge 
                              variant={ollamaInfo.connectionType === 'cloud' ? 'default' : 'secondary'} 
                              className="mt-1"
                            >
                              {ollamaInfo.connectionType === 'cloud' ? 'Cloud' : 'Local'}
                            </Badge>
                          </div>
                          {ollamaInfo.quantization && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Quantization
                              </div>
                              <Badge variant="outline" className="mt-1 font-mono">{ollamaInfo.quantization}</Badge>
                            </div>
                          )}
                        </div>
                        {ollamaInfo.connectionType === 'cloud' && ollamaInfo.cloudHost && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Cloud Host
                            </div>
                            <p className="text-sm font-mono text-foreground bg-muted/50 p-2 rounded border">{ollamaInfo.cloudHost}</p>
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Model Name
                          </div>
                          <p className="text-sm font-mono text-foreground bg-muted/50 p-2 rounded border">{ollamaInfo.modelName}</p>
                        </div>
                      </>
                    )}

                    {sourceType === 'upload' && (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            File Name
                          </div>
                          <p className="text-sm font-mono text-foreground bg-muted/50 p-2 rounded border">{uploadInfo.fileName}</p>
                        </div>
                        {uploadInfo.file && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              File Size
                            </div>
                            <p className="text-sm text-foreground">{(uploadInfo.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            License
                          </div>
                          <Badge variant="outline" className="mt-1">{uploadInfo.license}</Badge>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Download Status */}
              {sourceType === 'huggingface' && (
                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Download Status</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      {isDownloading
                        ? downloadProgress > 0 && downloadProgress < 100
                          ? `Downloading model from Hugging Face... ${downloadProgress}%`
                          : 'Downloading model from Hugging Face... This may take several minutes for large models.'
                        : 'Ready to download and cache the model. After you click Register, the real download will start and run in the background.'}
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full bg-primary transition-all duration-300',
                          isDownloading && downloadProgress === 0 && 'animate-pulse w-1/3 min-w-[20%]'
                        )}
                        style={isDownloading && downloadProgress === 0 ? { width: '30%' } : { width: `${downloadProgress}%` }}
                      />
                    </div>
                    {isDownloading && downloadProgress === 0 && (
                      <p className="text-xs text-muted-foreground">Progress will update when the first phase completes (downloading from HF).</p>
                    )}
                    {downloadError && (() => {
                      const { short, isLong } = getDownloadErrorDisplay(downloadError)
                      return (
                        <div className="space-y-1">
                          <p className="text-sm text-destructive">{short}</p>
                          {isLong && (
                            <>
                              <button
                                type="button"
                                onClick={() => setShowErrorDetails((v) => !v)}
                                className="text-xs text-muted-foreground hover:underline"
                              >
                                {showErrorDetails ? 'Hide technical details' : 'Show technical details'}
                              </button>
                              {showErrorDetails && (
                                <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-auto max-h-24 whitespace-pre-wrap break-all">
                                  {downloadError}
                                </pre>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border p-6 bg-background">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={step === 1 ? () => onOpenChange(false) : handleBack}
              disabled={isDownloading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            <div className="flex gap-2">
              {step < 3 ? (
                <Button onClick={handleNext} disabled={isDownloading}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isDownloading}>
                  {isDownloading ? 'Downloading...' : 'Register Base Model'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )

  if (!portalRoot) return null

  return createPortal(sidebarContent, portalRoot)
}
