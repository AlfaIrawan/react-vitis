import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, Copy, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useExecutionStore } from '../store/executionStore'
import { cn } from '@/lib/utils'

interface LogsConsoleProps {
  sessionId: string
}

export function LogsConsole({ sessionId }: LogsConsoleProps) {
  const { getSession } = useExecutionStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [copied, setCopied] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const session = getSession(sessionId)
  if (!session) return null

  // Filter logs
  const filteredLogs = useMemo(() => {
    let logs = session.logs

    // Level filter
    if (levelFilter !== 'all') {
      logs = logs.filter((log) => log.level === levelFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      logs = logs.filter((log) => log.message.toLowerCase().includes(query))
    }

    return logs
  }, [session.logs, levelFilter, searchQuery])

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [filteredLogs, autoScroll])

  const handleCopy = async () => {
    const logText = filteredLogs
      .map((log) => {
        const time = new Date(log.t).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        return `[${time}] [${log.level.toUpperCase()}] ${log.message}`
      })
      .join('\n')

    await navigator.clipboard.writeText(logText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500'
      case 'warn':
        return 'text-yellow-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Logs</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
            className={autoScroll ? 'bg-accent' : ''}
          >
            Auto-scroll
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy logs
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1">
          {(['all', 'info', 'warn', 'error'] as const).map((level) => (
            <Button
              key={level}
              variant={levelFilter === level ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLevelFilter(level)}
              className="capitalize"
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      {/* Logs Container */}
      <div className="bg-black/20 dark:bg-black/40 rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No logs available</p>
            {session.logs.length === 0 && (
              <p className="text-xs mt-1">Logs will appear as training progresses</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log, index) => {
              const time = new Date(log.t).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                fractionalSecondDigits: 3,
              })

              return (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    [{time}]
                  </span>
                  <span className={cn('text-xs font-medium', getLevelColor(log.level))}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="text-foreground flex-1">{log.message}</span>
                </div>
              )
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {filteredLogs.length} of {session.logs.length} log entries
      </div>
    </div>
  )
}
