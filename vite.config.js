import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Changes paths to relative so it works perfectly on GitHub Pages root
  build: {
    outDir: 'dist', // Ensures the compiled files go into the folder our workflow uploads
    assetsDir: 'assets', // Puts JS and CSS into a dedicated assets folder
    rollupOptions: {
      input: {
        main: './index.html', // Forces Vite to explicitly find your index.html
      },
    },
  },
})
