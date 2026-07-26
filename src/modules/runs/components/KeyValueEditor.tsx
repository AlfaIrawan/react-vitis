import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface KeyValueEditorProps {
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
  placeholder?: {
    key?: string
    value?: string
  }
}

export function KeyValueEditor({
  value,
  onChange,
  placeholder = { key: 'Parameter name', value: 'Parameter value' },
}: KeyValueEditorProps) {
  const [entries, setEntries] = useState<Array<{ key: string; value: string }>>(() => {
    return Object.entries(value).map(([key, val]) => ({ key, value: val }))
  })

  const updateEntries = (newEntries: Array<{ key: string; value: string }>) => {
    setEntries(newEntries)
    const newValue: Record<string, string> = {}
    newEntries.forEach((entry) => {
      if (entry.key.trim()) {
        newValue[entry.key.trim()] = entry.value.trim()
      }
    })
    onChange(newValue)
  }

  const addEntry = () => {
    updateEntries([...entries, { key: '', value: '' }])
  }

  const removeEntry = (index: number) => {
    updateEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: 'key' | 'value', newValue: string) => {
    const newEntries = [...entries]
    newEntries[index] = { ...newEntries[index], [field]: newValue }
    updateEntries(newEntries)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder={placeholder.key}
                value={entry.key}
                onChange={(e) => updateEntry(index, 'key', e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder={placeholder.value}
                value={entry.value}
                onChange={(e) => updateEntry(index, 'value', e.target.value)}
                className="text-sm"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => removeEntry(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addEntry}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Parameter
      </Button>
      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No parameters added. Click "Add Parameter" to add one.
        </p>
      )}
    </div>
  )
}
