import { useState, useMemo } from 'react'
import { Search, Filter } from 'lucide-react'
import { usePortfolioStore, type BusinessDomain, type Environment, type RiskLevel } from '@/modules/portfolio'
import { PortfolioModelCard } from '../components/PortfolioModelCard'
import { ValueRealizationPanel } from '../components/ValueRealizationPanel'
import { RiskHeatmap } from '../components/RiskHeatmap'
import { LifecycleInsights } from '../components/LifecycleInsights'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { Breadcrumb } from '@/components/ui/breadcrumb'

export function PortfolioOverviewPage() {
  const { getPortfolioModels, getFilteredPortfolioModels } = usePortfolioStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [domainFilter, setDomainFilter] = useState<BusinessDomain | 'all'>('all')
  const [environmentFilter, setEnvironmentFilter] = useState<Environment | 'all'>('all')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)
  
  const allModels = getPortfolioModels()
  
  // Get unique values for filters
  const uniqueDomains = useMemo(() => {
    const domains = new Set<BusinessDomain>()
    allModels.forEach(m => domains.add(m.businessDomain))
    return Array.from(domains)
  }, [allModels])
  
  const uniqueEnvironments = useMemo(() => {
    const envs = new Set<Environment>()
    allModels.forEach(m => envs.add(m.environment))
    return Array.from(envs)
  }, [allModels])
  useMemo(() => {
    const owners = new Set<string>()
    allModels.forEach(m => owners.add(m.businessOwner))
    return Array.from(owners)
  }, [allModels]);
  // Apply filters
  const filteredModels = useMemo(() => {
    let filtered = getFilteredPortfolioModels({
      domain: domainFilter !== 'all' ? domainFilter : undefined,
      environment: environmentFilter !== 'all' ? environmentFilter : undefined,
      riskLevel: riskFilter !== 'all' ? riskFilter : undefined
    })
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(query) ||
        model.businessDomain.toLowerCase().includes(query) ||
        model.useCase.toLowerCase().includes(query) ||
        model.businessOwner.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [searchQuery, domainFilter, environmentFilter, riskFilter, getFilteredPortfolioModels])
  
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Portfolio' }]} />

      {/* Header */}
      <PageHeader
        title="AI Portfolio & Value Management"
        description="Strategic oversight for executives, AI CoE, Enterprise Architecture, and Governance stakeholders"
      />
      
      {/* Value Realization Panel */}
      <ValueRealizationPanel />
      
      {/* Risk Heatmap */}
      <RiskHeatmap />
      
      {/* Portfolio Table Section */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Portfolio Overview</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search models by name, domain, use case, or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 glass-panel rounded-lg">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Domain</label>
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value as BusinessDomain | 'all')}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                >
                  <option value="all">All Domains</option>
                  {uniqueDomains.map(domain => (
                    <option key={domain} value={domain}>
                      {domain.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Environment</label>
                <select
                  value={environmentFilter}
                  onChange={(e) => setEnvironmentFilter(e.target.value as Environment | 'all')}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                >
                  <option value="all">All Environments</option>
                  {uniqueEnvironments.map(env => (
                    <option key={env} value={env}>
                      {env.charAt(0).toUpperCase() + env.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Risk Level</label>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'all')}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Results Count */}
        <div className="text-sm text-muted-foreground mb-4">
          Showing {filteredModels.length} of {allModels.length} models
        </div>
        
        {/* Models Grid */}
        {filteredModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModels.map((model) => (
              <PortfolioModelCard key={model.id} model={model} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No models found matching your criteria.</p>
            <p className="text-sm mt-2">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
      
      {/* Lifecycle Insights */}
      <LifecycleInsights />
    </div>
  )
}
