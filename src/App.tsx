import { Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './modules/core-shell/components/AppLayout'
import { ToastProvider } from './components/ui/toast'
import { PlatformRouteLoadingFallback } from './components/loading/PlatformRouteLoadingFallback'
import { AppBackgroundVideo } from './components/layout/AppBackgroundVideo'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { renderVitisShellRoutes } from './routes/vitisShellRoutes'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { OAuthCallbackPage } from './pages/OAuthCallbackPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppBackgroundVideo />
      <ToastProvider>
        <BrowserRouter>
          <AppErrorBoundary>
            <Suspense fallback={<PlatformRouteLoadingFallback />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/login/oauth/callback" element={<OAuthCallbackPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  {renderVitisShellRoutes()}
                </Route>
              </Routes>
            </Suspense>
          </AppErrorBoundary>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
