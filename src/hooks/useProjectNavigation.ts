import { useNavigate } from 'react-router-dom'
import { useActiveProjectStore } from '@/stores/active-project-store'

/**
 * Hook to get project-aware navigation functions
 * All lifecycle object navigation should use this hook to ensure project context
 */
export function useProjectNavigation() {
  const navigate = useNavigate()
  const { activeProjectId } = useActiveProjectStore()

  return {
    navigateToConnector: (connectorId: string, projectId?: string) => {
      const pid = projectId || activeProjectId
      if (!pid) {
        navigate('/projects')
        return
      }
      navigate(`/projects/${pid}/connectors/${connectorId}`)
    },
    navigateToRun: (runId: string, projectId?: string) => {
      const pid = projectId || activeProjectId
      if (!pid) {
        navigate('/projects')
        return
      }
      navigate(`/projects/${pid}/runs/${runId}`)
    },
    navigateToModel: (modelId: string, projectId?: string) => {
      const pid = projectId || activeProjectId
      if (!pid) {
        navigate('/projects')
        return
      }
      navigate(`/projects/${pid}/models/${modelId}`)
    },
    navigateToDeployment: (deploymentId: string, projectId?: string) => {
      const pid = projectId || activeProjectId
      if (!pid) {
        navigate('/projects')
        return
      }
      navigate(`/projects/${pid}/deployments/${deploymentId}/monitoring`)
    },
    navigateToFeedback: (feedbackId: string, projectId?: string) => {
      const pid = projectId || activeProjectId
      if (!pid) {
        navigate('/projects')
        return
      }
      navigate(`/projects/${pid}/feedback/${feedbackId}`)
    },
    navigateToProjectTab: (tab: string, projectId?: string) => {
      const pid = projectId || activeProjectId
      if (!pid) {
        navigate('/projects')
        return
      }
      if (tab === 'overview') {
        navigate(`/projects/${pid}`)
      } else {
        navigate(`/projects/${pid}/${tab}`)
      }
    },
  }
}
