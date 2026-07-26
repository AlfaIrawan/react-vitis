import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Save, CheckCircle2, AlertCircle, Copy, Download, Upload, Play, ArrowLeft, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/toast'
import { notifyEvent } from '@/lib/api/notificationApi'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { WorkflowNode } from '../components/WorkflowNode'
import { NodeCatalogPalette } from '../components/NodeCatalogPalette'
import { NodeInspector } from '../components/NodeInspector'
import type { CatalogNode } from '../catalog/nodeCatalog'
import type { CatalogNodeData } from '../types'
import { validateWorkflow } from '../utils/workflowValidator'
import {
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  getWorkflowForReference,
  getReferencedWorkflows,
  type WorkflowDefinition,
} from '../utils/workflowStorage'
import { getGroup } from '../utils/workflowGroupStorage'
import type { WorkflowNodeData, WorkflowNode as WorkflowNodeType } from '../types'
import { cn } from '@/lib/utils'

const nodeTypes = {
  custom: WorkflowNode,
}

export function WorkflowBuilderPage() {
  const { projectId, workflowId } = useParams<{ projectId: string; workflowId: string }>()
  const searchParams = new URLSearchParams(window.location.search)
  const isReference = searchParams.get('reference') === 'true'
  const { activeProjectId } = useActiveProjectStore()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  const projectIdToUse = projectId || activeProjectId
  const isNew = workflowId === 'new'
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null)
  const [workflowName, setWorkflowName] = useState('')
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeType | null>(null)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [workflowGroup, setWorkflowGroup] = useState<{ name: string } | null>(null)

  // Load workflow
  useEffect(() => {
    if (!projectIdToUse) return

    if (isNew) {
      setWorkflowName('Untitled Workflow')
      setNodes([])
      setEdges([])
      setIsReadOnly(false)
    } else if (workflowId) {
      let loaded: WorkflowDefinition | null = null
      
      // Try to load from current project first
      loaded = getWorkflow(projectIdToUse, workflowId)
      
      // If not found and viewing as reference, try to load from owner project
      if (!loaded && isReference) {
        // For reference, we need owner project ID from URL or search params
        // For now, try to find it by scanning (simplified for Phase 1)
        // In real app, this would come from route params
        const allReferenced = getReferencedWorkflows(projectIdToUse)
        loaded = allReferenced.find((w) => w.id === workflowId) || null
      }
      
      if (loaded) {
        setWorkflow(loaded)
        setWorkflowName(loaded.name)
        setNodes(loaded.nodes as any)
        setEdges(loaded.edges)
        // Check if this is a referenced workflow (read-only)
        const isReferenced = isReference || (loaded.ownerProjectId !== projectIdToUse)
        setIsReadOnly(isReferenced)
        // Load group info if workflow is in a group
        if (loaded.groupId && !isReferenced) {
          const group = getGroup(projectIdToUse, loaded.groupId)
          if (group) {
            setWorkflowGroup({ name: group.name })
          }
        } else {
          setWorkflowGroup(null)
        }
      } else {
        addToast({ title: 'Error', description: 'Workflow not found', variant: 'error' })
        navigate(`/projects/${projectIdToUse}/workflows`)
      }
    }
  }, [projectIdToUse, workflowId, isNew, isReference, navigate, addToast])

  // Validate on change
  useEffect(() => {
    if (!projectIdToUse || nodes.length === 0) {
      setValidationResult(null)
      return
    }

    const tempWorkflow: WorkflowDefinition = {
      id: workflow?.id || 'temp',
      projectId: projectIdToUse,
      name: workflowName,
      version: workflow?.version || 1,
      status: workflow?.status || 'draft',
      nodes: nodes as any,
      edges,
      createdAt: workflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = validateWorkflow(tempWorkflow)
    setValidationResult(result)
  }, [nodes, edges, projectIdToUse, workflowName, workflow])

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowInstance || !reactFlowWrapper.current) return

      const dataStr = event.dataTransfer.getData('application/reactflow')
      if (!dataStr) return

      let nodeData: WorkflowNodeData
      let nodeId: string
      let label: string

      try {
        const parsed = JSON.parse(dataStr)
        if (parsed.type === 'catalog') {
          // Catalog node
          const { getNodeById } = require('../catalog/nodeCatalog')
          const catalogNode = getNodeById(parsed.catalogNodeId)
          if (!catalogNode) return

          nodeId = `${parsed.catalogNodeId}_${Date.now()}`
          label = catalogNode.name
          nodeData = {
            type: parsed.catalogNodeId,
            catalogNodeId: parsed.catalogNodeId,
            label: catalogNode.name,
            config: catalogNode.configSchema.type === 'form' ? {} : { code: '' },
          } as CatalogNodeData
        } else {
          // Legacy node type
          const type = parsed.nodeType || dataStr
          nodeId = `${type}_${Date.now()}`
          label = type.replace('-', ' ')
          nodeData = {
            type: type as any,
            label,
          } as WorkflowNodeData
        }
      } catch {
        // Fallback to legacy format
        const type = dataStr
        nodeId = `${type}_${Date.now()}`
        label = type.replace('-', ' ')
        nodeData = {
          type: type as any,
          label,
        } as WorkflowNodeData
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: WorkflowNodeType = {
        id: nodeId,
        type: 'custom',
        position,
        data: nodeData,
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes]
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
    setSelectedNode(node as WorkflowNodeType)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node))
      )
      if (selectedNode?.id === nodeId) {
        setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...data } } as WorkflowNodeType)
      }
    },
    [setNodes, selectedNode]
  )

  const handleSaveDraft = useCallback(() => {
    if (!projectIdToUse || !workflowName.trim()) {
      addToast({ title: 'Error', description: 'Workflow name is required', variant: 'error' })
      return
    }

    const workflowData: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      projectId: projectIdToUse,
      name: workflowName.trim(),
      status: 'draft',
      nodes: nodes as any,
      edges,
    }

    if (isNew || !workflow) {
      const created = createWorkflow(projectIdToUse, workflowData)
      addToast({ title: 'Success', description: 'Workflow saved as draft', variant: 'success' })
      notifyEvent({ type_code: 'project', title: 'Workflow disimpan', body: `"${workflowName.trim()}" disimpan sebagai draft.` })
      navigate(`/projects/${projectIdToUse}/workflows/${created.id}`)
    } else {
      updateWorkflow(projectIdToUse, workflow.id, workflowData)
      addToast({ title: 'Success', description: 'Workflow saved as draft', variant: 'success' })
      notifyEvent({ type_code: 'project', title: 'Workflow disimpan', body: `"${workflowName.trim()}" disimpan sebagai draft.` })
      setWorkflow(getWorkflow(projectIdToUse, workflow.id))
    }
  }, [projectIdToUse, workflowName, nodes, edges, isNew, workflow, navigate, addToast])

  const handlePublish = useCallback(() => {
    if (!projectIdToUse || !workflowName.trim()) {
      addToast({ title: 'Error', description: 'Workflow name is required', variant: 'error' })
      return
    }

    if (validationResult && !validationResult.isValid) {
      addToast({
        title: 'Validation Error',
        description: 'Please fix validation errors before publishing',
        variant: 'error',
      })
      return
    }

    const workflowData: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      projectId: projectIdToUse,
      name: workflowName.trim(),
      status: 'published',
      nodes: nodes as any,
      edges,
    }

    if (isNew || !workflow) {
      const created = createWorkflow(projectIdToUse, workflowData)
      addToast({ title: 'Success', description: 'Workflow published', variant: 'success' })
      notifyEvent({ type_code: 'project', title: 'Workflow dipublikasi', body: `"${workflowName.trim()}" telah dipublikasi.` })
      navigate(`/projects/${projectIdToUse}/workflows/${created.id}`)
    } else {
      const updated = updateWorkflow(projectIdToUse, workflow.id, workflowData)
      if (updated) {
        addToast({ title: 'Success', description: 'Workflow published', variant: 'success' })
        notifyEvent({ type_code: 'project', title: 'Workflow dipublikasi', body: `"${workflowName.trim()}" telah dipublikasi.` })
        setWorkflow(updated)
      }
    }
  }, [projectIdToUse, workflowName, nodes, edges, isNew, workflow, validationResult, navigate, addToast])

  const handleExport = useCallback(() => {
    const exportData = {
      name: workflowName,
      nodes,
      edges,
      version: workflow?.version || 1,
      status: workflow?.status || 'draft',
    }
    const json = JSON.stringify(exportData, null, 2)
    navigator.clipboard.writeText(json)
    addToast({ title: 'Success', description: 'Workflow JSON copied to clipboard', variant: 'success' })
  }, [workflowName, nodes, edges, workflow])

  const handleImport = useCallback(() => {
    const json = prompt('Paste workflow JSON:')
    if (!json) return
    try {
      const data = JSON.parse(json)
      if (data.nodes && Array.isArray(data.nodes) && data.edges && Array.isArray(data.edges)) {
        setNodes(data.nodes)
        setEdges(data.edges)
        if (data.name) setWorkflowName(data.name)
        addToast({ title: 'Success', description: 'Workflow imported', variant: 'success' })
        notifyEvent({ type_code: 'project', title: 'Workflow diimpor', body: 'Workflow berhasil diimpor.' })
      } else {
        addToast({ title: 'Error', description: 'Invalid workflow format', variant: 'error' })
      }
    } catch (error) {
      addToast({ title: 'Error', description: 'Invalid JSON', variant: 'error' })
    }
  }, [setNodes, setEdges, addToast])

  const handleDragStart = (event: React.DragEvent, catalogNode: CatalogNode) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: 'catalog',
      catalogNodeId: catalogNode.id,
      nodeType: catalogNode.id,
    }))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Read-only Banner */}
      {isReadOnly && workflow && (
        <div className="glass-card rounded-xl p-3 mb-3 border border-slate-500/20 bg-slate-500/5">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Eye className="w-4 h-4" />
            <span>
              This workflow is owned by <strong>Project {workflow.ownerProjectId}</strong>. You are viewing a referenced workflow (read-only).
            </span>
          </div>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="glass-card rounded-xl p-3 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectIdToUse}/workflows`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Workflow name"
              disabled={isReadOnly}
              className="text-sm font-semibold bg-transparent border-none outline-none w-full disabled:opacity-50"
            />
            {workflowGroup && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Group: {workflowGroup.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {validationResult && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs">
              {validationResult.isValid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600">Valid</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-red-600">{validationResult.errors.length} errors</span>
                </>
              )}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
          {!isReadOnly && (
            <>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Draft
              </Button>
              <Button size="sm" onClick={handlePublish} disabled={validationResult && !validationResult.isValid}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Publish
              </Button>
            </>
          )}
          <Tooltip content="Coming in Phase 2 (Orchestrator)" side="bottom">
            <span className="inline-block">
              <Button variant="outline" size="sm" disabled>
                <Play className="w-3.5 h-3.5 mr-1.5" />
                Run
              </Button>
            </span>
          </Tooltip>
        </div>
      </div>

      {/* Validation Errors Panel */}
      {validationResult && !validationResult.isValid && validationResult.errors.length > 0 && (
        <div className="glass-card rounded-xl p-3 mb-3 border border-red-500/20 bg-red-500/5">
          <div className="text-xs font-semibold text-red-600 mb-2">Validation Errors:</div>
          <div className="space-y-1">
            {validationResult.errors.map((error: any, idx: number) => (
              <div key={idx} className="text-xs text-red-600">
                • {error.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Left: Node Catalog Palette */}
        {!isReadOnly && (
          <div className="flex-shrink-0">
            <NodeCatalogPalette onDragStart={handleDragStart} />
          </div>
        )}

        {/* Center: React Flow Canvas */}
        <div className="flex-1 glass-card rounded-xl overflow-hidden" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={isReadOnly ? undefined : onConnect}
            onInit={setReactFlowInstance}
            onDrop={isReadOnly ? undefined : onDrop}
            onDragOver={isReadOnly ? undefined : onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            nodesDraggable={!isReadOnly}
            nodesConnectable={!isReadOnly}
            elementsSelectable={!isReadOnly}
            fitView
            className="bg-background"
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const type = (node.data as WorkflowNodeData).type
                const colors: Record<string, string> = {
                  dataset: '#3b82f6',
                  'base-model': '#a855f7',
                  trainer: '#6366f1',
                  compute: '#f97316',
                  'train-step': '#10b981',
                  'evaluate-step': '#06b6d4',
                  'register-step': '#ec4899',
                  'deploy-step': '#f59e0b',
                }
                return colors[type] || '#gray'
              }}
            />
          </ReactFlow>
        </div>

        {/* Right: Node Inspector */}
        <div className="flex-shrink-0 w-64">
          <NodeInspector node={selectedNode} onUpdate={isReadOnly ? () => {} : handleNodeUpdate} />
        </div>
      </div>
    </div>
  )
}
