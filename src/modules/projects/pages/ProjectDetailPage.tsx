import { ProjectWorkspace } from '../components/ProjectWorkspace'

/**
 * ProjectDetailPage - Entry point to Project Workspace
 * 
 * This page now uses ProjectWorkspace component which provides
 * tab-based navigation for all lifecycle objects within a project.
 * 
 * All lifecycle operations (Connectors, Runs, Models, Deployments, Feedback)
 * are now strictly scoped to the project context.
 */
export function ProjectDetailPage() {
  return <ProjectWorkspace />
}
