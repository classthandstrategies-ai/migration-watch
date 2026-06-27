import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Vercel/Netlify serve from the domain root ('/'). GitHub Pages serves this
  // project under '/migration-watch/', so the deploy workflow sets GITHUB_PAGES
  // to switch the base path. Reference public assets via import.meta.env.BASE_URL.
  base: process.env.GITHUB_PAGES ? '/migration-watch/' : '/',
  // The bundled real dataset (src/data/tracks.json) is inlined; it gzips well,
  // so lift the advisory chunk-size warning above its size.
  build: { chunkSizeWarningLimit: 900 },
});
