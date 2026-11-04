import { AuthTransientAlert } from '@/modules/auth/components/AuthTransientAlert'
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


  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const isFormValid = isEmailValid && !!password && !isSubmitting

  return (
    <AuthPageLayout>
      <div id="login-card-header" className="space-y-2 text-center">
        <img src="/images/vitis-wordmark.svg"
          alt="Vitis — AI Workflow Automation"
          className="mx-auto h-24 max-w-full w-auto object-contain"
        />
        <p className="text-sm text-muted-foreground">
          Sign in to your account
        </p>
      </div>

      <AuthTransientAlert message={error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            className={cn(
              authCardInputClass,
              !isEmailValid && email.length > 0 && 'border-destructive focus-visible:ring-destructive',
            )}
            disabled={isSubmitting}
            autoComplete="email"
            required
          />
          {!isEmailValid && email.length > 0 && (
            <p className="text-xs text-destructive">Please enter a valid email address</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              disabled={isSubmitting}
              autoComplete="current-password"
              required
              className={cn(authCardInputClass, 'pr-10')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isSubmitting}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          id="login-submit"
          type="submit"
          className={authCardButtonClass}
          disabled={!isFormValid}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <Button
        id="login-passkey"
        type="button"
        variant="outline"
        className={cn(authCardButtonClass, 'mt-3')}
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

      <p id="login-signup-link" className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <a href="/register" className="text-primary hover:underline" onClick={(e) => { e.preventDefault(); navigate('/register') }}>
          Sign up
        </a>
      </p>
    </AuthPageLayout>
  )
}
