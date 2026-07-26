import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface MetricOption {
  value: string
  label: string
}

interface MetricSelectorProps {
  metrics: MetricOption[]
  selected: string
  onSelect: (metric: string) => void
  className?: string
}

export function MetricSelector({ metrics, selected, onSelect, className }: MetricSelectorProps) {
  const selectedMetric = metrics.find((m) => m.value === selected) || metrics[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('justify-between min-w-[180px]', className)}
        >
          <span>{selectedMetric?.label || 'Select metric'}</span>
          <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {metrics.map((metric) => (
          <DropdownMenuItem
            key={metric.value}
            onClick={() => onSelect(metric.value)}
            className={selected === metric.value ? 'bg-accent' : ''}
          >
            {metric.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
