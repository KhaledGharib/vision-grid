import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // shadcn components are generated with "@/..." imports
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    // Always 5173. Without strictPort, Vite silently moves to 5174 when the
    // port is busy (e.g. an orphaned dev server), and you end up staring at a
    // stale tab on the old port wondering why edits don't show up.
    port: 5173,
    strictPort: true,

    // Cloudflare tunnel terminates TLS and forwards here, so Vite sees a host
    // it doesn't recognise and blocks it by default.
    allowedHosts: ['visionboard.khaleds.com', '.khaleds.com', 'localhost'],

    // HMR is intentionally left undefined so Vite infers it from the request
    // origin. Hard-coding the tunnel hostname over wss silently killed hot
    // reload on localhost.
  },
})
