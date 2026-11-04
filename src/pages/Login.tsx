import { AuthPageLayout, authCardButtonClass, authCardInputClass } from '@/modules/auth/AuthPageLayout'
import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Fingerprint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, ensureFreshSession, attemptSilentSso, loginWithPasskey } from '@/auth/authService'
import { passkeyErrorMessage } from '@/lib/api/webauthnApi'
import { isSocialProviderEnabled, startSocialOAuthLogin } from '@/lib/authProviders'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const next = searchParams.get('next') || '/'
  const microsoftEnabled = isSocialProviderEnabled('microsoft')

  // Already-signed-in / silent SSO → skip the login screen.
  useEffect(() => {
    let cancelled = false
    void ensureFreshSession()
      .then(async (s) => s ?? (await attemptSilentSso()))
      .then((s) => {
        if (!cancelled && s) navigate(next, { replace: true })
      })
    return () => {
      cancelled = true
    }
  }, [navigate, next])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) return
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasskeyLogin = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      await loginWithPasskey()
      navigate(next, { replace: true })
    } catch (err) {
      setError(passkeyErrorMessage(err, 'signin'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMicrosoft = async () => {
    setError('')
    try {
      await startSocialOAuthLogin('microsoft')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microsoft sign-in is unavailable.')
    }
  }

  return (
    <AuthPageLayout>
      <div id="login-card-header" className="space-y-2 text-center">
        <img src="/images/vitis-wordmark.svg" alt="Vitis — AI Workflow Automation" className="mx-auto h-24 max-w-full w-auto object-contain" />
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            className={authCardInputClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              className={authCardInputClass + " pr-11"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-1/2 flex h-10 w-11 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className={authCardButtonClass} disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <Button
        type="button"
        variant="outline"
        className={authCardButtonClass}
        onClick={() => void handlePasskeyLogin()}
        disabled={isSubmitting}
      >
        <Fingerprint className="h-4 w-4" />
        Sign in with a passkey
      </Button>

      {microsoftEnabled && (
        <>
          <div className="my-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            Or continue with
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            className={authCardButtonClass}
            onClick={() => void handleMicrosoft()}
          >
            <span
              className="inline-grid h-4 w-4 shrink-0 grid-cols-2 gap-[1px]"
              aria-hidden
            >
              <span className="bg-[#f25022]" />
              <span className="bg-[#7fba00]" />
              <span className="bg-[#00a4ef]" />
              <span className="bg-[#ffb900]" />
            </span>
            Sign in with Microsoft
          </Button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          className={cn('font-medium text-primary hover:underline')}
          onClick={() => navigate('/register')}
        >
          Sign up
        </button>
      </p>
    </AuthPageLayout>
  )
}
