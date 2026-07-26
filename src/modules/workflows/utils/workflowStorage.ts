import type { WorkflowDefinition } from '../types'

const STORAGE_PREFIX = 'vitis_workflows_'

function getStorageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId}`
}

export function getAllWorkflows(projectId: string): WorkflowDefinition[] {
  try {
    const key = getStorageKey(projectId)
    const stored = localStorage.getItem(key)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('[workflowStorage] Failed to get workflows:', error)
    return []
  }
}

export function getWorkflow(projectId: string, workflowId: string): WorkflowDefinition | null {
  const workflows = getAllWorkflows(projectId)
  return workflows.find((w) => w.id === workflowId) || null
}

export function createWorkflow(projectId: string, workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'ownerProjectId'>): WorkflowDefinition {
  const workflows = getAllWorkflows(projectId)
  const now = new Date().toISOString()
  const newWorkflow: WorkflowDefinition = {
    ...workflow,
    ownerProjectId: projectId, // Always set owner to current project
    id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    version: 1,
    createdAt: now,
    updatedAt: now,
  }
  workflows.push(newWorkflow)
  saveWorkflows(projectId, workflows)
  return newWorkflow
}

export function updateWorkflow(
  projectId: string,
  workflowId: string,
  updates: Partial<Omit<WorkflowDefinition, 'id' | 'ownerProjectId' | 'createdAt' | 'version'>>
): WorkflowDefinition | null {
  const workflows = getAllWorkflows(projectId)
  const index = workflows.findIndex((w) => w.id === workflowId)
  if (index === -1) return null

  const existing = workflows[index]
  
  // Only allow editing if user owns the workflow
  if (existing.ownerProjectId !== projectId) {
    console.error('[workflowStorage] Cannot edit workflow owned by another project')
    return null
  }

  const updated: WorkflowDefinition = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  // If publishing, bump version
  if (updates.status === 'published' && existing.status === 'draft') {
    updated.version = existing.version + 1
  }

  workflows[index] = updated
  saveWorkflows(projectId, workflows)
  return updated
}

export function deleteWorkflow(projectId: string, workflowId: string): boolean {
  const workflows = getAllWorkflows(projectId)
  const workflow = workflows.find((w) => w.id === workflowId)
  
  // Only allow deletion if user owns the workflow
  if (!workflow || workflow.ownerProjectId !== projectId) {
    console.error('[workflowStorage] Cannot delete workflow owned by another project')
    return false
  }

  const filtered = workflows.filter((w) => w.id !== workflowId)
  if (filtered.length === workflows.length) return false
  saveWorkflows(projectId, filtered)
  return true
}

export function duplicateWorkflow(projectId: string, workflowId: string): WorkflowDefinition | null {
  const workflow = getWorkflow(projectId, workflowId)
  if (!workflow) return null

  const now = new Date().toISOString()
  const duplicated: WorkflowDefinition = {
    ...workflow,
    id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${workflow.name} (Copy)`,
    version: 1,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    // Deep clone nodes and edges to avoid reference issues
    nodes: workflow.nodes.map((node) => ({
      ...node,
      id: `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    })),
    edges: workflow.edges.map((edge) => ({
      ...edge,
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: workflow.nodes.find((n) => n.id === edge.source)?.id || edge.source,
      target: workflow.nodes.find((n) => n.id === edge.target)?.id || edge.target,
    })),
  }

  const workflows = getAllWorkflows(projectId)
  workflows.push(duplicated)
  saveWorkflows(projectId, workflows)
  return duplicated
}

function saveWorkflows(projectId: string, workflows: WorkflowDefinition[]): void {
  try {
    const key = getStorageKey(projectId)
    localStorage.setItem(key, JSON.stringify(workflows))
  } catch (error) {
    console.error('[workflowStorage] Failed to save workflows:', error)
  }
}

// Get workflows owned by a project (for cross-project reference loading)
export function getWorkflowsByOwner(ownerProjectId: string): WorkflowDefinition[] {
  try {
    const key = getStorageKey(ownerProjectId)
    const stored = localStorage.getItem(key)
    if (!stored) return []
    const all = JSON.parse(stored)
    // Return only workflows owned by this project
    return all.filter((w: WorkflowDefinition) => w.ownerProjectId === ownerProjectId)
  } catch (error) {
    console.error('[workflowStorage] Failed to get workflows by owner:', error)
    return []
  }
}

// Get referenced workflows (cross-project, read-only)
export function getReferencedWorkflows(currentProjectId: string): WorkflowDefinition[] {
  const referenced: WorkflowDefinition[] = []
  
  // Get all projects from localStorage (simple approach for Phase 1)
  // In real app, this would query all projects
  try {
    // Scan localStorage for all workflow keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const projectId = key.replace(STORAGE_PREFIX, '')
        if (projectId !== currentProjectId) {
          // Get published workflows from other projects
          const workflows = getWorkflowsByOwner(projectId)
          const published = workflows.filter((w) => w.status === 'published')
          referenced.push(...published)
        }
      }
    }
  } catch (error) {
    console.error('[workflowStorage] Failed to get referenced workflows:', error)
  }
  
  return referenced
}

// Get a specific workflow for reference (cross-project, read-only)
export function getWorkflowForReference(ownerProjectId: string, workflowId: string): WorkflowDefinition | null {
  const workflows = getWorkflowsByOwner(ownerProjectId)
  const workflow = workflows.find((w) => w.id === workflowId)
  // Only return published workflows for reference
  if (workflow && workflow.status === 'published') {
    return workflow
  }
  return null
}

export function seedDefaultWorkflow(projectId: string): WorkflowDefinition | null {
  const workflows = getAllWorkflows(projectId)
  if (workflows.length > 0) return null // Already has workflows

  const now = new Date().toISOString()
  const defaultWorkflow: WorkflowDefinition = {
    id: `wf_default_${Date.now()}`,
    ownerProjectId: projectId,
    groupId: undefined, // Ungrouped by default
    name: 'Default Training Pipeline',
    version: 1,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    nodes: [
      {
        id: 'dataset_1',
        type: 'custom',
        position: { x: 100, y: 100 },
        data: { type: 'dataset', datasetId: '', label: 'Dataset' },
      },
      {
        id: 'base-model_1',
        type: 'custom',
        position: { x: 300, y: 100 },
        data: { type: 'base-model', baseModelId: '', label: 'Base Model' },
      },
      {
        id: 'trainer_1',
        type: 'custom',
        position: { x: 500, y: 100 },
        data: { type: 'trainer', trainerId: '', label: 'Trainer' },
      },
      {
        id: 'compute_1',
        type: 'custom',
        position: { x: 700, y: 100 },
        data: { type: 'compute', computeId: '', label: 'Compute' },
      },
      {
        id: 'train-step_1',
        type: 'custom',
        position: { x: 900, y: 100 },
        data: { type: 'train-step', hyperparams: {}, label: 'Train' },
      },
      {
        id: 'evaluate-step_1',
        type: 'custom',
        position: { x: 1100, y: 100 },
        data: { type: 'evaluate-step', metrics: [], label: 'Evaluate' },
      },
      {
        id: 'register-step_1',
        type: 'custom',
        position: { x: 1300, y: 100 },
        data: { type: 'register-step', modelNameTemplate: 'model-{version}', label: 'Register Model' },
      },
    ],
    edges: [
      { id: 'e1', source: 'dataset_1', target: 'base-model_1' },
      { id: 'e2', source: 'base-model_1', target: 'trainer_1' },
      { id: 'e3', source: 'trainer_1', target: 'compute_1' },
      { id: 'e4', source: 'compute_1', target: 'train-step_1' },
      { id: 'e5', source: 'train-step_1', target: 'evaluate-step_1' },
      { id: 'e6', source: 'evaluate-step_1', target: 'register-step_1' },
    ],
  }

  workflows.push(defaultWorkflow)
  saveWorkflows(projectId, workflows)
  return defaultWorkflow
}

// Seed dummy data for 2 projects with reference relationship
export function seedDummyWorkflowsWithReference(): void {
  // Project A: "Standard NLP Training Pipeline" (Published)
  const projectA = 'project-a-dummy'
  const workflowsA = getAllWorkflows(projectA)
  if (workflowsA.length === 0) {
    const now = new Date().toISOString()
    const standardNLP: WorkflowDefinition = {
      id: `wf_standard_nlp_${Date.now()}`,
      ownerProjectId: projectA,
      groupId: undefined,
      name: 'Global NLP Baseline',
      version: 1,
      status: 'published',
      createdAt: now,
      updatedAt: now,
      nodes: [
        {
          id: 'dataset_1',
          type: 'custom',
          position: { x: 100, y: 100 },
          data: { type: 'dataset', datasetId: '', label: 'NLP Dataset' },
        },
        {
          id: 'base-model_1',
          type: 'custom',
          position: { x: 300, y: 100 },
          data: { type: 'base-model', baseModelId: '', label: 'BERT Base' },
        },
        {
          id: 'trainer_1',
          type: 'custom',
          position: { x: 500, y: 100 },
          data: { type: 'trainer', trainerId: '', label: 'NLP Trainer' },
        },
        {
          id: 'compute_1',
          type: 'custom',
          position: { x: 700, y: 100 },
          data: { type: 'compute', computeId: '', label: 'GPU Compute' },
        },
        {
          id: 'train-step_1',
          type: 'custom',
          position: { x: 900, y: 100 },
          data: { type: 'train-step', hyperparams: {}, label: 'Train' },
        },
        {
          id: 'evaluate-step_1',
          type: 'custom',
          position: { x: 1100, y: 100 },
          data: { type: 'evaluate-step', metrics: [], label: 'Evaluate' },
        },
        {
          id: 'register-step_1',
          type: 'custom',
          position: { x: 1300, y: 100 },
          data: { type: 'register-step', modelNameTemplate: 'nlp-model-{version}', label: 'Register Model' },
        },
      ],
      edges: [
        { id: 'e1', source: 'dataset_1', target: 'base-model_1' },
        { id: 'e2', source: 'base-model_1', target: 'trainer_1' },
        { id: 'e3', source: 'trainer_1', target: 'compute_1' },
        { id: 'e4', source: 'compute_1', target: 'train-step_1' },
        { id: 'e5', source: 'train-step_1', target: 'evaluate-step_1' },
        { id: 'e6', source: 'evaluate-step_1', target: 'register-step_1' },
      ],
    }
    workflowsA.push(standardNLP)
    saveWorkflows(projectA, workflowsA)
  }

  // Project B: Multiple workflows with groups
  const projectB = 'project-b-dummy'
  const workflowsB = getAllWorkflows(projectB)
  if (workflowsB.length === 0) {
    // Seed groups first
    const { seedDummyGroups } = require('./workflowGroupStorage')
    seedDummyGroups(projectB)
    const groups = require('./workflowGroupStorage').getAllGroups(projectB)
    const standardGroup = groups.find((g: any) => g.name === 'Standard Pipelines')
    const experimentalGroup = groups.find((g: any) => g.name === 'Experimental')

    const now = new Date().toISOString()
    
    // Standard NLP Training - in Standard Pipelines group
    const standardNLP: WorkflowDefinition = {
      id: `wf_standard_nlp_${Date.now()}`,
      ownerProjectId: projectB,
      groupId: standardGroup?.id,
      name: 'Standard NLP Training',
      version: 1,
      status: 'published',
      createdAt: now,
      updatedAt: now,
      nodes: [
        {
          id: 'dataset_1',
          type: 'custom',
          position: { x: 100, y: 100 },
          data: { type: 'dataset', datasetId: '', label: 'NLP Dataset' },
        },
        {
          id: 'base-model_1',
          type: 'custom',
          position: { x: 300, y: 100 },
          data: { type: 'base-model', baseModelId: '', label: 'BERT Base' },
        },
        {
          id: 'trainer_1',
          type: 'custom',
          position: { x: 500, y: 100 },
          data: { type: 'trainer', trainerId: '', label: 'NLP Trainer' },
        },
        {
          id: 'compute_1',
          type: 'custom',
          position: { x: 700, y: 100 },
          data: { type: 'compute', computeId: '', label: 'GPU Compute' },
        },
        {
          id: 'train-step_1',
          type: 'custom',
          position: { x: 900, y: 100 },
          data: { type: 'train-step', hyperparams: {}, label: 'Train' },
        },
        {
          id: 'evaluate-step_1',
          type: 'custom',
          position: { x: 1100, y: 100 },
          data: { type: 'evaluate-step', metrics: [], label: 'Evaluate' },
        },
        {
          id: 'register-step_1',
          type: 'custom',
          position: { x: 1300, y: 100 },
          data: { type: 'register-step', modelNameTemplate: 'nlp-model-{version}', label: 'Register Model' },
        },
      ],
      edges: [
        { id: 'e1', source: 'dataset_1', target: 'base-model_1' },
        { id: 'e2', source: 'base-model_1', target: 'trainer_1' },
        { id: 'e3', source: 'trainer_1', target: 'compute_1' },
        { id: 'e4', source: 'compute_1', target: 'train-step_1' },
        { id: 'e5', source: 'train-step_1', target: 'evaluate-step_1' },
        { id: 'e6', source: 'evaluate-step_1', target: 'register-step_1' },
      ],
    }

    // Standard CV Training - in Standard Pipelines group
    const standardCV: WorkflowDefinition = {
      id: `wf_standard_cv_${Date.now()}`,
      ownerProjectId: projectB,
      groupId: standardGroup?.id,
      name: 'Standard CV Training',
      version: 1,
      status: 'published',
      createdAt: now,
      updatedAt: now,
      nodes: [
        {
          id: 'dataset_1',
          type: 'custom',
          position: { x: 100, y: 100 },
          data: { type: 'dataset', datasetId: '', label: 'CV Dataset' },
        },
        {
          id: 'base-model_1',
          type: 'custom',
          position: { x: 300, y: 100 },
          data: { type: 'base-model', baseModelId: '', label: 'ResNet Base' },
        },
        {
          id: 'trainer_1',
          type: 'custom',
          position: { x: 500, y: 100 },
          data: { type: 'trainer', trainerId: '', label: 'CV Trainer' },
        },
        {
          id: 'compute_1',
          type: 'custom',
          position: { x: 700, y: 100 },
          data: { type: 'compute', computeId: '', label: 'GPU Compute' },
        },
        {
          id: 'train-step_1',
          type: 'custom',
          position: { x: 900, y: 100 },
          data: { type: 'train-step', hyperparams: {}, label: 'Train' },
        },
      ],
      edges: [
        { id: 'e1', source: 'dataset_1', target: 'base-model_1' },
        { id: 'e2', source: 'base-model_1', target: 'trainer_1' },
        { id: 'e3', source: 'trainer_1', target: 'compute_1' },
        { id: 'e4', source: 'compute_1', target: 'train-step_1' },
      ],
    }

    // Sentiment Experiment v1 - in Experimental group
    const sentimentPipeline: WorkflowDefinition = {
      id: `wf_sentiment_${Date.now()}`,
      ownerProjectId: projectB,
      groupId: experimentalGroup?.id,
      name: 'Sentiment Experiment v1',
      version: 1,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      nodes: [
        {
          id: 'dataset_1',
          type: 'custom',
          position: { x: 100, y: 100 },
          data: { type: 'dataset', datasetId: '', label: 'Sentiment Dataset' },
        },
        {
          id: 'workflow-ref_1',
          type: 'custom',
          position: { x: 300, y: 100 },
          data: {
            type: 'workflow-reference',
            referencedProjectId: projectA,
            referencedWorkflowId: workflowsA[0]?.id || `wf_standard_nlp_${Date.now()}`,
            referencedVersion: 1,
            displayName: 'Standard NLP Training Pipeline',
            label: 'Standard NLP Pipeline',
          },
        },
        {
          id: 'evaluate-step_1',
          type: 'custom',
          position: { x: 500, y: 100 },
          data: { type: 'evaluate-step', metrics: ['accuracy', 'f1'], label: 'Evaluate Sentiment' },
        },
      ],
      edges: [
        { id: 'e1', source: 'dataset_1', target: 'workflow-ref_1' },
        { id: 'e2', source: 'workflow-ref_1', target: 'evaluate-step_1' },
      ],
      referencedWorkflows: [
        {
          projectId: projectA,
          workflowId: workflowsA[0]?.id || `wf_standard_nlp_${Date.now()}`,
          version: 1,
        },
      ],
    }

    // Quick Test Pipeline - ungrouped
    const quickTest: WorkflowDefinition = {
      id: `wf_quick_test_${Date.now()}`,
      ownerProjectId: projectB,
      groupId: undefined,
      name: 'Quick Test Pipeline',
      version: 1,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      nodes: [
        {
          id: 'dataset_1',
          type: 'custom',
          position: { x: 100, y: 100 },
          data: { type: 'dataset', datasetId: '', label: 'Test Dataset' },
        },
        {
          id: 'train-step_1',
          type: 'custom',
          position: { x: 300, y: 100 },
          data: { type: 'train-step', hyperparams: {}, label: 'Train' },
        },
      ],
      edges: [
        { id: 'e1', source: 'dataset_1', target: 'train-step_1' },
      ],
    }

    workflowsB.push(standardNLP, standardCV, sentimentPipeline, quickTest)
    saveWorkflows(projectB, workflowsB)
  }
}

// Assign workflow to group
export function assignWorkflowToGroup(
  projectId: string,
  workflowId: string,
  groupId: string | undefined
): boolean {
  const workflows = getAllWorkflows(projectId)
  const index = workflows.findIndex((w) => w.id === workflowId)
  if (index === -1) return false

  const workflow = workflows[index]
  if (workflow.ownerProjectId !== projectId) return false // Only owner can assign

  workflows[index] = {
    ...workflow,
    groupId,
    updatedAt: new Date().toISOString(),
  }
  saveWorkflows(projectId, workflows)
  return true
}
