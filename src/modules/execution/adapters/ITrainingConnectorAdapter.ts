import type { RunExecutionSession, LogEntry, MetricPoint, TimelineEvent, ResourcePoint } from '@/modules/execution'

export interface RunConfig {
  runId: string
  name: string
  projectId: string
  datasetId: string
  trainerId: string
  computeId: string
  parameters: Record<string, string>
  [key: string]: any
}

export interface ITrainingConnectorAdapter {
  /**
   * Start a training session
   * @param runConfig Configuration for the run
   * @returns Promise resolving to sessionId
   */
  start(runConfig: RunConfig): Promise<string>

  /**
   * Stop a training session
   * @param sessionId Session ID to stop
   */
  stop(sessionId: string): Promise<void>

  /**
   * Subscribe to log updates
   * @param sessionId Session ID
   * @param callback Callback function for log entries
   * @returns Unsubscribe function
   */
  subscribeLogs(sessionId: string, callback: (log: LogEntry) => void): () => void

  /**
   * Subscribe to metric updates
   * @param sessionId Session ID
   * @param callback Callback function for metric points
   * @returns Unsubscribe function
   */
  subscribeMetrics(sessionId: string, callback: (metricName: string, point: MetricPoint) => void): () => void

  /**
   * Subscribe to resource updates
   * @param sessionId Session ID
   * @param callback Callback function for resource points
   * @returns Unsubscribe function
   */
  subscribeResources(sessionId: string, callback: (resourceName: string, point: ResourcePoint) => void): () => void

  /**
   * Subscribe to event updates
   * @param sessionId Session ID
   * @param callback Callback function for timeline events
   * @returns Unsubscribe function
   */
  subscribeEvents(sessionId: string, callback: (event: TimelineEvent) => void): () => void

  /**
   * Get current session status
   * @param sessionId Session ID
   * @returns Current session or null
   */
  getSessionStatus(sessionId: string): Promise<RunExecutionSession | null>

  /**
   * Pause a running session (if supported)
   * @param sessionId Session ID
   */
  pause?(sessionId: string): Promise<void>

  /**
   * Resume a paused session (if supported)
   * @param sessionId Session ID
   */
  resume?(sessionId: string): Promise<void>
}
