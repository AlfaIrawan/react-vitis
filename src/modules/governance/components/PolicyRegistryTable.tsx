import { useGovernanceStore } from '../store/governanceStore'
import { PolicyStatusBadge } from './PolicyStatusBadge'
import { FileText, Info } from 'lucide-react'

export function PolicyRegistryTable() {
  const { policies } = useGovernanceStore()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      data_usage: 'Data Usage',
      bias: 'Bias',
      explainability: 'Explainability',
      monitoring: 'Monitoring',
      retention: 'Retention',
    }
    return labels[category] || category
  }

  const getScopeLabel = (scope: string) => {
    const labels: Record<string, string> = {
      model: 'Model',
      deployment: 'Deployment',
      organization: 'Organization',
    }
    return labels[scope] || scope
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Policy Registry</h3>
          <p className="text-xs text-muted-foreground">
            Read-only view of enterprise AI governance policies
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-3 border border-blue-500/30 bg-blue-500/10">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-300">
            Policies are managed externally via enterprise governance process.
          </p>
        </div>
      </div>

      {policies.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No policies registered</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/20">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Policy Name
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Scope
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Effective Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr
                  key={policy.id}
                  className="border-b border-border/10 hover:bg-accent/5 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{policy.name}</p>
                      {policy.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {policy.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-foreground">{getScopeLabel(policy.scope)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-foreground">
                      {getCategoryLabel(policy.category)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <PolicyStatusBadge status={policy.status} />
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-foreground">{formatDate(policy.effectiveDate)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-foreground">{policy.owner}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
