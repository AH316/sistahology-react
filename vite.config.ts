import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // HashRouter handles all routing, no need for complex base path
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
