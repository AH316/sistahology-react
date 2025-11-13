import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

if (import.meta.env.MODE !== 'production' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
}