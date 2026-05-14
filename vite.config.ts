import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  root: '.',
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src/client'),
    },
  },
  server: {
    port: 5173,
    proxy: (() => {
      const target = `http://localhost:${process.env.PORT ?? 3000}`
      const errorHandler = (_err: unknown, _req: unknown, res: unknown) => {
        const r = res as import('http').ServerResponse
        if (!r.headersSent) {
          r.writeHead(503, { 'Content-Type': 'application/json' })
          r.end(JSON.stringify({ error: 'backend_unavailable' }))
        }
      }
      return {
        '/api': { target, configure: (p) => p.on('error', errorHandler) },
        '/auth': { target, configure: (p) => p.on('error', errorHandler) },
      }
    })(),
  },
})
