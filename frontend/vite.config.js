import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { configDefaults } from 'vitest/config'
// import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { resolve } from "path"
import { visualizer } from 'rollup-plugin-visualizer';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    // Uncomment the following line to enable the build visualizer plugin
    // visualizer({
    //   filename: './dist/stats.html', // output location
    //   open: true,                    // auto-open after build
    //   gzipSize: true,
    //   brotliSize: true
    // }),
    
  ],

  // Add CSS configuration for PostCSS
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },

  // vitest config
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  },

  server: {

    // to run on a local server, uncomment these
    host: '0.0.0.0', // Allow connections from all IPs
    allowedHosts: true, // Allow connections to all hostnames of this server

    strictPort: true, // Optional: prevent the server from picking a random port if the specified one is taken
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
      }
    }
  }
})
