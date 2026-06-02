import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Add a dev proxy for /api -> backend to make local development simpler
// Uses VITE_API_BASE_URL if available, otherwise falls back to localhost:8081
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = (env.VITE_API_BASE_URL || 'http://localhost:8081').replace(/\/+$/, '')

  return defineConfig({
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return
            }

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('react-router')
            ) {
              return 'react-vendor'
            }

            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
              return 'redux-vendor'
            }

            if (id.includes('recharts')) {
              return 'charts-vendor'
            }

            if (id.includes('date-fns')) {
              return 'date-vendor'
            }

            if (id.includes('@floating-ui/')) {
              return 'floating-ui-vendor'
            }

            if (id.includes('@tremor/')) {
              return 'tremor-vendor'
            }

            return 'vendor'
          },
        },
      },
    },
    server: {
      proxy: {
        // Proxy any /api requests to the backend. This keeps frontend code
        // calling relative paths (e.g. /api/auth/login) and avoids CORS in dev.
        '/api': {
          target: backend,
          changeOrigin: true,
          secure: false,
        },
      },
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  })
}
