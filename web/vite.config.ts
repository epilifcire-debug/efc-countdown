import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

const API = process.env.VITE_DEV_API || 'http://localhost:8080'
const r = (p: string) => path.resolve(import.meta.dirname, p)

// `vite build --mode demo` gera o preview navegável (sem backend, dados de exemplo).
export default defineConfig(({ mode }) => {
  const demo = mode === 'demo'
  return {
    base: demo ? './' : '/',
    plugins: [react(), { name: 'demo-html', transformIndexHtml: (html: string) => (demo ? html.replace('<script src="/env.js"></script>', '') : html) }],
    define: { 'import.meta.env.VITE_DEMO': JSON.stringify(demo ? '1' : '') },
    resolve: {
      alias: [
        ...(demo ? [
          { find: /^@\/lib\/api$/, replacement: r('src/demo/api.ts') },
          { find: /^@\/lib\/supabase$/, replacement: r('src/demo/supabase.ts') },
        ] : []),
        { find: '@components', replacement: r('src/components') },
        { find: '@shared', replacement: r('../shared') },
        { find: '@', replacement: r('src') },
      ],
    },
    server: {
      fs: { allow: ['..'] },
      proxy: { '/api': API, '/gif': API, '/media': API, '/env.js': API },
    },
    build: { chunkSizeWarningLimit: 700, outDir: demo ? 'dist-demo' : 'dist' },
  }
})
