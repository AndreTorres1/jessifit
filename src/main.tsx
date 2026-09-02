import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AppProvider } from './data/store'
import { AuthProvider } from './lib/auth'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { Onboarding } from './components/Onboarding'
import { ReloadPrompt } from './components/ReloadPrompt'
import { applyTheme, getTheme } from './lib/theme'
import App from './App'
import './index.css'

// aplica o tema guardado antes do primeiro render (evita flash)
applyTheme(getTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              <App />
              <ReloadPrompt />
              <Onboarding />
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
)
