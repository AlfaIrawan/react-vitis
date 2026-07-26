import type { WorkflowGroup } from '../types'

const STORAGE_PREFIX = 'ai_monitor_workflow_groups_'

function getStorageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId}`
}

export function getAllGroups(projectId: string): WorkflowGroup[] {
  try {
    const key = getStorageKey(projectId)
    const stored = localStorage.getItem(key)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('[workflowGroupStorage] Failed to get groups:', error)
    return []
  }
}

export function getGroup(projectId: string, groupId: string): WorkflowGroup | null {
  const groups = getAllGroups(projectId)
  return groups.find((g) => g.id === groupId) || null
}

export function createGroup(
  projectId: string,
  group: Omit<WorkflowGroup, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
): WorkflowGroup {
  const groups = getAllGroups(projectId)
  
  // Check for duplicate name
  if (groups.some((g) => g.name.toLowerCase() === group.name.toLowerCase())) {
    throw new Error('Group name must be unique')
  }

  const now = new Date().toISOString()
  const newGroup: WorkflowGroup = {
    ...group,
    id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    projectId,
    createdAt: now,
    updatedAt: now,
  }
  groups.push(newGroup)
  saveGroups(projectId, groups)
  return newGroup
}

export function updateGroup(
  projectId: string,
  groupId: string,
  updates: Partial<Omit<WorkflowGroup, 'id' | 'projectId' | 'createdAt'>>
): WorkflowGroup | null {
  const groups = getAllGroups(projectId)
  const index = groups.findIndex((g) => g.id === groupId)
  if (index === -1) return null

  // Check for duplicate name (excluding current group)
  if (updates.name) {
    const duplicate = groups.find(
      (g) => g.id !== groupId && g.name.toLowerCase() === updates.name!.toLowerCase()
    )
    if (duplicate) {
      throw new Error('Group name must be unique')
    }
  }

  const existing = groups[index]
  const updated: WorkflowGroup = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  groups[index] = updated
  saveGroups(projectId, groups)
  return updated
}

export function deleteGroup(projectId: string, groupId: string): boolean {
  const groups = getAllGroups(projectId)
  const filtered = groups.filter((g) => g.id !== groupId)
  if (filtered.length === groups.length) return false
  saveGroups(projectId, filtered)
  return true
}

function saveGroups(projectId: string, groups: WorkflowGroup[]): void {
  try {
    const key = getStorageKey(projectId)
    localStorage.setItem(key, JSON.stringify(groups))
  } catch (error) {
    console.error('[workflowGroupStorage] Failed to save groups:', error)
  }
}

// Seed dummy groups for demo
export function seedDummyGroups(projectId: string): void {
  const groups = getAllGroups(projectId)
  if (groups.length > 0) return // Already seeded

  const now = new Date().toISOString()
  const standardGroup: WorkflowGroup = {
    id: `group_standard_${Date.now()}`,
    projectId,
    name: 'Standard Pipelines',
    description: 'Standardized training pipelines for production use',
    createdAt: now,
    updatedAt: now,
  }

  const experimentalGroup: WorkflowGroup = {
    id: `group_experimental_${Date.now()}`,
    projectId,
    name: 'Experimental',
    description: 'Experimental workflows for testing and research',
    createdAt: now,
    updatedAt: now,
  }

  groups.push(standardGroup, experimentalGroup)
  saveGroups(projectId, groups)
}
