import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, isAuthenticated, getDemoAccounts } from '@/auth/authService'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showDemoAccounts, setShowDemoAccounts] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const next = searchParams.get('next') || '/projects'

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate(next, { replace: true })
    }
  }, [navigate, next])

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmailValid = email.length === 0 || emailRegex.test(email)
  const isPasswordValid = password.length > 0
  const isFormValid = isEmailValid && isPasswordValid && !isSubmitting

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!isFormValid) {
      return
    }

    setIsSubmitting(true)

    try {
      login(email, password)
      // Navigate to intended destination or default to /projects
      navigate(next, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const demoAccounts = getDemoAccounts()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="glass-card rounded-lg shadow-2xl p-8 space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <img
              src="/images/logo.png"
              alt="Vitis"
              className="mx-auto h-24 w-auto object-contain"
            />
            <p className="text-sm text-muted-foreground">
              Sign in to your account
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@vitis.local"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                className={cn(
                  !isEmailValid && email.length > 0 && 'border-destructive focus-visible:ring-destructive'
                )}
                disabled={isSubmitting}
                autoComplete="email"
                required
              />
              {!isEmailValid && email.length > 0 && (
                <p className="text-xs text-destructive">Please enter a valid email address</p>
              )}
            </div>

            {/* Password Field */}
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
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
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

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Demo Accounts Helper */}
          <div className="border-t border-border/40 pt-4">
            <button
              type="button"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
              className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Demo Accounts</span>
              {showDemoAccounts ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showDemoAccounts && (
              <div className="mt-3 space-y-2 p-3 bg-muted/30 rounded-md text-xs">
                {demoAccounts.map((account) => (
                  <div
                    key={account.email}
                    className="flex items-center justify-between py-1.5 px-2 hover:bg-muted/50 rounded transition-colors cursor-pointer"
                    onClick={() => {
                      setEmail(account.email)
                      setPassword(account.password)
                      setShowDemoAccounts(false)
                    }}
                  >
                    <div>
                      <div className="font-medium text-foreground">{account.name}</div>
                      <div className="text-muted-foreground">{account.email}</div>
                    </div>
                    <div className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                      {account.role}
                    </div>
                  </div>
                ))}
                <p className="text-muted-foreground/70 pt-2 border-t border-border/30 mt-2">
                  Click any account to fill the form
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}