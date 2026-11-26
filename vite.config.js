import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/portfolio/' : '/',
  build: {
    // Three.js is an optional, dynamically loaded module (about 133 KB gzipped).
    chunkSizeWarningLimit: 600,
    outDir: 'dist',
    emptyOutDir: true,
  },
}));
