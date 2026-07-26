import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Globe, 
  Shield, 
  Monitor,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Server,
  TestTube,
  Info,
  Check,
  Search
} from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { getSession, logout, type Session } from '@/auth/authService'
import { cn } from '@/lib/utils'

type SettingsSection = 'environment' | 'security' | 'system' | 'model-sources'

/**
 * Settings Page
 * 
 * User-facing settings page with sections for:
 * - Environment: Environment info and feature flags
 * - Security: Session info and security settings
 * - Model Sources: External model source configuration
 * - System: Application info and version
 */
export function PlatformSettingsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeSection, setActiveSection] = useState<SettingsSection>('environment')
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const currentSession = getSession()
    setSession(currentSession)
  }, [])

  // Handle query parameter for section navigation
  useEffect(() => {
    const sectionParam = searchParams.get('section')
    if (sectionParam && ['environment', 'security', 'model-sources', 'system'].includes(sectionParam)) {
      setActiveSection(sectionParam as SettingsSection)
    }
  }, [searchParams])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const sections: { id: SettingsSection; label: string; icon: typeof Globe }[] = [
    { id: 'environment', label: 'Environment', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'model-sources', label: 'Model Sources', icon: Server },
    { id: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Settings' }]} />

      {/* Header */}
      <PageHeader
        title="Settings"
        description="Manage your account settings, preferences, and system configuration."
      />

      {/* Settings Layout */}
      <div className="flex gap-6">
        {/* Left Sidebar Navigation */}
        <div className="w-64 shrink-0">
          <Card className="glass-card">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{section.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 min-w-0">
          {activeSection === 'environment' && <EnvironmentSection />}
          {activeSection === 'security' && <SecuritySection session={session} onLogout={handleLogout} />}
          {activeSection === 'model-sources' && <ModelSourcesSection />}
          {activeSection === 'system' && <SystemSection />}
        </div>
      </div>
    </div>
  )
}

// Shared layout wrapper for settings sections (matches Model Sources)
function SettingsSectionLayout({
  title,
  description,
  children,
  sidebar,
}: {
  title: string
  description: string
  children: ReactNode
  sidebar: ReactNode
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">{children}</div>
        <div className="space-y-6">{sidebar}</div>
      </div>
    </div>
  )
}

// Environment Section
function EnvironmentSection() {
  const flags = ['Advanced Analytics', 'Beta Features', 'Export Reports', 'API Integrations']
  return (
    <SettingsSectionLayout
      title="Environment"
      description="View current environment configuration and feature flags."
      sidebar={
        <>
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-primary shrink-0" />
                Environment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Configuration</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Environment and API mode are configured by your deployment. Feature flags control optional capabilities.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 space-y-2">
                <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Feature Flags</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Toggled by administrators. Contact your admin to enable or disable features.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      }
    >
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold mb-1">Environment & Flags</CardTitle>
              <CardDescription className="text-xs">
                Current configuration and feature toggles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Environment</Label>
              <div>
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                  Production
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">API Mode</Label>
              <div>
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Mock Data (active)
                </span>
              </div>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Feature Flags</Label>
            <div className="space-y-2">
              {flags.map((flag) => (
                <div
                  key={flag}
                  className="p-3.5 rounded-lg border border-border/20 bg-background/50 flex items-center justify-between hover:bg-accent/30 transition-colors"
                >
                  <span className="text-sm font-medium">{flag}</span>
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                    Enabled
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </SettingsSectionLayout>
  )
}

// Security Section
function SecuritySection({ session, onLogout }: { session: Session | null; onLogout: () => void }) {
  return (
    <SettingsSectionLayout
      title="Security"
      description="Manage your security settings and active sessions."
      sidebar={
        <>
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-primary shrink-0" />
                Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Active Session</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your session is stored locally. Logging out clears the token from this device only.
                </p>
              </div>
              <Card className="glass-card bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 shrink-0">
                      <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Tip</p>
                      <p className="text-xs text-purple-600/80 dark:text-purple-400/80 leading-relaxed">
                        Log out from shared devices to protect your account.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </>
      }
    >
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold mb-1">Security & Session</CardTitle>
              <CardDescription className="text-xs">
                Session details and logout
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Session ID</Label>
              <Input value={session?.token || ''} readOnly className="bg-background/50 font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Login Timestamp</Label>
              <Input
                value={session?.loginAt ? new Date(session.loginAt).toLocaleString() : ''}
                readOnly
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Auth Method</Label>
              <Input value="localStorage" readOnly className="bg-background/50" />
            </div>
          </div>
          <Separator className="my-6" />
          <Button onClick={onLogout} variant="outline" className="w-full h-10">
            <LogOut className="w-4 h-4 mr-2" />
            Logout from this device
          </Button>
        </CardContent>
      </Card>
    </SettingsSectionLayout>
  )
}

// Model Sources Section
const ITEMS_PER_PAGE = 10

function ModelSourcesSection() {
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434')
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const { addToast } = useToast()

  // Load saved Ollama host from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ollama-host')
    if (saved) {
      setOllamaHost(saved)
    }
  }, [])

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus('idle')
    
    try {
      // Real Ollama API call: Test connection by fetching tags
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`${ollamaHost}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      await response.json() // Just verify response is valid
      
      // Connection successful
      setConnectionStatus('success')
      addToast({
        title: 'Connection Successful',
        description: `Successfully connected to Ollama at ${ollamaHost}`,
        variant: 'success',
      })
    } catch (error: any) {
      setConnectionStatus('error')
      // Clear models data when connection fails
      setOllamaModels([])
      const errorMessage = error.name === 'AbortError' 
        ? 'Connection timeout. Please check if Ollama is running.'
        : error.message || 'Could not connect to Ollama.'
      
      addToast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'error',
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleFetchModels = async () => {
    try {
      // Real Ollama API call: Fetch list of available models
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(`${ollamaHost}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Parse models from Ollama API response
      // Response format: { models: [{ name: "model:tag", ... }] }
      const models = data.models?.map((model: any) => model.name) || []
      
      setOllamaModels(models)
      
      if (models.length === 0) {
        addToast({
          title: 'No Models Found',
          description: 'No models are available. Pull a model first using `ollama pull <model-name>`.',
          variant: 'info',
        })
      } else {
        addToast({
          title: 'Models Fetched',
          description: `Found ${models.length} local model${models.length > 1 ? 's' : ''}.`,
          variant: 'success',
        })
      }
    } catch (error: any) {
      const errorMessage = error.name === 'AbortError'
        ? 'Request timeout. Please check your connection.'
        : error.message || 'Could not fetch Ollama models.'
      
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      })
      setOllamaModels([])
    }
  }

  const handleSaveHost = () => {
    localStorage.setItem('ollama-host', ollamaHost)
    addToast({
      title: 'Settings Saved',
      description: 'Ollama host configuration saved.',
      variant: 'success',
    })
  }

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) {
      return ollamaModels
    }
    const query = searchQuery.toLowerCase()
    return ollamaModels.filter((model) => 
      model.toLowerCase().includes(query)
    )
  }, [ollamaModels, searchQuery])

  // Pagination logic (based on filtered models)
  const totalPages = Math.ceil(filteredModels.length / ITEMS_PER_PAGE)
  const paginatedModels = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredModels.slice(startIndex, endIndex)
  }, [filteredModels, currentPage])

  // Reset to page 1 when models or search query change
  useEffect(() => {
    setCurrentPage(1)
  }, [ollamaModels.length, searchQuery])

  return (
    <SettingsSectionLayout
      title="Model Sources"
      description="Configure external model sources for base model registration."
      sidebar={
        <>
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary shrink-0" />
                Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                <h4 className="text-sm font-semibold text-foreground">System-Level Models</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ollama models are system-level resources. Projects can reference registered base models, but cannot create orphan base models.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 space-y-2">
                <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Quick Setup</h4>
                <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside pl-1">
                  <li className="leading-relaxed">Ensure Ollama is running</li>
                  <li className="leading-relaxed">Enter your Ollama host URL</li>
                  <li className="leading-relaxed">Test the connection</li>
                  <li className="leading-relaxed">Fetch available models</li>
                </ol>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 shrink-0">
                  <TestTube className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    Important Note
                  </p>
                  <p className="text-xs text-purple-600/80 dark:text-purple-400/80 leading-relaxed">
                    Ollama models are system-level. Projects can reference registered base models, but cannot create orphan base models.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      }
    >
      <div className="space-y-6">
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold mb-1">Ollama Configuration</CardTitle>
                <CardDescription className="text-xs">
                  Connect to your local Ollama instance to register models
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
              {/* Host Configuration */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ollama-host" className="text-sm font-semibold">
                    Ollama Host URL
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Configure Ollama to register local models as base models. Ollama models are system-level and can be referenced by projects.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="ollama-host"
                    value={ollamaHost}
                    onChange={(e) => setOllamaHost(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveHost}
                    variant="default"
                    className="shrink-0 px-4"
                  >
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span>Default:</span>
                  <code className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono">http://localhost:11434</code>
                </p>
              </div>

              <Separator className="my-6" />

              {/* Connection Actions */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Connection & Models</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    variant={connectionStatus === 'success' ? 'default' : 'outline'}
                    className="w-full h-10"
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button
                    onClick={handleFetchModels}
                    disabled={connectionStatus !== 'success'}
                    variant="outline"
                    className="w-full h-10"
                  >
                    <Server className="mr-2 h-4 w-4" />
                    Fetch Models
                  </Button>
                </div>
                
                {/* Connection Status */}
                {connectionStatus !== 'idle' && (
                  <div className={`p-3.5 rounded-lg border ${
                    connectionStatus === 'success' 
                      ? 'bg-green-500/10 border-green-500/20' 
                      : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {connectionStatus === 'success' ? (
                        <>
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Connection Successful
                          </span>
                        </>
                      ) : (
                        <>
                          <TestTube className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                            Connection Failed
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
          </CardContent>
        </Card>

        {/* Available Models Card */}
        {ollamaModels.length > 0 && (
          <Card className="glass-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold mb-1">Available Local Models</CardTitle>
                    <CardDescription className="text-xs">
                      {searchQuery 
                        ? `${filteredModels.length} of ${ollamaModels.length} model${filteredModels.length > 1 ? 's' : ''} found`
                        : `${ollamaModels.length} model${ollamaModels.length > 1 ? 's' : ''} found`
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Models List */}
                {filteredModels.length === 0 ? (
                  <div className="p-8 rounded-lg border border-border/20 bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">
                      No models found matching "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {paginatedModels.map((model) => (
                        <div
                          key={model}
                          className="p-3.5 rounded-lg border border-border/20 bg-background/50 hover:bg-accent/50 hover:border-border/40 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-1.5 rounded bg-primary/10 shrink-0">
                              <Server className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="text-sm font-mono truncate">{model}</span>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0 ml-2">
                            Local
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-border/20">
                        <div className="text-xs text-muted-foreground">
                          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                          {Math.min(currentPage * ITEMS_PER_PAGE, filteredModels.length)} of{' '}
                          {filteredModels.length} model{filteredModels.length > 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <p className="text-xs text-muted-foreground pt-2 border-t border-border/20">
                  These models can be registered as base models from the Base Models page.
                </p>
              </CardContent>
          </Card>
        )}
      </div>
    </SettingsSectionLayout>
  )
}

// System Section
function SystemSection() {
  const browserInfo = typeof navigator !== 'undefined' 
    ? `${navigator.userAgent.split(' ')[0]} ${navigator.userAgent.match(/version\/(\d+)/i)?.[1] || ''}`.trim()
    : 'Unknown'

  const systemFields = [
    { label: 'Application Name', value: 'Vitis' },
    { label: 'Version', value: 'v1.0.0' },
    { label: 'Module', value: 'Core Shell' },
    { label: 'Last Updated', value: new Date().toLocaleDateString() },
    { label: 'Browser', value: browserInfo },
  ]

  return (
    <SettingsSectionLayout
      title="System"
      description="Application information and system details."
      sidebar={
        <>
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-primary shrink-0" />
                System Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Core Shell</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This module provides the main application shell, navigation, and platform settings.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 space-y-2">
                <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Version</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  v1.0.0 — Module 1: Core Shell. Check for updates periodically.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      }
    >
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold mb-1">System Details</CardTitle>
              <CardDescription className="text-xs">
                Application and environment information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {systemFields.map(({ label, value }) => (
              <div key={label} className="space-y-2">
                <Label className="text-sm font-semibold">{label}</Label>
                <Input value={value} readOnly className="bg-background/50" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </SettingsSectionLayout>
  )
}
