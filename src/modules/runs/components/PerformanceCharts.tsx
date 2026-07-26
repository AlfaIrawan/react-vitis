import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { RunResultData } from '../store/runStore'

interface PerformanceChartsProps {
  resultData: RunResultData
}

/**
 * PerformanceCharts - Static epoch-based charts (POST-Training)
 * Module 6 - Results & Evaluation (POST-Training)
 */
export function PerformanceCharts({ resultData }: PerformanceChartsProps) {
  const chartData = useMemo(() => {
    if (!resultData.epochMetrics || resultData.epochMetrics.length === 0) {
      return []
    }

    return resultData.epochMetrics.map((metric) => ({
      epoch: metric.epoch,
      trainLoss: metric.trainLoss,
      valLoss: metric.valLoss,
      trainAcc: metric.trainAcc,
      valAcc: metric.valAcc,
    }))
  }, [resultData.epochMetrics])

  const hasLossData = chartData.some((d) => d.trainLoss !== undefined || d.valLoss !== undefined)
  const hasAccData = chartData.some((d) => d.trainAcc !== undefined || d.valAcc !== undefined)

  if (chartData.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Performance Charts</h2>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-sm">No performance data available</p>
            <p className="text-xs mt-1">Epoch metrics were not recorded for this run</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Loss Chart */}
      {hasLossData && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Training Loss vs Validation Loss</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="epoch"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                label={{ value: 'Loss', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number | undefined) => (value !== undefined ? value.toFixed(4) : 'N/A')}
              />
              <Legend />
              {chartData.some((d) => d.trainLoss !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="trainLoss"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Training Loss"
                />
              )}
              {chartData.some((d) => d.valLoss !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="valLoss"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Validation Loss"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Accuracy Chart */}
      {hasAccData && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Accuracy per Epoch</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="epoch"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                domain={[0, 1]}
                label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number | undefined) =>
                  value !== undefined ? `${(value * 100).toFixed(2)}%` : 'N/A'
                }
              />
              <Legend />
              {chartData.some((d) => d.trainAcc !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="trainAcc"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Training Accuracy"
                />
              )}
              {chartData.some((d) => d.valAcc !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="valAcc"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Validation Accuracy"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
