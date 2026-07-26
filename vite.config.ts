import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5182,
    strictPort: true,
    allowedHosts: ['localhost', '127.0.0.1', 'host.docker.internal'],
    proxy: {
      // Project & Folder API (python-project-service-fastapi di port 8500)
      '/api/project-service': {
        target: 'http://localhost:8500',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/project-service/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})


