// Module 4: Run Setup (PRE-Training)
// This module provides run draft management and pre-flight validation.
// NO training execution, NO engine API calls, NO log streaming, NO metrics.

export { RunListPage } from './pages/RunListPage'
export { RunDetailPage } from './pages/RunDetailPage'
export { RunResultsDetailPage } from './pages/RunResultsDetailPage'
export { RunCard } from './components/RunCard'
export { RunStatusBadge } from './components/RunStatusBadge'
export { RunFormModal } from './components/RunFormModal'
export { KeyValueEditor } from './components/KeyValueEditor'
export { RequirementsChecklist } from './components/RequirementsChecklist'
export { useRunStore } from './store/runStore'
export type { RunDraft, RunStatus, RunPurpose, RunResultData } from './store/runStore'
