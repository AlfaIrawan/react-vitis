// Module 2: Projects & Workspace
// Export all public APIs for this module

export { ProjectListPage } from './pages/ProjectListPage'
export { ProjectDetailPage } from './pages/ProjectDetailPage'
export { CreateProjectModal } from './components/CreateProjectModal'
export { CreateFolderModal } from './components/CreateFolderModal'
export { FoldersSection } from './components/FoldersSection'
export { ProjectsSection } from './components/ProjectsSection'
export { ProjectSummaryStats } from './components/ProjectSummaryStats'
export { RoadmapHint } from './components/RoadmapHint'
export { useProjectStore } from './store/projectStore'
export type { Project, ProjectStatus } from './store/projectStore'
export { useFolderStore } from './store/folderStore'
export type { Folder } from './store/folderStore'