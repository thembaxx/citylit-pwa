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
        // Generated/AI Studio experiments are not referenced by the app. Keep
        // them out of the precache if they are ever restored under public/.
        globIgnores: ['**/aistudio/**'],
        // Named-place lookups survive offline after a single successful visit.
        // Overpass/elevation responses are cached by osmService in localStorage.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/search/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'citylit-geocode',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // A dev service worker precaches Vite's optimized dependencies. When the
      // lockfile or optimizer changes it can keep serving a stale copy of the
      // bundle alongside the current one ("Multiple instances of Three.js"),
      // which breaks the renderer with cross-version Matrix4 errors. The app
      // itself resolves a single Three.js version (pnpm-workspace.yaml pins it
      // via overrides), but the dev SW is still disabled as a precaution.
      // Production PWA behaviour is unaffected; use `pnpm preview` to test it.
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    // Match tsconfig.json's ES2022 target explicitly instead of relying on the
    // Vite default, so emitted syntax stays in step with type checking.
    target: 'es2022',
    modulePreload: {
      resolveDependencies: (_filename, deps, { hostType }) => {
        // The engine is loaded on demand by App.tsx. Vite otherwise adds its
        // chunks (including Three.js) to the HTML preload list, which would
        // download ~900 kB before first paint. Runtime preloading for the
        // dynamic import is generated separately and stays intact.
        if (hostType === 'html') {
          return deps.filter((dep) => !/assets\/(three|CitylitEngine)-/.test(dep));
        }
        return deps;
      },
    },
    rolldownOptions: {
      output: {
        // Split the heavy WebGL engine from the UI. The engine is dynamically
        // imported from App.tsx, so these chunks load after first paint and are
        // cached independently when the UI changes.
        manualChunks(id) {
          const path = id.replace(/\\/g, '/');
          if (!path.includes('node_modules')) return;
          // The WebGPU/TSL stack is reached only through the dynamic imports in
          // createRenderer.ts. Match it BEFORE the generic `/three/` rule:
          // folding these builds into the eager `three` chunk makes every
          // WebGL-only visitor download WebGPURenderer + NodeMaterial code.
          if (
            /\/three\/build\/three\.(webgpu|webgpu\.nodes|tsl)\.js$/.test(path) ||
            path.includes('/three/src/renderers/webgpu/') ||
            path.includes('/three/src/nodes/') ||
            path.includes('/three/examples/jsm/tsl/')
          ) {
            return 'three-webgpu';
          }
          if (
            path.includes('/three/') ||
            path.includes('/n8ao/') ||
            path.includes('/postprocessing/')
          ) {
            return 'three';
          }
          if (
            path.includes('/react/') ||
            path.includes('/react-dom/') ||
            path.includes('/scheduler/')
          ) {
            return 'react';
          }
          if (path.includes('/recharts/') || path.includes('/d3-')) return 'charts';
          if (path.includes('/motion/') || path.includes('/phosphor-icons/')) return 'ui';
        },
      },
    },
  },
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
