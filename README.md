# Citylit PWA

Files: index.html, manifest.webmanifest, sw.js, icons/.

## Deploy (needs HTTPS; localhost also works)

- Vercel / Netlify / Cloudflare Pages / GitHub Pages: upload this folder as-is, keep all files at the site root.
- Local test: `npx serve .` then open the printed URL in Chrome.

## Check it

1. Chrome DevTools > Application > Manifest: no errors, installable.
2. Application > Service Workers: activated and running.
3. Load once online and wait ~5 s (it caches three.js), then tick Offline and reload: the app should open.
4. Lighthouse > Progressive Web App.

## Notes

- Install: Android/desktop Chrome shows an Install button in the search sheet; iPhone: Share > Add to Home Screen.
- Live weather (Open-Meteo) only works online; offline it falls back to typical conditions.
- Bump `V` in sw.js (e.g. citylit-v9) whenever you change index.html so users get the update.
- three.js is pinned to the latest release (`three@0.187.0` / `@types/three@0.187.0`) and bundled at build time — no CDN dependency.
- Rendering uses PCF shadows only (`PCFShadowMap`), exponential fog, ACES filmic tone mapping, and sky-matched dissolve particles.

# citylit-pwa
