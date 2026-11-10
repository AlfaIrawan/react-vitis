import { create } from 'zustand'
import { getSession } from './authService'

export const useVitisWorkspace = create<{
  subjectId: string; workspaceId: string; workspaceIds: string[]
  setMemberships: (subjectId: string, workspaceIds: string[]) => void
  select: (workspaceId: string) => void
}>((set, get) => ({
  subjectId: '', workspaceId: '', workspaceIds: [],
  setMemberships: (subjectId, workspaceIds) => set(state => ({ subjectId, workspaceIds,
    workspaceId: state.subjectId === subjectId && workspaceIds.includes(state.workspaceId) ? state.workspaceId : '' })),
  select: workspaceId => {
    if (get().subjectId !== getSession()?.user.id || (workspaceId && !get().workspaceIds.includes(workspaceId))) throw new Error('Select a workspace from your active memberships.')
    set({ workspaceId })
  },
}))

export function requireVitisWorkspace(requested?: string): string {
  const state = useVitisWorkspace.getState()
  const id = requested ?? state.workspaceId
  if (state.subjectId !== getSession()?.user.id || !id || !state.workspaceIds.includes(id)) {
    throw new Error('Select an authorized workspace. If none are available, ask an administrator to configure Vitis workspace access.')
  }
  return id
}
