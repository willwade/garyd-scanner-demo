import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Ensures assets are loaded correctly on GitHub Pages
  build: {
    outDir: 'dist'
  },
  optimizeDeps: {
    force: true // Force re-bundling of dependencies
  },
  server: {
    fs: {
      strict: false // Allow serving files outside of root
    },
    hmr: {
      overlay: true // Show HMR errors in overlay
    }
  }
})
