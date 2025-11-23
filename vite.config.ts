import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // BrowserRouter for Vercel deployment with clean URLs
  build: {
    assetsDir: 'assets',
    outDir: 'dist'
  },

  server: {
    allowedHosts: [
      'message-type-granted-doing.trycloudflare.com'
    ]
  }

})
