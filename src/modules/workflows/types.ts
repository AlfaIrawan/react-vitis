import { Node, Edge } from 'reactflow'

export type WorkflowStatus = 'draft' | 'published'

export type WorkflowNodeType =
  | 'dataset'
  | 'base-model'
  | 'trainer'
  | 'compute'
  | 'train-step'
  | 'evaluate-step'
  | 'register-step'
  | 'deploy-step'
  | 'workflow-reference'
  | 'sync'
  | 'prepare'
  | 'cleanse'
  | 'distinct'
  | 'split'
  | 'stack'
  | 'join'
  | 'group'
  | 'window'
  | 'top-n'
  | 'pivot'
  | 'filter'
  | 'sort'
  | 'python'
  | 'r'
  | 'shell'
  | 'sql'
  | 'spark-sql'
  | 'pyspark'
  | 'sparkr'

export interface DatasetNodeData {
  type: 'dataset'
  datasetId?: string
  label?: string
}

export interface BaseModelNodeData {
  type: 'base-model'
  baseModelId?: string
  label?: string
}

export interface TrainerNodeData {
  type: 'trainer'
  trainerId?: string
  label?: string
}

export interface ComputeNodeData {
  type: 'compute'
  computeId?: string
  label?: string
}

export interface TrainStepNodeData {
  type: 'train-step'
  hyperparams?: Record<string, any>
  retryPolicy?: {
    maxRetries?: number
    retryDelay?: number
  }
  label?: string
}

export interface EvaluateStepNodeData {
  type: 'evaluate-step'
  metrics?: string[]
  label?: string
}

export interface RegisterStepNodeData {
  type: 'register-step'
  modelNameTemplate?: string
  label?: string
}

export interface DeployStepNodeData {
  type: 'deploy-step'
  environment?: 'staging' | 'prod'
  label?: string
}

export interface WorkflowReferenceNodeData {
  type: 'workflow-reference'
  referencedProjectId: string
  referencedWorkflowId: string
  referencedVersion?: number
  displayName?: string
  label?: string
}

// Catalog node data (from node catalog)
export interface CatalogNodeData {
  type: string // Node ID from catalog
  label?: string
  config?: Record<string, any> // Form values or code content
  catalogNodeId: string // Reference to catalog node definition
}

export type WorkflowNodeData =
  | DatasetNodeData
  | BaseModelNodeData
  | TrainerNodeData
  | ComputeNodeData
  | TrainStepNodeData
  | EvaluateStepNodeData
  | RegisterStepNodeData
  | DeployStepNodeData
  | WorkflowReferenceNodeData
  | CatalogNodeData

export type WorkflowNode = Node<WorkflowNodeData>
export type WorkflowEdge = Edge

export interface WorkflowReference {
  projectId: string
  workflowId: string
  version?: number
}

export interface WorkflowGroup {
  id: string
  projectId: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface WorkflowDefinition {
  id: string
  ownerProjectId: string // Project yang memiliki workflow ini
  groupId?: string // Group yang menampung workflow ini (nullable)
  name: string
  version: number
  status: WorkflowStatus
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  referencedWorkflows?: WorkflowReference[] // Workflows yang direferensikan oleh workflow ini
  createdAt: string
  updatedAt: string
}

export interface WorkflowValidationError {
  type: 'cycle' | 'missing-path' | 'invalid-order' | 'duplicate-node' | 'missing-node' | 'invalid-reference' | 'reference-cycle'
  message: string
  nodeIds?: string[]
  edgeIds?: string[]
}

export interface WorkflowValidationResult {
  isValid: boolean
  errors: WorkflowValidationError[]
}
