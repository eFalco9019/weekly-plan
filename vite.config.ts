import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base: il sito vive sotto https://<owner>.github.io/weekly-plan/ (GitHub Pages).
export default defineConfig({
  plugins: [react()],
  base: '/weekly-plan/',
  build: {
    // Librerie in un file a parte: cambiano di rado, quindi restano in cache
    // tra un aggiornamento dell'app e l'altro.
    rolldownOptions: {
      output: { codeSplitting: { groups: [{ name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ }, { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ }] } },
    },
  },
})
