import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // This allows the app to work when opened as files
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
