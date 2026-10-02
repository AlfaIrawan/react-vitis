import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loginWithAuthorizationCode } from '@/auth/authService'
import { readOAuthSession, clearOAuthSession } from '@/lib/oauthPkce'

/** Handles the identity-lite redirect after a social (Microsoft) sign-in. */
export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState('')
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    const code = params.get('code')
    const state = params.get('state')
    const oauthError = params.get('error')
    const { verifier, state: storedState } = readOAuthSession()
    const redirectUri = `${window.location.origin}/login/oauth/callback`

    const run = async () => {
      if (oauthError) {
        setError('Microsoft sign-in was cancelled or failed. Please try again.')
        return
      }
      if (!code || !verifier) {
        setError('Sign-in could not be completed. Please start again from the login page.')
        return
      }
      if (storedState && state && storedState !== state) {
        setError('Sign-in verification failed (state mismatch). Please try again.')
        return
      }
      try {
        await loginWithAuthorizationCode({ code, redirectUri, codeVerifier: verifier })
        clearOAuthSession()
        navigate('/', { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.')
      }
    }
    void run()
  }, [navigate, params])

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      {error ? (
        <div className="max-w-sm space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => navigate('/login', { replace: true })}
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Completing sign-in…</p>
      )}
    </div>
  )
}
