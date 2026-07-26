import { useGovernanceStore } from '../store/governanceStore'
import { ComplianceStatusBadge } from './ComplianceStatusBadge'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export function ComplianceChecklist() {
  const { complianceReadiness } = useGovernanceStore()

  const CheckIcon = ({ checked }: { checked: boolean }) => {
    if (checked) {
      return <CheckCircle2 className="w-4 h-4 text-green-400" />
    }
    return <XCircle className="w-4 h-4 text-red-400" />
  }

  const getCheckLabel = (key: string) => {
    const labels: Record<string, string> = {
      modelDocumentationAvailable: 'Model documentation available',
      trainingLineageRecorded: 'Training lineage recorded',
      deploymentMonitored: 'Deployment monitored',
      feedbackTraceable: 'Feedback traceable',
      policiesAttached: 'Policies attached',
    }
    return labels[key] || key
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Compliance Readiness</h3>
          <p className="text-xs text-muted-foreground">
            Informational checklist for audit and compliance purposes
          </p>
        </div>
      </div>

      {complianceReadiness.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No compliance data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complianceReadiness.map((compliance) => (
            <div
              key={compliance.modelId}
              className="glass-panel rounded-xl p-4 border border-border/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    {compliance.modelName}
                  </h4>
                  <p className="text-xs text-muted-foreground">Version {compliance.version}</p>
                </div>
                <ComplianceStatusBadge status={compliance.overallStatus} />
              </div>

              <div className="space-y-2.5">
                {Object.entries(compliance.checks).map(([key, checked]) => (
                  <div key={key} className="flex items-center gap-3">
                    <CheckIcon checked={checked} />
                    <span className="text-xs text-foreground flex-1">
                      {getCheckLabel(key)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
