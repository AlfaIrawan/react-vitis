import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AuthCopyrightNotice } from './components/AuthCopyrightNotice'
import { useAuthMobileViewport } from './useAuthMobileViewport'

export const authCardInputClass = 'h-10 rounded-xl px-3 text-sm'
export const authCardButtonClass = 'h-10 w-full justify-center gap-2 rounded-xl px-3 text-sm leading-snug whitespace-normal'

export function AuthPageLayout({ children, register = false }: { children: ReactNode; register?: boolean }) {
  const viewport = useAuthMobileViewport()
  return (
    <div ref={viewport} className={cn('mobile-login flex w-full items-center justify-center', register ? 'mobile-register p-4' : 'px-4 py-16 sm:p-4')}>
      <div className="mx-auto w-full max-w-md">
        <div className={cn("liquid-glass-enterprise-panel space-y-6 rounded-lg", register ? "p-8" : "p-6 sm:p-8")}>
          {children}
        </div>
      </div>
      <footer className="login-footer">
        <AuthCopyrightNotice />
      </footer>
    </div>
  )
}
