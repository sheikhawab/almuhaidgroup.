import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LanguageProvider } from '@/components/language-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { syncOutbox } from '@/lib/outbox'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)

void navigator.storage.persist()
void syncOutbox()
window.addEventListener('online', syncOutbox)
// No browser event fires when only the server comes back, so also retry on a timer.
setInterval(syncOutbox, 30_000)
