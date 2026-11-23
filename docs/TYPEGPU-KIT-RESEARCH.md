# TypeGPU Kit — research and fit analysis for Citylit PWA

**Date:** 2026-11-23
**Sources:** [announcement post](https://x.com/swmansion/status/2124902599073882421),
[TypeGPU Kit docs](https://docs.swmansion.com/typegpu-kit/),
[npm `@typegpu/kit@0.1.0`](https://registry.npmjs.org/@typegpu/kit/latest),
plus the local code graph (`graphify query`) and `docs/WEBGPU_AND_QUALITY.md`.

This is research, not a commitment to migrate. The actionable plan is
[`plans/025-typegpu-kit-webgpu-stage.md`](../plans/025-typegpu-kit-webgpu-stage.md).

## 1. What TypeGPU Kit actually is

`@typegpu/kit` (0.1.0, MIT, Software Mansion) is a set of interchangeable GPU
modules built on [TypeGPU](https://typegpu.com). Its own tagline is "building
blocks … use what you want and fill the gaps with your own code."

The mental model is deliberately **not** a scene graph:

| Concern | three.js today | TypeGPU Kit |
| --- | --- | --- |
| Shaders | GLSL `ShaderMaterial` / TSL | TypeScript functions marked `'use gpu'` |
| Memory | attributes + uniforms | typed schemas (`d.struct`, tables, buffers) |
| Objects | `Object3D` hierarchy | rows in buffers; one draw per mesh |
| Passes and order | the renderer's | **yours** |
| Submit | the renderer's | **yours, once a frame** |

Every module is a factory: `create(root, options)` allocates resources and
returns a handle with (a) typed resources, (b) `record(...)` methods that draw
into **your** pass or encoder, (c) `'use gpu'` functions your shaders call, and
(d) `destroy()`. `initAsync()` compiles pipelines before the loop, so a steady
frame allocates nothing. A frame's order is simply the order of your calls.

Subpath exports exist for essentially every area we care about:
`geometry`, `meshPool`, `gltf`, `instances`, `cameras`, `passes`, `targets`,
`lighting`, `shading`, `materials`, `ao`, `environment`, `bloom`, `finish`,
`taa`, `fxaa`, `dof`, `exposure`, `particles`, `text`, `picker`, `web`,
`hosting`, `profiler`, `testing`.

Peer deps are optional but the useful web set is `typegpu@^0.12.11`,
`@typegpu/color@^0.12.2`, `@typegpu/noise@^0.12.1`; `wgpu-matrix` is a direct
dependency. The published package is large on disk (~9 MB unpacked, 1084 files)
but the subpath exports allow tree-shaking; the PWA budget needs measuring.

## 2. Module-by-module mapping to Citylit

### Models and geometry

- `meshes` (`@typegpu/kit/geometry`) gives indexed primitives — `box`, `plane`,
  `sphere`, `cylinder`, `torus`, `icosphere`, `capsule`, `roundedBox` — each with
  `position`, outward `normal` and `uv`. `transform`, `concat`, `map` and `attach`
  compose them into a single shape while vertices stay index-computed. Draw them
  computed every frame (`unindexed`), index-baked (`bakeIndices`) or fully baked
  (`bake`); bake shapes above a few hundred vertices.
- `meshPool` puts all shapes/models in shared vertex/index buffers (u32 indices,
  half-float UVs), with bounding boxes, optional second UV set (`uvs1` for
  lightmaps), joints/weights, custom vertex extras, and decoded textures with
  mipmaps. One pipeline can draw any mesh by range. `meshPool.roomFor([...])`
  sizes the pool exactly.
- `gltf.read`/`gltf.load` converts a `.glb` to CPU arrays + materials; `pool.add`
  uploads it. It supports the glTF metallic-roughness material (colour,
  roughness, metallic, emission, normal, occlusion), named moving parts, skins
  and animation clips, and `placements: true` to store a repeated mesh once and
  instance its node transforms.
- `instances` stores one row per copy (position, quaternion, scale, material
  fields, optional custom fields) and renders all live rows per mesh with one
  draw. Custom *kinds* add `'use gpu'` callbacks for vertex deformation, material
  overrides and carried per-vertex values; `history: true` keeps last frame's
  rows for motion-vector TAA. GPU culling uses `cull: true` plus
  `indirect-first-instance` (optional; there is a fallback path).

**Our situation:** Citylit currently has **no `.glb`/`.gltf` assets** — the only
matching file is `public/assets/env/sky.hdr`. All 43 landmarks are hand-built
THREE geometry in `src/three/builders/landmarksA.ts`, `landmarksB.ts`,
`primitives.ts`, `propKit.ts`, `dioramaKit.ts`, `animalKit.ts`. So "using TypeGPU
Kit for models" means either (a) baking/exporting that procedural geometry to
glTF once and loading it through `gltf` → `meshPool` → `instances`, or (b)
re-expressing the reusable parts with `meshes.*` + `concat`/`transform` and
baking them into a pool. (a) preserves the art; (b) is a larger rewrite.

glTF caveats that matter if we go via (a): morph targets are skipped; a model
may have only one skin; meshopt- and KTX2-compressed files must be converted
with `gltf-transform` (`copy`, `ktxdecompress`); Draco needs an external decoder
(`draco3d` on web, a JS build on React Native); mirrored nodes flip winding.

### Scenes and passes

- `passes.create(root, screen, { hdr: passes.color, depth: passes.depth }, opts)`
  declares which textures a pass writes and builds a pipeline per drawing.
  `.pipe(view.inject())` fills the camera uniform; `.beneath(light.inject())`
  supplies default lighting; `shared: { ao: occlusion.part }` binds parts that
  survive texture replacement on resize. `scene.add(drawing)` returns draw
  commands; `scene.record(frame, drawn)` opens/ends the pass.
- `targets` holds sets of textures that follow canvas size (`fit()` per frame),
  with scale, sampling, mip and multisample options.
- `cameras` provides `orbit` (eased goal, damping, floor/reach constraints),
  `flat`, `custom` (matrices from `wgpu-matrix`) and `layered` (one view per
  shadow cascade). Shaders read one `cameras.current` accessor; CPU helpers
  include `projectAt`, `rayAt`, `hitHeight`, `sees`, `toClip`, `rayOf`.
- `web.orbitControls(view, canvas)` writes the camera goal from pointer input
  (drag, wheel, pinch, pan, optional `page` mode for scrollable pages).

This replaces our `OrbitControls` + `SceneRenderer.setSize/setPixelRatio` +
render-target plumbing, but only for a stage owned by the kit.

### Lighting, shadows and environment

- `lighting.create(root, ...)` holds sun direction/intensity/colour, two-colour
  sky, fog, point/spot lights from a table or a `'use gpu'` function, and
  cascaded sun shadows fitted to the camera (1–4 cascades, 1/4/9-tap filtering,
  optional enable flag). Shading runs through `shading.shade(material, point)`;
  `materials.matte/glossy/metal/glow` are glTF metallic-roughness presets.
- `ao.create` is GTAO from a depth prepass (usually half-res `depth32float`),
  with a denoise pass. Read it in the ambient hook:
  `(m, p) => shading.hemisphere(m, p) * ao.at(p.position)`. It dims only sky
  light; sun and point lights keep their own shadows.
- `environment` bakes an HDR panorama, a cube map or a procedural sky into a
  reflection cube at six roughnesses plus nine diffuse harmonics. `sky.ambient`
  plugs into lighting; `environment.daylight` + `sunAt(hour, lat, declination)`
  + `sunColor(direction)` model physical daylight, with a rebake cadence rather
  than every frame. `environment.clip` extracts a photographed sun into a real
  shadow-casting light; `stars()`, `background()` and `sunDisc()` cover the sky.

This is the closest conceptual match to our current `lightingRig.ts` (sun,
rim, biome-tinted bounce, mood curves), `globalIllumination.ts` (irradiance
probe volume from `sky.hdr`) and the two sky domes — but the kit's version is
data-driven and GPU-resident, with no per-frame CPU colour lerps in JS.

### Post-processing

`bloom` (13-tap downsample, Karis average, tent upsample, threshold/knee/spread),
`finish` (glow → exposure → tone curve → grade → vignette → sRGB → dither;
curves `neutral`/`aces`/`reinhard`/`agx`), `exposure` (GPU log-luminance meter
with rise/fall), `taa` (jitter + history, motion/depth-aware), `fxaa`, `dof`,
`mipmaps`, `profiler` and a GPU debug panel. `grade(color, uv)` is a `'use gpu'`
function, so our saturation/contrast/split-tone/shadow-lift/vignette chain from
`webgpuPostFX.ts` can be expressed directly.

### Effects, interaction and hosting

`particles`/`trails` (could replace wind/weather/snow moments), `impostors`
(distant foliage), `text`/`font` (labels/HUD in 3D), `picker` (GPU hit testing
under a pointer, replacing raycasts), `poses` (skinned animation), `readback`,
`recording`/`testing` (`recordingRoot()` counts GPU allocations in a test).

`web.host(createScene, options, { canvas, attach, onFrame, onError,
optionalFeatures })` owns root, surface, loop, animation, errors and teardown.
A React component starts it in an effect and destroys it in cleanup; `send()`
runs a closure on the scene runtime (weather/time/landmark changes), and
`schedule: false` + `loop.run(seconds)` supports on-demand frames. On React
Native the same scene file runs through `useScene` / `host` (worker by default).

## 3. Fit with the current application

### What we already have (keep)

- Dual renderer stack in `src/three/renderer/SceneRenderer.ts`: WebGL reference
  plus an opt-in WebGPU path via `three`'s `WebGPURenderer` with TSL equivalents
  (`webgpuCompat.ts`) and a TSL post chain (`webgpuPostFX.ts`).
- `CitylitEngine.create()` backend selection (`?renderer=webgl|webgpu`,
  Settings preference, adapter probe, fallback to WebGL). WebGL is the fidelity
  reference and the fallback for browsers without WebGPU.
- 43 procedural landmarks, Places cutaway slices, Globe dot-cloud, weather and
  sky events, daylight birds, coordinate explorer, PWA service worker, QA
  capture scripts (`qa:renderers`, `qa:shots`) and a quality benchmark.

### Hard constraints

1. **WebGPU only.** TypeGPU Kit does not run on WebGL. Any kit stage needs a
   WebGPU-capable browser; `three` + WebGL must remain for everyone else. This
   is not a drop-in replacement for the current facade.
2. **One canvas, one owner.** `three`'s `WebGPURenderer` and the kit's
   `web.surface`/`web.host` both configure the canvas context. They cannot
   drive the same canvas concurrently. A pilot must use a separate canvas or
   replace the WebGPU renderer path wholesale for that stage.
3. **No scene graph.** Current code relies on `THREE.Group` hierarchies,
   `onBeforeCompile` material patches (`shaders.ts`, `globalIllumination.ts`,
   `placesShaders.ts`) and per-object animation. Porting means redesigning state
   as tables/instances/kernels, not translating calls one-for-one.
4. **Custom shaders have no kit equivalent.** Water/volumetric fog/strata/
   season/cloud/noise GLSL, weather particles, window/lamp glows and foliage
   need new `'use gpu'` implementations or a deliberate simplification.
5. **Maturity and toolchain.** The kit is 0.1.0 with several modules marked
   unstable; it is developed against TypeScript ~6 (`tsover`) while this repo
   pins TypeScript 7.0.2. A typecheck/bundle spike must come first.
6. **Asset pipeline.** No glTF assets exist today; adopting the model path adds
   an export step (gltf-transform) and, optionally, a Draco decoder. `sky.hdr`
   is directly reusable via `images.decodeHdr` + `environment`.

### Where the kit is clearly stronger

- Deterministic, allocation-free frames with explicit pass order and a GPU
  debug panel/profiler — worth a lot given the existing performance work
  (`plans/021`–`023`, `docs/PERFORMANCE-ROUND-4.md`).
- Instancing and GPU culling for large counts (birds, crowds, trees, dot
  clouds) without JS draw calls.
- Physically grounded daylight + IBL from the existing HDR, with AO wired into
  the ambient term instead of multiplied onto the final colour.
- A copyable, end-to-end "lit models" recipe in the docs (`recipes/lit-models/`)
  that already combines shadows, AO, TAA, bloom and grading.

### Where three.js is still stronger for us

- WebGL fallback and the existing GLSL material library.
- The mature editor-friendly scene graph used by all 43 landmark builders.
- Existing QA harness, service worker and benchmark are tied to the current
  renderer; changing the renderer invalidates those baselines.

## 4. Recommended shape of the work

Do **not** replace the renderer. Add a WebGPU-only, kit-owned stage behind a
flag, prove it can match the current look with a small scene, then port one
real stage. Keep `three` + WebGL untouched until the kit stage wins a visual
and performance comparison. Phases, files and acceptance criteria are in
[`plans/025-typegpu-kit-webgpu-stage.md`](../plans/025-typegpu-kit-webgpu-stage.md).

## 5. Open questions for the product decision

- Is the goal (a) better lighting/post quality on WebGPU, (b) a reusable kit
  for many detailed models, or (c) a React Native app later? The answer changes
  which phase gets priority — (a) favours the `look.ts` port, (b) favours the
  model export pipeline, (c) favours a shared `scene.ts` and `web.host`/
  `useScene` split from day one.
- Are we willing to introduce glTF/Draco assets into the PWA, or must the
  procedural builders stay the source of truth?
- Should the kit stage be user-visible (a new renderer option in Settings) or
  an internal QA/comparison surface first?
