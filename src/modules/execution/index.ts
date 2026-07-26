// Module 5: Training Execution (Monitoring Real-time)
export { ExecutionDetailPage } from './pages/ExecutionDetailPage'
export { ExecutionHeader } from './components/ExecutionHeader'
export { MetricsPanel } from './components/MetricsPanel'
export { ResourcePanel } from './components/ResourcePanel'
export { LogsConsole } from './components/LogsConsole'
export { EventsTimeline } from './components/EventsTimeline'
export { ExecutionStatusBadge } from './components/ExecutionStatusBadge'
export { MetricSelector } from './components/MetricSelector'
export { useExecutionStore } from './store/executionStore'
export type {
  ExecutionStatus,
  RunExecutionSession,
  MetricPoint,
  ResourcePoint,
  LogEntry,
  TimelineEvent,
  MetricSeries,
  ResourceSeries,
} from './store/executionStore'
export { MockTrainingAdapter } from './adapters/MockTrainingAdapter'
export { ApiTrainingAdapter } from './adapters/ApiTrainingAdapter'
export { CliTrainingAdapter } from './adapters/CliTrainingAdapter'
export type { ITrainingConnectorAdapter, RunConfig } from './adapters/ITrainingConnectorAdapter'
