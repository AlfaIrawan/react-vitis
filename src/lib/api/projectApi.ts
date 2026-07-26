/**
 * Project service API client.
 * Uses python-project-service-fastapi (http://localhost:8500).
 * In development, Vite proxies /api/project-service -> localhost:8500 (set VITE_PROJECT_API_URL to override).
 */

const BASE_URL =
  import.meta.env.VITE_PROJECT_API_URL ??
  (import.meta.env.DEV ? '/api/project-service' : 'http://localhost:8500')

export type ProjectStatus = 'active' | 'archived'

export interface ProjectApi {
  id: string
  name: string
  description: string | null
  status_id: string
  status_code: string
  owner_id: string
  owner_name: string
  created_by: string
  created_date: string
  created_from: string
  updated_by: string | null
  updated_date: string | null
  updated_from: string | null
  tags: string[]
  icon_name: string | null
  border_color: string | null
  folder_id: string | null
  folder_name: string | null
  members: {
    user_id: string
    display_name: string
    role_code: string
    role_name: string
  }[]
}

export interface ProjectListResponse {
  projects: ProjectApi[]
  total: number
  page: number
  page_size: number
}

const activeStatusId = '550e8400-e29b-41d4-a716-446655440101'
const archivedStatusId = '550e8400-e29b-41d4-a716-446655440102'
const dummyOwnerId = '00000000-0000-0000-0000-000000000001'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function fetchProjects(params?: {
  page?: number
  page_size?: number
  status_id?: string
  folder_id?: string | null
}): Promise<ProjectListResponse> {
  const sp = new URLSearchParams()
  sp.set('page', String(params?.page ?? 1))
  sp.set('page_size', String(params?.page_size ?? 100))
  if (params?.status_id) sp.set('status_id', params.status_id)
  if (params?.folder_id !== undefined) {
    sp.set('folder_id', params.folder_id === null ? 'null' : params.folder_id)
  }
  const res = await fetch(`${BASE_URL}/v1/projects?${sp}`)
  return handleResponse<ProjectListResponse>(res)
}

export async function fetchProject(id: string): Promise<ProjectApi | null> {
  const res = await fetch(`${BASE_URL}/v1/projects/${id}`)
  if (res.status === 404) return null
  return handleResponse<ProjectApi>(res)
}

export interface CreateProjectPayload {
  name: string
  description?: string
  tags?: string[]
  icon_name?: string
  border_color?: string
  folder_id?: string | null
}

export async function createProject(payload: CreateProjectPayload): Promise<ProjectApi> {
  const res = await fetch(`${BASE_URL}/v1/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: payload.name,
      description: payload.description ?? null,
      status_id: activeStatusId,
      owner_id: dummyOwnerId,
      tags: payload.tags ?? [],
      icon_name: payload.icon_name ?? null,
      border_color: payload.border_color ?? null,
      folder_id: payload.folder_id ?? null,
    }),
  })
  return handleResponse<ProjectApi>(res)
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  status_id?: string
  tags?: string[]
  icon_name?: string
  border_color?: string
  folder_id?: string | null
}

export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<ProjectApi> {
  const res = await fetch(`${BASE_URL}/v1/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<ProjectApi>(res)
}

export async function archiveProject(id: string): Promise<ProjectApi> {
  return updateProject(id, { status_id: archivedStatusId })
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/v1/projects/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
}
