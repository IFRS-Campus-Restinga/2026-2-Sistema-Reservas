import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  base: '/static/',

  build: {
    outDir: path.resolve(__dirname, '../backend/frontend'),
    emptyOutDir: true,
  },
})