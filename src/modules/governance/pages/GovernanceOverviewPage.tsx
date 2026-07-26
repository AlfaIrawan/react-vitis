import { useGovernanceStore } from '@/modules/governance'
import { SummaryCard } from '../components/SummaryCard'
import { PolicyRegistryTable } from '../components/PolicyRegistryTable'
import { ModelGovernanceTable } from '../components/ModelGovernanceTable'
import { AuditTrailVisualization } from '../components/AuditTrailVisualization'
import { ComplianceChecklist } from '../components/ComplianceChecklist'
import { ExportButtons } from '../components/ExportButtons'
import { ComplianceStatusBadge } from '../components/ComplianceStatusBadge'
import { Package, Rocket, FileText, Clock, Shield } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export function GovernanceOverviewPage() {
  const {
    getTotalModelsGoverned,
    getActiveDeploymentsCovered,
    getPoliciesApplied,
    getLastAuditSnapshot,
    getComplianceStatus,
  } = useGovernanceStore()

  const totalModels = getTotalModelsGoverned()
  const activeDeployments = getActiveDeploymentsCovered()
  const policiesApplied = getPoliciesApplied()
  const lastAudit = getLastAuditSnapshot()
  const complianceStatus = getComplianceStatus()

  const formatLastAudit = (timestamp: string | null) => {
    if (!timestamp) return 'No snapshot available'
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getComplianceMessage = () => {
    switch (complianceStatus) {
      case 'compliant':
        return 'All models are governed under active policies'
      case 'partial':
        return 'Some models require additional compliance measures'
      case 'non_compliant':
        return 'Compliance review required'
      default:
        return 'Compliance status unknown'
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Governance' }]} />

      {/* Header */}
      <PageHeader
        title="Governance & Audit Readiness"
        description="Enterprise AI governance, policy visibility, and audit traceability"
        right={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">Read-only • Oversight</span>
          </div>
        }
      />

      {/* Governance Overview - Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Models Governed"
          value={totalModels}
          icon={<Package className="w-5 h-5" />}
        />
        <SummaryCard
          title="Active Deployments Covered"
          value={activeDeployments}
          icon={<Rocket className="w-5 h-5" />}
        />
        <SummaryCard
          title="Policies Applied"
          value={policiesApplied}
          icon={<FileText className="w-5 h-5" />}
        />
        <SummaryCard
          title="Last Audit Snapshot"
          value={formatLastAudit(lastAudit)}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Compliance Status Banner */}
      <div className="glass-panel rounded-xl p-4 border border-border/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Compliance Status</p>
              <p className="text-xs text-muted-foreground mt-0.5">{getComplianceMessage()}</p>
            </div>
          </div>
          <ComplianceStatusBadge status={complianceStatus} />
        </div>
        {lastAudit && (
          <p className="text-xs text-muted-foreground mt-3">
            Last governance snapshot: {formatLastAudit(lastAudit)}
          </p>
        )}
      </div>

      {/* Policy Registry */}
      <PolicyRegistryTable />

      {/* Model Governance Coverage */}
      <ModelGovernanceTable />

      {/* Audit Trail & Traceability Snapshot */}
      <AuditTrailVisualization />

      {/* Compliance Readiness */}
      <ComplianceChecklist />

      {/* Export & Evidence */}
      <ExportButtons />
    </div>
  )
}
