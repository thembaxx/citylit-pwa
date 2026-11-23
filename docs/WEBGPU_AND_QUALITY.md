# Renderer selection & measured quality

## Renderer stack (dual-stack)

`CitylitEngine.create()` selects a backend asynchronously:

1. `?renderer=webgl` / `?renderer=webgpu` URL override, then the Settings
   choice (`settings.renderer` in `cl-st`, mirrored to `cl-renderer-pref`).
2. `navigator.gpu` + adapter probe.
3. `new WebGPURenderer(...).init()` — accepted only if the real WebGPU backend
   initialised (three can silently fall back to its WebGL2 backend; that is
   rejected so the original `WebGLRenderer` stack is used instead).
4. Any failure returns the untouched WebGL stack.

`src/three/renderer/SceneRenderer.ts` wraps both behind one facade. The WebGL
path is unchanged: GLSL `ShaderMaterial`, `onBeforeCompile`, `EffectComposer`,
N8AO, bloom, SMAA and the miniature grade pass all still run.

### WebGPU limitations (first pass)

`WebGPURenderer` cannot compile GLSL `ShaderMaterial` or `onBeforeCompile`, and
`EffectComposer` passes are WebGL-only. The WebGPU path therefore:

- converts GLSL materials to node materials via `webgpuCompat.ts` — base colour,
  animated intensity/opacity, blend state, the two sky domes (procedural PMREM
  environment and live weather sky), the far horizon ridges and the stage
  ground sheen have TSL equivalents, and additive glows get a radial alpha
  falloff. Sync readback also supplies a neutral `uv` attribute where WebGL
  silently substitutes one. Other hand-written GLSL effects remain approximations;
- runs a TSL post chain (`webgpuPostFX.ts`) with MSAA, SSAO + MRT normals and
  bokeh DoF on the high tier, bloom on high/balanced, plus saturation/contrast,
  split-tone, shadow lift, vignette and ACES tone mapping. SMAA is replaced by
  MSAA;
- uses asynchronous pixel readback for progressive thumbnails and auto exposure;
  the synchronous one-shot postcard/gallery APIs remain WebGL-only;
- uses three's `WebGPURenderer`-specific PMREM generator for sky environments.

Full visual parity still needs the remaining custom GLSL shaders (water/fog,
weather particles, window and lamp glows, foliage/wind) ported to TSL. WebGL
remains the fidelity reference.

## Auto quality benchmark

`auto` no longer guesses from the device. On first load (no valid cached
measurement):

1. Start at `balanced` (index 1) — neutral, not the old "hardware ⇒ high".
2. Discard 20 warm-up frames (shader/HDR compilation).
3. Sample 60 frames using `max(rAF interval, render-call time, GPU timestamp)`,
   clamped to 100 ms; gaps over 1 s (tab switches) are ignored. GPU timings come
   from `EXT_disjoint_timer_query_webgl2` on WebGL and three's timestamp queries
   on WebGPU, and are used only when available.
4. Commit a tier: median ≤ 16.7 ms with p95 ≤ 24 ms → `high`, median ≤ 22 ms →
   `balanced`, otherwise `low`. Software renderers stay at `low`.
5. Cache the result in `localStorage['cl-quality-benchmark-v1']` keyed by
   backend and device pixel ratio; reuse it for 7 days.

Explicit `high` / `balanced` / `low` settings always override the measurement.
After the benchmark commits, the existing runtime monitor resumes fine-tuning
`renderScale` toward the 60 fps target.

Decision logic lives in `src/lib/qualityBenchmark.ts` and is unit-tested with
`node --test`; it has no three.js or DOM dependency.

## UI controls

The landmark card's former auto-tour Play button is now a compact/full toggle:
the down caret collapses the card, the up caret restores it. On phones
(`max-width: 640px`) the app starts compact — title, 1/43 counter, prev/next and
the expand caret only. Auto-tour remains available from the Space shortcut.
The top-bar hero-view button was removed. The scale-mode badge sits above the
other fixed controls on small screens (and is offset below the weather widget).
Auto-tour is also exposed as a toggle in Settings (Space still works). The
compact/full choice is stored in `localStorage['cl-compact']`, so a manual choice
survives reloads; the mobile default only applies when nothing is stored.

## Comparing backends

`npm run qa:renderers` captures the same pinned high-tier view on both backends
into `qa-renderers/` with a JSON report of console messages and engine state.
Point it at a running server with `QA_URL` (default `http://127.0.0.1:4173/`).
Add `--headed` to watch the captures.
