import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'DENGE — Akıllı Bütçe',
        short_name: 'DENGE',
        description: 'Modern kişisel bütçe uygulaması',
        theme_color: '#0C1F1A',
        background_color: '#F3EFE6',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/butce/',
        start_url: '/butce/',
        lang: 'tr',
        categories: ['finance', 'productivity'],
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/butce/index.html',
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  base: '/butce/',
})
