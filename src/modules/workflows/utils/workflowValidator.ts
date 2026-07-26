import type { WorkflowDefinition, WorkflowValidationError, WorkflowValidationResult, WorkflowNodeType, WorkflowReferenceNodeData } from '../types'
import { getWorkflowForReference } from './workflowStorage'

export function validateWorkflow(workflow: WorkflowDefinition): WorkflowValidationResult {
  const errors: WorkflowValidationError[] = []

  // 1. Check for cycles (DAG validation)
  const cycleError = detectCycles(workflow)
  if (cycleError) errors.push(cycleError)

  // 2. Check for minimal happy path: Dataset -> Base Model -> Trainer -> Compute -> Train
  const pathError = validateMinimalPath(workflow)
  if (pathError) errors.push(pathError)

  // 3. Check node count constraints (phase 1: max 1 of each resource type)
  const countErrors = validateNodeCounts(workflow)
  errors.push(...countErrors)

  // 4. Check ordering: Train -> Evaluate -> Register -> Deploy
  const orderErrors = validateStepOrdering(workflow)
  errors.push(...orderErrors)

  // 5. Check for duplicate nodes (same type)
  const duplicateErrors = validateNoDuplicates(workflow)
  errors.push(...duplicateErrors)

  // 6. Validate workflow references
  const referenceErrors = validateWorkflowReferences(workflow)
  errors.push(...referenceErrors)

  return {
    isValid: errors.length === 0,
    errors,
  }
}

function detectCycles(workflow: WorkflowDefinition): WorkflowValidationError | null {
  const visited = new Set<string>()
  const recStack = new Set<string>()
  const nodeMap = new Map(workflow.nodes.map((n) => [n.id, n]))
  const adjList = new Map<string, string[]>()

  // Build adjacency list
  workflow.edges.forEach((edge) => {
    if (!adjList.has(edge.source)) {
      adjList.set(edge.source, [])
    }
    adjList.get(edge.source)!.push(edge.target)
  })

  function hasCycle(nodeId: string): string[] | null {
    if (recStack.has(nodeId)) {
      // Found cycle, trace back
      const cycle: string[] = []
      let current = nodeId
      do {
        cycle.push(current)
        // Find parent in recStack
        for (const [source, targets] of adjList.entries()) {
          if (targets.includes(current) && recStack.has(source)) {
            current = source
            break
          }
        }
      } while (current !== nodeId && cycle.length < workflow.nodes.length)
      return cycle
    }

    if (visited.has(nodeId)) return null

    visited.add(nodeId)
    recStack.add(nodeId)

    const neighbors = adjList.get(nodeId) || []
    for (const neighbor of neighbors) {
      const cycle = hasCycle(neighbor)
      if (cycle) return cycle
    }

    recStack.delete(nodeId)
    return null
  }

  for (const node of workflow.nodes) {
    if (!visited.has(node.id)) {
      const cycle = hasCycle(node.id)
      if (cycle) {
        const cycleEdges = workflow.edges.filter(
          (e) => cycle.includes(e.source) && cycle.includes(e.target)
        )
        return {
          type: 'cycle',
          message: `Workflow contains a cycle: ${cycle.join(' -> ')}`,
          nodeIds: cycle,
          edgeIds: cycleEdges.map((e) => e.id),
        }
      }
    }
  }

  return null
}

function validateMinimalPath(workflow: WorkflowDefinition): WorkflowValidationError | null {
  const requiredTypes: WorkflowNodeType[] = ['dataset', 'base-model', 'trainer', 'compute', 'train-step']
  const nodeTypeMap = new Map<string, WorkflowNodeType>()
  
  workflow.nodes.forEach((node) => {
    const nodeType = node.data.type
    nodeTypeMap.set(node.id, nodeType)
  })

  // Find nodes of each required type
  const typeNodes = new Map<WorkflowNodeType, string[]>()
  requiredTypes.forEach((type) => {
    typeNodes.set(
      type,
      workflow.nodes.filter((n) => n.data.type === type).map((n) => n.id)
    )
  })

  // Check if all required types exist
  const missingTypes: WorkflowNodeType[] = []
  requiredTypes.forEach((type) => {
    if (typeNodes.get(type)!.length === 0) {
      missingTypes.push(type)
    }
  })

  if (missingTypes.length > 0) {
    return {
      type: 'missing-path',
      message: `Missing required nodes: ${missingTypes.join(', ')}`,
      nodeIds: [],
    }
  }

  // Check if there's a path from dataset -> base-model -> trainer -> compute -> train
  const datasetNodes = typeNodes.get('dataset')!
  const trainNodes = typeNodes.get('train-step')!

  // Build reverse adjacency list (target -> sources)
  const reverseAdj = new Map<string, string[]>()
  workflow.edges.forEach((edge) => {
    if (!reverseAdj.has(edge.target)) {
      reverseAdj.set(edge.target, [])
    }
    reverseAdj.get(edge.target)!.push(edge.source)
  })

  // BFS from train nodes backwards to find if we can reach dataset
  let foundPath = false
  for (const trainNode of trainNodes) {
    const queue = [trainNode]
    const visited = new Set<string>()
    visited.add(trainNode)

    while (queue.length > 0) {
      const current = queue.shift()!
      const currentType = nodeTypeMap.get(current)

      if (currentType === 'dataset') {
        foundPath = true
        break
      }

      const parents = reverseAdj.get(current) || []
      for (const parent of parents) {
        if (!visited.has(parent)) {
          visited.add(parent)
          queue.push(parent)
        }
      }
    }

    if (foundPath) break
  }

  if (!foundPath) {
    return {
      type: 'missing-path',
      message: 'No valid path from Dataset to Train step found',
      nodeIds: [],
    }
  }

  return null
}

function validateNodeCounts(workflow: WorkflowDefinition): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = []
  const resourceTypes: WorkflowNodeType[] = ['dataset', 'base-model', 'trainer', 'compute']
  const stepTypes: WorkflowNodeType[] = ['train-step']

  const counts = new Map<WorkflowNodeType, number>()
  workflow.nodes.forEach((node) => {
    const type = node.data.type
    counts.set(type, (counts.get(type) || 0) + 1)
  })

  // Phase 1: Only 1 of each resource type allowed
  resourceTypes.forEach((type) => {
    const count = counts.get(type) || 0
    if (count > 1) {
      const duplicateNodes = workflow.nodes.filter((n) => n.data.type === type).map((n) => n.id)
      errors.push({
        type: 'duplicate-node',
        message: `Only one ${type} node allowed (found ${count})`,
        nodeIds: duplicateNodes,
      })
    }
  })

  // Phase 1: Only 1 train step allowed
  stepTypes.forEach((type) => {
    const count = counts.get(type) || 0
    if (count > 1) {
      const duplicateNodes = workflow.nodes.filter((n) => n.data.type === type).map((n) => n.id)
      errors.push({
        type: 'duplicate-node',
        message: `Only one ${type} node allowed (found ${count})`,
        nodeIds: duplicateNodes,
      })
    }
  })

  return errors
}

function validateStepOrdering(workflow: WorkflowDefinition): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = []
  const adjList = new Map<string, string[]>()
  
  workflow.edges.forEach((edge) => {
    if (!adjList.has(edge.source)) {
      adjList.set(edge.source, [])
    }
    adjList.get(edge.source)!.push(edge.target)
  })

  const nodeTypeMap = new Map<string, WorkflowNodeType>()
  workflow.nodes.forEach((node) => {
    nodeTypeMap.set(node.id, node.data.type)
  })

  // Expected order: train-step -> evaluate-step -> register-step -> deploy-step
  const order: WorkflowNodeType[] = ['train-step', 'evaluate-step', 'register-step', 'deploy-step']
  
  // Find all nodes of these types
  const typeNodes = new Map<WorkflowNodeType, string[]>()
  order.forEach((type) => {
    typeNodes.set(
      type,
      workflow.nodes.filter((n) => n.data.type === type).map((n) => n.id)
    )
  })

  // Check if evaluate exists, train must come before it
  const evaluateNodes = typeNodes.get('evaluate-step') || []
  if (evaluateNodes.length > 0) {
    const trainNodes = typeNodes.get('train-step') || []
    if (trainNodes.length === 0) {
      errors.push({
        type: 'invalid-order',
        message: 'Evaluate step requires Train step before it',
        nodeIds: evaluateNodes,
      })
    } else {
      // Check if train is reachable from evaluate (backwards)
      const reverseAdj = new Map<string, string[]>()
      workflow.edges.forEach((edge) => {
        if (!reverseAdj.has(edge.target)) {
          reverseAdj.set(edge.target, [])
        }
        reverseAdj.get(edge.target)!.push(edge.source)
      })

      for (const evalNode of evaluateNodes) {
        let foundTrain = false
        const queue = [evalNode]
        const visited = new Set<string>()
        visited.add(evalNode)

        while (queue.length > 0) {
          const current = queue.shift()!
          if (nodeTypeMap.get(current) === 'train-step') {
            foundTrain = true
            break
          }
          const parents = reverseAdj.get(current) || []
          for (const parent of parents) {
            if (!visited.has(parent)) {
              visited.add(parent)
              queue.push(parent)
            }
          }
        }

        if (!foundTrain) {
          errors.push({
            type: 'invalid-order',
            message: 'Evaluate step must come after Train step',
            nodeIds: [evalNode],
          })
        }
      }
    }
  }

  // Similar checks for register and deploy
  const registerNodes = typeNodes.get('register-step') || []
  if (registerNodes.length > 0) {
    const evaluateNodes = typeNodes.get('evaluate-step') || []
    if (evaluateNodes.length === 0) {
      errors.push({
        type: 'invalid-order',
        message: 'Register step requires Evaluate step before it',
        nodeIds: registerNodes,
      })
    }
  }

  const deployNodes = typeNodes.get('deploy-step') || []
  if (deployNodes.length > 0) {
    const registerNodes = typeNodes.get('register-step') || []
    if (registerNodes.length === 0) {
      errors.push({
        type: 'invalid-order',
        message: 'Deploy step requires Register step before it',
        nodeIds: deployNodes,
      })
    }
  }

  return errors
}

function validateNoDuplicates(workflow: WorkflowDefinition): WorkflowValidationError[] {
  // This is already handled by validateNodeCounts for phase 1
  // But we can add more specific duplicate checks here if needed
  return []
}

function validateWorkflowReferences(workflow: WorkflowDefinition): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = []
  const referenceNodes = workflow.nodes.filter(
    (n) => n.data.type === 'workflow-reference'
  ) as Array<{ id: string; data: WorkflowReferenceNodeData }>

  for (const node of referenceNodes) {
    const { referencedProjectId, referencedWorkflowId, referencedVersion } = node.data

    // Check if referenced workflow exists and is published
    if (referencedProjectId && referencedWorkflowId) {
      const referenced = getWorkflowForReference(referencedProjectId, referencedWorkflowId)
      
      if (!referenced) {
        errors.push({
          type: 'invalid-reference',
          message: `Referenced workflow not found: ${referencedWorkflowId} in project ${referencedProjectId}`,
          nodeIds: [node.id],
        })
      } else if (referenced.status !== 'published') {
        errors.push({
          type: 'invalid-reference',
          message: `Cannot reference draft workflow. Only published workflows can be referenced.`,
          nodeIds: [node.id],
        })
      } else if (referencedVersion && referenced.version !== referencedVersion) {
        errors.push({
          type: 'invalid-reference',
          message: `Referenced workflow version mismatch. Expected v${referencedVersion}, found v${referenced.version}`,
          nodeIds: [node.id],
        })
      }

      // Check for cross-workflow cycles (simplified for Phase 1)
      // In Phase 2, this would do deep cycle detection across workflows
      if (referenced && referenced.ownerProjectId === workflow.ownerProjectId) {
        // Same project - check for direct self-reference
        if (referenced.id === workflow.id) {
          errors.push({
            type: 'reference-cycle',
            message: 'Workflow cannot reference itself',
            nodeIds: [node.id],
          })
        }
      }
    } else {
      errors.push({
        type: 'invalid-reference',
        message: 'Workflow reference node missing required project or workflow ID',
        nodeIds: [node.id],
      })
    }
  }

  return errors
}
