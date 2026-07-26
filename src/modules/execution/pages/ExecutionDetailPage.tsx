import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExecutionStore } from '../store/executionStore'
import { useRunStore } from '../../runs/store/runStore'
import { MockTrainingAdapter } from '../adapters/MockTrainingAdapter'
import { ExecutionHeader } from '../components/ExecutionHeader'
import { MetricsPanel } from '../components/MetricsPanel'
import { ResourcePanel } from '../components/ResourcePanel'
import { LogsConsole } from '../components/LogsConsole'
import { EventsTimeline } from '../components/EventsTimeline'
import { useToast } from '@/components/ui/toast'

export function ExecutionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { getSession, getSessionByRunId, stopSession, pauseSession, resumeSession } = useExecutionStore()
  const { getRun } = useRunStore()
  const { addToast } = useToast()
  const [adapter] = useState(() => new MockTrainingAdapter())

  // If sessionId is not provided, try to get from runId
  const { runId } = useParams<{ runId: string }>()
  const effectiveSessionId = sessionId || (runId ? getSessionByRunId(runId)?.sessionId : undefined)

  const session = effectiveSessionId ? getSession(effectiveSessionId) : null
  const run = session ? getRun(session.runId) : runId ? getRun(runId) : null

  useEffect(() => {
    if (!session && !run) {
      addToast({
        title: 'Session not found',
        description: 'The execution session could not be found.',
        variant: 'error',
      })
      navigate('/runs')
      return
    }

    // If we have a run but no session, redirect to runs page
    if (run && !session) {
      navigate(`/runs/${run.id}`)
      return
    }
  }, [session, run, navigate, addToast])

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-2">Loading...</p>
          <p className="text-sm text-muted-foreground">Preparing execution session</p>
        </div>
      </div>
    )
  }

  const handlePause = async () => {
    try {
      await adapter.pause?.(session.sessionId)
      pauseSession(session.sessionId)
      addToast({
        title: 'Training paused',
        description: 'Training has been paused.',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        title: 'Failed to pause',
        description: 'Could not pause training session.',
        variant: 'error',
      })
    }
  }

  const handleResume = async () => {
    try {
      await adapter.resume?.(session.sessionId)
      resumeSession(session.sessionId)
      addToast({
        title: 'Training resumed',
        description: 'Training has been resumed.',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        title: 'Failed to resume',
        description: 'Could not resume training session.',
        variant: 'error',
      })
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this training session?')) {
      return
    }

    try {
      await adapter.stop(session.sessionId)
      stopSession(session.sessionId, 'cancelled')
      addToast({
        title: 'Training cancelled',
        description: 'Training session has been cancelled.',
        variant: 'success',
      })
      navigate('/runs')
    } catch (error) {
      addToast({
        title: 'Failed to cancel',
        description: 'Could not cancel training session.',
        variant: 'error',
      })
    }
  }

  return (
    <div className="space-y-6">
      <ExecutionHeader
        sessionId={session.sessionId}
        onPause={handlePause}
        onResume={handleResume}
        onCancel={handleCancel}
      />

      {/* Main Monitoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <MetricsPanel sessionId={session.sessionId} />
          <ResourcePanel sessionId={session.sessionId} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <LogsConsole sessionId={session.sessionId} />
          <EventsTimeline sessionId={session.sessionId} />
        </div>
      </div>
    </div>
  )
}
