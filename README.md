# Citylit PWA

[![CI](https://github.com/thembaxx/citylit-pwa/actions/workflows/ci.yml/badge.svg)](https://github.com/thembaxx/citylit-pwa/actions/workflows/ci.yml)

Files: index.html, manifest.webmanifest, sw.js, icons/.

## Develop and build

- Install: `pnpm install`
- Dev server: `pnpm dev` (http://localhost:3000)
- Lint and type-check: `pnpm lint`
- Unit tests: `pnpm test` (Node's test runner over `src/lib/*.test.ts` and `src/data/*.test.ts`)
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

## Sky calendar and weather moments

The expanded weather panel includes a **Sky calendar** date picker. `src/data/skyEvents.ts`
holds a small curated calendar of real events — annual meteor showers (Quadrantids,
Perseids, Geminids, …), dated solar/lunar eclipses and comet apparitions. Choosing a
date renders the active event in the 3D scene: denser meteor streaks during a shower,
the Moon reddening during a lunar eclipse, a dark disc and corona across the Sun during
a solar eclipse, and a tailed comet in the night sky. The next three events are listed
for navigation; quiet dates simply show the ordinary sky.

Separately, `src/data/weatherMoments.ts` turns real Open-Meteo observations into
place-specific extremes: thunderstorms become **Highveld lightning** over Gauteng,
snowfall or freezing readings become **Drakensberg snow**, and fog or moist, still air
becomes **Cape Point mist**. These moments amplify the existing storm/fog systems and
add GPU-animated snowfall at the relevant landmark. They only appear when a live
observation is available; offline and climate-model weather stay unchanged.

## 3D globe

The **Globe** button (or the globe icon in a landmark card) opens a 3D map of
South Africa. Landmasses are drawn as stylised dot clouds from simplified
Natural Earth boundaries (public domain, generated into `src/data/globeGeo.ts`).

- **Navigate:** drag to rotate, scroll or pinch to zoom, double-tap empty space
  or press the compass button to reset the view.
- **Explore:** the province pills fly to and highlight a province; landmark
  pins show a tooltip on hover (or tap) and open that landmark when selected.
  Visited landmarks turn green, and provinces tint towards green as their
  landmarks are completed.
- **Keyboard / screen readers:** the HUD exposes a visually hidden list of all
  landmarks alongside the province pills.
- **Deep links:** `/?globe=1` opens the globe;
  `/?globe=1&province=Western%20Cape` opens it focused on a province.
- **Motion and quality:** the globe honours the reduced-motion setting and
  rebuilds its dot density when the quality tier changes.

For the manual touch-device checklist see `docs/qa-mobile.md`.

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

## Rendering performance

- **Settings → Frame rate** offers Auto (default), 60 and 30. Auto keeps the
  adaptive idle pacing; the fixed options apply a continuous ceiling while the
  stricter reduced-motion, software-GL and settled-idle caps still win.
- **Settings → Graphics quality** still selects the tier. The WebGL bokeh pass
  renders its 10-tap blur into a half-resolution target and composites it at
  full resolution, keeping the focus band sharp.
- Procedural bump/normal/roughness canvases are deterministic and cached in
  IndexedDB (`citylit-textures-v1`), so repeat visits skip the pixel loops.
- **Overdraw debug view:** append `?overdraw=1` to the URL (or call
  `window.citylitEngine.setOverdrawDebug(true)` in the console). Every surface
  becomes a translucent additive layer with depth testing off; brighter areas
  are shaded more times. It bypasses post-processing and is a dev tool, not a
  user setting.

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
