import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      // option 1: ignore by prefix
      routeFileIgnorePrefix: '_components', // this will ignore any file/folder starting with "_components"
      // option 2: ignore by regex
      routeFileIgnorePattern: '_components', // or use a regex like '(_components)$' if you want
      // ... other config options
    }),
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 4001,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist'
  }
})
