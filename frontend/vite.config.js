import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
// import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { resolve } from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react()
  ],

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
      }
    }
  }
})
