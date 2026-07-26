/**
 * Base Model service API client.
 * Integrates with python-base-model-service-fastapi (default port 8502 in __main__).
 * Set VITE_BASE_MODEL_API_URL in .env to point to your base model service.
 */

const BASE_URL = import.meta.env.VITE_BASE_MODEL_API_URL ?? 'http://localhost:8502'

// Lookup IDs from backend seed_data (must match python-base-model-service-fastapi)
export const LOOKUP_SOURCE_IDS = {
  huggingface: '550e8400-e29b-41d4-a716-446655441001',
  scratch: '550e8400-e29b-41d4-a716-446655441002',
  ollama: '550e8400-e29b-41d4-a716-446655441003',
  upload: '550e8400-e29b-41d4-a716-446655441004',
} as const

export const LOOKUP_TASK_IDS: Record<string, string> = {
  'text-generation': '550e8400-e29b-41d4-a716-446655441101',
  'text-embedding': '550e8400-e29b-41d4-a716-446655441102',
  'image-classification': '550e8400-e29b-41d4-a716-446655441103',
  'speech-to-text': '550e8400-e29b-41d4-a716-446655441104',
  multimodal: '550e8400-e29b-41d4-a716-446655441105',
  nlp: '550e8400-e29b-41d4-a716-446655441101',
  vision: '550e8400-e29b-41d4-a716-446655441103',
  custom: '550e8400-e29b-41d4-a716-446655441105',
}

export const LOOKUP_FRAMEWORK_IDS: Record<string, string> = {
  pytorch: '550e8400-e29b-41d4-a716-446655441201',
  tensorflow: '550e8400-e29b-41d4-a716-446655441202',
  onnx: '550e8400-e29b-41d4-a716-446655441203',
  gguf: '550e8400-e29b-41d4-a716-446655441204',
  safetensors: '550e8400-e29b-41d4-a716-446655441205',
  other: '550e8400-e29b-41d4-a716-446655441201',
}

export const LOOKUP_LICENSE_IDS: Record<string, string> = {
  'apache-2.0': '550e8400-e29b-41d4-a716-446655441301',
  'Apache 2.0': '550e8400-e29b-41d4-a716-446655441301',
  mit: '550e8400-e29b-41d4-a716-446655441302',
  'cc-by-4.0': '550e8400-e29b-41d4-a716-446655441303',
  proprietary: '550e8400-e29b-41d4-a716-446655441304',
  Proprietary: '550e8400-e29b-41d4-a716-446655441304',
}

export const LOOKUP_ARCHITECTURE_IDS: Record<string, string> = {
  transformer: '550e8400-e29b-41d4-a716-446655441601',
  cnn: '550e8400-e29b-41d4-a716-446655441602',
  rnn: '550e8400-e29b-41d4-a716-446655441603',
  diffusion: '550e8400-e29b-41d4-a716-446655441604',
  mlp: '550e8400-e29b-41d4-a716-446655441605',
  lstm: '550e8400-e29b-41d4-a716-446655441603',
  custom: '550e8400-e29b-41d4-a716-446655441605',
}

// --- API response types (match backend Pydantic models) ---

export interface BaseModelResponse {
  id: string
  project_id: string
  name: string
  description?: string | null
  source_id: string
  source_code: string
  source_name: string
  architecture_id?: string | null
  /** public | private */
  visibility?: string | null
  created_by: string
  created_date: string
  created_from: string
  updated_by?: string | null
  updated_date?: string | null
  updated_from?: string | null
  /** Included in list when model has download record (e.g. HF/Ollama). */
  download_status_code?: string | null
  download_status_name?: string | null
  download_progress?: number | null
  download_error_message?: string | null
}

export interface BaseModelListResponse {
  base_models: BaseModelResponse[]
  total: number
  page: number
  page_size: number
}

export interface DownloadInfo {
  download_status_id: string
  download_status_code: string
  download_status_name: string
  download_progress: number
  download_local_path?: string | null
  downloaded_at?: string | null
  download_error_message?: string | null
}

export interface BaseModelDetailHuggingface {
  master: BaseModelResponse
  hf_repo_id: string
  hf_revision?: string | null
  download?: DownloadInfo | null
  task_ids: string[]
  framework_ids: string[]
  license_ids: string[]
}

export interface BaseModelDetailOllama {
  master: BaseModelResponse
  ollama_model_name: string
  ollama_host_url: string
  ollama_host_type: string
  download?: DownloadInfo | null
  task_ids: string[]
  framework_ids: string[]
  license_ids: string[]
}

export interface BaseModelDetailScratch {
  master: BaseModelResponse
  scratch_input_format?: string | null
  scratch_init_method?: string | null
  task_ids: string[]
  framework_ids: string[]
  license_ids: string[]
}

export interface BaseModelDetailUpload {
  master: BaseModelResponse
  upload_file_name: string
  upload_file_path: string
  upload_file_size_bytes: number
  upload_checksum?: string | null
  upload_mime_type?: string | null
  task_ids: string[]
  framework_ids: string[]
  license_ids: string[]
}

export type BaseModelDetail =
  | BaseModelDetailHuggingface
  | BaseModelDetailOllama
  | BaseModelDetailScratch
  | BaseModelDetailUpload

// --- Versioning ---
export interface ModelVersionResponse {
  id: string
  base_model_id: string
  version_tag: string
  minio_prefix: string
  description?: string | null
  created_by: string
  created_date: string
}

export interface VersionListResponse {
  versions: ModelVersionResponse[]
}

// --- Stats & Resolve ---
export interface BaseModelStatsResponse {
  total_downloads: number
  last_downloaded_at: string | null
}

export interface ResolveResponse {
  base_model_id: string
  version_tag: string | null
  minio_prefix: string
}

// --- Create / Update request types ---

export interface HuggingfaceDetailCreate {
  hf_repo_id: string
  hf_revision?: string | null
}

export interface OllamaDetailCreate {
  ollama_model_name: string
  ollama_host_url: string
  ollama_host_type: 'local' | 'cloud'
}

export interface ScratchDetailCreate {
  scratch_input_format?: string | null
  scratch_init_method?: string | null
}

export interface UploadDetailCreate {
  upload_file_name: string
  upload_file_path: string
  upload_file_size_bytes: number
  upload_checksum?: string | null
  upload_mime_type?: string | null
}

export interface BaseModelCreatePayload {
  project_id: string
  name: string
  description?: string | null
  source_id: string
  architecture_id?: string | null
  visibility?: string | null
  task_ids?: string[]
  framework_ids?: string[]
  license_ids?: string[]
  huggingface?: HuggingfaceDetailCreate | null
  ollama?: OllamaDetailCreate | null
  scratch?: ScratchDetailCreate | null
  upload?: UploadDetailCreate | null
}

export interface BaseModelUpdatePayload {
  name?: string | null
  description?: string | null
  architecture_id?: string | null
  task_ids?: string[] | null
  framework_ids?: string[] | null
  license_ids?: string[] | null
}

// --- Frontend display type (compatible with existing BaseModel card/detail) ---

export interface BaseModelListItem {
  id: string
  projectId: string
  name: string
  description?: string
  source_type: 'huggingface' | 'scratch' | 'ollama' | 'upload'
  source_reference: string
  source_name: string
  framework: string
  task: string
  license: string
  risk_level: 'low' | 'medium' | 'high'
  runtime_scope: 'cloud' | 'local' | 'hybrid'
  /** public | private */
  visibility?: string | null
  created_at: string
  updated_at?: string
  /** Download status code: not-started | downloading | completed | failed */
  download_status_code?: string | null
  download_status_name?: string | null
  download_progress?: number | null
  download_error_message?: string | null
}

function mapResponseToListItem(r: BaseModelResponse): BaseModelListItem {
  const sourceCode = (r.source_code || '').toLowerCase()
  const sourceType = ['huggingface', 'scratch', 'ollama', 'upload'].includes(sourceCode)
    ? (sourceCode as BaseModelListItem['source_type'])
    : 'upload'
  return {
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    description: r.description ?? undefined,
    source_type: sourceType,
    source_reference: r.name,
    source_name: r.source_name,
    framework: 'pytorch',
    task: 'nlp',
    license: '—',
    risk_level: 'low',
    runtime_scope: 'cloud',
    visibility: r.visibility ?? undefined,
    created_at: r.created_date,
    updated_at: r.updated_date ?? undefined,
    download_status_code: r.download_status_code ?? undefined,
    download_status_name: r.download_status_name ?? undefined,
    download_progress: r.download_progress ?? undefined,
    download_error_message: r.download_error_message ?? undefined,
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    let msg = text
    try {
      const j = JSON.parse(text)
      if (j.detail) msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail)
    } catch {
      // use text
    }
    throw new Error(msg || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/**
 * List base models by project (paginated). Optionally filter by visibility (public | private).
 */
export async function fetchBaseModels(params: {
  project_id: string
  page?: number
  page_size?: number
  visibility?: string | null
}): Promise<{ items: BaseModelListItem[]; total: number; page: number; page_size: number }> {
  const { project_id, page = 1, page_size = 100, visibility } = params
  const url = new URL(`${BASE_URL}/v1/base-models`)
  url.searchParams.set('project_id', project_id)
  url.searchParams.set('page', String(page))
  url.searchParams.set('page_size', String(page_size))
  if (visibility) url.searchParams.set('visibility', visibility)
  const res = await fetch(url.toString())
  const data = await handleResponse<BaseModelListResponse>(res)
  return {
    items: data.base_models.map(mapResponseToListItem),
    total: data.total,
    page: data.page,
    page_size: data.page_size,
  }
}

/**
 * Get a single base model (master only).
 */
export async function fetchBaseModel(id: string): Promise<BaseModelResponse | null> {
  const res = await fetch(`${BASE_URL}/v1/base-models/${id}`)
  if (res.status === 404) return null
  return handleResponse<BaseModelResponse>(res)
}

/**
 * Get full detail (master + source-specific detail).
 */
export async function fetchBaseModelDetail(id: string): Promise<BaseModelDetail | null> {
  const res = await fetch(`${BASE_URL}/v1/base-models/${id}/detail`)
  if (res.status === 404) return null
  return handleResponse<BaseModelDetail>(res)
}

/**
 * Get README.md content from the model (MinIO). Use version for a specific version. Returns null if not available.
 */
export async function fetchBaseModelReadme(
  baseModelId: string,
  version?: string | null
): Promise<string | null> {
  const url = new URL(`${BASE_URL}/v1/base-models/${baseModelId}/readme`)
  if (version) url.searchParams.set('version', version)
  const res = await fetch(url.toString())
  if (res.status === 404) return null
  const data = await handleResponse<{ content: string }>(res)
  return data?.content ?? null
}

export interface BaseModelFileItem {
  name: string
  size: number
  last_modified: string | null
}

/**
 * List files in the model (MinIO). Use version for a specific version. Returns null if not available.
 */
export async function fetchBaseModelFiles(
  baseModelId: string,
  version?: string | null
): Promise<BaseModelFileItem[] | null> {
  const url = new URL(`${BASE_URL}/v1/base-models/${baseModelId}/files`)
  if (version) url.searchParams.set('version', version)
  const res = await fetch(url.toString())
  if (res.status === 404) return null
  const data = await handleResponse<{ files: BaseModelFileItem[] }>(res)
  return data?.files ?? null
}

/**
 * Create a new base model.
 */
export async function createBaseModel(payload: BaseModelCreatePayload): Promise<BaseModelResponse> {
  const res = await fetch(`${BASE_URL}/v1/base-models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<BaseModelResponse>(res)
}

/**
 * Update a base model.
 */
export async function updateBaseModel(
  id: string,
  payload: BaseModelUpdatePayload
): Promise<BaseModelResponse> {
  const res = await fetch(`${BASE_URL}/v1/base-models/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<BaseModelResponse>(res)
}

/**
 * Delete a base model.
 */
export async function deleteBaseModel(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/v1/base-models/${id}`, { method: 'DELETE' })
  await handleResponse<void>(res)
}

/**
 * Start or retry Hugging Face download for a base model (202 Accepted).
 * Only for source=huggingface. Connect to download/ws for real-time progress.
 */
export async function startBaseModelDownload(
  baseModelId: string
): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/v1/base-models/${baseModelId}/start-download`, {
    method: 'POST',
  })
  return handleResponse<{ status: string; message: string }>(res)
}

/** WebSocket base URL (ws or wss from VITE_BASE_MODEL_API_URL). */
const WS_BASE_URL = (import.meta.env.VITE_BASE_MODEL_API_URL ?? 'http://localhost:8502').replace(/^http/, 'ws')

/**
 * WebSocket URL for real-time download progress for a base model.
 * Connect after creating an HF base model or calling start-download.
 */
export function getBaseModelDownloadWsUrl(baseModelId: string): string {
  return `${WS_BASE_URL}/v1/base-models/${baseModelId}/download/ws`
}

/** Payload sent over the download progress WebSocket. */
export interface DownloadProgressWsMessage {
  download_progress: number
  download_status_code: string
  download_status_name: string
  download_error_message: string | null
}

/**
 * List versions for a base model. Returns null if base model not found.
 */
export async function fetchBaseModelVersions(
  baseModelId: string
): Promise<ModelVersionResponse[] | null> {
  const res = await fetch(`${BASE_URL}/v1/base-models/${baseModelId}/versions`)
  if (res.status === 404) return null
  const data = await handleResponse<VersionListResponse>(res)
  return data?.versions ?? null
}

/**
 * Get a single version by tag (e.g. 'latest', 'v1.0'). Returns null if not found.
 */
export async function fetchBaseModelVersionByTag(
  baseModelId: string,
  versionTag: string
): Promise<ModelVersionResponse | null> {
  const res = await fetch(
    `${BASE_URL}/v1/base-models/${baseModelId}/versions/${encodeURIComponent(versionTag)}`
  )
  if (res.status === 404) return null
  return handleResponse<ModelVersionResponse>(res)
}

/**
 * Get presigned download URL for a single file. Use version for a specific version.
 */
export async function fetchFileDownloadUrl(
  baseModelId: string,
  fileName: string,
  params?: { version?: string | null; expiry?: number }
): Promise<{ url: string; expiry_seconds: number } | null> {
  const url = new URL(
    `${BASE_URL}/v1/base-models/${baseModelId}/files/${encodeURIComponent(fileName)}/download-url`
  )
  if (params?.version) url.searchParams.set('version', params.version)
  if (params?.expiry != null) url.searchParams.set('expiry', String(params.expiry))
  const res = await fetch(url.toString())
  if (res.status === 404) return null
  const data = await handleResponse<{ url: string; expiry_seconds: number }>(res)
  return data
}

/**
 * Get download stats for a base model. Returns null if not found.
 */
export async function fetchBaseModelStats(
  baseModelId: string
): Promise<BaseModelStatsResponse | null> {
  const res = await fetch(`${BASE_URL}/v1/base-models/${baseModelId}/stats`)
  if (res.status === 404) return null
  return handleResponse<BaseModelStatsResponse>(res)
}

/**
 * Resolve model (and optional version) to MinIO prefix for training/inference. Returns null if not found.
 */
export async function fetchResolve(
  baseModelId: string,
  version?: string | null
): Promise<ResolveResponse | null> {
  const url = new URL(`${BASE_URL}/v1/base-models/${baseModelId}/resolve`)
  if (version) url.searchParams.set('version', version)
  const res = await fetch(url.toString())
  if (res.status === 404) return null
  return handleResponse<ResolveResponse>(res)
}
