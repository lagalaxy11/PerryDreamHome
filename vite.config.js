import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The Smart Home view talks to the local Kasa bridge (bridge/kasa_bridge.py)
    // through /api so the browser only ever sees one origin.
    proxy: {
      '/api': process.env.KASA_BRIDGE_URL || 'http://127.0.0.1:8787',
    },
  },
  build: {
    outDir: 'dist' // explicit, though it is the default
  }
})
