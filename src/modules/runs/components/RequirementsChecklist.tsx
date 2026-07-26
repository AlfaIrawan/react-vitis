import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Requirement {
  label: string
  met: boolean
  error?: string
}

interface RequirementsChecklistProps {
  requirements: Requirement[]
  className?: string
}

export function RequirementsChecklist({
  requirements,
  className,
}: RequirementsChecklistProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-semibold text-foreground mb-2">
        Requirements
      </h3>
      <div className="space-y-1.5">
        {requirements.map((req, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start gap-2 text-sm',
              req.met ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {req.met ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <span>{req.label}</span>
              {req.error && !req.met && (
                <p className="text-xs text-orange-500 mt-0.5">{req.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {requirements.every((r) => r.met) && (
        <div className="mt-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 text-sm text-green-500">
            <AlertCircle className="w-4 h-4" />
            <span>Semua requirements terpenuhi. Run siap digunakan.</span>
          </div>
        </div>
      )}
    </div>
  )
}
