import { Position, type Edge } from 'reactflow'

export type WorkflowWaypoint = { x: number; y: number }

type RoutingData = Record<string, unknown> & { vitisWaypoint?: WorkflowWaypoint }

export function getWorkflowWaypoint(data: RoutingData | undefined): WorkflowWaypoint | undefined {
  const point = data?.vitisWaypoint
  return point && Number.isFinite(point.x) && Number.isFinite(point.y) ? point : undefined
}

export function setWorkflowWaypoint(edges: Edge<RoutingData>[], id: string, point?: WorkflowWaypoint) {
  return edges.map((edge) => {
    if (edge.id !== id) return edge
    const data = { ...edge.data }
    if (point) data.vitisWaypoint = point
    else delete data.vitisWaypoint
    return { ...edge, data: Object.keys(data).length > 0 ? data : undefined }
  })
}

function isVertical(position: Position) {
  return position === Position.Top || position === Position.Bottom
}

/** Adapted from Tectona Workflow Automation Engine's orthogonal waypoint path. */
export function workflowWaypointPath(
  from: WorkflowWaypoint,
  sourcePosition: Position,
  waypoint: WorkflowWaypoint,
  to: WorkflowWaypoint,
  targetPosition: Position,
): string {
  const firstBend = isVertical(sourcePosition) ? [from.x, waypoint.y] : [waypoint.x, from.y]
  const lastBend = isVertical(targetPosition) ? [to.x, waypoint.y] : [waypoint.x, to.y]
  return `M ${from.x},${from.y} L ${firstBend} L ${waypoint.x},${waypoint.y} L ${lastBend} L ${to.x},${to.y}`
}
