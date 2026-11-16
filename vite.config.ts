import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base: '/weekly-plan/' serve per GitHub Pages (il sito vive sotto
// https://<owner>.github.io/weekly-plan/). Se in futuro si usa un dominio
// custom, cambiare in base: '/'.
export default defineConfig({
  plugins: [react()],
  base: '/weekly-plan/',
})
