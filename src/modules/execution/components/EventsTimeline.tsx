import { useMemo } from 'react'
import { CheckCircle2, AlertCircle, Info, Clock, Save } from 'lucide-react'
import { useExecutionStore } from '../store/executionStore'
import { cn } from '@/lib/utils'

interface EventsTimelineProps {
  sessionId: string
}

export function EventsTimeline({ sessionId }: EventsTimelineProps) {
  const { getSession } = useExecutionStore()

  const session = getSession(sessionId)
  if (!session) return null

  // Sort events by timestamp
  const sortedEvents = useMemo(() => {
    return [...session.events].sort((a, b) => a.t - b.t)
  }, [session.events])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'checkpoint':
        return <Save className="w-4 h-4" />
      case 'evaluation':
        return <CheckCircle2 className="w-4 h-4" />
      case 'early_stopping':
        return <AlertCircle className="w-4 h-4" />
      case 'warning':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'checkpoint':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      case 'evaluation':
        return 'text-green-500 bg-green-500/10 border-green-500/20'
      case 'early_stopping':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'warning':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Events Timeline</h2>

      {sortedEvents.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p className="text-sm">No events yet</p>
          <p className="text-xs mt-1">Timeline events will appear as training progresses</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event, index) => {
            const time = new Date(event.t).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })

            return (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border',
                  getEventColor(event.type)
                )}
              >
                <div className="mt-0.5">{getEventIcon(event.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium capitalize">
                      {event.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs opacity-70">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {time}
                    </span>
                  </div>
                  <p className="text-sm">{event.message}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
