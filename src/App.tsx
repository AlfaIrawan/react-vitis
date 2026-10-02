import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AppLayout } from './modules/core-shell/components/AppLayout'
import { PlaceholderPage, module1Routes } from './modules/core-shell/components/PlaceholderPage'
import { ToastProvider } from './components/ui/toast'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { OAuthCallbackPage } from './pages/OAuthCallbackPage'
import { ProfilePage } from './pages/Profile'
import { DashboardPage } from './modules/dashboard'
import { ProjectListPage, ProjectDetailPage } from './modules/projects'
import { ConnectorDetailPage } from './modules/connectors'
import { RunDetailPage, RunResultsDetailPage } from './modules/runs'
import { ExecutionDetailPage } from './modules/execution'
import { PlatformSettingsPage } from './modules/core-shell/pages/PlatformSettingsPage'
import { CompactDensityExamplePage } from './pages/CompactDensityExamplePage'
import { WorkflowBuilderPage } from './modules/workflows'
import {
  GlobalIntegrationsCatalogPage,
  GlobalProcessMonitorPage,
  WorkflowDesignerOrchestrationPage,
} from './modules/vitis'

function RedirectToProjectHome() {
  const { id, projectId } = useParams<{ id?: string; projectId?: string }>()
  const pid = projectId ?? id
  return <Navigate to={pid ? `/projects/${pid}` : '/projects'} replace />
}

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
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login/oauth/callback" element={<OAuthCallbackPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />

              {module1Routes
                .filter(
                  (route) =>
                    route.path !== '/runs' &&
                    route.path !== '/' &&
                    route.path !== '/settings'
                )
                .map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <PlaceholderPage
                        title={route.title}
                        description={route.description}
                        icon={route.icon}
                      />
                    }
                  />
                ))}

              <Route path="/projects" element={<ProjectListPage />} />
              <Route path="/projects/create" element={<Navigate to="/projects" replace />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/projects/:id/:tab" element={<ProjectDetailPage />} />

              <Route
                path="/projects/:projectId/connectors/:id"
                element={<ConnectorDetailPage />}
              />
              <Route path="/projects/:projectId/runs/:id" element={<RunDetailPage />} />
              <Route
                path="/projects/:projectId/runs/:runId/execution"
                element={<ExecutionDetailPage />}
              />
              <Route
                path="/projects/:projectId/runs/:id/results"
                element={<RunResultsDetailPage />}
              />
              <Route path="/execution/:sessionId" element={<ExecutionDetailPage />} />
              <Route
                path="/projects/:projectId/workflows/:workflowId"
                element={<WorkflowBuilderPage />}
              />

              {/* Vitis — enterprise views */}
              <Route path="/integrations" element={<GlobalIntegrationsCatalogPage />} />
              <Route path="/monitor" element={<GlobalProcessMonitorPage />} />
              <Route path="/workflows" element={<WorkflowDesignerOrchestrationPage />} />
              <Route
                path="/automation"
                element={
                  <PlaceholderPage
                    title="Automation Rules"
                    description="Trigger configuration, conditional execution, approval workflows, and state automation"
                    icon="Zap"
                  />
                }
              />
              <Route
                path="/analytics"
                element={
                  <PlaceholderPage
                    title="Analytics & Reporting"
                    description="Integration metrics, process performance, throughput analysis, and KPI dashboards"
                    icon="BarChart3"
                  />
                }
              />
              <Route
                path="/docs"
                element={
                  <PlaceholderPage
                    title="Documentation"
                    description="API docs, integration guides, workflow templates, and best practices"
                    icon="FileText"
                  />
                }
              />

              {/* Block AI Lifecycle paths — send back to workspace */}
              <Route
                path="/projects/:projectId/datasets/*"
                element={<RedirectToProjectHome />}
              />
              <Route
                path="/projects/:id/base-models/*"
                element={<RedirectToProjectHome />}
              />
              <Route
                path="/projects/:projectId/models/*"
                element={<RedirectToProjectHome />}
              />
              <Route
                path="/projects/:projectId/deployments/*"
                element={<RedirectToProjectHome />}
              />
              <Route
                path="/projects/:projectId/feedback/*"
                element={<RedirectToProjectHome />}
              />

              <Route path="/models" element={<Navigate to="/projects" replace />} />
              <Route path="/models/*" element={<Navigate to="/projects" replace />} />
              <Route path="/feedback" element={<Navigate to="/projects" replace />} />
              <Route path="/feedback/*" element={<Navigate to="/projects" replace />} />
              <Route path="/governance" element={<Navigate to="/projects" replace />} />
              <Route path="/portfolio" element={<Navigate to="/projects" replace />} />
              <Route path="/portfolio/*" element={<Navigate to="/projects" replace />} />

              <Route path="/connectors" element={<Navigate to="/integrations" replace />} />
              <Route path="/connectors/:id" element={<Navigate to="/integrations" replace />} />
              <Route path="/runs" element={<Navigate to="/monitor" replace />} />
              <Route path="/runs/*" element={<Navigate to="/monitor" replace />} />
              <Route path="/deployments/*" element={<Navigate to="/projects" replace />} />

              <Route path="/settings" element={<PlatformSettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/compact" element={<CompactDensityExamplePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
