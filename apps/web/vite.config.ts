import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'login-bg.jpg'],
      manifest: {
        name: 'Nakliye CRM',
        short_name: 'NakliyeCRM',
        description: 'Uluslararası nakliye CRM',
        theme_color: '#e30a17',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        lang: 'tr',
        icons: [
          {
            src: '/login-bg.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:4100',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
