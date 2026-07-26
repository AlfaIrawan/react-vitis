import type { ITrainingConnectorAdapter, RunConfig } from './ITrainingConnectorAdapter'
import type { LogEntry, MetricPoint, ResourcePoint, TimelineEvent } from '../store/executionStore'
import { useExecutionStore } from '../store/executionStore'
import { generateMockLog, generateMockMetric, generateMockResource, generateMockEvent } from '../utils/mockDataGenerators'

export class MockTrainingAdapter implements ITrainingConnectorAdapter {
  private intervals: Map<string, ReturnType<typeof setInterval>[]> = new Map()
  private isPaused: Map<string, boolean> = new Map()

  async start(runConfig: RunConfig): Promise<string> {
    const store = useExecutionStore.getState()
    const session = store.startSession(runConfig.runId)

    // Update status to starting
    store.updateSession(session.sessionId, { status: 'starting' })

    // Start simulation after 3 seconds
    setTimeout(() => {
      store.updateSession(session.sessionId, { status: 'running' })
      this.startSimulation(session.sessionId)
    }, 3000)

    return session.sessionId
  }

  async stop(sessionId: string): Promise<void> {
    this.clearIntervals(sessionId)
    const store = useExecutionStore.getState()
    store.stopSession(sessionId, 'cancelled')
  }

  subscribeLogs(_sessionId: string, _callback: (log: LogEntry) => void): () => void {
    // Logs are generated in the simulation loop
    // This is a no-op for mock adapter as logs are pushed directly to store
    return () => {}
  }

  subscribeMetrics(_sessionId: string, _callback: (metricName: string, point: MetricPoint) => void): () => void {
    // Metrics are generated in the simulation loop
    return () => {}
  }

  subscribeResources(_sessionId: string, _callback: (resourceName: string, point: ResourcePoint) => void): () => void {
    // Resources are generated in the simulation loop
    return () => {}
  }

  subscribeEvents(_sessionId: string, _callback: (event: TimelineEvent) => void): () => void {
    // Events are generated in the simulation loop
    return () => {}
  }

  async getSessionStatus(sessionId: string) {
    const store = useExecutionStore.getState()
    return store.getSession(sessionId) || null
  }

  pause(sessionId: string): Promise<void> {
    this.isPaused.set(sessionId, true)
    const store = useExecutionStore.getState()
    store.pauseSession(sessionId)
    return Promise.resolve()
  }

  resume(sessionId: string): Promise<void> {
    this.isPaused.set(sessionId, false)
    const store = useExecutionStore.getState()
    store.resumeSession(sessionId)
    return Promise.resolve()
  }

  private startSimulation(sessionId: string) {
    const store = useExecutionStore.getState()
    const session = store.getSession(sessionId)
    if (!session) return

    let step = 0
    let epoch = 0
    const totalSteps = 200
    const totalEpochs = 10
    const startTime = Date.now()
    const duration = 60000 + Math.random() * 30000 // 60-90 seconds

    const interval = setInterval(() => {
      if (this.isPaused.get(sessionId)) {
        return // Skip updates when paused
      }

      const session = store.getSession(sessionId)
      if (!session || session.status !== 'running') {
        clearInterval(interval)
        return
      }

      const elapsed = Date.now() - startTime
      if (elapsed >= duration) {
        // Complete the session
        this.clearIntervals(sessionId)
        store.stopSession(sessionId, 'completed')
        store.appendLog(sessionId, {
          t: Date.now(),
          level: 'info',
          message: 'Training completed successfully',
        })
        return
      }

      step++
      if (step > totalSteps) {
        step = 0
        epoch++
        if (epoch >= totalEpochs) {
          epoch = totalEpochs - 1
        }
      }

      const progressPct = Math.min(100, ((epoch * totalSteps + step) / (totalEpochs * totalSteps)) * 100)

      // Update session progress
      store.updateSession(sessionId, {
        step,
        epoch,
        progressPct,
      })

      // Generate logs
      if (step % 10 === 0) {
        const log = generateMockLog(step, epoch, totalSteps)
        store.appendLog(sessionId, log)
      }

      // Generate metrics
      const metrics = ['train_loss', 'val_loss', 'train_acc', 'val_acc']
      metrics.forEach((metricName) => {
        const baseValue = metricName.includes('loss') ? 0.8 : 0.3
        const point = generateMockMetric(metricName, step, epoch, baseValue)
        store.appendMetric(sessionId, metricName, point)
      })

      // Generate resources
      const resources = ['gpu_util', 'ram_util']
      resources.forEach((resourceName) => {
        const point = generateMockResource(resourceName)
        store.appendResource(sessionId, resourceName, point)
      })

      // Generate events (occasionally)
      const event = generateMockEvent(step, epoch)
      if (event) {
        store.appendEvent(sessionId, event)
      }
    }, 1000) // Update every 1 second

    // Store interval for cleanup
    if (!this.intervals.has(sessionId)) {
      this.intervals.set(sessionId, [])
    }
    this.intervals.get(sessionId)!.push(interval)
  }

  private clearIntervals(sessionId: string) {
    const intervals = this.intervals.get(sessionId)
    if (intervals) {
      intervals.forEach((interval) => clearInterval(interval))
      this.intervals.delete(sessionId)
    }
    this.isPaused.delete(sessionId)
  }
}
