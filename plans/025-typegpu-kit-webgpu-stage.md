# Plan 025 — TypeGPU Kit WebGPU stage

**Status:** proposed · **Date:** 2026-11-23
**Research:** [`docs/TYPEGPU-KIT-RESEARCH.md`](../docs/TYPEGPU-KIT-RESEARCH.md)

## Goal

Adopt [`@typegpu/kit`](https://docs.swmansion.com/typegpu-kit/) for 3D models,
scenes, lighting and post-processing **without breaking the existing three.js
stack**. The kit is WebGPU-only; WebGL remains the fallback and the fidelity
reference. The plan adds a kit-owned stage behind a flag, proves parity on a
small scene, then ports one real Citylit stage.

## Non-goals / boundaries

- No removal of `three`, `WebGPURenderer`, `webgpuCompat.ts` or `webgpuPostFX.ts`
  in phases 0–2. No change to the WebGL renderer.
- No conversion of all 43 landmarks in one go. No new glTF assets in phase 0–1.
- No React Native work now; `scene.ts` is written so `web.host` can later be
  swapped for `useScene`, but only the web host is wired.
- No replacement of the GLSL water/fog/weather/window shaders until a kit
  implementation is proven to look at least as good.
- The single canvas cannot be shared: the kit stage uses its own `<canvas>`
  (or fully replaces the WebGPU path for a stage in phase 3, by decision).

## Phase 0 — compatibility spike (½–1 day)

**Purpose:** find out whether the kit builds, typechecks and runs in this Vite +
TypeScript 7 + PWA project before any design work depends on it.

Steps:

1. `pnpm add typegpu@^0.12.11 @typegpu/color@^0.12.2 @typegpu/noise@^0.12.1 @typegpu/kit@0.1.0`
   (pnpm-workspace overrides stay; do not change the pinned `three` version).
2. Create a throwaway `src/kit/spike.ts` + a dev-only route `?kitspike=1`:
   - `web.host(createScene, {}, { canvas })` on a fresh canvas;
   - `meshes.roundedBox()` baked into a small `meshPool`, one `instances` row;
   - `cameras.orbit(root, { size: surface, target: [0, 0.5, 0], distance: 6 })`
     plus `web.orbitControls(view, canvas)` in `attach`;
   - `lighting.create(root, { settings: { sunDirection: [0.4, 1, 0.3] } })` and
     `shading.shade(materials.glossy(d.vec3f(0.9, 0.6, 0.3), 0.4), shading.pointAt(world, normal))`;
   - `passes.create(root, screen, { hdr: passes.color, depth: passes.depth })`
     piped with `view.inject()` and `light.inject()`; `bloom` + `finish` to the
     canvas.
3. Verify the published APIs against the installed `.d.ts` files. The kit is
   version 0.1.0 and developed against TypeScript ~6; TypeScript 7.0.2 may
   report errors. If it does, record them here and decide between a local
   `skipLibCheck` scope, a compatible TS pin, or stopping the adoption.
4. Measure: `pnpm build` bundle delta (kit code must be dynamically imported on
   a WebGPU-only path), first-frame time, and whether `vite-plugin-pwa`
   workbox picks up the new chunk. Confirm the service worker still installs
   offline.

**Acceptance:** dev route renders a lit, orbitable object on WebGPU with zero
console errors; `pnpm lint`, `pnpm test` and `pnpm build` pass; bundle delta and
any TS incompatibilities are documented in this file.

## Phase 1 — reproduce the "lit models" look on a separate stage

Use the kit's shipped recipe (`docs/recipes/lit-models/`: `props.ts`, `look.ts`,
`scene.ts`) as the starting point. This is the smallest change that exercises
models, lighting, shadows, AO and the whole post chain together.

New files:

- `src/kit/look.ts` — `createLook(root, surface, view, options)`:
  half-res `depth32float` prepass → `ao.create` (GTAO, `temporal: true`, radius
  ≈ one tenth of the diorama size) → `lighting.create` with a 2-cascade
  fitted shadow and `ambient: (m, p) => shading.hemisphere(m, p) * ao.at(p.position)`
  → HDR targets → `taa` → `bloom` → `finish` with `tone.neutral` and a grade
  matching today's split-tone/vignette from `postfx.ts`.
  Read the AO result through `shared: { ao: occlusion.part }` so resizes do not
  rebuild pipelines.
- `src/kit/props.ts` — `createProps(root, models, placements)`: one `meshPool`
  sized with `meshPool.roomFor([...])`, `instances.create`, `add(model, values)`
  per placement, `ready`, `flush`, `destroy`. For phase 1 the "models" are kit
  primitives (`meshes.roundedBox`, `cylinder`, `icosphere`) so no assets are
  needed.
- `src/kit/scene.ts` — `createScene(root, surface, options)` returning
  `{ view, frame(frame), ready, destroy }`. Wire `web.orbitControls` in the
  host's `attach`, call `view.update(frame.dt)` each frame, then
  `props.flush()`, cull/shadow record, `scene.record(frame, drawn)`, AO, TAA,
  bloom and `final.record(frame, surface.view(frame))`.
- `src/kit/host.ts` — React glue mirroring the hosting docs: start
  `web.host(createScene, options, { canvas, attach, onFrame, onError,
  optionalFeatures: ['timestamp-query', 'indirect-first-instance'] })` in a
  `useEffect`, destroy in cleanup, keep the loading cover until `stage.ready`.
- `src/kit/bridge.ts` — `send()` closures for the values React owns today:
  landmark index, `timePreset`/hour, weather state, quality tier. These are the
  only inputs the scene reads per frame.

Verification: capture the same pinned camera/time/weather as `qa:renderers`
with a third script (`scripts/compare-kit.mjs`, based on
`scripts/compare-renderers.mjs`) and compare side by side with the WebGL and
current WebGPU baselines. Tune until the kit matches within the existing visual
tolerance (no floating props, no AO banding, equivalent highlight rolloff).

**Acceptance:** the kit stage is visually comparable to the reference on one
simple scene; frame time is ≤ the current TSL WebGPU post chain on the same
device; resize, offline reload and teardown are clean.

## Phase 2 — port one real stage

Pick the **hero landmark diorama** first. It is the most visible stage and has
the clearest mapping; Places/Globe can follow only if this succeeds.

1. **Geometry source of truth.** Export the active landmark's procedural
   geometry once, offline, to a `.glb` using a small Node script
   (`scripts/export-landmark-glb.mjs`) that walks the THREE group and writes
   positions/normals/uvs/indices per material. Normalise orientation to +z
   forward (glTF/`instances.toward` convention) or pass `gltf.read`'s
   `rotation` option. Keep the builder code; the export is a build artefact,
   not a replacement. Alternative if export proves too lossy: re-express the
   small reusable set of shapes with `meshes.concat`/`transform` in
   `src/kit/shapes.ts` and bake them into the pool.
2. **Load path.** `gltf.load('/models/<site>.glb', { placements: true })` →
   `pool.add(model)` → `instances.add` per placement. Await `model.ready`
   before hiding the loading cover. Convert any meshopt/KTX2 source with
   `gltf-transform copy|ktxdecompress`; add the `draco3d` decoder only if a
   Draco asset is actually introduced.
3. **Lighting bridge.** Replace the kit's fixed sun with our time system:
   - `environment.sunAt(hour, latitude, declination)` and
     `environment.sunColor(dir)` set `light.settings.patch({ sunDirection,
       sunColor, sunIntensity })`;
   - `environment.add(environment.daylight)` (piped with `light.inject()`) and
     rebake via `clock.cadence({ hz: 15 })` only when the sun actually moved;
   - alternatively bake the existing `public/assets/env/sky.hdr` with
     `images.decodeHdr` + `environment.add(texture)` + `environment.clip` to
     recover a shadow-casting sun from the photograph.
   - Map our biome bounce colours into `skyTop`/`skyBottom`/`skyIntensity`
     (or `environment.settings.intensity`) so night/studio moods still read.
4. **State and interaction.** `web.pointer` + `picker` for landmark taps
   (replacing raycasts on this stage); `cameras.turn`/`pan` for keyboard and
   gesture input so the existing control grammar is preserved. Feed weather
   moments to `particles`/`trails` only after the base scene matches.
5. **Backend selection.** Add `settings.kit` / `?kit=1`, gated on `navigator.gpu`
   and the adapter probe already in `createRenderer.ts`. Keep the three.js
   stage as the fallback and as the WebGL path. If both canvases must exist,
   hide the inactive one with `display: none` and pause its loop
   (`schedule: false` or `hosted.pause()`) so only one renders per frame.

**Acceptance:** all quality tiers work on the kit stage; landmark switching,
hour presets, weather overrides, reduced-motion, keyboard navigation and the
deep links still work; `qa:shots` contact sheets show no regressions; PWA
offline still opens the fallback stage.

## Phase 3 — decide and consolidate (only after phase 2 passes)

- If the kit stage wins: make it the default WebGPU backend for the hero stage,
  retire `webgpuPostFX.ts` for that stage, and port Places/Globe with the same
  `look.ts`. Extend `qa:renderers` to report three backends.
- If it does not win: keep the exploration as an opt-in dev surface or remove
  `src/kit/` and the dependencies; the research and QA harness remain useful.
- Either way, update `README.md`, `docs/WEBGPU_AND_QUALITY.md` and the PWA
  precache configuration, and record the final decision in this plan.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| WebGPU-only; WebGL users see nothing new | three/WebGL path is untouched and remains the fallback |
| 0.1.0 API/TS instability | phase 0 spike pins versions and records exact errors before design work |
| Kit and three fight over the canvas | separate canvas for phases 0–2; pause the inactive stage |
| Procedural geometry does not export cleanly | keep builders as source of truth; fallback to kit `meshes.*` shapes |
| Custom GLSL effects missing | keep them on the three stage until `'use gpu'` ports are proven |
| Bundle/PWA growth | dynamic import on a WebGPU-only path; measure in phase 0 |
| New asset pipeline (glTF/Draco/KTX2) | avoid assets in phases 0–1; convert with `gltf-transform` only if needed |
| QA baselines invalidated | new `compare-kit.mjs` captures beside, not over, existing baselines |

## Verification checklist (every phase)

- `pnpm lint` and `pnpm test` (existing 118 tests must stay green).
- `pnpm build`, then `pnpm preview` with Offline checked: service worker still
  installs and the fallback stage renders.
- `pnpm qa:renderers` / `pnpm qa:shots` against the pinned view.
- `graphify update .` after any source change (AST-only, no API cost).

## Decision needed before phase 1

Priority determines which file is built first:

1. **Look first** — port `look.ts` (lighting/shadows/AO/post) — best if the goal
   is visual quality on WebGPU and keeping the current models.
2. **Models first** — build the glTF export/load pipeline — best if the goal is
   many detailed models and instancing.
3. **Shared scene first** — structure `scene.ts` for both `web.host` and React
   Native `useScene` — best if a native app is planned.

Recommendation: **look first**. It reuses `sky.hdr`, needs no new assets, and
directly tests the claim that the kit improves Citylit's lighting and scenes.
