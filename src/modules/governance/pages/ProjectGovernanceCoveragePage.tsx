import { useParams } from 'react-router-dom'
import { useGovernanceStore } from '../store/governanceStore'
import { useProjectStore } from '../../projects/store/projectStore'
import { ComplianceStatusBadge } from '../components/ComplianceStatusBadge'
import { Shield, Eye, AlertTriangle } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'

/**
 * Project Governance Coverage Page
 * 
 * Project-scoped view showing governance coverage for the current project.
 * 
 * Features:
 * - Applied policies visibility
 * - Risk level indicator
 * - Compliance status
 * - Read-only (cannot modify policies here)
 */
export function ProjectGovernanceCoveragePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { getProject } = useProjectStore()
  const {
    getComplianceStatus,
    getPoliciesApplied,
  } = useGovernanceStore()

  const project = projectId ? getProject(projectId) : undefined
  const complianceStatus = projectId ? getComplianceStatus() : 'unknown'
  const policiesApplied = projectId ? getPoliciesApplied() : 0

  if (!project) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project.name, href: `/projects/${project.id}` },
          { label: 'Governance' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Governance Coverage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View applied policies, risk level, and compliance status for this project.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/20">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Coverage View</span>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Compliance Status</h2>
          </div>
          <ComplianceStatusBadge status={complianceStatus} />
        </div>
        <p className="text-sm text-muted-foreground">
          {complianceStatus === 'compliant'
            ? 'All models in this project are governed under active policies.'
            : complianceStatus === 'partial'
            ? 'Some models require additional compliance measures.'
            : 'Compliance review required for this project.'}
        </p>
      </div>

      {/* Applied Policies */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Applied Policies</h2>
        <div className="space-y-3">
          {policiesApplied > 0 ? (
            <div className="p-4 border border-border/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">Enterprise AI Policy</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Applied to all models in this project
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded-md bg-green-500/10 text-green-500">
                  Active
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 border border-border/20 rounded-lg text-center">
              <AlertTriangle className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No policies applied to this project yet.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Policies are managed at the enterprise level in Governance settings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Risk Level */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Risk Assessment</h2>
        <div className="space-y-3">
          <div className="p-4 border border-border/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Overall Risk Level</span>
              <span className="px-2 py-1 text-xs rounded-md bg-yellow-500/10 text-yellow-500">
                Medium
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on model types, deployment environments, and data sensitivity.
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="glass-card rounded-2xl p-4 border border-blue-500/20 bg-blue-500/5">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Coverage View Only</p>
            <p className="text-xs text-muted-foreground mt-1">
              This view shows governance coverage for this project. To modify policies or configure
              enterprise governance, navigate to the global Governance page in the sidebar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
