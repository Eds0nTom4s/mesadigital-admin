import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const API_PROXY_TARGET = 'http://127.0.0.1:8081'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    host: true,
    hmr: {
      clientPort: 3000
    },
    proxy: {
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  },
  define: {
    // Polyfill para bibliotecas Node.js no navegador
    'global': 'globalThis'
  }
})
