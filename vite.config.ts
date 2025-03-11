import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    open: true
  },
  build: {
    target: 'esnext',
    sourcemap: true
  }
})
