import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: true
  },
  server: {
    host: true // Esto también ayuda a que se vea en red local
  }
})