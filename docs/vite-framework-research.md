# Is Vite the right build tool / framework for Citylit PWA?

**Research date:** 2026-11-20
**Method:** primary sources (official docs, release notes, source repos) plus a direct audit of this repository. Load-bearing external claims were re-fetched and verified against the source that owns them; vendor performance figures are labelled as vendor-reported.

---

## Verdict

**Keep Vite. Keep React. Keep the imperative Three.js engine.** No framework switch is justified for this app.

The premise is a category error: **Vite is a build tool, not an application framework**. It never executes inside your render loop, so it cannot make the 3D faster. The two decisions that matter are separate:

1. **Build tool** — Vite 8 is currently the best fit for this stack: first-party React 19 / Tailwind v4 / PWA integration, native GLSL-as-string, worker and WASM handling, and a much faster Rolldown-based build. Switching to Rspack, Turbopack, Webpack, Parcel or Bun would buy *seconds of build time* while costing plugin rewrite work and PWA maturity.
2. **UI + 3D stack** — React for the DOM UI and a hand-written imperative Three.js renderer is correct for a ~27k-line custom engine with its own frame loop, composer chain and software-GL fallback. React Three Fiber is an *authoring model*, not a performance upgrade — its own docs say there is "no overhead" — so adopting it here means a rewrite for no frame-rate gain. Babylon/PlayCanvas mean a full engine port.

The real opportunities are configuration and GPU-side: dedupe Three.js, split the bundle, drop unreferenced assets from the PWA precache, move blocking thumbnail renders off the main thread, and tune draw calls / post-processing. Details in [§6](#6-what-would-actually-move-the-needle-for-this-app).

---

## 1. First, correct the question

| Layer | Options | What it decides |
|---|---|---|
| **Build tool** | Vite, Rspack, Webpack, Turbopack, Parcel, esbuild, Bun | Dev startup, HMR latency, build time, chunking, asset hashing, worker/WASM/GLSL handling, PWA precache |
| **UI framework** | React, Solid, Svelte, vanilla TS | DOM state ergonomics, UI bundle size |
| **3D engine / paradigm** | imperative Three.js, React Three Fiber, Babylon.js, PlayCanvas | Scene graph, draw calls, shader pipeline, **runtime FPS** |

Turbopack is a good example of the confusion: it is an incremental bundler that ships *inside Next.js* ([Next.js docs](https://nextjs.org/docs/app/api-reference/turbopack)); it has no involvement in what happens inside `WebGLRenderer.render()`. "Switch to Turbopack for better 3D performance" is simply false.

Vite's own docs are explicit that it **transpiles TypeScript but does not type-check**, and recommend running `tsc --noEmit` separately ([Vite Features](https://vite.dev/guide/features)) — which is exactly what `package.json:10` already does.

---

## 2. What this app actually is (repository grounding)

Measured from the repo, not inferred:

- **Stack:** Vite `8.3.8`, React `19.3.1`, Three `0.187.0`, `@vitejs/plugin-react` `6.3.0`, `vite-plugin-pwa` `2.0.0`, Tailwind v4 via `@tailwindcss/vite`, TypeScript `7.0.2`, oxlint/oxfmt (`package.json:16-38`). `@react-three/fiber` / `drei` are **not** installed.
- **Imperative renderer:** `WebGLRenderer` is constructed in `src/three/CitylitEngine.ts:195-199` with `powerPreference: 'high-performance'`, canvas appended to a React-owned host div at `:214-216`. Scene, cameras, lights and controls are hand-built at `:218-306`. The frame loop is a manual `requestAnimationFrame` at `:1834-1837`, with a 60 fps quality monitor at `:1888-1909`.
- **Size:** ~27,000 TS/TSX lines, ~90% plain Three.js. Largest files: `placesSliceBuilders.ts` (4,274), `builders/landmarksA.ts` (2,479), `CitylitEngine.ts` (2,090), `builders/landmarksB.ts` (2,127), `builders/primitives.ts` (1,807).
- **Post-processing:** `EffectComposer` with `HalfFloatType` + `DepthTexture` (`:309-317`) chaining RenderPass → N8AO → UnrealBloom → custom `MiniaturePass` (tilt-shift/DoF, 10-tap bokeh, `postfx.ts:83-95`) → SMAA (`:319-347`). AO is already half-res and is suspended mid-orbit on high-DPI screens (`:799-805`).
- **Fully procedural geometry:** 43 landmarks built from code; the only shipped 3D asset is `public/assets/env/sky.hdr` (~1.4 MB). There is **no glTF/Draco/KTX2 pipeline** to preserve or migrate.
- **Instancing** is already used for trees, rocks, flowers and clouds (`placesSliceBuilders.ts:515-731`, `placesClouds.ts:32-38`, `weatherScene.ts:108,209`).
- **Degradation paths:** software-GL detection (`:193-212`), DPR caps of 2/1.4/1 by quality tier (`:818-820`), shadow maps 1024/2048/4096, reduced-motion easing (`:1883-1885`).
- **React seam:** one `useEffect` in `src/App.tsx:258-334` constructs the engine once, keeps it in a ref, calls methods imperatively, and receives state via callbacks. React never owns Three objects. `StrictMode` (`src/main.tsx:6-9`) means the engine is created/disposed twice in dev.
- **Build today:** no `manualChunks`, no `build.target`, no minify override. Output is a single **2,327 KB** JS chunk; `dist/` is **31.6 MB**.
- **Known friction (as audited, before the fixes in §9):** `node_modules/.pnpm` contained a **stale orphan** `three@0.170.0` directory, but `pnpm-lock.yaml` resolved *both* `n8ao@2.1.0` and `postprocessing@6.39.6` against `three@0.187.0` — the app was **not** actually loading two versions. The dev-service-worker workaround in `vite.config.ts` and `usePWAInstall.ts` guards against a stale cached bundle rather than a second installed copy. `public/assets/aistudio/` held **21 PNGs / 27.5 MB** with no source references, and the Workbox glob precached them. `README.md` still referred to a root `sw.js` that no longer exists.

---

## 3. Build tooling comparison

| Tool | 2026 status (primary source) | HMR / dev server | Production & code splitting | Workers / WASM | PWA fit | Verdict here |
|---|---|---|---|---|---|---|
| **Vite 8** (current) | 8.0 stable 2026-03-12: single Rust **Rolldown** bundler, vendor-reported 10–30× faster builds, Oxc compiler; 8.1 added experimental bundled dev + Wasm ESM ([8.0](https://vite.dev/blog/announcing-vite8), [8.1](https://vite.dev/blog/announcing-vite8-1)) | Unbundled native ESM, Rolldown prebundling, Oxc React Refresh; experimental `bundledDev` reports ~15× startup / 10× reload on a 10k-component app ([8.1](https://vite.dev/blog/announcing-vite8-1)) | Rolldown chunking, automatic preload directives, experimental chunk import map ([Features](https://vite.dev/guide/features)) | Native `?worker`, `new Worker(new URL(...))`, `?raw` for `.glsl`, `.wasm?init` and Wasm ESM ([Features](https://vite.dev/guide/features)) | `vite-plugin-pwa` with Workbox `generateSW`/`injectManifest`, declares Vite 8 support ([repo](https://github.com/vite-pwa/vite-plugin-pwa), [Workbox docs](https://vite-pwa-org.netlify.app/workbox/)) | **Keep** — already integrated, zero migration |
| **Rspack 2.x** | 2.0 (2026-04-22) and 2.2 (2026-08-26); Rust, incremental + persistent cache ([2.0](https://www.rspack.dev/blog/announcing-2-0), [2.2](https://www.rspack.dev/blog/announcing-2-2)) | Fast, webpack-compatible HMR API ([HMR](https://www.rspack.dev/api/runtime-api/hmr)) | Strong splitting, Module Federation | webpack-style loaders | No first-class PWA plugin; Workbox manual | **Viable but unjustified** — build-time-only gain |
| **Turbopack** | Default bundler in Next.js 16; function-level incremental cache; not standalone ([docs](https://nextjs.org/docs/app/api-reference/turbopack), [Next 16](https://nextjs.org/blog/next-16)) | Bundled dev, fast refresh | Stable for `next build` | Via Next.js | No equivalent of `vite-plugin-pwa` | **Poor fit** — forces a Next.js rewrite for zero FPS benefit |
| **Webpack 5** | Mature, huge ecosystem; slowest in Rspack's published comparison | Config-heavy Fast Refresh | Excellent | Supported | `workbox-webpack-plugin`, more manual | **Regressive** |
| **Parcel 2** | Zero-config, disk cache, automatic splitting ([features](https://parceljs.org/features/development/)) | Good | Automatic | Supported | No mature PWA plugin | **No advantage** |
| **esbuild** | Very fast transformer; maintainers explicitly do **not** plan HMR or all-in-one features ([FAQ](https://esbuild.github.io/faq/)) | Live reload only; no JS HMR | Primitive | Limited | None | **Not standalone** |
| **Bun bundler** | Fast; HMR API "work in progress", some APIs missing ([docs](https://bun.sh/docs/bundler/hot-reloading)) | Fast but incomplete | Supported | Plugins exist | No mature Workbox integration | **Too immature** for a shipping PWA |

**Build-tool verdict:** Vite 8 is at or near the top on every criterion that matters *here*, and all four integration points are already wired. Rspack is the only credible "faster build" alternative, and its win is measured in seconds on cold builds — irrelevant beside a 16.7 ms frame budget.

---

## 4. 3D + UI stack comparison

| Option | What it is (primary source) | Runtime | Custom GLSL / post FX | Migration from this app | Verdict |
|---|---|---|---|---|---|
| **Imperative Three.js 0.187** (current) | Manual renderer, scene, loop ([Creating a scene](https://threejs.org/manual/pages/creating-a-scene.html), [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)) | Direct, zero abstraction; `InstancedMesh`, `BatchedMesh`, `LOD`, experimental `MeshletDrawingPipeline` ([InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html), [BatchedMesh](https://threejs.org/docs/pages/BatchedMesh.html), [Meshlet](https://threejs.org/docs/pages/MeshletDrawingPipeline.html)) | First-class: `ShaderMaterial`, custom render targets, n8ao, `compileAsync()` | **Zero** | **Keep** |
| **React Three Fiber** | "A React renderer for three.js"; `<mesh/>` → `new THREE.Mesh()`; "no overhead", "everything that works in Threejs will work here without exception" ([Intro](https://r3f.docs.pmnd.rs/getting-started/introduction)) | No inherent FPS gain; `useFrame` in its own loop | Fully possible; can accept your own renderer and wrap imperative objects in `<primitive>` ([Canvas](https://r3f.docs.pmnd.rs/api/canvas)) | **High** — re-own scene, loop, composer, disposal | **Optional for isolated state-driven 3D widgets, not a rewrite** |
| **Babylon.js** | Full WebGL/WebGPU engine with occlusion queries, MRT, UBOs ([features](https://doc.babylonjs.com/features/), [WebGPU](https://doc.babylonjs.com/setup/support/webGPU)) | Strong; mature WebGPU | GLSL must be adapted; compute is WebGPU-only | **Very high** — port engine, shaders, n8ao, instancing | **Don't switch** unless WebGPU compute is a hard requirement |
| **PlayCanvas** | WebGPU/WebGL2 engine, ECS, built-in Draco/Basis/KTX2 ([engine docs](https://developer.playcanvas.com/user-manual/engine/), [shaders](https://developer.playcanvas.com/user-manual/graphics/shaders/)) | Excellent | GLSL/WGSL | **Very high** — entity/component rewrite | **Don't switch** |
| **Solid/Svelte + Three, vanilla TS + Three** | Same Three.js underneath | Same GPU work; no FPS gain | Same | High — rewrite UI | **No benefit** |

**3D-stack verdict:** R3F removes the usual "declarative is slower" argument, which also removes any performance reason to migrate. This engine deliberately implements its own loop, quality scaling, dual render paths, software-GL fallback and disposal — precisely the machinery R3F would take over. The DOM UI (React + Tailwind + Motion) is unaffected by, and well suited to, the current split.

---

## 5. Where the bundler does — and does not — matter

**Does affect:** dev startup and HMR on large module graphs; production build time; initial load via chunk splitting, tree-shaking and hashing; correct bundling of workers, WASM, GLSL strings and asset URLs; **PWA precache correctness** (which files are hashed, which exceed the cache cap, whether the SW serves a stale dependency copy — see the documented duplicate-Three bug in `vite.config.ts:77-84`); lazy-loading scenes via dynamic `import()`.

**Does not affect:** frame time, draw calls, triangle count, shader ALU cost, texture bandwidth, overdraw, GPU occupancy, post-processing cost, instancing, or whether procedural generation blocks the main thread. Those are Three.js/GLSL/browser concerns.

Analogy: the bundler controls how fast the book is printed and delivered; Three.js plus your GLSL controls how good the reading is.

---

## 6. What would actually move the needle for this app

Ordered by expected impact, grounded in the audit above:

1. **Guarantee a single Three.js version.** The lockfile already resolves `n8ao` and `postprocessing` against `three@0.187.0`; the `three@0.170.0` folder was only a stale orphan in `node_modules/.pnpm`. Removing it and pinning `three: 0.187.0` in `pnpm-workspace.yaml` overrides makes the single-version guarantee explicit and prevents a future install from introducing a second copy.
2. **Stop shipping 27.5 MB of dead weight.** `public/assets/aistudio/` has 21 unreferenced PNGs, and the Workbox glob precaches them into a 31.6 MB `dist/`. Delete them or exclude them, then reconsider the 5 MB `maximumFileSizeToCacheInBytes` (`vite.config.ts:73-75`) based on what the app actually needs offline.
3. **Split the 2,327 KB entry chunk.** Add `build.rollupOptions.output.manualChunks` to separate `three` + postfx from the React UI, and lazy-load the large mode builders so globe, places and landmarks don't all ship at boot. Vite supports dynamic imports and automatic preload directives natively ([Features](https://vite.dev/guide/features)).
4. **Move blocking renders off the main thread.** The synchronous `generateThumbnails()` (`CitylitEngine.ts:1302-1373`) renders all 43 landmarks at 210×140 in one pass — but it is **unused**; the app calls `generateThumbnailsAsync()`, which is already idle-sliced two landmarks at a time. Postcards and gallery shots (`:1375-1488`) still re-render at up to 4096 shadow maps and block when the user requests them. A true `OffscreenCanvas` + Worker port ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)) would require moving the whole scene graph and landmark builders into the worker; that is a separate refactor, not a small patch. Vite bundles workers as separate chunks natively if undertaken.
5. **Measure before more tuning.** Establish a baseline with `renderer.info.render.calls` / `.triangles` and GPU timing ([Three.js Info](https://threejs.org/docs/pages/Info.html)). Keep the existing instancing; use `BatchedMesh` with `perObjectFrustumCulled` for mixed geometry; add chunk bounds so a single huge mesh doesn't defeat culling; add `LOD` tiers for distant landmarks ([LOD](https://threejs.org/docs/pages/LOD.html)). On capable devices only, the experimental `MeshletDrawingPipeline` offers GPU-driven cluster culling ([docs](https://threejs.org/docs/pages/MeshletDrawingPipeline.html)).
6. **Audit the post chain further.** AO is already half-res and bloom is monkey-patched to half-res (`:320-341`) — good. Keep DPR caps; consider conditional passes by device tier and fewer render-target ping-pongs.
7. **Consolidate shader prewarming.** Two hand-rolled paths exist (`prewarmShaders()` `CitylitEngine.ts:1805-1832`; `prewarmNextLandmark()` `:551-602`, already using `compileAsync`). `prewarmShaders()` has been switched to `compileAsync()` with a synchronous fallback; the shared cached materials are deliberately not disposed.
8. **Optional DX lever:** if the module graph keeps growing, trial Vite 8.1's `experimental.bundledDev: true` — but note it may not work with third-party plugins ([8.1 announcement](https://vite.dev/blog/announcing-vite8-1)), so validate `vite-plugin-pwa` first.
9. **Fix stale docs:** `README.md` referenced a root `sw.js` that no longer exists; the SW is generated into `dist/sw.js` by `vite-plugin-pwa`. Deploy/build instructions now describe `pnpm build` and `dist/`.

Only after all of the above would a build-tool change make sense — and then as a DX optimization, not a performance fix.

---

## 7. Risks / watch-items for the current stack

- **Vite 8 / Rolldown plugin edge cases:** the plugin API is almost Rollup-compatible but not identical — `moduleParsed` is not called in dev, `resolveImportMeta` / `renderDynamicImport` are unsupported, sourcemap validation is stricter ([Rolldown Plugin API](https://rolldown.rs/apis/plugin-api), [Vite Plugin API](https://vite.dev/guide/api-plugin)). Validate plugins after every upgrade.
- **PWA plugin churn:** pin `vite-plugin-pwa`; it declares Vite 8 support but the ecosystem is moving ([repo](https://github.com/vite-pwa/vite-plugin-pwa)).
- **Keep `devOptions.enabled: false`** (`vite.config.ts`) — the dependency graph is now pinned to one Three.js version, but a dev SW can still cache a stale optimized bundle across lockfile changes, so the guard remains worthwhile.
- **TypeScript 7 + Oxc:** the `tsc --noEmit && vite build` split is correct; Vite does not type-check ([Features](https://vite.dev/guide/features)).
- **Vendor figures:** build-speed numbers (10–30×, 15×/10×) are vendor-reported from official release notes; no independent benchmark was run for this report.

---

## 8. Sources

**Vite / build tooling**
1. Vite 8.0 announcement — https://vite.dev/blog/announcing-vite8
2. Vite 8.1 announcement — https://vite.dev/blog/announcing-vite8-1
3. Vite Features (`?raw`, workers, WASM, build optimizations) — https://vite.dev/guide/features
4. Vite Plugin API — https://vite.dev/guide/api-plugin
5. Vite migration guide — https://vite.dev/guide/migration
6. Rolldown Plugin API — https://rolldown.rs/apis/plugin-api
7. Rspack 2.0 — https://www.rspack.dev/blog/announcing-2-0
8. Rspack 2.2 — https://www.rspack.dev/blog/announcing-2-2
9. Rspack HMR — https://www.rspack.dev/api/runtime-api/hmr
10. Next.js Turbopack docs — https://nextjs.org/docs/app/api-reference/turbopack
11. Next.js 16 blog — https://nextjs.org/blog/next-16
12. esbuild FAQ (no HMR planned) — https://esbuild.github.io/faq/
13. Bun bundler HMR — https://bun.sh/docs/bundler/hot-reloading
14. Parcel development — https://parceljs.org/features/development/

**PWA / CSS**
15. vite-plugin-pwa — https://github.com/vite-pwa/vite-plugin-pwa
16. vite-plugin-pwa Workbox docs — https://vite-pwa-org.netlify.app/workbox/
17. Tailwind CSS + Vite — https://tailwindcss.com/docs/installation/using-vite

**3D engines / paradigm**
18. R3F Introduction — https://r3f.docs.pmnd.rs/getting-started/introduction
19. R3F Canvas / custom renderers — https://r3f.docs.pmnd.rs/api/canvas
20. Three.js manual: Creating a scene — https://threejs.org/manual/pages/creating-a-scene.html
21. Three.js WebGLRenderer — https://threejs.org/docs/pages/WebGLRenderer.html
22. Three.js InstancedMesh — https://threejs.org/docs/pages/InstancedMesh.html
23. Three.js BatchedMesh — https://threejs.org/docs/pages/BatchedMesh.html
24. Three.js LOD — https://threejs.org/docs/pages/LOD.html
25. Three.js MeshletDrawingPipeline — https://threejs.org/docs/pages/MeshletDrawingPipeline.html
26. Babylon.js features — https://doc.babylonjs.com/features/
27. PlayCanvas engine — https://developer.playcanvas.com/user-manual/engine/

**Browser / runtime**
28. Three.js Info — https://threejs.org/docs/pages/Info.html
29. MDN OffscreenCanvas — https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas

**Local evidence:** `package.json`, `vite.config.ts`, `pnpm-workspace.yaml`, `README.md`, `src/App.tsx`, `src/main.tsx`, `src/three/CitylitEngine.ts`, `src/three/postfx.ts`, `src/three/placesSliceBuilders.ts`, `src/hooks/usePWAInstall.ts`, `dist/`, `public/assets/aistudio/`, `node_modules/.pnpm`.

---

## 9. Implementation status (2026-11-20)

**Done:**

- **Single Three.js version:** verified `pnpm-lock.yaml` already resolves `n8ao` and `postprocessing` to `three@0.187.0`; removed the stale `three@0.170.0` orphan from `node_modules/.pnpm` and added `three: 0.187.0` to `pnpm-workspace.yaml` overrides. No app code imported 0.170.0.
- **Dead assets removed:** deleted the 21 unreferenced `public/assets/aistudio/` images (27.5 MB) and added `workbox.globIgnores: ['**/aistudio/**']` as a guard.
- **Bundle split + lazy engine:** added `build.target: 'es2022'` and `manualChunks` (three / react / charts / ui); `App.tsx` now dynamically imports `CitylitEngine`, so the WebGL bundle loads after first paint. Added an error fallback so a WebGL load failure doesn't leave the UI stuck on the splash.
- **Shader prewarming:** `prewarmShaders()` now uses `compileAsync()` with a synchronous fallback; shared cached materials are not disposed.
- **Docs:** `README.md` rebuilt around `pnpm dev` / `pnpm build` / `pnpm preview` and the generated SW; stale dev-SW comments corrected; this report's duplicate-Three claim corrected.

**Deliberately not done (needs a separate, higher-risk change):**

- **Worker/OffscreenCanvas rendering:** the thumbnails actually used at runtime are already idle-sliced (`generateThumbnailsAsync`); the synchronous generator is unused. Moving real WebGL rendering into a worker means porting the engine's scene graph and ~20k lines of landmark builders — a rewrite, not a patch. Postcard/gallery captures remain main-thread but are user-triggered.
- **Lazy-loading individual mode builders:** the engine and all its builders now load together *after* first paint via the dynamic import. Splitting globe/places/landmark builders into independently lazy chunks requires re-architecting the engine's synchronous construction paths.
- **Draw-call / culling / LOD tuning:** needs a measured `renderer.info` baseline and visual regression testing; no blind changes made.
