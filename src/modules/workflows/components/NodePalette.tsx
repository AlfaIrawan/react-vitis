import { Database, Brain, Server, Play, BarChart3, Package, Rocket, GitBranch } from 'lucide-react'
import type { WorkflowNodeType } from '../types'
import { cn } from '@/lib/utils'

interface NodeTypeInfo {
  type: WorkflowNodeType
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const nodeTypes: NodeTypeInfo[] = [
  { type: 'dataset', label: 'Dataset', icon: Database, color: 'bg-blue-500/20 border-blue-500/50 text-blue-600' },
  { type: 'base-model', label: 'Base Model', icon: Brain, color: 'bg-purple-500/20 border-purple-500/50 text-purple-600' },
  { type: 'trainer', label: 'Trainer', icon: Brain, color: 'bg-indigo-500/20 border-indigo-500/50 text-indigo-600' },
  { type: 'compute', label: 'Compute', icon: Server, color: 'bg-orange-500/20 border-orange-500/50 text-orange-600' },
  { type: 'train-step', label: 'Train Step', icon: Play, color: 'bg-green-500/20 border-green-500/50 text-green-600' },
  { type: 'evaluate-step', label: 'Evaluate Step', icon: BarChart3, color: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-600' },
  { type: 'register-step', label: 'Register Model', icon: Package, color: 'bg-pink-500/20 border-pink-500/50 text-pink-600' },
  { type: 'deploy-step', label: 'Deploy Step', icon: Rocket, color: 'bg-amber-500/20 border-amber-500/50 text-amber-600' },
  { type: 'workflow-reference', label: 'Workflow Reference', icon: GitBranch, color: 'bg-slate-500/20 border-slate-500/50 text-slate-600' },
]

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: WorkflowNodeType) => void
}

export function NodePalette({ onDragStart }: NodePaletteProps) {
  return (
    <div className="glass-card rounded-xl p-3 w-48">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
        Node Types
      </div>
      <div className="space-y-1.5">
        {nodeTypes.map((nodeType) => {
          const Icon = nodeType.icon
          return (
            <div
              key={nodeType.type}
              draggable
              onDragStart={(e) => onDragStart(e, nodeType.type)}
              className={cn(
                'flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing',
                'border border-transparent hover:border-border/50 transition-all',
                'hover:bg-accent/30',
                nodeType.color
              )}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs font-medium">{nodeType.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
