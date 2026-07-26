import { useGovernanceStore } from '../store/governanceStore'
import { RiskLevelBadge } from './RiskLevelBadge'
import { Package } from 'lucide-react'

export function ModelGovernanceTable() {
  const { modelGovernance, getPolicy } = useGovernanceStore()

  const getEnvironmentLabel = (env: string) => {
    const labels: Record<string, string> = {
      production: 'Production',
      staging: 'Staging',
      development: 'Development',
    }
    return labels[env] || env
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Model Governance Coverage</h3>
          <p className="text-xs text-muted-foreground">
            Mapping of models to applied policies and risk assessment
          </p>
        </div>
      </div>

      {modelGovernance.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No models under governance</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/20">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Model
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Version
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Environment
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Policies Applied
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">
                  Risk Level
                </th>
              </tr>
            </thead>
            <tbody>
              {modelGovernance.map((gov) => (
                <tr
                  key={gov.modelId}
                  className="border-b border-border/10 hover:bg-accent/5 transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-foreground">{gov.modelName}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-foreground">{gov.version}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-foreground">
                      {getEnvironmentLabel(gov.environment)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {gov.policiesApplied.map((policyId) => {
                        const policy = getPolicy(policyId)
                        return policy ? (
                          <span
                            key={policyId}
                            className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent-foreground border border-border/20"
                            title={policy.name}
                          >
                            {policy.name.split(' ')[0]}
                          </span>
                        ) : null
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <RiskLevelBadge level={gov.riskLevel} />
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
