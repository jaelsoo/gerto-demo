import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativo permite publicar o build em subpastas (ex.: GitHub Pages).
export default defineConfig({
  plugins: [react()],
  base: './',
});
