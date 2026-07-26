import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ExecutionStatus = 'queued' | 'starting' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

export interface MetricPoint {
  t: number // timestamp
  v: number // value
}

export interface ResourcePoint {
  t: number // timestamp
  v: number // value
}

export interface LogEntry {
  t: number // timestamp
  level: 'info' | 'warn' | 'error'
  message: string
}

export interface TimelineEvent {
  t: number // timestamp
  type: 'checkpoint' | 'evaluation' | 'early_stopping' | 'warning' | 'info'
  message: string
}

export interface MetricSeries {
  name: string
  points: MetricPoint[]
}

export interface ResourceSeries {
  name: string
  points: ResourcePoint[]
}

export interface RunExecutionSession {
  sessionId: string
  runId: string
  status: ExecutionStatus
  startedAt: number
  endedAt?: number
  step: number
  epoch: number
  progressPct: number
  lastHeartbeatAt: number
  metricsSeries: MetricSeries[]
  resourceSeries: ResourceSeries[]
  logs: LogEntry[]
  events: TimelineEvent[]
  errorMessage?: string
}

interface ExecutionState {
  sessions: RunExecutionSession[]
  getSession: (sessionId: string) => RunExecutionSession | undefined
  getSessionByRunId: (runId: string) => RunExecutionSession | undefined
  startSession: (runId: string) => RunExecutionSession
  stopSession: (sessionId: string, status: 'completed' | 'failed' | 'cancelled') => void
  updateSession: (sessionId: string, updates: Partial<RunExecutionSession>) => void
  appendLog: (sessionId: string, log: LogEntry) => void
  appendMetric: (sessionId: string, metricName: string, point: MetricPoint) => void
  appendResource: (sessionId: string, resourceName: string, point: ResourcePoint) => void
  appendEvent: (sessionId: string, event: TimelineEvent) => void
  pauseSession: (sessionId: string) => void
  resumeSession: (sessionId: string) => void
}

export const useExecutionStore = create<ExecutionState>()(
  persist(
    (set, get) => ({
      sessions: [],

      getSession: (sessionId) => {
        return get().sessions.find((s) => s.sessionId === sessionId)
      },

      getSessionByRunId: (runId) => {
        return get().sessions.find((s) => s.runId === runId && (s.status === 'running' || s.status === 'paused' || s.status === 'starting'))
      },

      startSession: (runId) => {
        const now = Date.now()
        const newSession: RunExecutionSession = {
          sessionId: `session-${now}-${Math.random().toString(36).substr(2, 9)}`,
          runId,
          status: 'queued',
          startedAt: now,
          step: 0,
          epoch: 0,
          progressPct: 0,
          lastHeartbeatAt: now,
          metricsSeries: [],
          resourceSeries: [],
          logs: [],
          events: [],
        }

        set((state) => ({
          sessions: [...state.sessions, newSession],
        }))

        return newSession
      },

      stopSession: (sessionId, status) => {
        const session = get().getSession(sessionId)
        if (!session) return

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.sessionId === sessionId
              ? {
                  ...s,
                  status,
                  endedAt: Date.now(),
                  lastHeartbeatAt: Date.now(),
                }
              : s
          ),
        }))
      },

      updateSession: (sessionId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.sessionId === sessionId
              ? {
                  ...s,
                  ...updates,
                  lastHeartbeatAt: Date.now(),
                }
              : s
          ),
        }))
      },

      appendLog: (sessionId, log) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.sessionId === sessionId
              ? {
                  ...s,
                  logs: [...s.logs, log],
                  lastHeartbeatAt: Date.now(),
                }
              : s
          ),
        }))
      },

      appendMetric: (sessionId, metricName, point) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.sessionId !== sessionId) return s

            const existingSeries = s.metricsSeries.find((series) => series.name === metricName)
            const updatedSeries: MetricSeries[] = existingSeries
              ? s.metricsSeries.map((series) =>
                  series.name === metricName
                    ? { ...series, points: [...series.points, point] }
                    : series
                )
              : [...s.metricsSeries, { name: metricName, points: [point] }]

            return {
              ...s,
              metricsSeries: updatedSeries,
              lastHeartbeatAt: Date.now(),
            }
          }),
        }))
      },

      appendResource: (sessionId, resourceName, point) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.sessionId !== sessionId) return s

            const existingSeries = s.resourceSeries.find((series) => series.name === resourceName)
            const updatedSeries: ResourceSeries[] = existingSeries
              ? s.resourceSeries.map((series) =>
                  series.name === resourceName
                    ? { ...series, points: [...series.points, point] }
                    : series
                )
              : [...s.resourceSeries, { name: resourceName, points: [point] }]

            return {
              ...s,
              resourceSeries: updatedSeries,
              lastHeartbeatAt: Date.now(),
            }
          }),
        }))
      },

      appendEvent: (sessionId, event) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.sessionId === sessionId
              ? {
                  ...s,
                  events: [...s.events, event],
                  lastHeartbeatAt: Date.now(),
                }
              : s
          ),
        }))
      },

      pauseSession: (sessionId) => {
        const session = get().getSession(sessionId)
        if (!session || session.status !== 'running') return

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.sessionId === sessionId
              ? {
                  ...s,
                  status: 'paused',
                  lastHeartbeatAt: Date.now(),
                }
              : s
          ),
        }))
      },

      resumeSession: (sessionId) => {
        const session = get().getSession(sessionId)
        if (!session || session.status !== 'paused') return

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.sessionId === sessionId
              ? {
                  ...s,
                  status: 'running',
                  lastHeartbeatAt: Date.now(),
                }
              : s
          ),
        }))
      },
    }),
    {
      name: 'execution-storage',
    }
  )
)
