import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// Copia locale del vecchio selettore Ezio/Arianna: i giorni sono nel database
// e si importano nel proprio account al primo accesso.
try {
  for (const k of Object.keys(localStorage)) if (k.startsWith('weekly-plan:dayplan:') || k === 'weekly-plan:sync-pending') localStorage.removeItem(k)
} catch {
  // storage non disponibile
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
