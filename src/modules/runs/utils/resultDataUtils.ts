import type { RunExecutionSession } from '../../execution/store/executionStore'
import type { RunResultData } from '../store/runStore'

/**
 * Convert execution session to RunResultData for Module 6
 * This utility extracts final metrics and epoch-based data from a completed execution session
 */
export function convertSessionToResultData(
  session: RunExecutionSession,
  totalEpochs: number = 10
): RunResultData {
  const isFailed = session.status === 'failed'
  const isCancelled = session.status === 'cancelled'
  const isCompleted = session.status === 'completed'

  // Extract final metrics from the last points in each series
  const getFinalMetric = (metricName: string): number | undefined => {
    const series = session.metricsSeries.find((s) => s.name === metricName)
    if (!series || series.points.length === 0) return undefined
    return series.points[series.points.length - 1].v
  }

  const finalAccuracy = getFinalMetric('train_acc')
  const validationAccuracy = getFinalMetric('val_acc')
  const finalLoss = getFinalMetric('train_loss')

  // Build epoch-based metrics by grouping metrics by epoch
  // This is a simplified version - in reality, you'd need to track epoch boundaries
  const epochMetrics: RunResultData['epochMetrics'] = []
  if (session.metricsSeries.length > 0) {
    // Group metrics by approximate epoch (based on progress)
    const epochCount = Math.max(session.epoch, totalEpochs)
    for (let epoch = 1; epoch <= epochCount; epoch++) {
      const epochProgress = epoch / epochCount
      const targetTimestamp = session.startedAt + (session.endedAt || Date.now() - session.startedAt) * epochProgress

      const trainLossSeries = session.metricsSeries.find((s) => s.name === 'train_loss')
      const valLossSeries = session.metricsSeries.find((s) => s.name === 'val_loss')
      const trainAccSeries = session.metricsSeries.find((s) => s.name === 'train_acc')
      const valAccSeries = session.metricsSeries.find((s) => s.name === 'val_acc')

      const findClosestPoint = (series: typeof trainLossSeries, targetTime: number) => {
        if (!series || series.points.length === 0) return undefined
        let closest = series.points[0]
        let minDiff = Math.abs(series.points[0].t - targetTime)
        for (const point of series.points) {
          const diff = Math.abs(point.t - targetTime)
          if (diff < minDiff) {
            minDiff = diff
            closest = point
          }
        }
        return closest
      }

      epochMetrics.push({
        epoch,
        trainLoss: findClosestPoint(trainLossSeries, targetTimestamp)?.v,
        valLoss: findClosestPoint(valLossSeries, targetTimestamp)?.v,
        trainAcc: findClosestPoint(trainAccSeries, targetTimestamp)?.v,
        valAcc: findClosestPoint(valAccSeries, targetTimestamp)?.v,
      })
    }
  }

  return {
    finalAccuracy,
    validationAccuracy,
    finalLoss,
    totalEpochs,
    completedEpochs: isCompleted ? totalEpochs : session.epoch,
    epochMetrics: epochMetrics.length > 0 ? epochMetrics : undefined,
    startTime: new Date(session.startedAt).toISOString(),
    endTime: session.endedAt ? new Date(session.endedAt).toISOString() : new Date().toISOString(),
    durationSeconds: session.endedAt
      ? Math.floor((session.endedAt - session.startedAt) / 1000)
      : Math.floor((Date.now() - session.startedAt) / 1000),
    errorMessage: isFailed ? session.errorMessage : undefined,
    errorSummary: isFailed ? session.errorMessage : undefined,
    artifacts: isCompleted
      ? [
          {
            name: 'model.pth',
            type: 'model' as const,
            size: 1024 * 1024 * 50, // 50 MB
            path: `/artifacts/${session.sessionId}/model.pth`,
          },
          {
            name: 'metrics.json',
            type: 'metrics' as const,
            size: 1024 * 10, // 10 KB
            path: `/artifacts/${session.sessionId}/metrics.json`,
          },
          {
            name: 'config.yaml',
            type: 'config' as const,
            size: 1024 * 2, // 2 KB
            path: `/artifacts/${session.sessionId}/config.yaml`,
          },
        ]
      : undefined,
  }
}
