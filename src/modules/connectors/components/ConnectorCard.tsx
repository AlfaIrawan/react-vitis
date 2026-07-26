import { Database, Cpu, Clock, FolderOpen } from 'lucide-react'
import type { Connector } from '../store/connectorStore'
import { ConnectorStatusBadge } from './ConnectorStatusBadge'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../projects/store/projectStore'

interface ConnectorCardProps {
  connector: Connector
}

/**
 * ConnectorCard - Display connector information in a card format
 * 
 * This is a READ-ONLY card component. It does NOT provide any actions to execute or test connectors.
 * 
 * Scope: Module 3 - Connector Management (non-operational)
 */
export function ConnectorCard({ connector }: ConnectorCardProps) {
  const navigate = useNavigate()
  const { getProject } = useProjectStore()

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
      return 'Engine'
    }
    
    // Show data source type if available
    if (connector.dataSourceType) {
      const typeLabels: Record<string, string> = {
        'relational-database': 'Database',
        'object-storage': 'Object Storage',
        'file-system': 'File System',
        'data-api': 'Data API',
      }
      return `Data Source · ${typeLabels[connector.dataSourceType] || connector.dataSourceType}`
    }
    
    return 'Data Source'
  }

  const TypeIcon = getTypeIcon()

  // Project-First: Connector belongs to exactly one project
  const project = getProject(connector.projectId)
  const projectName = project?.name

  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer'
      )}
      onClick={() => navigate(`/projects/${connector.projectId}/connectors/${connector.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <TypeIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
              {connector.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">{getTypeLabel()}</span>
              <ConnectorStatusBadge status={connector.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {projectName && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{projectName}</span>
          </div>
        )}

        {connector.lastChecked && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Last checked: {formatDate(connector.lastChecked) || '–'}</span>
          </div>
        )}

        {!connector.lastChecked && !projectName && (
          <div className="text-xs text-muted-foreground">
            Connector belum terhubung.
          </div>
        )}
      </div>
    </div>
  )
}
