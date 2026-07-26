import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: React.ReactElement
  /** Content: string (first line = title, rest = list items) or ReactNode for custom layout */
  content: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

/** Renders tooltip content with consistent SaaS style: title (semibold) + divider + list (normal). */
function renderDefaultContent(content: string): React.ReactNode {
  const lines = content.split('\n').filter(Boolean)
  if (lines.length === 0) return null
  if (lines.length === 1) {
    return (
      <div className="text-[13px] font-normal text-slate-700 dark:text-slate-300 leading-relaxed">
        {lines[0]}
      </div>
    )
  }
  const [title, ...items] = lines
  return (
    <>
      <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{title}</div>
      <div className="border-t border-slate-200/80 dark:border-slate-600/80 mt-2 pt-2" />
      <ul className="space-y-1.5 text-[13px] font-normal text-slate-700 dark:text-slate-300 leading-relaxed list-none mt-2">
        {items.map((line, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-slate-400 dark:text-slate-500 shrink-0">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

export function Tooltip({ children, content, side = 'bottom', className }: TooltipProps) {
  const [open, setOpen] = React.useState(false)
  const [coords, setCoords] = React.useState({ left: 0, top: 0 })
  const triggerRef = React.useRef<HTMLElement>(null)
  const tooltipRef = React.useRef<HTMLDivElement>(null)

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const gap = 8
    const padding = 14
    
    // Get trigger center
    const centerX = rect.left + rect.width / 2
    
    // Calculate initial position (centered on trigger)
    let left = centerX
    
    // If tooltip is already rendered, measure its actual width and adjust
    if (tooltipRef.current) {
      const tooltipWidth = tooltipRef.current.offsetWidth
      const halfWidth = tooltipWidth / 2
      
      // Constrain to viewport bounds
      const minLeft = padding + halfWidth
      const maxLeft = window.innerWidth - padding - halfWidth
      left = Math.max(minLeft, Math.min(maxLeft, left))
    } else {
      // Fallback: constrain assuming max width
      const maxW = 320
      const halfMaxW = maxW / 2
      const minLeft = padding + halfMaxW
      const maxLeft = window.innerWidth - padding - halfMaxW
      left = Math.max(minLeft, Math.min(maxLeft, left))
    }
    
    // For "top": place tooltip fully above trigger (bottom edge of tooltip = rect.top - gap)
    let top: number
    if (side === 'bottom') {
      top = rect.bottom + gap
    } else if (side === 'top') {
      const tooltipHeight = tooltipRef.current?.offsetHeight ?? 64
      top = rect.top - gap - tooltipHeight
    } else {
      top = rect.top - gap
    }
    setCoords({ left, top })
  }, [side])

  const handleMouseEnter = (e: React.MouseEvent) => {
    setOpen(true)
    requestAnimationFrame(() => {
      updatePosition()
      // Recalculate after tooltip renders to get actual width
      requestAnimationFrame(updatePosition)
    })
  }
  const handleMouseLeave = () => setOpen(false)
  
  // Update position when tooltip content changes or window resizes
  React.useEffect(() => {
    if (!open) return
    updatePosition()
    const handleResize = () => updatePosition()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [open, updatePosition])

  const child = React.Children.only(children)
  const trigger = React.cloneElement(child as React.ReactElement<{ ref?: React.Ref<unknown>; onMouseEnter?: React.MouseEventHandler; onMouseLeave?: React.MouseEventHandler }>, {
    ref: (el: HTMLElement | null) => {
      triggerRef.current = el
      const origRef = (child as React.ReactElement<{ ref?: React.Ref<unknown> }>).ref
      if (typeof origRef === 'function') origRef(el)
      else if (origRef) (origRef as React.MutableRefObject<HTMLElement | null>).current = el
    },
    onMouseEnter: (e: React.MouseEvent) => {
      handleMouseEnter(e)
      child.props.onMouseEnter?.(e)
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave()
      child.props.onMouseLeave?.(e)
    },
  })

  const contentNode =
    typeof content === 'string'
      ? renderDefaultContent(content)
      : content

  return (
    <>
      {trigger}
      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            className={cn(
              'fixed z-[9999] max-w-[320px] px-4 py-3',
              'bg-white dark:bg-slate-800',
              'rounded-[13px]',
              'shadow-md shadow-black/6 dark:shadow-black/20',
              'border border-slate-200/70 dark:border-slate-600/50',
              'animate-in fade-in-0 zoom-in-95 duration-150',
              className
            )}
            style={{
              left: `${coords.left}px`,
              top: `${coords.top}px`,
              transform: 'translateX(-50%)',
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            {/* Minimal arrow pointer */}
            {side === 'bottom' && (
              <>
                <div
                  className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-[6px] border-transparent border-b-slate-200/70 dark:border-b-slate-600/50 border-t-0"
                  style={{ left: '50%', bottom: '100%' }}
                  aria-hidden
                />
                <div
                  className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-[5px] border-transparent border-b-white dark:border-b-slate-800 border-t-0"
                  style={{ left: '50%', bottom: 'calc(100% - 1px)' }}
                  aria-hidden
                />
              </>
            )}
            {side === 'top' && (
              <>
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-[6px] border-transparent border-t-slate-200/70 dark:border-t-slate-600/50 border-b-0"
                  style={{ left: '50%', top: '100%' }}
                  aria-hidden
                />
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-[5px] border-transparent border-t-white dark:border-t-slate-800 border-b-0"
                  style={{ left: '50%', top: 'calc(100% - 1px)' }}
                  aria-hidden
                />
              </>
            )}
            <div className="relative">{contentNode}</div>
          </div>,
          document.body
        )}
    </>
  )
}
