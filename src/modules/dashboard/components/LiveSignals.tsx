import { useMemo } from 'react'
import { TrendingUp, Clock, AlertCircle, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { useDashboardStore } from '@/modules/dashboard'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'

type TrendDirection = 'improving' | 'stable' | 'degrading'

function calculateTrend(data: Array<{ time: string; value: number }>): TrendDirection {
  if (data.length < 2) return 'stable'
  
  // Compare first quarter vs last quarter to determine trend
  const firstQuarter = data.slice(0, Math.ceil(data.length / 4))
  const lastQuarter = data.slice(-Math.ceil(data.length / 4))
  
  const firstAvg = firstQuarter.reduce((sum, d) => sum + d.value, 0) / firstQuarter.length
  const lastAvg = lastQuarter.reduce((sum, d) => sum + d.value, 0) / lastQuarter.length
  
  const changePercent = ((lastAvg - firstAvg) / firstAvg) * 100
  
  // Threshold: > 5% change is significant
  if (changePercent > 5) return 'improving'
  if (changePercent < -5) return 'degrading'
  return 'stable'
}

function TrendLabel({ trend, metricType }: { trend: TrendDirection; metricType: 'requests' | 'latency' | 'error' | 'drift' }) {
  // For error rate and drift, "improving" means decreasing, "degrading" means increasing
  const isInverse = metricType === 'error' || metricType === 'drift'
  
  const config = {
    improving: {
      label: isInverse ? '↓ decreasing' : '↑ improving',
      icon: isInverse ? ArrowDown : ArrowUp,
      className: 'text-green-600 dark:text-green-400',
    },
    stable: {
      label: '→ stable',
      icon: Minus,
      className: 'text-gray-600 dark:text-gray-400',
    },
    degrading: {
      label: isInverse ? '↑ increasing' : '↓ degrading',
      icon: isInverse ? ArrowUp : ArrowDown,
      className: 'text-red-600 dark:text-red-400',
    },
  }
  
  const { label, icon: Icon, className } = config[trend]
  
  return (
    <div className={cn('flex items-center gap-1 text-[10px] font-medium', className)}>
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </div>
  )
}

// Generate sparkline data (last 24 hours, hourly)
// Uses deterministic pseudo-random based on value to ensure stability
function generateSparklineData(value: number, variance: number = 0.2, seed: number = 0) {
  const data = []
  const now = Date.now()
  // Use a simple seeded random for deterministic results
  let seedValue = seed || value
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280
    return seedValue / 233280
  }
  
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now - i * 60 * 60 * 1000)
    const baseValue = value / 24
    const variation = (seededRandom() - 0.5) * variance * baseValue
    data.push({
      time: timestamp.toLocaleTimeString('en-US', { hour: 'numeric' }),
      value: Math.max(0, baseValue + variation),
    })
  }
  return data
}

function SparklineChart({ 
  data, 
  id, 
  color = '#3b82f6' 
}: { 
  data: Array<{ time: string; value: number }>; 
  id: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data} key={id}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
        />
        <XAxis hide dataKey="time" />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '6px',
            padding: '4px 8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
          labelStyle={{ color: '#1f2937' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function LiveSignals() {
  const getMetrics = useDashboardStore((state) => state.getMetrics)
  const metrics = getMetrics()

  // Memoize sparkline data to prevent infinite re-renders
  const requestsData = useMemo(
    () => generateSparklineData(metrics.liveSignals.requests24h, 0.3, metrics.liveSignals.requests24h),
    [metrics.liveSignals.requests24h]
  )
  
  const latencyData = useMemo(
    () => generateSparklineData(metrics.liveSignals.avgLatencyP95, 0.2, metrics.liveSignals.avgLatencyP95),
    [metrics.liveSignals.avgLatencyP95]
  )
  
  const errorRateData = useMemo(
    () => generateSparklineData(metrics.liveSignals.errorRate, 0.15, metrics.liveSignals.errorRate * 1000),
    [metrics.liveSignals.errorRate]
  )
  
  const driftData = useMemo(
    () => generateSparklineData(metrics.liveSignals.driftWarningsCount, 0.1, metrics.liveSignals.driftWarningsCount),
    [metrics.liveSignals.driftWarningsCount]
  )

  // Calculate trends for each metric
  const requestsTrend = useMemo(() => calculateTrend(requestsData), [requestsData])
  const latencyTrend = useMemo(() => calculateTrend(latencyData), [latencyData])
  const errorTrend = useMemo(() => calculateTrend(errorRateData), [errorRateData])
  const driftTrend = useMemo(() => calculateTrend(driftData), [driftData])

  const signals = useMemo(() => [
    {
      title: 'Requests (24h)',
      value: metrics.liveSignals.requests24h.toLocaleString(),
      icon: TrendingUp,
      color: 'text-blue-500',
      chartColor: '#3b82f6',
      sparklineData: requestsData,
      trend: requestsTrend,
      metricType: 'requests' as const,
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Avg Latency (P95)',
      value: `${metrics.liveSignals.avgLatencyP95}ms`,
      icon: Clock,
      color: 'text-purple-500',
      chartColor: '#a855f7',
      sparklineData: latencyData,
      trend: latencyTrend,
      metricType: 'latency' as const,
      iconBg: 'bg-purple-50',
    },
    {
      title: 'Error Rate',
      value: `${metrics.liveSignals.errorRate.toFixed(2)}%`,
      icon: AlertCircle,
      color: metrics.liveSignals.errorRate > 5 ? 'text-red-500' : 'text-green-500',
      chartColor: metrics.liveSignals.errorRate > 5 ? '#ef4444' : '#22c55e',
      sparklineData: errorRateData,
      trend: errorTrend,
      metricType: 'error' as const,
      iconBg: metrics.liveSignals.errorRate > 5 ? 'bg-red-50' : 'bg-green-50',
    },
    {
      title: 'Drift Warnings',
      value: metrics.liveSignals.driftWarningsCount.toString(),
      icon: Activity,
      color: metrics.liveSignals.driftWarningsCount > 0 ? 'text-orange-500' : 'text-gray-500',
      chartColor: metrics.liveSignals.driftWarningsCount > 0 ? '#f97316' : '#6b7280',
      sparklineData: driftData,
      trend: driftTrend,
      metricType: 'drift' as const,
      iconBg: metrics.liveSignals.driftWarningsCount > 0 ? 'bg-orange-50' : 'bg-gray-50',
    },
  ], [metrics.liveSignals, requestsData, latencyData, errorRateData, driftData, requestsTrend, latencyTrend, errorTrend, driftTrend])

  return (
    <div className="glass-card-neon rounded-xl p-3">
      <h2 className="text-xs font-semibold text-gray-900 mb-3">
        Live Signals
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {signals.map((signal) => {
          const Icon = signal.icon
          return (
            <div key={signal.title} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('p-1.5 rounded', signal.iconBg)}>
                    <Icon className={cn('w-4 h-4', signal.color)} />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {signal.title}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-bold text-gray-900">
                  {signal.value}
                </p>
                <TrendLabel trend={signal.trend} metricType={signal.metricType} />
              </div>
              <div className="h-10">
                <SparklineChart 
                  data={signal.sparklineData} 
                  id={signal.title} 
                  color={signal.chartColor}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
