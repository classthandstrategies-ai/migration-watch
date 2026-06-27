import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The bundled real dataset (src/data/tracks.json) is inlined; it gzips well,
  // so lift the advisory chunk-size warning above its size.
  build: { chunkSizeWarningLimit: 900 },
});
