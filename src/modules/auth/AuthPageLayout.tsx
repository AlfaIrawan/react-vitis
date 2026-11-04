import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { usePreferencesStore } from '@/stores/preferences-store'
import { useAuthMobileViewport } from './useAuthMobileViewport'

export const authCardInputClass = 'h-10 rounded-xl px-3 text-sm'
export const authCardButtonClass = 'h-10 w-full justify-center gap-2 rounded-xl px-3 text-sm leading-snug whitespace-normal'

export function AuthPageLayout({ children, register = false }: { children: ReactNode; register?: boolean }) {
  const viewport = useAuthMobileViewport()
  const reduceAnimations = usePreferencesStore((state) => state.preferences.reduceAnimations || state.preferences.highContrast)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return (
    <div ref={viewport} className={cn('mobile-login flex w-full items-center justify-center px-4 py-16 sm:p-4', register && 'mobile-register')}>
      {createPortal(
        <div className="app-background-video-layer bg-cover bg-center" style={{ backgroundImage: 'url(/images/background-1.png)' }} aria-hidden="true">
          {!reducedMotion && !reduceAnimations && (
            <video className="app-background-video" src="/images/background-1.mp4" poster="/images/background-1.png"
              autoPlay muted loop playsInline tabIndex={-1} />
          )}
        </div>,
        document.body,
      )}
      <div className="mx-auto w-full max-w-md">
        <div className="liquid-glass-enterprise-panel space-y-6 rounded-lg p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
