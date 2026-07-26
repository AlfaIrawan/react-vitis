import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useExecutionStore } from '../store/executionStore'

interface ResourcePanelProps {
  sessionId: string
}

export function ResourcePanel({ sessionId }: ResourcePanelProps) {
  const { getSession } = useExecutionStore()

  const session = getSession(sessionId)
  if (!session) return null

  // Prepare chart data
  const chartData = useMemo(() => {
    if (session.resourceSeries.length === 0) return []

    // Get all unique timestamps
    const allTimestamps = new Set<number>()
    session.resourceSeries.forEach((series) => {
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

      session.resourceSeries.forEach((series) => {
        const point = series.points.find((p) => p.t === timestamp)
        if (point) {
          dataPoint[series.name] = point.v
        }
      })

      return dataPoint
    })
  }, [session.resourceSeries])

  const colors = {
    gpu_util: '#8b5cf6',
    cpu_util: '#3b82f6',
    ram_util: '#10b981',
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">System Resources</h2>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-sm">No resource data yet</p>
            <p className="text-xs mt-1">Resource metrics will appear as training progresses</p>
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
              domain={[0, 100]}
              label={{ value: 'Utilization (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(2)}%`, ''] : ['', '']}
            />
            <Legend />
            {session.resourceSeries.map((series) => (
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
