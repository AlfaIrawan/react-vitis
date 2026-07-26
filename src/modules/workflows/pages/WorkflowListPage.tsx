import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, FileText, ChevronDown, ChevronRight, Folder, Edit2, X } from 'lucide-react'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { ProjectEmptyState } from '@/modules/core-shell/components/ProjectEmptyState'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { useToast } from '@/components/ui/toast'
import { notifyEvent } from '@/lib/api/notificationApi'
import type { WorkflowDefinition, WorkflowGroup } from '../types'
import {
  getAllWorkflows,
  deleteWorkflow,
  duplicateWorkflow,
  seedDefaultWorkflow,
  getReferencedWorkflows,
  seedDummyWorkflowsWithReference,
  assignWorkflowToGroup,
} from '../utils/workflowStorage'
import {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  seedDummyGroups,
} from '../utils/workflowGroupStorage'
import { WorkflowGroupModal } from '../components/WorkflowGroupModal'
import { WorkflowCard } from '../components/WorkflowCard'
import { cn } from '@/lib/utils'

export function WorkflowListPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { activeProjectId, hasActiveProject } = useActiveProjectStore()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [ownedWorkflows, setOwnedWorkflows] = useState<WorkflowDefinition[]>([])
  const [referencedWorkflows, setReferencedWorkflows] = useState<WorkflowDefinition[]>([])
  const [groups, setGroups] = useState<WorkflowGroup[]>([])
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<WorkflowGroup | null>(null)
  const projectIdToUse = projectId || activeProjectId

  // Group workflows by groupId
  const groupedWorkflows = useMemo(() => {
    const grouped = new Map<string, WorkflowDefinition[]>()
    const ungrouped: WorkflowDefinition[] = []

    ownedWorkflows.forEach((workflow) => {
      if (workflow.groupId) {
        if (!grouped.has(workflow.groupId)) {
          grouped.set(workflow.groupId, [])
        }
        grouped.get(workflow.groupId)!.push(workflow)
      } else {
        ungrouped.push(workflow)
      }
    })

    return { grouped, ungrouped }
  }, [ownedWorkflows])

  const loadData = () => {
    if (!projectIdToUse) return
    // Seed groups
    seedDummyGroups(projectIdToUse)
    // Seed default workflow if none exist
    seedDefaultWorkflow(projectIdToUse)
    // Seed dummy workflows with reference relationship (for demo)
    seedDummyWorkflowsWithReference()
    // Get groups
    const allGroups = getAllGroups(projectIdToUse)
    setGroups(allGroups)
    // Get owned workflows
    const all = getAllWorkflows(projectIdToUse)
    const owned = all.filter((w) => w.ownerProjectId === projectIdToUse)
    setOwnedWorkflows(owned)
    // Get referenced workflows
    const referenced = getReferencedWorkflows(projectIdToUse)
    setReferencedWorkflows(referenced)
  }

  useEffect(() => {
    loadData()
  }, [projectIdToUse])

  const handleCreate = () => {
    if (!projectIdToUse) return
    navigate(`/projects/${projectIdToUse}/workflows/new`)
  }

  const handleOpen = (workflowId: string, ownerProjectId?: string) => {
    if (!projectIdToUse) return
    // If viewing referenced workflow, use owner project ID
    if (ownerProjectId && ownerProjectId !== projectIdToUse) {
      navigate(`/projects/${ownerProjectId}/workflows/${workflowId}?reference=true`)
    } else {
      navigate(`/projects/${projectIdToUse}/workflows/${workflowId}`)
    }
  }

  const handleViewJSON = (workflow: WorkflowDefinition) => {
    const json = JSON.stringify(workflow, null, 2)
    navigator.clipboard.writeText(json)
    addToast({ title: 'Success', description: 'Workflow JSON copied to clipboard', variant: 'success' })
  }

  const handleDuplicate = (workflowId: string) => {
    if (!projectIdToUse) return
    const duplicated = duplicateWorkflow(projectIdToUse, workflowId)
    if (duplicated) {
      addToast({ title: 'Success', description: 'Workflow duplicated', variant: 'success' })
      notifyEvent({ type_code: 'project', title: 'Workflow diduplikasi', body: 'Workflow berhasil diduplikasi.' })
      const all = getAllWorkflows(projectIdToUse)
      const owned = all.filter((w) => w.ownerProjectId === projectIdToUse)
      setOwnedWorkflows(owned)
    }
  }

  const handleDelete = (workflowId: string, name: string) => {
    if (!projectIdToUse) return
    if (!window.confirm(`Delete workflow "${name}"?`)) return
    if (deleteWorkflow(projectIdToUse, workflowId)) {
      addToast({ title: 'Success', description: 'Workflow deleted', variant: 'success' })
      notifyEvent({ type_code: 'project', title: 'Workflow dihapus', body: `"${name}" telah dihapus.` })
      loadData()
    }
  }

  const handleCreateGroup = () => {
    setEditingGroup(null)
    setIsGroupModalOpen(true)
  }

  const handleEditGroup = (group: WorkflowGroup) => {
    setEditingGroup(group)
    setIsGroupModalOpen(true)
  }

  const handleSaveGroup = (groupData: WorkflowGroup | Omit<WorkflowGroup, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    if (!projectIdToUse) return
    try {
      if (editingGroup) {
        const updated = updateGroup(projectIdToUse, editingGroup.id, groupData as Partial<WorkflowGroup>)
        if (updated) {
          addToast({ title: 'Success', description: 'Group updated', variant: 'success' })
          notifyEvent({ type_code: 'project', title: 'Workflow group diupdate', body: 'Group workflow berhasil diupdate.' })
          loadData()
        }
      } else {
        const created = createGroup(projectIdToUse, groupData as any)
        addToast({ title: 'Success', description: 'Group created', variant: 'success' })
        notifyEvent({ type_code: 'project', title: 'Workflow group dibuat', body: 'Group workflow berhasil dibuat.' })
        loadData()
      }
      setIsGroupModalOpen(false)
      setEditingGroup(null)
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message || 'Failed to save group', variant: 'error' })
    }
  }

  const handleDeleteGroup = (groupId: string, name: string) => {
    if (!projectIdToUse) return
    if (!window.confirm(`Delete group "${name}"? Workflows in this group will be moved to Ungrouped.`)) return
    if (deleteGroup(projectIdToUse, groupId)) {
      addToast({ title: 'Success', description: 'Group deleted', variant: 'success' })
      notifyEvent({ type_code: 'project', title: 'Workflow group dihapus', body: `Group "${name}" telah dihapus.` })
      loadData()
    }
  }

  const handleToggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleAssignToGroup = (workflowId: string, groupId: string | undefined) => {
    if (!projectIdToUse) return
    if (assignWorkflowToGroup(projectIdToUse, workflowId, groupId)) {
      addToast({ title: 'Success', description: 'Workflow assigned to group', variant: 'success' })
      notifyEvent({ type_code: 'project', title: 'Workflow ditetapkan ke group', body: 'Workflow berhasil ditetapkan ke group.' })
      loadData()
    }
  }


  if (!hasActiveProject() && !projectIdToUse) {
    return <ProjectEmptyState moduleName="Workflow Designer & Orchestration" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflow Designer & Orchestration"
        description="AI-native visual workflow orchestration, execution design, reusable automation flows, decision routing, runtime coordination, and enterprise execution control"
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCreateGroup} disabled={!projectIdToUse}>
              <Folder className="w-4 h-4 mr-2" />
              Create Group
            </Button>
            <Button onClick={handleCreate} disabled={!projectIdToUse}>
              <Plus className="w-4 h-4 mr-2" />
              Create Orchestration Flow
            </Button>
          </div>
        }
      />

      {/* Owned Workflows - Grouped */}
      {ownedWorkflows.length === 0 && referencedWorkflows.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium text-foreground mb-2">No orchestration flows yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Start designing and orchestrating enterprise AI workflows.
          </p>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Orchestration Flow
          </Button>
        </div>
      ) : (
        <>
          {/* Workflow Groups */}
          {Array.from(groupedWorkflows.grouped.entries()).map(([groupId, workflows]) => {
            const group = groups.find((g) => g.id === groupId)
            if (!group) return null
            const isCollapsed = collapsedGroups.has(groupId)
            return (
              <div key={groupId} className="space-y-3">
                <div className="glass-card rounded-xl p-3 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleGroup(groupId)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Folder className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{group.name}</h3>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                          {workflows.length}
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditGroup(group)}
                      className="h-7 w-7"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                      className="h-7 w-7 text-destructive hover:text-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {workflows.map((workflow) => {
                      const group = workflow.groupId ? groups.find((g) => g.id === workflow.groupId) : null
                      return (
                        <WorkflowCard
                          key={workflow.id}
                          workflow={workflow}
                          group={group}
                          onOpen={() => handleOpen(workflow.id)}
                          onDuplicate={() => handleDuplicate(workflow.id)}
                          onDelete={() => handleDelete(workflow.id, workflow.name)}
                          onAssignToGroup={(groupId) => handleAssignToGroup(workflow.id, groupId)}
                          availableGroups={groups}
                          showGroupActions={true}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Ungrouped Workflows */}
          {groupedWorkflows.ungrouped.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Ungrouped Workflows
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedWorkflows.ungrouped.map((workflow) => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    onOpen={() => handleOpen(workflow.id)}
                    onDuplicate={() => handleDuplicate(workflow.id)}
                    onDelete={() => handleDelete(workflow.id, workflow.name)}
                    onAssignToGroup={(groupId) => handleAssignToGroup(workflow.id, groupId)}
                    availableGroups={groups}
                    showGroupActions={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Referenced Workflows Section */}
          {referencedWorkflows.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Referenced Workflows
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {referencedWorkflows.map((workflow) => (
                  <WorkflowCard
                    key={`${workflow.ownerProjectId}-${workflow.id}`}
                    workflow={workflow}
                    isReferenced={true}
                    onOpen={() => handleOpen(workflow.id, workflow.ownerProjectId)}
                    onViewJSON={() => handleViewJSON(workflow)}
                    showGroupActions={false}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Group Modal */}
      <WorkflowGroupModal
        open={isGroupModalOpen}
        onOpenChange={setIsGroupModalOpen}
        group={editingGroup}
        projectId={projectIdToUse || ''}
        onSave={handleSaveGroup}
      />
    </div>
  )
}
