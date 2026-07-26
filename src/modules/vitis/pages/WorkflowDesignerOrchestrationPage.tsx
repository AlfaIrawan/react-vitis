import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  BarChart3,
  Bot,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  FlaskConical,
  GitBranch,
  GitMerge,
  History,
  LayoutGrid,
  Network,
  PlayCircle,
  Route,
  Scale,
  Settings,
  ShieldCheck,
  Signal,
  Users,
  Workflow,
  Zap,
} from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { EnterpriseNavIconRail } from '@/components/enterprise/EnterpriseNavIconRail'
import { cn } from '@/lib/utils'
import {
  computeWorkspaceMainPanelViewportHeightPx,
  workspaceAsideClass,
  workspaceNavInnerClass,
  workspaceNavMenuScrollClass,
  workspaceOuterGridClass,
} from '@/lib/workspaceNavLayout'

// --- Static data ------------------------------------------------------------------

const kpiCards = [
  {
    id: 'active-workflows',
    label: 'Active Workflows',
    value: '24',
    sub: 'Registered orchestration flows',
    trend: '+18%',
    cardId: 'total',
    trendColor: '#0ea5e9',
    trendSeries: [48, 51, 49, 53, 55, 57, 60],
    Icon: Workflow,
  },
  {
    id: 'running-executions',
    label: 'Running Executions',
    value: '156',
    sub: 'Live execution instances',
    trend: '+12%',
    cardId: 'active',
    trendColor: '#10b981',
    trendSeries: [62, 63, 64, 64, 65, 65, 66],
    Icon: Activity,
  },
  {
    id: 'successful-executions',
    label: 'Successful Executions',
    value: '4,232',
    sub: 'Completed this period',
    trend: '+8%',
    cardId: 'active',
    trendColor: '#10b981',
    trendSeries: [66, 68, 69, 72, 74, 76, 79],
    Icon: CheckCircle2,
  },
  {
    id: 'failed-executions',
    label: 'Failed Executions',
    value: '47',
    sub: 'Requires attention',
    trend: '-5%',
    cardId: 'risk',
    trendColor: '#f43f5e',
    trendSeries: [18, 16, 15, 14, 15, 14, 13],
    Icon: AlertTriangle,
  },
  {
    id: 'avg-execution-time',
    label: 'Avg. Execution Time',
    value: '4.2m',
    sub: 'Per workflow completion',
    trend: '-12%',
    cardId: 'members',
    trendColor: '#6366f1',
    trendSeries: [420, 438, 446, 460, 468, 476, 492],
    Icon: Clock,
  },
  {
    id: 'ai-tokens-consumed',
    label: 'AI Tokens Consumed',
    value: '2.8M',
    sub: 'Consumed by AI agents',
    trend: '+24%',
    cardId: 'projects',
    trendColor: '#f59e0b',
    trendSeries: [58, 60, 61, 63, 64, 66, 68],
    Icon: Zap,
  },
]

type KpiCardItem = (typeof kpiCards)[number]
type KpiCardId = KpiCardItem['id']
const WORKFLOW_KPI_CARD_ORDER_STORAGE_KEY = 'vitis-workflow-kpi-card-order-v1'

const workflowHealthDistribution = [
  { status: 'Healthy',  count: 18, percentage: 75, color: '#10b981' },
  { status: 'Warning',  count: 4,  percentage: 17, color: '#f59e0b' },
  { status: 'Critical', count: 1,  percentage: 4,  color: '#ef4444' },
  { status: 'Draft',    count: 2,  percentage: 8,  color: '#94a3b8' },
]

const executionStatusDistribution = [
  { status: 'Success', count: 4232, percentage: 93, color: '#10b981' },
  { status: 'Failed',  count: 47,   percentage: 1,  color: '#ef4444' },
  { status: 'Running', count: 156,  percentage: 3,  color: '#3b82f6' },
  { status: 'Pending', count: 89,   percentage: 2,  color: '#f59e0b' },
]

const categoryDistribution = [
  { category: 'Finance',    count: 8, percentage: 33, color: '#8b5cf6' },
  { category: 'Customer',   count: 7, percentage: 29, color: '#3b82f6' },
  { category: 'Operations', count: 5, percentage: 21, color: '#10b981' },
  { category: 'Compliance', count: 3, percentage: 12, color: '#f59e0b' },
  { category: 'Others',     count: 1, percentage: 4,  color: '#94a3b8' },
]

const topWorkflows = [
  { name: 'Rejected Loan Recovery',       executions: 1247, status: 'Healthy'  },
  { name: 'Customer Onboarding',          executions: 856,  status: 'Healthy'  },
  { name: 'AI Document Review',           executions: 623,  status: 'Healthy'  },
  { name: 'Collection Reminder',          executions: 412,  status: 'Warning'  },
  { name: 'Customer Complaint Handling',  executions: 294,  status: 'Healthy'  },
]

const recentExecutions = [
  { workflow: 'Rejected Loan Recovery',  status: 'Success', startedAt: '2 min ago',  duration: '3m 42s', initiatedBy: 'System'        },
  { workflow: 'AI Document Review',      status: 'Running', startedAt: '12 min ago', duration: '—',      initiatedBy: 'batch_process'  },
  { workflow: 'Customer Onboarding',     status: 'Success', startedAt: '1 hr ago',   duration: '5m 18s', initiatedBy: 'api_gateway'    },
  { workflow: 'Collection Reminder',     status: 'Failed',  startedAt: '3 hr ago',   duration: '1m 24s', initiatedBy: 'scheduler'      },
  { workflow: 'Fraud Detection Workflow',status: 'Success', startedAt: '4 hr ago',   duration: '2m 51s', initiatedBy: 'event_stream'   },
]

const pendingApprovals = [
  { workflow: 'High-Value Loan Approval', step: 'Manager Approval',    requestedBy: 'John Doe',       requestedAt: '30 min ago', priority: 'high'   },
  { workflow: 'Account Closure Review',   step: 'Finance Approval',    requestedBy: 'Jane Smith',     requestedAt: '1 hr ago',   priority: 'high'   },
  { workflow: 'Policy Exception Request', step: 'Risk Approval',       requestedBy: 'Mike Johnson',   requestedAt: '2 hr ago',   priority: 'medium' },
  { workflow: 'Compliance Flag Review',   step: 'Compliance Approval', requestedBy: 'Sarah Williams', requestedAt: '4 hr ago',   priority: 'medium' },
]

const deploymentSummary = [
  { environment: 'Production', workflowCount: 18, status: 'Healthy'  },
  { environment: 'Staging',    workflowCount: 6,  status: 'Healthy'  },
  { environment: 'UAT',        workflowCount: 4,  status: 'Warning'  },
  { environment: 'Development',workflowCount: 24, status: 'Healthy'  },
]

const aiAgentActivity = [
  { agent: 'Loan Validation Agent',   status: 'Active', tasks: 23, successRate: '98.4%' },
  { agent: 'Document Review Agent',   status: 'Active', tasks: 15, successRate: '96.2%' },
  { agent: 'Collection Agent',        status: 'Idle',   tasks: 0,  successRate: '97.8%' },
  { agent: 'Fraud Detection Agent',   status: 'Active', tasks: 8,  successRate: '99.1%' },
]

const dependencyRisks = [
  { dependency: 'Customer Data Sync',        usageCount: 12, impact: 'High',   risk: 'Critical' },
  { dependency: 'PII Masking Service',       usageCount: 8,  impact: 'Medium', risk: 'High'     },
  { dependency: 'Credit Scoring Service',    usageCount: 15, impact: 'High',   risk: 'Medium'   },
  { dependency: 'Email Notification Service',usageCount: 24, impact: 'Low',    risk: 'Low'      },
]

// --- Navigation sections ----------------------------------------------------------

const NAV_SECTIONS = [
  {
    label: 'FOUNDATION',
    items: [
      { id: 'overview',  icon: LayoutGrid, label: 'Overview',        description: 'Workflow execution and AI intelligence dashboard', badge: 'SUMMARY'  },
      { id: 'studio',    icon: Workflow,   label: 'Workflow Studio',  description: 'Design, execute, and orchestrate AI-native workflows',  badge: 'DESIGNER' },
      { id: 'templates', icon: Box,        label: 'Flow Templates',   description: 'Reusable workflow patterns and orchestration templates', badge: 'CATALOG'  },
    ],
  },
  {
    label: 'EXECUTION',
    items: [
      { id: 'simulator',  icon: FlaskConical, label: 'Execution Simulator', description: 'Test orchestration and agent workflows', badge: 'TESTING' },
      { id: 'monitoring', icon: Activity,     label: 'Runtime Monitoring',  description: 'Real-time workflow execution and AI agent performance', badge: 'LIVE'    },
      { id: 'history',    icon: History,      label: 'Execution History',   description: 'Audit execution logs and orchestration records', badge: 'AUDIT'   },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { id: 'agents',     icon: Bot,     label: 'AI Agent Orchestration', description: 'Manage AI agents and execution coordination', badge: 'AI'  },
      { id: 'dependency', icon: Network, label: 'Dependency Graph',       description: 'Visualize workflow and service dependencies', badge: 'MAP' },
    ],
  },
  {
    label: 'GOVERNANCE',
    items: [
      { id: 'versions',    icon: GitBranch, label: 'Workflow Versions',       description: 'Version control and workflow change history', badge: 'VERSION' },
      { id: 'deployment',  icon: GitMerge,  label: 'Deployment & Env.',       description: 'Environment management and deployment configuration', badge: 'DEPLOY'  },
      { id: 'governance',  icon: Scale,     label: 'Workflow Governance',     description: 'Policies, compliance, and workflow controls', badge: 'POLICY'  },
      { id: 'components',  icon: Cpu,       label: 'Reusable Components',     description: 'Shared workflow components and orchestration blocks', badge: 'LIBRARY' },
    ],
  },
]

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items)

// --- Design Palette System (Pastel/Vivid) ------------------------------------------

type ControlTowerPalette = 'pastel' | 'vivid'

const ORCHESTRATION_CONTROL_TOWER_PALETTES: Record<
  ControlTowerPalette,
  {
    shellAccent: string
    cardBg: string
    cardBorder: string
    healthIconBg: string
    healthIconColor: string
    executionIconBg: string
    executionIconColor: string
    deploymentIconBg: string
    deploymentIconColor: string
    agentIconBg: string
    agentIconColor: string
    healthAccent: string
    executionAccent: string
    deploymentAccent: string
    agentAccent: string
  }
> = {
  pastel: {
    shellAccent: 'from-sky-200 via-cyan-200 to-emerald-200',
    cardBg: 'bg-[linear-gradient(160deg,rgba(255,255,255,0.94),rgba(248,250,252,0.90))]',
    cardBorder: 'border-slate-200/90',
    healthIconBg: 'bg-emerald-50 ring-1 ring-emerald-100',
    healthIconColor: 'text-emerald-500',
    executionIconBg: 'bg-sky-50 ring-1 ring-sky-100',
    executionIconColor: 'text-sky-500',
    deploymentIconBg: 'bg-violet-50 ring-1 ring-violet-100',
    deploymentIconColor: 'text-violet-400',
    agentIconBg: 'bg-amber-50 ring-1 ring-amber-100',
    agentIconColor: 'text-amber-500',
    healthAccent: 'from-emerald-300 via-emerald-400 to-teal-400',
    executionAccent: 'from-sky-300 via-blue-400 to-indigo-400',
    deploymentAccent: 'from-indigo-300 via-violet-400 to-fuchsia-400',
    agentAccent: 'from-amber-300 via-orange-400 to-rose-400',
  },
  vivid: {
    shellAccent: 'from-cyan-400 via-blue-500 to-indigo-500',
    cardBg: 'bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(241,245,249,0.95))]',
    cardBorder: 'border-slate-300/80',
    healthIconBg: 'bg-emerald-50 ring-1 ring-emerald-200',
    healthIconColor: 'text-emerald-700',
    executionIconBg: 'bg-sky-50 ring-1 ring-sky-200',
    executionIconColor: 'text-sky-700',
    deploymentIconBg: 'bg-violet-50 ring-1 ring-violet-200',
    deploymentIconColor: 'text-violet-700',
    agentIconBg: 'bg-amber-50 ring-1 ring-amber-200',
    agentIconColor: 'text-amber-700',
    healthAccent: 'from-emerald-500 via-teal-500 to-cyan-500',
    executionAccent: 'from-sky-500 via-blue-600 to-indigo-600',
    deploymentAccent: 'from-violet-500 via-fuchsia-500 to-rose-500',
    agentAccent: 'from-amber-500 via-orange-500 to-rose-500',
  },
}

// --- Helpers ----------------------------------------------------------------------

function statusBadgeColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'success': case 'healthy': case 'active':  return 'bg-emerald-100 text-emerald-700'
    case 'running':                                  return 'bg-blue-100 text-blue-700'
    case 'failed':  case 'critical':                 return 'bg-red-100 text-red-700'
    case 'pending': case 'warning':                  return 'bg-amber-100 text-amber-700'
    case 'medium':                                   return 'bg-amber-100 text-amber-700'
    case 'high':                                     return 'bg-orange-100 text-orange-700'
    default:                                         return 'bg-slate-100 text-slate-600'
  }
}

function StatusIcon({ status }: { status: string }) {
  const s = status?.toLowerCase()
  if (s === 'success' || s === 'healthy' || s === 'active') return <CheckCircle2 className="h-3.5 w-3.5" />
  if (s === 'running')                                       return <Activity className="h-3.5 w-3.5" />
  if (s === 'failed'  || s === 'critical')                   return <AlertOctagon className="h-3.5 w-3.5" />
  if (s === 'pending' || s === 'warning')                    return <AlertTriangle className="h-3.5 w-3.5" />
  if (s === 'idle'    || s === 'degraded')                   return <AlertCircle className="h-3.5 w-3.5" />
  return null
}

function PremiumDonutChart({ data }: { data: Array<{ percentage: number; color: string }> }) {
  const r = 38
  const circ = 2 * Math.PI * r
  let offset = 0

  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('premium-donut-styles')) {
      const style = document.createElement('style')
      style.id = 'premium-donut-styles'
      style.textContent = `
        @keyframes donut-sheen {
          0% { stroke-dashoffset: 0; opacity: 0.3; }
          25% { opacity: 0.6; }
          50% { opacity: 0.8; }
          75% { opacity: 0.5; }
          100% { stroke-dashoffset: ${circ}; opacity: 0.2; }
        }
        @keyframes donut-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .premium-donut-svg {
          animation: donut-rotate 45s linear infinite;
          transform-origin: 50% 50%;
          filter: drop-shadow(0 12px 28px rgba(15, 23, 42, 0.12));
        }
        .premium-donut-sheen {
          animation: donut-sheen 3.8s ease-in-out infinite;
          stroke-linecap: round;
        }
      `
      document.head.appendChild(style)
    }
  }, [circ])

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90 shrink-0 premium-donut-svg">
      <defs>
        <filter id="donut-glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="48" cy="48" r={r} fill="none" stroke="#e2e8f0" strokeWidth="11" opacity="0.6" filter="url(#donut-glow)" />
      {data.map((item, idx) => {
        const dash = (item.percentage / 100) * circ
        const gap = circ - dash
        const el = (
          <circle
            key={idx}
            cx="48" cy="48" r={r}
            fill="none"
            stroke={item.color}
            strokeWidth="11"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            filter="url(#donut-glow)"
            style={{ transition: 'all 0.3s ease-out' }}
          />
        )
        offset += dash
        return el
      })}
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="11" strokeDasharray={circ} className="premium-donut-sheen" opacity="0.15" />
    </svg>
  )
}

function DonutChart({ data }: { data: Array<{ percentage: number; color: string }> }) {
  const r = 38
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90 shrink-0">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#f1f5f9" strokeWidth="11" />
      {data.map((item, idx) => {
        const dash = (item.percentage / 100) * circ
        const gap  = circ - dash
        const el = (
          <circle
            key={idx}
            cx="48" cy="48" r={r}
            fill="none"
            stroke={item.color}
            strokeWidth="11"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
          />
        )
        offset += dash
        return el
      })}
    </svg>
  )
}

function IntelligenceChartPanel({
  title,
  description,
  icon: Icon,
  accent,
  palette,
  iconBgClass,
  iconColorClass,
  right,
  style,
  children,
  isPremium,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  palette: (typeof ORCHESTRATION_CONTROL_TOWER_PALETTES)[ControlTowerPalette]
  iconBgClass: string
  iconColorClass: string
  right?: ReactNode
  style?: CSSProperties
  children: ReactNode
  isPremium?: boolean
}) {
  if (isPremium) {
    return (
      <div
        style={style}
        className={cn(
          'group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl p-5 transition-all duration-300 ease-out',
          'backdrop-blur-sm',
          palette.cardBg,
          `border ${palette.cardBorder}`,
          'shadow-[0_8px_16px_rgba(15,23,42,0.04),0_12px_34px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.5)]',
          'hover:shadow-[0_12px_24px_rgba(15,23,42,0.06),0_16px_48px_rgba(15,23,42,0.12),inset_0_1px_2px_rgba(255,255,255,0.6)]',
          'hover:-translate-y-1'
        )}
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
        <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-[2.5px] rounded-t-2xl bg-gradient-to-r opacity-85 shadow-[0_2px_8px_rgba(15,23,42,0.12)]', accent)} />
        <div className="relative mb-3 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 shadow-[0_2px_6px_rgba(15,23,42,0.08)] group-hover:shadow-[0_4px_12px_rgba(15,23,42,0.12)] group-hover:scale-110', iconBgClass)}>
                <Icon className={cn('h-4.5 w-4.5 transition-transform duration-200 group-hover:rotate-12', iconColorClass)} />
              </span>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
            </div>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">{description}</p>
          </div>
          {right}
        </div>
        <div className="relative min-h-0 flex-1 z-10">{children}</div>
      </div>
    )
  }

  return (
    <div style={style} className={cn('relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl p-5 shadow-[0_12px_34px_rgba(15,23,42,0.08)]', palette.cardBg, `border ${palette.cardBorder}`)}>
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r opacity-85', accent)} />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', iconBgClass)}>
              <Icon className={cn('h-4 w-4', iconColorClass)} />
            </span>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          </div>
          <p className="mt-1 text-xs text-slate-600">{description}</p>
        </div>
        {right}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}

function workspaceKpiChrome(cardId: string): string {
  const base =
    'group rounded-2xl p-4 transition-all duration-200 relative overflow-hidden border border-slate-300/55 ring-1 ring-black/[0.025] shadow-[0_10px_28px_rgba(15,23,42,0.07)] hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.1)]'

  if (cardId === 'total') return cn(base, 'bg-gradient-to-br from-slate-50 via-white to-sky-50')
  if (cardId === 'active') return cn(base, 'bg-gradient-to-br from-emerald-50 via-white to-cyan-50')
  if (cardId === 'risk') return cn(base, 'bg-gradient-to-br from-rose-50 via-white to-amber-50')
  if (cardId === 'members') return cn(base, 'bg-gradient-to-br from-indigo-50 via-white to-violet-50')
  if (cardId === 'projects') return cn(base, 'bg-gradient-to-br from-orange-50 via-white to-yellow-50')
  return cn(base, 'bg-gradient-to-br from-cyan-50 via-white to-blue-50')
}

function KpiSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const gradId = `vitis-kpi-${color.replace('#', '')}`
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 95 - ((value - min) / range) * 80
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${points} 100,100`} fill={`url(#${gradId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function KpiSortableCard({ id, children }: { id: KpiCardId; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="h-full select-none outline-none focus:outline-none focus-visible:outline-none"
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

function ComingSoonPanel({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex flex-col">
      <div className="border-b border-border/50 px-6 py-4">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-1 min-h-[420px] flex-col items-center justify-center gap-3 p-12 text-center">
        <Settings className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
        <span className="mt-1 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700">
          Coming Soon
        </span>
      </div>
    </div>
  )
}

function OverviewWorkspace() {
  const [palette] = useState<ControlTowerPalette>('pastel')
  const pal = ORCHESTRATION_CONTROL_TOWER_PALETTES[palette]

  return (
    <div className="flex flex-col">
      <div className="space-y-4 border-b border-border/50 px-6 py-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <BarChart3 className="h-5 w-5 text-sky-600" />
            Orchestration Intelligence Control Tower
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Execution posture • Workflow health • Approval pipeline • Deployment status • AI agent performance
          </p>
        </div>

        {/* Enhanced Alert Banner with Shell Gradient */}
        <div className={cn('flex items-start gap-3 rounded-2xl border p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]', 'border-sky-200/90', 'bg-gradient-to-r from-sky-50 via-cyan-50 to-emerald-50')}>
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sky-900">Pending approvals</h4>
            <p className="mt-0.5 text-xs text-sky-700">4 pending approvals • 2 high-priority items require immediate attention</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className={cn('h-8 rounded-full border-white/70 bg-white/80 px-4 text-xs font-semibold text-slate-900 transition-all duration-200', 'shadow-[0_2px_8px_rgba(15,23,42,0.08)]', 'hover:border-white/90 hover:bg-white/95 hover:shadow-[0_4px_12px_rgba(15,23,42,0.12)]')}>
              View Executions
            </button>
            <button className={cn('h-8 rounded-full border-white/70 bg-white/80 px-4 text-xs font-semibold text-slate-900 transition-all duration-200', 'shadow-[0_2px_8px_rgba(15,23,42,0.08)]', 'hover:border-white/90 hover:bg-white/95 hover:shadow-[0_4px_12px_rgba(15,23,42,0.12)]')}>
              Rebalance
            </button>
            <button className={cn('h-8 rounded-full border-white/70 bg-white/80 px-4 text-xs font-semibold text-slate-900 transition-all duration-200', 'shadow-[0_2px_8px_rgba(15,23,42,0.08)]', 'hover:border-white/90 hover:bg-white/95 hover:shadow-[0_4px_12px_rgba(15,23,42,0.12)]')}>
              Open Studio
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5">

        {/* ANALYTICS GRID with IntelligenceChartPanel */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Workflow Health - Premium Edition */}
          <IntelligenceChartPanel
            title="Workflow Health"
            description="Healthy vs at-risk vs critical posture"
            icon={ShieldCheck}
            accent={pal.healthAccent}
            palette={pal}
            iconBgClass={pal.healthIconBg}
            iconColorClass={pal.healthIconColor}
            isPremium={true}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="mx-auto flex-shrink-0 sm:mx-0">
                <PremiumDonutChart data={workflowHealthDistribution} />
              </div>
              <div className="flex w-full flex-col gap-2">
                {workflowHealthDistribution.map((d) => (
                  <div
                    key={d.status}
                    className="group/legend flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg transition-all duration-200 hover:bg-slate-100/50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_1px_3px_rgba(15,23,42,0.12)] transition-all duration-200 group-hover/legend:scale-125"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-xs font-medium text-slate-700 truncate group-hover/legend:text-slate-900">
                        {d.status}
                      </span>
                    </span>
                    <span className="font-semibold text-sm text-slate-900 shrink-0 group-hover/legend:text-slate-950 transition-colors duration-200">
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </IntelligenceChartPanel>

          {/* Execution Status - Premium Edition */}
          <IntelligenceChartPanel
            title="Execution Status"
            description="Running, completed, and failed executions"
            icon={Activity}
            accent={pal.executionAccent}
            palette={pal}
            iconBgClass={pal.executionIconBg}
            iconColorClass={pal.executionIconColor}
            isPremium={true}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="mx-auto flex-shrink-0 sm:mx-0">
                <PremiumDonutChart data={executionStatusDistribution} />
              </div>
              <div className="flex w-full flex-col gap-2">
                {executionStatusDistribution.map((d) => (
                  <div
                    key={d.status}
                    className="group/legend flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg transition-all duration-200 hover:bg-slate-100/50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_1px_3px_rgba(15,23,42,0.12)] transition-all duration-200 group-hover/legend:scale-125"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-xs font-medium text-slate-700 truncate group-hover/legend:text-slate-900">
                        {d.status}
                      </span>
                    </span>
                    <span className="font-semibold text-sm text-slate-900 shrink-0 group-hover/legend:text-slate-950 transition-colors duration-200">
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </IntelligenceChartPanel>

          {/* Workflow Categories - Premium Edition */}
          <IntelligenceChartPanel
            title="Workflow Categories"
            description="Distribution across orchestration types"
            icon={Database}
            accent={pal.agentAccent}
            palette={pal}
            iconBgClass={pal.agentIconBg}
            iconColorClass={pal.agentIconColor}
            isPremium={true}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="mx-auto flex-shrink-0 sm:mx-0">
                <PremiumDonutChart data={categoryDistribution} />
              </div>
              <div className="flex w-full flex-col gap-2">
                {categoryDistribution.map((d) => (
                  <div
                    key={d.category}
                    className="group/legend flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg transition-all duration-200 hover:bg-slate-100/50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_1px_3px_rgba(15,23,42,0.12)] transition-all duration-200 group-hover/legend:scale-125"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-xs font-medium text-slate-700 truncate group-hover/legend:text-slate-900">
                        {d.category}
                      </span>
                    </span>
                    <span className="font-semibold text-sm text-slate-900 shrink-0 group-hover/legend:text-slate-950 transition-colors duration-200">
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </IntelligenceChartPanel>
        </div>

        {/* EXECUTION & APPROVAL */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Recent Executions - Premium Edition */}
          <IntelligenceChartPanel
            title="Recent Executions"
            description="Latest workflow executions with status overview"
            icon={PlayCircle}
            accent={pal.executionAccent}
            palette={pal}
            iconBgClass={pal.executionIconBg}
            iconColorClass={pal.executionIconColor}
            isPremium={true}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/40 bg-gradient-to-r from-sky-500/8 to-transparent">
                    <th className="px-3 py-3 text-left font-semibold text-foreground/80 tracking-wide">Workflow</th>
                    <th className="px-3 py-3 text-left font-semibold text-foreground/80 tracking-wide">Status</th>
                    <th className="px-3 py-3 text-left font-semibold text-foreground/80 tracking-wide">Started</th>
                    <th className="px-3 py-3 text-left font-semibold text-foreground/80 tracking-wide">Duration</th>
                    <th className="px-3 py-3 text-left font-semibold text-foreground/80 tracking-wide">By</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExecutions.map((exec, idx) => (
                    <tr key={idx} className="group/row border-b border-white/20 hover:bg-sky-500/8 transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                      <td className="px-3 py-3 font-medium text-foreground max-w-[130px] truncate group-hover/row:text-sky-700 transition-colors">{exec.workflow}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold backdrop-blur-sm transition-all duration-200 group-hover/row:scale-105 group-hover/row:shadow-md', statusBadgeColor(exec.status))}>
                          <StatusIcon status={exec.status} />
                          {exec.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap group-hover/row:text-foreground transition-colors">{exec.startedAt}</td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap group-hover/row:text-foreground transition-colors">{exec.duration}</td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap group-hover/row:text-foreground transition-colors">{exec.initiatedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </IntelligenceChartPanel>

          {/* Pending Approvals */}
          <div className="rounded-xl border border-border/50 bg-background p-4 shadow-sm">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-amber-600" />
              Pending Approvals
            </h4>
            <div className="flex flex-col gap-2">
              {pendingApprovals.map((a, idx) => (
                <div key={idx} className="cursor-pointer rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-colors">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-foreground">{a.workflow}</span>
                    <span className={cn('inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold', a.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                      {a.priority === 'high' ? <AlertTriangle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {a.priority === 'high' ? 'High' : 'Medium'}
                    </span>
                  </div>
                  <p className="mb-1.5 text-[11px] text-muted-foreground">{a.step}</p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{a.requestedBy}</span>
                    <span>{a.requestedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DEPLOYMENT SUMMARY */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-border/50 bg-background p-4 shadow-sm">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Route className="h-4 w-4 text-indigo-600" />
              Deployment Summary
            </h4>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {deploymentSummary.map((d, idx) => (
                <div key={idx} className="rounded-lg border border-border/40 p-3 hover:border-border transition-colors">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{d.environment}</span>
                    <span className={cn('inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold', statusBadgeColor(d.status))}>
                      <StatusIcon status={d.status} />
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{d.workflowCount}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">workflows</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-background p-4 shadow-sm">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Bot className="h-4 w-4 text-indigo-600" />
              AI Agent Activity
            </h4>
            <div className="flex flex-col gap-2">
              {aiAgentActivity.map((a, idx) => (
                <div key={idx} className="rounded-lg border border-border/40 p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{a.agent}</span>
                    <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold', statusBadgeColor(a.status))}>
                      <StatusIcon status={a.status} />
                      {a.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{a.tasks} tasks</span>
                    <span className="font-semibold text-emerald-600">{a.successRate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-background p-4 shadow-sm">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <BarChart3 className="h-4 w-4 text-violet-600" />
              Top Workflows
            </h4>
            <p className="mb-3 text-xs text-muted-foreground">Most executed workflows in portfolio</p>
            <div className="flex flex-col gap-2.5">
              {topWorkflows.map((wf, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[11px] font-medium text-foreground">{wf.name}</span>
                    <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">{wf.executions}</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={cn('h-full rounded-full', wf.status === 'Warning' ? 'bg-amber-400' : 'bg-emerald-500')}
                      style={{ width: `${(wf.executions / 1247) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-background p-4 shadow-sm">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Workflow Dependency Risk
            </h4>
            <div className="flex flex-col gap-2">
              {dependencyRisks.map((d, idx) => (
                <div key={idx} className="rounded-lg border border-border/40 p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{d.dependency}</span>
                    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold', statusBadgeColor(d.risk))}>
                      {d.risk}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{d.usageCount} workflows</span>
                    <span className="font-medium">Impact: {d.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// --- Main page -------------------------------------------------------------------

export function WorkflowDesignerOrchestrationPage() {
  const [activeNav, setActiveNav] = useState('overview')
  const [kpiCardOrder, setKpiCardOrder] = useState<KpiCardId[]>(() => {
    const defaultOrder = kpiCards.map((kpi) => kpi.id)
    try {
      const raw = window.localStorage.getItem(WORKFLOW_KPI_CARD_ORDER_STORAGE_KEY)
      if (!raw) return defaultOrder
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) return defaultOrder
      const valid = new Set(defaultOrder)
      const ordered = (parsed as unknown[]).filter((x): x is KpiCardId => typeof x === 'string' && valid.has(x as KpiCardId))
      const missing = defaultOrder.filter((id) => !ordered.includes(id))
      return [...ordered, ...missing]
    } catch {
      return defaultOrder
    }
  })
  const [activeKpiCardId, setActiveKpiCardId] = useState<KpiCardId | null>(null)
  const [isWorkspaceCollapsed, setIsWorkspaceCollapsed] = useState(false)
  const navPanelRef = useRef<HTMLDivElement | null>(null)
  const [navPanelHeightPx, setNavPanelHeightPx] = useState<number | null>(null)
  const activeItem = ALL_NAV_ITEMS.find((n) => n.id === activeNav)!

  const kpiCardMap = Object.fromEntries(kpiCards.map((card) => [card.id, card])) as Record<KpiCardId, KpiCardItem>
  const activeKpiCard = activeKpiCardId ? kpiCardMap[activeKpiCardId] : null
  const ActiveKpiIcon = activeKpiCard?.Icon

  const kpiDndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    try {
      window.localStorage.setItem(WORKFLOW_KPI_CARD_ORDER_STORAGE_KEY, JSON.stringify(kpiCardOrder))
    } catch {
      // Ignore storage failures to keep UI functional.
    }
  }, [kpiCardOrder])

  useLayoutEffect(() => {
    const updateNavPanelHeight = () => {
      const navEl = navPanelRef.current
      if (!navEl) return
      // Match Tectona Fixed Sidebar floating panel: viewport-based height (+ boost/pad constants).
      setNavPanelHeightPx(computeWorkspaceMainPanelViewportHeightPx(navEl.getBoundingClientRect().top))
    }

    updateNavPanelHeight()
    const frame = window.requestAnimationFrame(() => {
      updateNavPanelHeight()
      window.requestAnimationFrame(updateNavPanelHeight)
    })
    const t1 = window.setTimeout(updateNavPanelHeight, 80)
    const t2 = window.setTimeout(updateNavPanelHeight, 360)
    window.addEventListener('resize', updateNavPanelHeight, { passive: true })
    window.addEventListener('scroll', updateNavPanelHeight, { passive: true })

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', updateNavPanelHeight)
      window.removeEventListener('scroll', updateNavPanelHeight)
    }
  }, [isWorkspaceCollapsed])

  function handleKpiDragStart(event: DragStartEvent) {
    setActiveKpiCardId(event.active.id as KpiCardId)
  }

  function handleKpiDragEnd(event: DragEndEvent) {
    setActiveKpiCardId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    setKpiCardOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as KpiCardId)
      const newIndex = prev.indexOf(over.id as KpiCardId)
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Workflow Designer & Orchestration', href: '/workflows' }]} />
      <PageHeader
        title="Workflow Designer & Orchestration"
        description="AI-native visual workflow orchestration, execution design, agent coordination, decision routing, runtime coordination, and enterprise execution control"
      />

      {/* KPI STRIP */}
      <DndContext
        sensors={kpiDndSensors}
        collisionDetection={closestCenter}
        onDragStart={handleKpiDragStart}
        onDragEnd={handleKpiDragEnd}
      >
        <SortableContext items={kpiCardOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {kpiCardOrder.map((kpiId) => {
              const kpi = kpiCardMap[kpiId]
              return (
                <KpiSortableCard key={kpi.id} id={kpi.id}>
                  <div className={workspaceKpiChrome(kpi.cardId)}>
                    <div className="pointer-events-none absolute -right-3 -bottom-4 opacity-[0.08] transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.12]">
                      <kpi.Icon className="h-20 w-20 text-slate-900 dark:text-white" aria-hidden />
                    </div>

                    <div className="text-xs text-slate-500">{kpi.label}</div>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="shrink-0 text-2xl font-bold leading-none text-slate-950">{kpi.value}</div>
                      <div className="h-10 min-w-0 flex-1">
                        <KpiSparkline data={kpi.trendSeries} color={kpi.trendColor} />
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <kpi.Icon className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                        <span className="truncate">{kpi.sub}</span>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 font-semibold',
                          kpi.trend.startsWith('-') ? 'text-rose-600' : 'text-emerald-600'
                        )}
                      >
                        {kpi.trend}
                      </span>
                    </div>
                  </div>
                </KpiSortableCard>
              )
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeKpiCard ? (
            <div className="relative w-[300px]">
              <div style={{ transform: 'rotate(2deg)' }}>
                <div className="scale-105 shadow-2xl">
                  <div className={workspaceKpiChrome(activeKpiCard.cardId)}>
                    <div className="pointer-events-none absolute -right-3 -bottom-4 opacity-[0.08]">
                      {ActiveKpiIcon ? <ActiveKpiIcon className="h-20 w-20 text-slate-900 dark:text-white" aria-hidden /> : null}
                    </div>
                    <div className="text-xs text-slate-500">{activeKpiCard.label}</div>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="shrink-0 text-2xl font-bold leading-none text-slate-950">{activeKpiCard.value}</div>
                      <div className="h-10 min-w-0 flex-1">
                        <KpiSparkline data={activeKpiCard.trendSeries} color={activeKpiCard.trendColor} />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        {ActiveKpiIcon ? <ActiveKpiIcon className="h-3.5 w-3.5 shrink-0 text-slate-600" /> : null}
                        <span className="truncate">{activeKpiCard.sub}</span>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 font-semibold',
                          activeKpiCard.trend.startsWith('-') ? 'text-rose-600' : 'text-emerald-600'
                        )}
                      >
                        {activeKpiCard.trend}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* TWO-PANEL WORKSPACE — Fixed Sidebar TRUE: match Tectona Enterprise Navigation design */}
      <div className={workspaceOuterGridClass(true, isWorkspaceCollapsed, 'compact')}>
        <aside className={workspaceAsideClass(false, isWorkspaceCollapsed, 'compact')}>
          <div
            ref={navPanelRef}
            className={cn(
              workspaceNavInnerClass(false, true, isWorkspaceCollapsed),
              // Match Tectona / platanus Enterprise Navigation panel corner radius.
              'rounded-2xl xl:rounded-r-2xl',
              'overflow-hidden'
            )}
            style={
              navPanelHeightPx
                ? { height: navPanelHeightPx, maxHeight: navPanelHeightPx, minHeight: navPanelHeightPx }
                : undefined
            }
            aria-label="Workflow workspace navigation"
          >
            <div className="shrink-0">
              <div className={cn('flex items-center', isWorkspaceCollapsed ? 'mb-2 justify-center' : 'mb-3 justify-between')}>
                {!isWorkspaceCollapsed ? (
                  <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Enterprise Navigation
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'shrink-0 rounded-xl border border-slate-200/70 bg-white/75 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900',
                    isWorkspaceCollapsed ? 'h-8 w-8 rounded-full' : 'h-9 w-9'
                  )}
                  aria-label={isWorkspaceCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                  title={isWorkspaceCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                  onClick={() => setIsWorkspaceCollapsed((c) => !c)}
                >
                  {isWorkspaceCollapsed ? (
                    <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                  )}
                </Button>
              </div>

              {!isWorkspaceCollapsed ? (
                <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_38%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(30,41,59,0.94))] p-4 text-white shadow-[0_18px_44px_rgba(15,23,42,0.24)]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100/80">
                    Workspace Control Tower
                  </div>
                  <div className="mt-1.5 text-sm font-semibold leading-snug">
                    Design governance, member access, and operational visibility
                  </div>
                </div>
              ) : null}
            </div>

            {isWorkspaceCollapsed ? (
              <div className={cn(workspaceNavMenuScrollClass(), 'pt-0')}>
                <EnterpriseNavIconRail
                  items={ALL_NAV_ITEMS}
                  activeId={activeNav}
                  onSelect={setActiveNav}
                />
              </div>
            ) : (
              <>
                <div className={workspaceNavMenuScrollClass()}>
                  <div className="space-y-4">
                    {NAV_SECTIONS.map((section) => (
                      <div key={section.label} className="space-y-1.5">
                        <div className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {section.label}
                        </div>
                        {section.items.map((item) => {
                          const isActive = activeNav === item.id
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setActiveNav(item.id)}
                              className={cn(
                                'group relative flex w-full items-start gap-3 overflow-hidden rounded-[20px] border px-3.5 py-3 text-left transition-all duration-200',
                                isActive
                                  ? 'border-slate-300/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(241,245,249,0.92))] text-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.10)]'
                                  : 'border-transparent bg-white/55 text-slate-600 hover:border-slate-200/80 hover:bg-white/88 hover:text-slate-950'
                              )}
                              aria-label={item.label}
                              title={item.label}
                            >
                              {isActive ? (
                                <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-sky-500 via-blue-600 to-indigo-600" />
                              ) : null}
                              <span
                                className={cn(
                                  'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors',
                                  isActive
                                    ? 'border-sky-200 bg-sky-50 text-sky-700'
                                    : 'border-slate-200/80 bg-slate-50/90 text-slate-600 group-hover:border-slate-300 group-hover:bg-slate-100'
                                )}
                              >
                                <item.icon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-start justify-between gap-2">
                                  <span className="block truncate text-sm font-semibold text-slate-900">
                                    {item.label}
                                  </span>
                                  <span
                                    className={cn(
                                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
                                      isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                                    )}
                                  >
                                    {item.badge}
                                  </span>
                                </span>
                                <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                                  {item.description}
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 space-y-4 pt-4">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                      <Signal className="h-4 w-4" />
                      Workflow health
                    </div>
                    <div className="mt-3 flex items-start gap-3">
                      <div className="shrink-0 text-3xl font-bold leading-none tabular-nums text-slate-900">50%</div>
                      <p className="min-w-0 flex-1 text-[10px] leading-snug text-slate-600">
                        Composite of directory status, engagement, and structural load — a workspace governance signal.
                      </p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-blue-100">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: '50%' }} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT WORKSPACE */}
        <main
          className="min-h-0 overflow-y-auto rounded-2xl border border-border/50 bg-background shadow-[0_22px_60px_rgba(15,23,42,0.08)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={
            navPanelHeightPx
              ? { height: navPanelHeightPx, maxHeight: navPanelHeightPx, minHeight: navPanelHeightPx }
              : undefined
          }
        >
          {activeNav === 'overview'
            ? <OverviewWorkspace />
            : <ComingSoonPanel label={activeItem.label} description={activeItem.badge} />
          }
        </main>
      </div>
    </div>
  )
}
