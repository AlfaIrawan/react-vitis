import { useState, useEffect } from 'react'
import { Info } from 'lucide-react'
import type { WorkflowNodeData, WorkflowNode, CatalogNodeData } from '../types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CatalogNodeInspector } from './CatalogNodeInspector'

interface NodeInspectorProps {
  node: WorkflowNode | null
  onUpdate: (nodeId: string, data: Partial<WorkflowNodeData>) => void
}

export function NodeInspector({ node, onUpdate }: NodeInspectorProps) {
  if (!node) {
    return (
      <div className="glass-card rounded-xl p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <Info className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-xs text-muted-foreground">Select a node to edit properties</p>
        </div>
      </div>
    )
  }

  const { data } = node

  const handleUpdate = (updates: Partial<WorkflowNodeData>) => {
    onUpdate(node.id, updates)
  }

  // Check if this is a catalog node
  const isCatalogNode = 'catalogNodeId' in data && data.catalogNodeId

  return (
    <div className="glass-card rounded-xl p-4 h-full overflow-y-auto">
      {isCatalogNode ? (
        <CatalogNodeInspector
          nodeData={data as CatalogNodeData}
          onUpdate={(updates) => handleUpdate(updates)}
        />
      ) : (
        <>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-1 capitalize">
              {data.type.replace('-', ' ')}
            </h3>
            <p className="text-xs text-muted-foreground">Node ID: {node.id}</p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="label" className="text-xs">Label</Label>
              <Input
                id="label"
                value={data.label || ''}
                onChange={(e) => handleUpdate({ label: e.target.value })}
                placeholder="Node label"
                className="h-7 text-xs mt-1"
              />
            </div>

        {data.type === 'dataset' && (
          <div>
            <Label htmlFor="datasetId" className="text-xs">Dataset ID</Label>
            <Input
              id="datasetId"
              value={data.datasetId || ''}
              onChange={(e) => handleUpdate({ datasetId: e.target.value })}
              placeholder="Select dataset..."
              className="h-7 text-xs mt-1"
            />
          </div>
        )}

        {data.type === 'base-model' && (
          <div>
            <Label htmlFor="baseModelId" className="text-xs">Base Model ID</Label>
            <Input
              id="baseModelId"
              value={data.baseModelId || ''}
              onChange={(e) => handleUpdate({ baseModelId: e.target.value })}
              placeholder="Select base model..."
              className="h-7 text-xs mt-1"
            />
          </div>
        )}

        {data.type === 'trainer' && (
          <div>
            <Label htmlFor="trainerId" className="text-xs">Trainer ID</Label>
            <Input
              id="trainerId"
              value={data.trainerId || ''}
              onChange={(e) => handleUpdate({ trainerId: e.target.value })}
              placeholder="Select trainer..."
              className="h-7 text-xs mt-1"
            />
          </div>
        )}

        {data.type === 'compute' && (
          <div>
            <Label htmlFor="computeId" className="text-xs">Compute ID</Label>
            <Input
              id="computeId"
              value={data.computeId || ''}
              onChange={(e) => handleUpdate({ computeId: e.target.value })}
              placeholder="Select compute..."
              className="h-7 text-xs mt-1"
            />
          </div>
        )}

        {data.type === 'train-step' && (
          <>
            <div>
              <Label htmlFor="hyperparams" className="text-xs">Hyperparameters (JSON)</Label>
              <Textarea
                id="hyperparams"
                value={JSON.stringify(data.hyperparams || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    handleUpdate({ hyperparams: parsed })
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"learning_rate": 0.001, "epochs": 10}'
                className="h-20 text-xs mt-1 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="maxRetries" className="text-xs">Max Retries</Label>
              <Input
                id="maxRetries"
                type="number"
                value={data.retryPolicy?.maxRetries || 0}
                onChange={(e) =>
                  handleUpdate({
                    retryPolicy: {
                      ...data.retryPolicy,
                      maxRetries: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="h-7 text-xs mt-1"
              />
            </div>
          </>
        )}

        {data.type === 'evaluate-step' && (
          <div>
            <Label htmlFor="metrics" className="text-xs">Metrics (comma-separated)</Label>
            <Input
              id="metrics"
              value={data.metrics?.join(', ') || ''}
              onChange={(e) =>
                handleUpdate({
                  metrics: e.target.value.split(',').map((m) => m.trim()).filter(Boolean),
                })
              }
              placeholder="accuracy, f1, precision"
              className="h-7 text-xs mt-1"
            />
          </div>
        )}

        {data.type === 'register-step' && (
          <div>
            <Label htmlFor="modelNameTemplate" className="text-xs">Model Name Template</Label>
            <Input
              id="modelNameTemplate"
              value={data.modelNameTemplate || ''}
              onChange={(e) => handleUpdate({ modelNameTemplate: e.target.value })}
              placeholder="model-{version}"
              className="h-7 text-xs mt-1"
            />
          </div>
        )}

        {data.type === 'deploy-step' && (
          <div>
            <Label htmlFor="environment" className="text-xs">Environment</Label>
            <select
              id="environment"
              value={data.environment || 'staging'}
              onChange={(e) =>
                handleUpdate({ environment: e.target.value as 'staging' | 'prod' })
              }
              className="w-full h-7 text-xs mt-1 px-2 rounded-md border border-input bg-background"
            >
              <option value="staging">Staging</option>
              <option value="prod">Production</option>
            </select>
          </div>
        )}

        {data.type === 'workflow-reference' && (
          <>
            <div>
              <Label htmlFor="referencedProjectId" className="text-xs">Referenced Project ID</Label>
              <Input
                id="referencedProjectId"
                value={data.referencedProjectId || ''}
                onChange={(e) => handleUpdate({ referencedProjectId: e.target.value })}
                placeholder="project-id"
                className="h-7 text-xs mt-1"
              />
            </div>
            <div>
              <Label htmlFor="referencedWorkflowId" className="text-xs">Referenced Workflow ID</Label>
              <Input
                id="referencedWorkflowId"
                value={data.referencedWorkflowId || ''}
                onChange={(e) => handleUpdate({ referencedWorkflowId: e.target.value })}
                placeholder="workflow-id"
                className="h-7 text-xs mt-1"
              />
            </div>
            <div>
              <Label htmlFor="referencedVersion" className="text-xs">Version (optional)</Label>
              <Input
                id="referencedVersion"
                type="number"
                value={data.referencedVersion || ''}
                onChange={(e) =>
                  handleUpdate({ referencedVersion: parseInt(e.target.value) || undefined })
                }
                placeholder="1"
                className="h-7 text-xs mt-1"
              />
            </div>
            <div className="p-2 rounded bg-muted/30 border border-border/50">
              <p className="text-[10px] text-muted-foreground">
                <strong>Read-only reference:</strong> This node references a workflow from another project. It cannot be edited here.
              </p>
            </div>
          </>
        )}
          </div>
        </>
      )}
    </div>
  )
}
