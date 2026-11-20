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

## Coordinate explorer (on-demand OSM places)

Inspired by WorldCraft's generate-on-visit approach, any coordinate can become a
3D place without shipping pre-built data:

1. Open **Browse all landmarks** and press the map-pin button.
2. Enter `lat, lon` (e.g. `-33.9249, 18.4241`) or a place name, then explore.
3. OpenStreetMap footprints/roads and Open-Meteo elevation are fetched, converted
   into a stylised diorama slice, and shown in the Places stage.
4. Deep links work too: `/?lat=-33.9249&lon=18.4241` opens that place directly,
   and **Copy link** shares it.

Data is cached in localStorage for 7 days; Offline/failed requests degrade to a
procedural fallback (clearly labelled in the info card). OSM data is ©
OpenStreetMap contributors (ODbL). See `src/services/osmService.ts` and
`src/three/osmSlice.ts`.

## Accessibility and high-fidelity lighting

- Centered modals (Settings, Passport, Postcard) use the UI SDK dialog behavior
  from `@ui-sdk/react`: focus trap, Escape/outside dismissal, inert background
  and focus restoration. Sheets keep their custom drag motion and add a focus
  trap via `src/lib/focusTrap.ts`.
- **Cinematic lighting** in Settings raises shadow-map and AO quality on WebGL.
  In a native ThreeRT host it instead switches to path tracing through the
  capability bridge in `src/three/cinematic/nativeHost.ts`. See
  `docs/THREERT.md` — a browser PWA cannot run ThreeRT's native path tracer, so
  the WebGL preset is the graceful fallback.

# citylit-pwa
