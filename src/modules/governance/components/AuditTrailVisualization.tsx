import { useGovernanceStore } from '../store/governanceStore'
import { ArrowRight, Package, GitBranch, Rocket, MessageSquare, Clock, Shield } from 'lucide-react'

export function AuditTrailVisualization() {
  const { auditTrail } = useGovernanceStore()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Audit Trail & Traceability Snapshot
          </h3>
          <p className="text-xs text-muted-foreground">
            Immutable lineage visualization for audit purposes
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
          <Shield className="w-4 h-4 text-green-400" />
          <span className="text-xs font-medium text-green-400">Audit-safe: immutable & read-only</span>
        </div>
      </div>

      {auditTrail.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No audit trail entries</p>
        </div>
      ) : (
        <div className="space-y-6">
          {auditTrail.map((entry) => (
            <div key={entry.id} className="glass-panel rounded-xl p-5 border border-border/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">{entry.modelName}</h4>
                  <p className="text-xs text-muted-foreground">Version {entry.version}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(entry.timestamp)}</span>
                </div>
              </div>

              {/* Lineage Chain */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Model */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Package className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Model</p>
                    <p className="text-xs text-muted-foreground">{entry.modelName}</p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-muted-foreground" />

                {/* Version */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Version</p>
                    <p className="text-xs text-muted-foreground">{entry.version}</p>
                  </div>
                </div>

                {entry.runId && (
                  <>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <GitBranch className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Run</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {entry.runName || entry.runId}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {entry.deploymentId && (
                  <>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <Rocket className="w-4 h-4 text-green-400" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Deployment</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {entry.deploymentEndpoint || entry.deploymentId}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {entry.feedbackIds.length > 0 && (
                  <>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <MessageSquare className="w-4 h-4 text-yellow-400" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Feedback</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.feedbackIds.length} entry{entry.feedbackIds.length !== 1 ? 'ies' : 'y'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Snapshot Info */}
              <div className="mt-4 pt-4 border-t border-border/20">
                <p className="text-xs text-muted-foreground mb-2">Snapshot at {formatDate(entry.timestamp)}:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent-foreground border border-border/20">
                    Model: {entry.snapshot.modelStatus}
                  </span>
                  {entry.snapshot.deploymentStatus && (
                    <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent-foreground border border-border/20">
                      Deployment: {entry.snapshot.deploymentStatus}
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent-foreground border border-border/20">
                    Policies: {entry.snapshot.policies.length}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
