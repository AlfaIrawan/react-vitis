import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, Clock, Search } from 'lucide-react'
import { useDeploymentStore } from '../store/deploymentStore'
import { DeploymentStatusBadge } from '../components/DeploymentStatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function InferenceLogsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getDeployment, getRecentLogs } = useDeploymentStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all')

  const deployment = id ? getDeployment(id) : undefined
  const allLogs = id ? getRecentLogs(id, 200) : []

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = allLogs

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((log) => log.status === statusFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.requestId?.toLowerCase().includes(query) ||
          log.errorMessage?.toLowerCase().includes(query) ||
          log.modelVersion.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [allLogs, statusFilter, searchQuery])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  if (!deployment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/deployments')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Deployments
        </Button>
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">Deployment not found</p>
        </div>
      </div>
    )
  }

  const statusCounts = {
    all: allLogs.length,
    success: allLogs.filter((log) => log.status === 'success').length,
    error: allLogs.filter((log) => log.status === 'error').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/deployments/${id}/monitoring`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Inference Logs</h1>
              <DeploymentStatusBadge status={deployment.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {deployment.modelName} • Version {deployment.modelVersion} • Read-only logs
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search logs by request ID, error message, or version..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setStatusFilter('all')}
            >
              All ({statusCounts.all})
            </Button>
            <Button
              variant={statusFilter === 'success' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setStatusFilter('success')}
            >
              Success ({statusCounts.success})
            </Button>
            <Button
              variant={statusFilter === 'error' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setStatusFilter('error')}
            >
              Errors ({statusCounts.error})
            </Button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border/20">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Model Version</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Latency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Request ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Error Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.status === 'success' ? (
                        <div className="flex items-center gap-1.5 text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-xs">Success</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="text-xs">Error</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground font-mono">{log.modelVersion}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{log.latency}ms</td>
                    <td className="px-4 py-3 text-xs text-foreground font-mono">{log.requestId || '–'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                      {log.errorMessage || '–'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
