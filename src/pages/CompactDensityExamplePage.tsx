import { Link } from 'react-router-dom'
import { ArrowRight, Download, Filter, Plus, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const sampleCards = [
  { id: 'run-2419', title: 'Run #2419', meta: 'Training • 12m ago', status: 'Completed' },
  { id: 'run-2420', title: 'Run #2420', meta: 'Training • 9m ago', status: 'Running' },
  { id: 'run-2421', title: 'Run #2421', meta: 'Validation • 5m ago', status: 'Queued' },
  { id: 'run-2422', title: 'Run #2422', meta: 'Inference • 2m ago', status: 'Completed' },
]

const tableRows = [
  { name: 'Payments Model v3', owner: 'ML Platform', stage: 'Prod', health: 'Healthy', alerts: 0 },
  { name: 'Credit Risk v12', owner: 'Risk', stage: 'Staging', health: 'Attention', alerts: 2 },
  { name: 'Fraud Detector v7', owner: 'Fraud', stage: 'Prod', health: 'Healthy', alerts: 0 },
  { name: 'Collections Helper v2', owner: 'Ops', stage: 'Dev', health: 'Critical', alerts: 1 },
]

function StatusPill({ value }: { value: string }) {
  const styles: Record<string, string> = {
    Healthy: 'bg-green-50 text-green-700 border-green-200',
    Attention: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    Critical: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-medium', styles[value] || 'bg-gray-50 text-gray-700 border-gray-200')}>
      {value}
    </span>
  )
}

export function CompactDensityExamplePage() {
  return (
    <div className="space-y-4">
      {/* Page header (compact) */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-sm font-semibold text-gray-900">Compact Density Example</h1>
          <p className="text-xs text-gray-600 max-w-3xl">
            Fixed compact density applied consistently: nav padding, item padding, item spacing, icon/text sizes, compact cards, compact table rows, and compact button sizes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-1.5" variant="outline">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* Buttons (compact sizing demo) */}
      <div className="glass-card rounded-xl p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-900">Button sizes</h2>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" aria-label="Refresh">
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" aria-label="Download">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button variant="outline">Outline</Button>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      {/* Card list (compact) */}
      <div className="glass-card-neon rounded-xl p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-900">Card list</h2>
          <Link to="/" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
            Back to Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-2 space-y-2">
          {sampleCards.map((c) => (
            <div key={c.id} className="rounded-lg border border-blue-200/60 bg-white shadow-sm">
              <div className="flex items-center justify-between p-1.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-900 truncate">{c.title}</span>
                    <span className="text-[10px] text-gray-500">{c.id}</span>
                  </div>
                  <div className="text-[10px] text-gray-500">{c.meta}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-gray-700">
                    {c.status}
                  </span>
                  <Button variant="outline">Open</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table (compact rows) */}
      <div className="glass-card rounded-xl p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-900">Table rows (compact)</h2>
          <Button variant="outline">Export</Button>
        </div>

        <div className="mt-2 overflow-hidden rounded-lg border border-blue-200/60 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-600">
                <th className="px-2 py-2 font-medium">Model</th>
                <th className="px-2 py-2 font-medium">Owner</th>
                <th className="px-2 py-2 font-medium">Stage</th>
                <th className="px-2 py-2 font-medium">Health</th>
                <th className="px-2 py-2 font-medium text-right">Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableRows.map((r) => (
                <tr key={r.name} className="text-xs text-gray-700 hover:bg-gray-50">
                  <td className="px-2 py-1.5">
                    <div className="text-xs font-medium text-gray-900">{r.name}</div>
                  </td>
                  <td className="px-2 py-1.5">{r.owner}</td>
                  <td className="px-2 py-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700">
                      {r.stage}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <StatusPill value={r.health} />
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.alerts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

