import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // REST API calls: /api/* → http://localhost:8000/api/*
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // WebSocket: /ws → ws://localhost:8000/ws
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
