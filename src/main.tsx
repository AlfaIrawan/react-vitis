import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeAnimationSpeed } from './lib/animationUtils'
import { initTelemetry } from './lib/tracing'
import { initRum } from './lib/rum'
import { initUiScaleLock, syncUiScaleLock } from './lib/uiScale'
import { normalizeAccent } from './lib/vitisThemes'
import './vitis-themes.css'

function readPreference(value: string | null) {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

// Ensure light mode is set immediately before React renders
if (typeof window !== 'undefined') {
  initUiScaleLock()
  // Check if user has a saved preference
  const savedTheme = localStorage.getItem('ai_monitor_theme')
  const themeData = readPreference(savedTheme)
  const theme = themeData?.state?.theme || 'light'
  
  // Apply theme immediately
  document.documentElement.classList.remove('light', 'dark')
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.add(prefersDark ? 'dark' : 'light')
  } else {
    document.documentElement.classList.add(theme)
  }

  // Initialize animation speed and accent from preferences
  const savedPreferences = localStorage.getItem('ai_monitor_preferences')
  const preferencesData = readPreference(savedPreferences)
  const prefs = preferencesData?.state?.preferences || {}
  const animationSpeed = prefs.animationSpeed || 300
  const fontSize = prefs.fontSize || 14
  const rawAccent = prefs.accentColor
  const accentColor = normalizeAccent(rawAccent)
  if (accentColor) {
    document.documentElement.dataset.accent = accentColor
  }

  // Initialize animation speed
  initializeAnimationSpeed(animationSpeed)

  // Apply font size
  document.documentElement.style.fontSize = `${fontSize}px`
}

async function bootstrap() {
  await initTelemetry()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  syncUiScaleLock()
  window.requestAnimationFrame(syncUiScaleLock)
  initRum()
}
bootstrap()
