import { createContext, useContext } from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps } from 'reactflow'
import { getWorkflowWaypoint, workflowWaypointPath, type WorkflowWaypoint } from '../utils/edgeRouting'

type UpdateWaypoint = (id: string, waypoint?: WorkflowWaypoint) => void
export const WorkflowRoutingContext = createContext<UpdateWaypoint | null>(null)

export function WorkflowRoutedEdge({
  id, data, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  markerStart, markerEnd, selected, style, label,
}: EdgeProps) {
  const update = useContext(WorkflowRoutingContext)
  const { screenToFlowPosition } = useReactFlow()
  const [autoPath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 8,
  })
  const waypoint = getWorkflowWaypoint(data)
  const control = waypoint ?? { x: labelX, y: labelY }
  const path = waypoint
    ? workflowWaypointPath({ x: sourceX, y: sourceY }, sourcePosition, waypoint, { x: targetX, y: targetY }, targetPosition)
    : autoPath

  return (
    <>
      <BaseEdge id={id} path={path} markerStart={markerStart} markerEnd={markerEnd} style={style}
        label={label} labelX={control.x} labelY={control.y - (selected && update ? 16 : 0)} />
      {selected && update && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute flex items-center gap-1"
            style={{ pointerEvents: 'all', transform: `translate(-50%, -50%) translate(${control.x}px, ${control.y}px)` }}
          >
            <button
              type="button"
              aria-label="Move workflow connection bend"
              title="Drag to move the bend, or use arrow keys"
              className="h-4 w-4 touch-none rounded-full border-2 border-primary bg-background"
              onPointerDown={(event) => {
                if (event.button !== 0) return
                event.stopPropagation()
                event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  update(id, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
                }
              }}
              onKeyDown={(event) => {
                const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
                if (!direction) return
                event.preventDefault()
                event.stopPropagation()
                update(id, { x: control.x + direction[0] * 10, y: control.y + direction[1] * 10 })
              }}
            />
            {waypoint && (
              <button type="button" className="rounded border bg-background px-1 text-xs"
                onClick={() => update(id)} aria-label="Reset workflow connection bend">Reset</button>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
