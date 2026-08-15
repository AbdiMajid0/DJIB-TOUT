import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Cible surchargeable pour pouvoir viser un backend local sur un autre port
  // sans toucher a la configuration partagee. Defaut inchange : 8082.
  server: { proxy: { '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:8082', changeOrigin: true } } }
})
