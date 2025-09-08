import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Cleanup service workers in dev/preview to prevent stale cache issues
const isDevelopment = import.meta.env.DEV
const isPreview = import.meta.env.MODE === 'preview'

if ((isDevelopment || isPreview) && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      console.log('Unregistering service worker:', registration.scope)
      registration.unregister()
    }
  }).catch(error => {
    console.warn('Service worker cleanup failed:', error)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
