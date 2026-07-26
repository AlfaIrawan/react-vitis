import type { ITrainingConnectorAdapter, RunConfig } from './ITrainingConnectorAdapter'
import type { LogEntry, MetricPoint, ResourcePoint, TimelineEvent, RunExecutionSession } from '../store/executionStore'

/**
 * API Training Adapter - Integration-ready stub
 * 
 * This adapter is designed to connect to a REST API backend.
 * Implementation will be completed when backend API is available.
 */
export class ApiTrainingAdapter implements ITrainingConnectorAdapter {
  constructor(_baseUrl: string = '/api/v1') {
    // TODO: Store baseUrl when implementing API calls
  }

  async start(_runConfig: RunConfig): Promise<string> {
    // TODO: Implement API call to start training
    // const response = await fetch(`${this.baseUrl}/training/start`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(runConfig),
    // })
    // const data = await response.json()
    // return data.sessionId

    throw new Error('API Training Adapter not yet implemented. Backend API required.')
  }

  async stop(_sessionId: string): Promise<void> {
    // TODO: Implement API call to stop training
    // await fetch(`${this._baseUrl}/training/${sessionId}/stop`, {
    //   method: 'POST',
    // })

    throw new Error('API Training Adapter not yet implemented. Backend API required.')
  }

  subscribeLogs(_sessionId: string, _callback: (log: LogEntry) => void): () => void {
    // TODO: Implement WebSocket or SSE connection for logs
    // const ws = new WebSocket(`${this.wsBaseUrl}/training/${sessionId}/logs`)
    // ws.onmessage = (event) => {
    //   const log = JSON.parse(event.data)
    //   callback(log)
    // }
    // return () => ws.close()

    return () => {}
  }

  subscribeMetrics(_sessionId: string, _callback: (metricName: string, point: MetricPoint) => void): () => void {
    // TODO: Implement WebSocket or SSE connection for metrics
    return () => {}
  }

  subscribeResources(_sessionId: string, _callback: (resourceName: string, point: ResourcePoint) => void): () => void {
    // TODO: Implement WebSocket or SSE connection for resources
    return () => {}
  }

  subscribeEvents(_sessionId: string, _callback: (event: TimelineEvent) => void): () => void {
    // TODO: Implement WebSocket or SSE connection for events
    return () => {}
  }

  async getSessionStatus(_sessionId: string): Promise<RunExecutionSession | null> {
    // TODO: Implement API call to get session status
    // const response = await fetch(`${this._baseUrl}/training/${sessionId}/status`)
    // return await response.json()

    return null
  }
}
