import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/portfolio/' : '/',
  build: {
    // Three.js is an optional, dynamically loaded module (about 133 KB gzipped).
    chunkSizeWarningLimit: 600,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(rootDirectory, 'index.html'),
        privacy: resolve(rootDirectory, 'privacidade.html'),
      },
    },
  },
}));
