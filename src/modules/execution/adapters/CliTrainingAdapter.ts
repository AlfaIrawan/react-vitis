import type { ITrainingConnectorAdapter, RunConfig } from './ITrainingConnectorAdapter'
import type { LogEntry, MetricPoint, ResourcePoint, TimelineEvent, RunExecutionSession } from '../store/executionStore'

/**
 * CLI Training Adapter - Integration-ready stub
 * 
 * This adapter is designed to spawn CLI processes and parse their output.
 * Implementation will be completed when CLI backend is available.
 */
export class CliTrainingAdapter implements ITrainingConnectorAdapter {
  constructor(_cliPath: string = 'python') {
    // TODO: Store cliPath when implementing CLI calls
  }

  async start(_runConfig: RunConfig): Promise<string> {
    // TODO: Implement CLI process spawn
    // const { spawn } = require('child_process')
    // const process = spawn(this.cliPath, ['train', '--config', JSON.stringify(runConfig)])
    // 
    // // Parse output to extract sessionId
    // process.stdout.on('data', (data) => {
    //   // Parse sessionId from output
    // })
    //
    // return sessionId

    throw new Error('CLI Training Adapter not yet implemented. CLI backend required.')
  }

  async stop(_sessionId: string): Promise<void> {
    // TODO: Implement CLI process termination
    // Find process by sessionId and kill it

    throw new Error('CLI Training Adapter not yet implemented. CLI backend required.')
  }

  subscribeLogs(_sessionId: string, _callback: (log: LogEntry) => void): () => void {
    // TODO: Implement log parsing from CLI stdout/stderr
    // Parse lines and convert to LogEntry format
    return () => {}
  }

  subscribeMetrics(_sessionId: string, _callback: (metricName: string, point: MetricPoint) => void): () => void {
    // TODO: Implement metric parsing from CLI output
    // Parse metric lines and convert to MetricPoint format
    return () => {}
  }

  subscribeResources(_sessionId: string, _callback: (resourceName: string, point: ResourcePoint) => void): () => void {
    // TODO: Implement resource monitoring (e.g., via system commands)
    return () => {}
  }

  subscribeEvents(_sessionId: string, _callback: (event: TimelineEvent) => void): () => void {
    // TODO: Implement event parsing from CLI output
    return () => {}
  }

  async getSessionStatus(_sessionId: string): Promise<RunExecutionSession | null> {
    // TODO: Implement status check (e.g., check if process is running)
    return null
  }
}
