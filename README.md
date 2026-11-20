# Citylit PWA

Files: index.html, manifest.webmanifest, sw.js, icons/.

## Develop and build

- Install: `pnpm install`
- Dev server: `pnpm dev` (http://localhost:3000)
- Production build: `pnpm build` (runs `tsc --noEmit` then `vite build`, output in `dist/`)
- Serve the production build locally: `pnpm preview` — use this to test the service worker, since the dev SW is intentionally disabled.
- `pnpm start` serves `dist/` via the Express fallback in `server.js`.

## Deploy (needs HTTPS; localhost also works)

- Vercel / Netlify / Cloudflare Pages / GitHub Pages: build with `pnpm build` and deploy the `dist/` directory at the site root.
- The service worker and manifest are generated into `dist/` by `vite-plugin-pwa`; there is no hand-written `sw.js` to copy.

## Check it

1. Chrome DevTools > Application > Manifest: no errors, installable.
2. Application > Service Workers: activated and running.
3. Load once online and wait ~5 s (it caches three.js), then tick Offline and reload: the app should open.
4. Lighthouse > Progressive Web App.

## Notes

- Install: Android/desktop Chrome shows an Install button in the search sheet; iPhone: Share > Add to Home Screen.
- Live weather (Open-Meteo) only works online; offline it falls back to typical conditions.
- Updates use `registerType: 'autoUpdate'` in `vite.config.ts`; the service worker is regenerated on each build, so there is no version string to bump by hand.
- three.js is pinned to a single version (`three@0.187.0` / `@types/three@0.187.0`) via `pnpm-workspace.yaml` overrides and bundled at build time — no CDN dependency and no duplicate Three.js instances.
- Rendering uses PCF shadows only (`PCFShadowMap`), exponential fog, ACES filmic tone mapping, and sky-matched dissolve particles.

# citylit-pwa
