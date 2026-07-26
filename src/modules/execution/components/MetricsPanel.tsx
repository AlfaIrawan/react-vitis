import { useState, useMemo, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useExecutionStore } from '../store/executionStore'
import { MetricSelector, type MetricOption } from './MetricSelector'

interface MetricsPanelProps {
  sessionId: string
}

export function MetricsPanel({ sessionId }: MetricsPanelProps) {
  const { getSession } = useExecutionStore()
  const [selectedMetric, setSelectedMetric] = useState<string>('loss')

  const session = getSession(sessionId)
  if (!session) return null

  // Prepare metric options
  const metricOptions: MetricOption[] = useMemo(() => {
    const options: MetricOption[] = []
    session.metricsSeries.forEach((series) => {
      if (!options.find((opt) => opt.value === series.name)) {
        options.push({
          value: series.name,
          label: series.name.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        })
      }
    })
    return options
  }, [session.metricsSeries])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (session.metricsSeries.length === 0) return []

    // Get all unique timestamps
    const allTimestamps = new Set<number>()
    session.metricsSeries.forEach((series) => {
      series.points.forEach((point) => allTimestamps.add(point.t))
    })

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)

    // Build data points
    return sortedTimestamps.map((timestamp) => {
      const dataPoint: Record<string, any> = {
        timestamp,
        time: new Date(timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      }

      session.metricsSeries.forEach((series) => {
        const point = series.points.find((p) => p.t === timestamp)
        if (point) {
          dataPoint[series.name] = point.v
        }
      })

      return dataPoint
    })
  }, [session.metricsSeries])

  // Filter series based on selection
  const displaySeries = useMemo(() => {
    if (selectedMetric === 'loss') {
      return session.metricsSeries.filter((s) => s.name.includes('loss'))
    } else if (selectedMetric === 'accuracy') {
      return session.metricsSeries.filter((s) => s.name.includes('acc'))
    } else {
      return session.metricsSeries.filter((s) => s.name === selectedMetric)
    }
  }, [session.metricsSeries, selectedMetric])

  // Auto-select metric group if available
  const availableGroups = useMemo(() => {
    const hasLoss = session.metricsSeries.some((s) => s.name.includes('loss'))
    const hasAcc = session.metricsSeries.some((s) => s.name.includes('acc'))
    return { loss: hasLoss, accuracy: hasAcc }
  }, [session.metricsSeries])

  // Set default selection on mount
  useEffect(() => {
    if (availableGroups.loss && selectedMetric !== 'loss' && selectedMetric !== 'accuracy') {
      setSelectedMetric('loss')
    } else if (availableGroups.accuracy && !availableGroups.loss && selectedMetric !== 'accuracy') {
      setSelectedMetric('accuracy')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableGroups.loss, availableGroups.accuracy])

  const colors = {
    train_loss: '#3b82f6',
    val_loss: '#ef4444',
    train_acc: '#10b981',
    val_acc: '#f59e0b',
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Live Metrics</h2>
        {metricOptions.length > 0 && (
          <MetricSelector
            metrics={[
              ...(availableGroups.loss ? [{ value: 'loss', label: 'Loss' }] : []),
              ...(availableGroups.accuracy ? [{ value: 'accuracy', label: 'Accuracy' }] : []),
              ...metricOptions,
            ]}
            selected={selectedMetric}
            onSelect={setSelectedMetric}
          />
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-sm">No metrics data yet</p>
            <p className="text-xs mt-1">Metrics will appear as training progresses</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="time"
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            {displaySeries.map((series) => (
              <Line
                key={series.name}
                type="monotone"
                dataKey={series.name}
                stroke={colors[series.name as keyof typeof colors] || '#8884d8'}
                strokeWidth={2}
                dot={false}
                name={series.name.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
