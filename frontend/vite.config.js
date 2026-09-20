import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command }) => ({
  plugins: [react()],

  base: command === 'build' ? '/static/' : '/',

  server: {
    proxy: {
      '/session': 'http://localhost:8001',
      '/api': 'http://localhost:8001',
    },
  },

  build: {
    outDir: path.resolve(import.meta.dirname, '../backend/frontend'),
    emptyOutDir: true,
  },
}))
