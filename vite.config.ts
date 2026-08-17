import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Cloudflare tunnel terminates TLS and forwards here, so Vite sees a host
    // it doesn't recognise and blocks it by default.
    allowedHosts: ['visionboard.khaleds.com', '.khaleds.com', 'localhost'],
    // the tunnel needs HMR over wss on the public hostname, not localhost
    hmr: { clientPort: 443, protocol: 'wss', host: 'visionboard.khaleds.com' },
  },
})
