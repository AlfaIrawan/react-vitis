import type { LogEntry, MetricPoint, ResourcePoint, TimelineEvent } from '../store/executionStore'

/**
 * Generate mock log entry
 */
export function generateMockLog(step: number, epoch: number, totalSteps: number): LogEntry {
  const levels: LogEntry['level'][] = ['info', 'info', 'info', 'warn', 'info']
  const level = levels[Math.floor(Math.random() * levels.length)]

  const messages = [
    `Epoch ${epoch}/10 - step ${step}/${totalSteps} - loss=0.${Math.floor(Math.random() * 9000) + 1000}`,
    `Epoch ${epoch}/10 - step ${step}/${totalSteps} - train_loss=0.${Math.floor(Math.random() * 9000) + 1000}, val_loss=0.${Math.floor(Math.random() * 9000) + 1000}`,
    `Epoch ${epoch}/10 - step ${step}/${totalSteps} - train_acc=0.${Math.floor(Math.random() * 9000) + 1000}, val_acc=0.${Math.floor(Math.random() * 9000) + 1000}`,
    `Epoch ${epoch}/10 - step ${step}/${totalSteps} - learning_rate=0.0001`,
    `Epoch ${epoch}/10 - step ${step}/${totalSteps} - batch_size=32`,
    `Warning: Gradient clipping applied at step ${step}`,
    `Epoch ${epoch}/10 completed - avg_loss=0.${Math.floor(Math.random() * 9000) + 1000}`,
  ]

  return {
    t: Date.now(),
    level,
    message: messages[Math.floor(Math.random() * messages.length)],
  }
}

/**
 * Generate mock metric point
 */
export function generateMockMetric(
  metricName: string,
  step: number,
  epoch: number,
  baseValue: number = 0.5
): MetricPoint {
  let value = baseValue

  // Simulate training progress
  if (metricName.includes('loss')) {
    // Loss decreases over time with noise
    const progress = (epoch * 200 + step) / 2000 // 10 epochs * 200 steps
    value = baseValue * (1 - progress * 0.7) + Math.random() * 0.1
    if (metricName.includes('val')) {
      // Validation loss is more noisy and slightly higher
      value += 0.05 + Math.random() * 0.15
    }
    value = Math.max(0.01, value)
  } else if (metricName.includes('acc')) {
    // Accuracy increases over time with noise
    const progress = (epoch * 200 + step) / 2000
    value = baseValue + progress * 0.4 + Math.random() * 0.1
    if (metricName.includes('val')) {
      // Validation accuracy is more noisy and slightly lower
      value -= 0.05 + Math.random() * 0.1
    }
    value = Math.min(0.99, Math.max(0.1, value))
  }

  return {
    t: Date.now(),
    v: Number(value.toFixed(4)),
  }
}

/**
 * Generate mock resource point
 */
export function generateMockResource(resourceName: string): ResourcePoint {
  let value = 0

  if (resourceName === 'gpu_util') {
    // GPU utilization oscillates between 40-95%
    value = 40 + Math.sin(Date.now() / 5000) * 25 + Math.random() * 10
  } else if (resourceName === 'cpu_util') {
    // CPU utilization oscillates between 20-60%
    value = 20 + Math.sin(Date.now() / 3000) * 20 + Math.random() * 10
  } else if (resourceName === 'ram_util') {
    // RAM utilization oscillates between 30-80%
    value = 30 + Math.sin(Date.now() / 4000) * 25 + Math.random() * 10
  }

  return {
    t: Date.now(),
    v: Number(Math.max(0, Math.min(100, value)).toFixed(2)),
  }
}

/**
 * Generate mock timeline event
 */
export function generateMockEvent(step: number, epoch: number): TimelineEvent | null {
  // Events happen less frequently
  if (Math.random() > 0.1) return null

  const eventTypes: TimelineEvent['type'][] = ['checkpoint', 'evaluation', 'info']
  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)]

  let message = ''
  switch (type) {
    case 'checkpoint':
      message = `Checkpoint saved: epoch=${epoch}, step=${step}`
      break
    case 'evaluation':
      message = `Evaluation finished: val_acc=0.${Math.floor(Math.random() * 9000) + 1000}`
      break
    case 'info':
      message = `Epoch ${epoch} completed`
      break
    default:
      return null
  }

  return {
    t: Date.now(),
    type,
    message,
  }
}
