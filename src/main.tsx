import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { inject } from '@vercel/analytics'; 
import './index.css'
import App from './App.tsx'

if (import.meta.env.PROD) {
  inject();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

if (import.meta.env.MODE !== 'production' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
}