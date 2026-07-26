import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Database, Cpu, Clock, FolderOpen, Edit } from 'lucide-react'
import { useConnectorStore } from '@/modules/connectors'
import { ConnectorStatusBadge } from '@/modules/connectors'
import { ConnectorFormModal } from '@/modules/connectors'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/modules/projects'
import { useState } from 'react'

/**
 * ConnectorDetailPage - Display connector details (read-only)
 * 
 * This page is READ-ONLY. It does NOT provide actions to execute, test, or monitor connectors.
 * Only viewing and editing configuration is allowed.
 * 
 * Scope: Module 3 - Connector Management (non-operational)
 */
export function ConnectorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getConnector } = useConnectorStore()
  const { getProject } = useProjectStore()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const connector = id ? getConnector(id) : undefined

  if (!connector) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/connectors')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Connectors
        </Button>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Connector not found</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypeIcon = () => {
    return connector.type === 'engine' ? Cpu : Database
  }

  const getTypeLabel = () => {
    if (connector.type === 'engine') {
      return 'Engine Connector'
    }
    
    // Data Source Connector with type
    if (connector.dataSourceType) {
      const typeLabels: Record<string, string> = {
        'relational-database': 'Relational Database',
        'object-storage': 'Object Storage',
        'file-system': 'File System',
        'data-api': 'Data API',
      }
      return `Data Source Connector (${typeLabels[connector.dataSourceType] || connector.dataSourceType})`
    }
    
    return 'Data Source Connector'
  }

  const getConnectionMethodLabel = () => {
    switch (connector.connectionMethod) {
      case 'api-endpoint':
        if (connector.dataSourceType === 'file-system') return 'Path'
        return 'API Endpoint'
      case 'cli-command':
        return 'CLI Command'
      case 'connection-string':
        return 'Connection String'
      default:
        return connector.connectionMethod
    }
  }

  const TypeIcon = getTypeIcon()

  // Project-First: Connector belongs to exactly one project
  const project = getProject(connector.projectId)

  const maskSensitiveValue = (value?: string) => {
    if (!value) return '–'
    return '•'.repeat(Math.min(value.length, 20))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/connectors')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-1.5 rounded-md bg-primary/10">
                <TypeIcon className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-sm font-semibold text-foreground">{connector.name}</h1>
              <ConnectorStatusBadge status={connector.status} />
            </div>
            <p className="text-xs text-muted-foreground mb-2">{getTypeLabel()}</p>
            {connector.lastChecked && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last checked: {formatDate(connector.lastChecked)}</span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Configure
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="glass-card rounded-xl p-3">
        <h2 className="text-xs font-semibold text-foreground mb-2">Basic Information</h2>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs text-muted-foreground">Connector Name</span>
            <span className="text-xs font-medium text-foreground">{connector.name}</span>
          </div>
          <div className="flex items-start justify-between">
            <span className="text-xs text-muted-foreground">Type</span>
            <span className="text-xs font-medium text-foreground">
              {connector.type === 'engine' ? 'Engine Connector' : 'Data Source Connector'}
            </span>
          </div>
          {connector.dataSourceType && (
            <div className="flex items-start justify-between">
              <span className="text-xs text-muted-foreground">Data Source Type</span>
              <span className="text-xs font-medium text-foreground">
                {connector.dataSourceType === 'relational-database'
                  ? 'Relational Database'
                  : connector.dataSourceType === 'object-storage'
                  ? 'Object Storage'
                  : connector.dataSourceType === 'file-system'
                  ? 'File System'
                  : connector.dataSourceType === 'data-api'
                  ? 'Data API'
                  : connector.dataSourceType}
              </span>
            </div>
          )}
          <div className="flex items-start justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <ConnectorStatusBadge status={connector.status} />
          </div>
        </div>
      </div>

      {/* Connection Information */}
      <div className="glass-card rounded-2xl p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">Connection Information</h2>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground">Connection Method</span>
            <span className="text-sm font-medium text-foreground">
              {getConnectionMethodLabel()}
            </span>
          </div>
          {connector.connectionMethod === 'api-endpoint' && connector.apiEndpoint && (
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">{getConnectionMethodLabel()}</span>
              <p className="text-sm font-mono text-foreground break-all">
                {connector.apiEndpoint}
              </p>
            </div>
          )}
          {connector.connectionMethod === 'cli-command' && connector.cliCommand && (
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">{getConnectionMethodLabel()}</span>
              <p className="text-sm font-mono text-foreground break-all">
                {connector.cliCommand}
              </p>
            </div>
          )}
          {connector.connectionMethod === 'connection-string' &&
            connector.connectionString && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">
                  {getConnectionMethodLabel()}
                </span>
                <p className="text-sm font-mono text-foreground break-all">
                  {connector.connectionString}
                </p>
              </div>
            )}
          {connector.auth && (
            <div className="space-y-2 pt-2 border-t border-border/20">
              <span className="text-sm text-muted-foreground">Authentication</span>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-xs text-muted-foreground">Type</span>
                  <span className="text-xs font-medium text-foreground">
                    {connector.auth.type === 'token' ? 'Token' : 'Username / Password'}
                  </span>
                </div>
                {connector.auth.type === 'token' && connector.auth.token && (
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-muted-foreground">Token</span>
                    <span className="text-xs font-mono text-foreground">
                      {maskSensitiveValue(connector.auth.token)}
                    </span>
                  </div>
                )}
                {connector.auth.type === 'username-password' && (
                  <>
                    {connector.auth.username && (
                      <div className="flex items-start justify-between">
                        <span className="text-xs text-muted-foreground">Username</span>
                        <span className="text-xs font-medium text-foreground">
                          {connector.auth.username}
                        </span>
                      </div>
                    )}
                    {connector.auth.password && (
                      <div className="flex items-start justify-between">
                        <span className="text-xs text-muted-foreground">Password</span>
                        <span className="text-xs font-mono text-foreground">
                          {maskSensitiveValue(connector.auth.password)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Linked Projects */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Projects Linked</h2>
          <span className="text-sm text-muted-foreground">
            {project ? '1 project' : 'No project'}
          </span>
        </div>
        {!project ? (
          <p className="text-sm text-muted-foreground">
            Belum ada project yang dikaitkan dengan connector ini.
          </p>
        ) : (
          <div className="space-y-2">
            {project && (
                <div
                  key={project.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <FolderOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{project.name}</span>
                </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <ConnectorFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        connector={connector}
      />
    </div>
  )
}
