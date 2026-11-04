import { cn } from '@/lib/utils'
import { AuthBackToLoginLink } from '@/modules/auth/components/AuthBackToLoginLink'
import { AuthTransientAlert } from '@/modules/auth/components/AuthTransientAlert'
import { AuthPageLayout, authCardButtonClass, authCardInputClass } from '@/modules/auth/AuthPageLayout'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, registerWithEmail } from '@/auth/authService'

export function RegisterPage() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [displayNameTouched, setDisplayNameTouched] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) return
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsSubmitting(true)
    try {
      await registerWithEmail({ email, password, displayName })
      // Auto sign-in after successful registration.
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account.')
    } finally {
      setIsSubmitting(false)
    }
  }


  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmailValid = emailRegex.test(email.trim())
  const passwordsMatch = password === confirmPassword
  const isFormValid = isEmailValid && password.length >= 8 && passwordsMatch && !isSubmitting

  return (
    <AuthPageLayout register>
      <AuthBackToLoginLink />

      <div id="register-card-header" className="space-y-2 text-center">
        <img src="/images/vitis-wordmark.svg" alt="Vitis — AI Workflow Automation" className="mx-auto h-24 max-w-full w-auto object-contain" />
        <p className="text-sm text-muted-foreground">Create your Vitis account</p>
      </div>

      <AuthTransientAlert message={error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              const nextEmail = e.target.value
              setEmail(nextEmail)
              setError('')
              if (!displayNameTouched && emailRegex.test(nextEmail.trim())) {
                setDisplayName(nextEmail.trim().split('@')[0].replace(/[._-]+/g, ' '))
              }
            }}
            className={cn(authCardInputClass, !isEmailValid && email.length > 0 && 'border-destructive')}
            disabled={isSubmitting}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-name">Display name (optional)</Label>
          <Input
            id="register-name"
            placeholder="How should we call you?"
            className={authCardInputClass}
            value={displayName}
            onChange={(e) => {
              setDisplayNameTouched(true)
              setDisplayName(e.target.value)
            }}
            disabled={isSubmitting}
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <div data-tour-target="register-password-input">
            <div className="relative">
              <Input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
                required
                className={cn(authCardInputClass, 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="pt-1 text-xs text-muted-foreground">At least 8 characters</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-confirm">Confirm password</Label>
          <div data-tour-target="register-confirm-input">
            <Input
              id="register-confirm"
              type="password"
              placeholder="Re-enter your password"
              className={authCardInputClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="new-password"
              required
            />
            {!passwordsMatch && confirmPassword.length > 0 && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>
        </div>

        <Button id="register-submit" type="submit" className={authCardButtonClass} disabled={!isFormValid}>
          {isSubmitting ? 'Signing up…' : 'Sign up'}
        </Button>
      </form>

      <p id="register-signin-link" className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthPageLayout>
  )
}
