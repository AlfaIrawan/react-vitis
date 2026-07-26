import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  NODE_CATALOG,
  CATEGORY_METADATA,
  SUB_CATEGORY_METADATA,
  type CatalogNode,
  type NodeCategory,
  searchNodes,
} from '../catalog/nodeCatalog'

interface NodeCatalogPaletteProps {
  onDragStart: (event: React.DragEvent, catalogNode: CatalogNode) => void
}

export function NodeCatalogPalette({ onDragStart }: NodeCatalogPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<NodeCategory>>(
    new Set(['data-preparation', 'code-execution'])
  )
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set())

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) {
      return NODE_CATALOG
    }
    return searchNodes(searchQuery)
  }, [searchQuery])

  // Group nodes by category and sub-category
  const groupedNodes = useMemo(() => {
    const grouped = new Map<NodeCategory, Map<string, CatalogNode[]>>()

    filteredNodes.forEach((node) => {
      if (!grouped.has(node.category)) {
        grouped.set(node.category, new Map())
      }
      const categoryMap = grouped.get(node.category)!
      if (!categoryMap.has(node.subCategory)) {
        categoryMap.set(node.subCategory, [])
      }
      categoryMap.get(node.subCategory)!.push(node)
    })

    return grouped
  }, [filteredNodes])

  const toggleCategory = (category: NodeCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const toggleSubCategory = (subCategory: string) => {
    setExpandedSubCategories((prev) => {
      const next = new Set(prev)
      if (next.has(subCategory)) {
        next.delete(subCategory)
      } else {
        next.add(subCategory)
      }
      return next
    })
  }

  return (
    <div className="glass-card rounded-xl p-3 w-64 h-full flex flex-col">
      <div className="mb-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Node Catalog
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {Array.from(groupedNodes.entries()).map(([category, subCategoryMap]) => {
          const categoryMeta = CATEGORY_METADATA[category]
          const CategoryIcon = categoryMeta.icon
          const isCategoryExpanded = expandedCategories.has(category)

          return (
            <div key={category} className="space-y-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  'hover:bg-accent/30',
                  categoryMeta.color
                )}
              >
                {isCategoryExpanded ? (
                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                )}
                <CategoryIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="flex-1 text-left">{categoryMeta.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {Array.from(subCategoryMap.values()).reduce((sum, nodes) => sum + nodes.length, 0)}
                </span>
              </button>

              {/* Sub-categories */}
              {isCategoryExpanded && (
                <div className="pl-4 space-y-1">
                  {Array.from(subCategoryMap.entries()).map(([subCategory, nodes]) => {
                    const subCategoryMeta = SUB_CATEGORY_METADATA[subCategory as keyof typeof SUB_CATEGORY_METADATA]
                    const SubCategoryIcon = subCategoryMeta.icon
                    const isSubCategoryExpanded = expandedSubCategories.has(subCategory)

                    return (
                      <div key={subCategory} className="space-y-0.5">
                        {/* Sub-category Header */}
                        <button
                          onClick={() => toggleSubCategory(subCategory)}
                          className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-all"
                        >
                          {isSubCategoryExpanded ? (
                            <ChevronDown className="w-2.5 h-2.5" />
                          ) : (
                            <ChevronRight className="w-2.5 h-2.5" />
                          )}
                          <SubCategoryIcon className="w-3 h-3" />
                          <span className="flex-1 text-left">{subCategoryMeta.label}</span>
                          <span className="text-[10px]">{nodes.length}</span>
                        </button>

                        {/* Nodes */}
                        {isSubCategoryExpanded && (
                          <div className="pl-4 space-y-0.5">
                            {nodes.map((node) => {
                              const NodeIcon = node.icon
                              return (
                                <Tooltip key={node.id} content={node.description ?? node.name} side="bottom">
                                  <div
                                    draggable
                                    onDragStart={(e) => onDragStart(e, node)}
                                    className={cn(
                                      'flex items-center gap-2 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing',
                                      'border border-transparent hover:border-border/50 transition-all',
                                      'hover:bg-accent/30',
                                      'group'
                                    )}
                                  >
                                  <NodeIcon className="w-3 h-3 flex-shrink-0 text-muted-foreground group-hover:text-foreground" />
                                  <span className="text-xs font-medium flex-1 text-left">{node.name}</span>
                                  {node.requiresExpertise && (
                                    <Tooltip content="Requires technical expertise" side="bottom">
                                      <span className="inline-flex"><AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" /></span>
                                    </Tooltip>
                                  )}
                                  </div>
                                </Tooltip>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info Footer */}
      <div className="mt-3 pt-3 border-t border-border/20">
        <p className="text-[10px] text-muted-foreground text-center">
          {filteredNodes.length} node{filteredNodes.length !== 1 ? 's' : ''} available
        </p>
      </div>
    </div>
  )
}
