import { useState, useRef, useEffect } from 'react'
import {
  useConnectorStore,
  type Connector,
  type ConnectorType,
  type ConnectionMethod,
  type DataSourceType,
} from '../store/connectorStore'
import { useActiveProjectStore } from '@/stores/active-project-store'
import { useToast } from '@/components/ui/toast'
import { notifyEvent } from '@/lib/api/notificationApi'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ConnectorFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connector?: Connector | null // If provided, edit mode; otherwise, create mode
}

/**
 * ConnectorFormModal - Modal for creating/editing connector configuration
 *
 * This modal is for CONFIGURATION ONLY. It does NOT execute, test, or validate connections.
 * All fields are generic and mock-friendly.
 *
 * Scope: Module 3 - Connector Management (non-operational)
 */
export function ConnectorFormModal({
  open,
  onOpenChange,
  connector,
}: ConnectorFormModalProps) {
  const { addConnector, updateConnector } = useConnectorStore()
  const { activeProjectId } = useActiveProjectStore()
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    type: 'engine' as ConnectorType,
    dataSourceType: '' as DataSourceType | '',
    connectionMethod: 'api-endpoint' as ConnectionMethod,
    apiEndpoint: '',
    cliCommand: '',
    connectionString: '',
    authType: '' as 'token' | 'username-password' | '',
    token: '',
    username: '',
    password: '',
  })
  const [errors, setErrors] = useState<{ name?: string; dataSourceType?: string }>({})
  const nameInputRef = useRef<HTMLInputElement>(null)

  const isEditMode = !!connector
  const isDataSource = formData.type === 'data-source'

  // Get connection methods based on connector type and data source type
  const getConnectionMethods = (): { value: ConnectionMethod; label: string }[] => {
    if (!isDataSource) {
      // Engine Connector: API Endpoint or CLI Command
      return [
        { value: 'api-endpoint', label: 'API Endpoint' },
        { value: 'cli-command', label: 'CLI Command' },
      ]
    }

    // Data Source Connector: depends on data source type
    switch (formData.dataSourceType) {
      case 'relational-database':
        return [{ value: 'connection-string', label: 'Connection String' }]
      case 'object-storage':
      case 'data-api':
        return [{ value: 'api-endpoint', label: 'API Endpoint' }]
      case 'file-system':
        return [
          { value: 'api-endpoint', label: 'Path' },
          { value: 'cli-command', label: 'CLI Command' },
        ]
      default:
        return []
    }
  }

  // Get field label based on connection method
  const getConnectionFieldLabel = (): string => {
    if (!isDataSource) {
      return formData.connectionMethod === 'api-endpoint' ? 'API Endpoint' : 'CLI Command'
    }

    switch (formData.connectionMethod) {
      case 'connection-string':
        return 'Connection String'
      case 'api-endpoint':
        if (formData.dataSourceType === 'file-system') return 'Path'
        return 'API Endpoint'
      case 'cli-command':
        return 'CLI Command'
      default:
        return 'Connection'
    }
  }

  // Get placeholder based on connection method and data source type
  const getConnectionPlaceholder = (): string => {
    if (!isDataSource) {
      if (formData.connectionMethod === 'api-endpoint') {
        return 'https://api.example.com'
      }
      return 'python train.py --config config.json'
    }

    switch (formData.connectionMethod) {
      case 'connection-string':
        return 'postgresql://host:port/database'
      case 'api-endpoint':
        if (formData.dataSourceType === 'file-system') {
          return '/path/to/data or file:///path/to/data'
        }
        return 'https://api.example.com or s3://bucket-name'
      case 'cli-command':
        return 'ls /path/to/data or find . -name "*.csv"'
      default:
        return ''
    }
  }

  // Initialize form when modal opens or connector changes
  useEffect(() => {
    if (open) {
      if (connector) {
        // Edit mode: populate form with connector data
        setFormData({
          name: connector.name,
          type: connector.type,
          dataSourceType: connector.dataSourceType || '',
          connectionMethod: connector.connectionMethod,
          apiEndpoint: connector.apiEndpoint || '',
          cliCommand: connector.cliCommand || '',
          connectionString: connector.connectionString || '',
          authType: connector.auth?.type || '',
          token: '',
          username: connector.auth?.username || '',
          password: '',
        })
      } else {
        // Create mode: reset form
        setFormData({
          name: '',
          type: 'engine',
          dataSourceType: '',
          connectionMethod: 'api-endpoint',
          apiEndpoint: '',
          cliCommand: '',
          connectionString: '',
          authType: '',
          token: '',
          username: '',
          password: '',
        })
      }
      setErrors({})
      // Autofocus name input
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [open, connector])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        type: 'engine',
        dataSourceType: '',
        connectionMethod: 'api-endpoint',
        apiEndpoint: '',
        cliCommand: '',
        connectionString: '',
        authType: '',
        token: '',
        username: '',
        password: '',
      })
      setErrors({})
    }
  }, [open])

  // Auto-adjust connection method when data source type changes
  useEffect(() => {
    if (isDataSource && formData.dataSourceType) {
      const methods = getConnectionMethods()
      if (methods.length > 0 && !methods.find((m) => m.value === formData.connectionMethod)) {
        setFormData((prev) => ({ ...prev, connectionMethod: methods[0].value }))
      }
    }
  }, [formData.dataSourceType, isDataSource])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      setErrors({ name: 'Connector name is required' })
      nameInputRef.current?.focus()
      return
    }

    if (isDataSource && !formData.dataSourceType) {
      setErrors({ dataSourceType: 'Data source type is required' })
      return
    }

    // Project-First Enforcement: require active project for creation
    if (!isEditMode && !activeProjectId) {
      addToast({
        title: 'Project Required',
        description: 'Please select or create a project before creating a connector.',
        variant: 'error',
      })
      return
    }

    const connectorData: Omit<
      Connector,
      'id' | 'status' | 'createdAt' | 'updatedAt'
    > = {
      projectId: isEditMode && connector ? connector.projectId : activeProjectId!,
      name: formData.name.trim(),
      type: formData.type,
      connectionMethod: formData.connectionMethod,
      dataSourceType: isDataSource ? (formData.dataSourceType as DataSourceType) : undefined,
      apiEndpoint:
        formData.connectionMethod === 'api-endpoint' ? formData.apiEndpoint : undefined,
      cliCommand:
        formData.connectionMethod === 'cli-command' ? formData.cliCommand : undefined,
      connectionString:
        formData.connectionMethod === 'connection-string'
          ? formData.connectionString
          : undefined,
      auth:
        formData.authType
          ? {
              type: formData.authType,
              token: formData.authType === 'token' ? formData.token : undefined,
              username:
                formData.authType === 'username-password' ? formData.username : undefined,
              password:
                formData.authType === 'username-password' ? formData.password : undefined,
            }
          : undefined,
    }

    if (isEditMode && connector) {
      // Update existing connector
      updateConnector(connector.id, connectorData)
      addToast({
        title: 'Connector berhasil diperbarui',
        description: `Konfigurasi connector "${formData.name.trim()}" telah diperbarui.`,
        variant: 'success',
      })
      notifyEvent({
        type_code: 'connector',
        title: 'Connector berhasil diperbarui',
        body: `Konfigurasi connector "${formData.name.trim()}" telah diperbarui.`,
      })
    } else {
      // Create new connector
      addConnector(connectorData)
      addToast({
        title: 'Connector berhasil dibuat',
        description: `Connector "${formData.name.trim()}" telah dibuat.`,
        variant: 'success',
      })
      notifyEvent({
        type_code: 'connector',
        title: 'Connector berhasil dibuat',
        body: `Connector "${formData.name.trim()}" telah dibuat.`,
      })
    }

    // Close modal
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const isSubmitDisabled = !formData.name.trim() || (isDataSource && !formData.dataSourceType)

  const connectionMethods = getConnectionMethods()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogClose />
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Configure Connector' : 'Create Connector'}</DialogTitle>
          <DialogDescription>
            {isDataSource
              ? 'Menghubungkan project ke sumber data.'
              : 'Menghubungkan project ke mesin training atau inference.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Connector Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              ref={nameInputRef}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) setErrors({})
              }}
              placeholder="Enter connector name"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Connector Type</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as ConnectorType
                setFormData({
                  ...formData,
                  type: newType,
                  dataSourceType: newType === 'engine' ? '' : formData.dataSourceType,
                  connectionMethod:
                    newType === 'engine' ? 'api-endpoint' : formData.connectionMethod,
                })
              }}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
            >
              <option value="engine">Engine Connector</option>
              <option value="data-source">Data Source Connector</option>
            </select>
            <p className="text-xs text-muted-foreground">
              {isDataSource
                ? 'Menghubungkan project ke sumber data.'
                : 'Menghubungkan project ke mesin training atau inference.'}
            </p>
          </div>

          {isDataSource && (
            <div className="space-y-2">
              <Label htmlFor="dataSourceType">
                Data Source Type <span className="text-destructive">*</span>
              </Label>
              <select
                id="dataSourceType"
                value={formData.dataSourceType}
                onChange={(e) => {
                  const newDataSourceType = e.target.value as DataSourceType
                  setFormData({
                    ...formData,
                    dataSourceType: newDataSourceType,
                  })
                }}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
              >
                <option value="">Select data source type</option>
                <option value="relational-database">Relational Database</option>
                <option value="object-storage">Object Storage</option>
                <option value="file-system">File System</option>
                <option value="data-api">Data API</option>
              </select>
              {errors.dataSourceType && (
                <p className="text-sm text-destructive">{errors.dataSourceType}</p>
              )}
            </div>
          )}

          {connectionMethods.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="connectionMethod">Connection Method</Label>
              <select
                id="connectionMethod"
                value={formData.connectionMethod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    connectionMethod: e.target.value as ConnectionMethod,
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
              >
                {connectionMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.connectionMethod === 'api-endpoint' && (
            <div className="space-y-2">
              <Label htmlFor="apiEndpoint">{getConnectionFieldLabel()}</Label>
              <Input
                id="apiEndpoint"
                value={formData.apiEndpoint}
                onChange={(e) =>
                  setFormData({ ...formData, apiEndpoint: e.target.value })
                }
                placeholder={getConnectionPlaceholder()}
              />
              {!isDataSource && (
                <p className="text-xs text-muted-foreground">
                  Endpoint untuk mengirim perintah ke mesin training atau inference.
                </p>
              )}
              {isDataSource && formData.dataSourceType === 'data-api' && (
                <p className="text-xs text-muted-foreground">
                  Endpoint untuk mengambil data dari sumber eksternal.
                </p>
              )}
            </div>
          )}

          {formData.connectionMethod === 'cli-command' && (
            <div className="space-y-2">
              <Label htmlFor="cliCommand">{getConnectionFieldLabel()}</Label>
              <Textarea
                id="cliCommand"
                value={formData.cliCommand}
                onChange={(e) =>
                  setFormData({ ...formData, cliCommand: e.target.value })
                }
                placeholder={getConnectionPlaceholder()}
                rows={3}
              />
            </div>
          )}

          {formData.connectionMethod === 'connection-string' && (
            <div className="space-y-2">
              <Label htmlFor="connectionString">{getConnectionFieldLabel()}</Label>
              <Input
                id="connectionString"
                value={formData.connectionString}
                onChange={(e) =>
                  setFormData({ ...formData, connectionString: e.target.value })
                }
                placeholder={getConnectionPlaceholder()}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="authType">Authentication (Optional)</Label>
            <select
              id="authType"
              value={formData.authType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  authType: e.target.value as 'token' | 'username-password' | '',
                })
              }
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
            >
              <option value="">None</option>
              <option value="token">Token</option>
              <option value="username-password">Username / Password</option>
            </select>
          </div>

          {formData.authType === 'token' && (
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                type="password"
                value={formData.token}
                onChange={(e) =>
                  setFormData({ ...formData, token: e.target.value })
                }
                placeholder="Enter authentication token"
              />
            </div>
          )}

          {formData.authType === 'username-password' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter password"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isEditMode ? 'Update Connector' : 'Create Connector'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
