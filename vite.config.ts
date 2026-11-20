import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon.svg',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/apple-touch-icon.png',
        'icons/maskable-512.png',
        'assets/env/sky.hdr',
      ],
      manifest: {
        id: '/',
        name: 'Citylit: South African landmarks in 3D',
        short_name: 'Citylit',
        description:
          'Explore South African landmarks as interactive 3D places with weather, time of day and ambient sound.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0e0f13',
        theme_color: '#0e0f13',
        lang: 'en-ZA',
        categories: ['travel', 'education', 'entertainment'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Table Mountain',
            url: '/#table-mountain',
          },
          {
            name: 'Kruger National Park',
            url: '/#kruger-national-park',
          },
          {
            name: 'Hole in the Wall',
            url: '/#hole-in-the-wall',
          },
          {
            name: 'The Big Hole',
            url: '/#the-big-hole',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,hdr,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      // A dev service worker precaches Vite's optimized dependencies. When the
      // lockfile or optimizer changes it can keep serving an old copy of three
      // alongside the new one ("Multiple instances of Three.js"), which breaks
      // the renderer with cross-version Matrix4 errors. PWA behaviour in the
      // production build is unaffected; use `pnpm preview` to test the SW.
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
