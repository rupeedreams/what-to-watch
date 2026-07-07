import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base matches the GitHub Pages path: https://rupeedreams.github.io/what-to-watch/
export default defineConfig({
  base: '/what-to-watch/',
  plugins: [react()],
})
