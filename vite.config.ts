import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Always 5173. Without strictPort, Vite silently moves to 5174 when the
    // port is busy (e.g. an orphaned dev server), and you end up staring at a
    // stale tab on the old port wondering why edits don't show up.
    port: 5173,
    strictPort: true,

    // Cloudflare tunnel terminates TLS and forwards here, so Vite sees a host
    // it doesn't recognise and blocks it by default.
    allowedHosts: ['visionboard.khaleds.com', '.khaleds.com', 'localhost'],

    // HMR must follow whichever host you actually opened. The previous config
    // hard-coded the tunnel hostname over wss, which meant that on
    // localhost:5173 the browser tried to reach wss://visionboard.khaleds.com
    // for hot updates — that socket never connects, so live reload was dead
    // locally and every change needed a manual hard refresh.
    // Leaving hmr undefined lets Vite infer it from the request origin, which
    // works for localhost and for the tunnel.
  },
})
