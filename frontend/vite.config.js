import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Ce proxy ne sert qu'en developpement : en production, nginx sert le build
  // et relaie /api sur la meme origine. Or le seul lanceur de developpement du
  // projet, backend/start-local.ps1, force SERVER_PORT=8083. Viser 8082 ici
  // garantissait un ECONNREFUSED sur chaque appel, backend allume ou non.
  // Les deux valeurs doivent bouger ensemble.
  server: { proxy: { '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:8083', changeOrigin: true } } }
})
