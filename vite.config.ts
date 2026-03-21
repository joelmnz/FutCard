import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/futcard/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/*.svg'],
      manifest: {
        name: 'FutCard',
        short_name: 'FutCard',
        description: 'Football card trading PWA for kids.',
        theme_color: '#080c14',
        background_color: '#080c14',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/futcard/',
        scope: '/futcard/',
        icons: [
          {
            src: '/futcard/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/futcard/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: '/futcard/icons/maskable-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,png,webp}']
      }
    })
  ],
  server: {
    port: 5177,
    strictPort: true
  }
})
