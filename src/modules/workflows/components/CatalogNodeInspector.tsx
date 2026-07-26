import { useState, useEffect } from 'react'
import { AlertTriangle, Eye } from 'lucide-react'
import type { CatalogNodeData } from '../types'
import { getNodeById } from '../catalog/nodeCatalog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CatalogNodeInspectorProps {
  nodeData: CatalogNodeData
  onUpdate: (updates: Partial<CatalogNodeData>) => void
}

export function CatalogNodeInspector({ nodeData, onUpdate }: CatalogNodeInspectorProps) {
  const catalogNode = getNodeById(nodeData.catalogNodeId)
  if (!catalogNode) return null

  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [codeContent, setCodeContent] = useState<string>('')

  useEffect(() => {
    if (catalogNode.configSchema.type === 'form') {
      setFormValues((nodeData.config as Record<string, any>) || {})
    } else {
      setCodeContent((nodeData.config as any)?.code || '')
    }
  }, [nodeData.config, catalogNode.configSchema.type])

  const handleFormFieldChange = (fieldName: string, value: any) => {
    const newValues = { ...formValues, [fieldName]: value }
    setFormValues(newValues)
    onUpdate({ config: newValues })
  }

  const handleCodeChange = (value: string) => {
    setCodeContent(value)
    onUpdate({ config: { code: value } })
  }

  const renderFormField = (field: any) => {
    const value = formValues[field.name] ?? field.default ?? ''

    switch (field.type) {
      case 'string':
        return (
          <Input
            key={field.name}
            value={value}
            onChange={(e) => handleFormFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="h-7 text-xs mt-1"
          />
        )
      case 'number':
        return (
          <Input
            key={field.name}
            type="number"
            value={value}
            onChange={(e) => handleFormFieldChange(field.name, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            className="h-7 text-xs mt-1"
          />
        )
      case 'boolean':
        return (
          <div key={field.name} className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFormFieldChange(field.name, e.target.checked)}
              className="w-3.5 h-3.5 rounded border border-input"
            />
            <span className="text-xs text-muted-foreground">{field.label}</span>
          </div>
        )
      case 'select':
        return (
          <select
            key={field.name}
            value={value}
            onChange={(e) => handleFormFieldChange(field.name, e.target.value)}
            className="w-full h-7 text-xs mt-1 px-2 rounded-md border border-input bg-background"
          >
            {field.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )
      case 'multiselect':
        return (
          <div key={field.name} className="space-y-1 mt-1">
            {field.options?.map((opt: any) => {
              const selected = Array.isArray(value) ? value.includes(opt.value) : false
              return (
                <label key={opt.value} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      const current = Array.isArray(value) ? value : []
                      const newValue = e.target.checked
                        ? [...current, opt.value]
                        : current.filter((v) => v !== opt.value)
                      handleFormFieldChange(field.name, newValue)
                    }}
                    className="w-3.5 h-3.5 rounded border border-input"
                  />
                  <span>{opt.label}</span>
                </label>
              )
            })}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-3">
      {/* Node Info */}
      <div className="pb-3 border-b border-border/20">
        <div className="flex items-start gap-2 mb-1">
          <catalogNode.icon className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-foreground">{catalogNode.name}</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">{catalogNode.description}</p>
          </div>
        </div>
        {catalogNode.requiresExpertise && (
          <div className="mt-2 p-2 rounded bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-orange-600" />
              <p className="text-[10px] text-orange-600 font-medium">
                This node requires technical expertise
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Configuration */}
      {catalogNode.configSchema.type === 'form' ? (
        <div className="space-y-3">
          {catalogNode.configSchema.fields?.map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name} className="text-xs">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {renderFormField(field)}
            </div>
          ))}
          {catalogNode.previewable && (
            <Button variant="outline" size="sm" className="w-full mt-2" disabled>
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Preview Data (Coming Soon)
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs">
            {catalogNode.configSchema.codeLanguage?.toUpperCase() || 'CODE'} Script
          </Label>
          <Textarea
            value={codeContent}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={`Enter ${catalogNode.configSchema.codeLanguage || 'code'} script...`}
            className="h-48 text-xs font-mono mt-1 resize-none"
          />
          <div className="p-2 rounded bg-muted/30 border border-border/50">
            <p className="text-[10px] text-muted-foreground">
              <strong>Note:</strong> Code execution will be available in Phase 2. This is a preview only.
            </p>
          </div>
        </div>
      )}

      {/* Inputs/Outputs Info */}
      <div className="pt-3 border-t border-border/20 space-y-2">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">Inputs</p>
          <div className="space-y-0.5">
            {catalogNode.inputs.map((input) => (
              <div key={input.id} className="text-[10px] text-muted-foreground">
                • {input.name} {input.required && <span className="text-destructive">*</span>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">Outputs</p>
          <div className="space-y-0.5">
            {catalogNode.outputs.map((output) => (
              <div key={output.id} className="text-[10px] text-muted-foreground">
                • {output.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
