import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Database, Brain, Server, Play, BarChart3, Package, Rocket, Zap, GitBranch, AlertTriangle } from 'lucide-react'
import type { WorkflowNodeData } from '../types'
import { getNodeById, CATEGORY_METADATA } from '../catalog/nodeCatalog'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'

const nodeIcons = {
  dataset: Database,
  'base-model': Brain,
  trainer: Brain,
  compute: Server,
  'train-step': Play,
  'evaluate-step': BarChart3,
  'register-step': Package,
  'deploy-step': Rocket,
  'workflow-reference': GitBranch,
}

const nodeColors = {
  dataset: 'bg-blue-500/20 border-blue-500/50 text-blue-600',
  'base-model': 'bg-purple-500/20 border-purple-500/50 text-purple-600',
  trainer: 'bg-indigo-500/20 border-indigo-500/50 text-indigo-600',
  compute: 'bg-orange-500/20 border-orange-500/50 text-orange-600',
  'train-step': 'bg-green-500/20 border-green-500/50 text-green-600',
  'evaluate-step': 'bg-cyan-500/20 border-cyan-500/50 text-cyan-600',
  'register-step': 'bg-pink-500/20 border-pink-500/50 text-pink-600',
  'deploy-step': 'bg-amber-500/20 border-amber-500/50 text-amber-600',
  'workflow-reference': 'bg-slate-500/20 border-slate-500/50 text-slate-600',
}

interface WorkflowNodeProps extends NodeProps<WorkflowNodeData> {}

export const WorkflowNode = memo(({ data, selected }: WorkflowNodeProps) => {
  // Check if this is a catalog node
  const isCatalogNode = 'catalogNodeId' in data && data.catalogNodeId
  const catalogNode = isCatalogNode ? getNodeById(data.catalogNodeId) : null

  let Icon: React.ComponentType<{ className?: string }>
  let colorClass: string
  let label: string
  let requiresExpertise = false

  if (catalogNode) {
    Icon = catalogNode.icon
    const categoryMeta = CATEGORY_METADATA[catalogNode.category]
    colorClass = categoryMeta.color
    label = data.label || catalogNode.name
    requiresExpertise = catalogNode.requiresExpertise || false
  } else if (data.type in nodeIcons) {
    Icon = nodeIcons[data.type as keyof typeof nodeIcons]
    colorClass = nodeColors[data.type as keyof typeof nodeColors] || 'bg-gray-500/20 border-gray-500/50 text-gray-600'
    label = data.label || data.type.replace('-', ' ')
  } else {
    Icon = Database
    colorClass = 'bg-gray-500/20 border-gray-500/50 text-gray-600'
    label = data.label || 'Unknown'
  }

  return (
    <div
      className={cn(
        'glass-card rounded-lg p-3 min-w-[140px] border-2 transition-all',
        colorClass,
        selected && 'ring-2 ring-primary ring-offset-2 shadow-lg',
        requiresExpertise && 'border-orange-500/70'
      )}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-primary" />
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs font-medium capitalize truncate flex-1">{label}</span>
        {requiresExpertise && (
          <Tooltip content="Requires technical expertise" side="bottom">
            <span className="inline-flex"><AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" /></span>
          </Tooltip>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-primary" />
    </div>
  )
})

WorkflowNode.displayName = 'WorkflowNode'
