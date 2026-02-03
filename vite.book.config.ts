import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'book/public/components'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/book-component.ts'),
      output: {
        entryFileNames: 'switch-scanner.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    }
  }
});
