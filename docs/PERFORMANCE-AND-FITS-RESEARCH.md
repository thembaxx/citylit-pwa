# Performance, landmark rings and plinth-fit research (2026-11-23)

Grounded in `graphify query` output, source reads, the existing audits
(`docs/IMPROVEMENT-BRAINSTORM.md` §5, `docs/SCENERY-UPGRADE.md` §H) and the
shipped screenshots. This is the research behind plans **021–023**.

## 1. What the semi-transparent rings are

There are two distinct ring systems around a landmark diorama:

| System | Source | Visual | Decision |
|---|---|---|---|
| **Atmospheric fog cylinders** | `src/three/siteAtmosphere.ts` → `RING_SPECS` (L127), `createRingMaterial()` (L456), `RING_FRAGMENT` (L323) | 15 large `CylinderGeometry` shells (radii 9.3–16.8) with animated `fbm()` noise, `transparent`, `depthWrite:false`, `DoubleSide`, `frustumCulled:false`. These are the soft translucent bands hugging the diorama (ridge fog, sea/spray mist, dust, urban smog, heat haze). | **Remove.** This is the primary suspect for both the user-visible rings and desktop lag. |
| **Coastal ripple rings** | `src/three/builders/primitives.ts` → `seaRings()` (L3018), called from 12 coastal builders | Thin `RingGeometry` annuli with `transparent`/`depthWrite:false`, expanding and fading each tick (`opacity = 0.48 * (1-k)`). Small white rings on the water around coastal landmarks. | **Remove.** Also semi-transparent rings around landmarks; cheap individually but pure decoration. |
| Horizon scenery rings | `src/three/horizonScenery.ts` → `createHorizonRing()` (L130) | Distant cylindrical mountain/dune/skyline silhouettes that encircle the *scene*. | **Keep.** This is the background landscape, not a ring around an individual landmark; removing it would leave an empty sky. Documented here so the intent is explicit. |
| Plinth emissive rim | `CitylitEngine.ts:710-736` (`ringMat`, square frame) | Thin glowing square trim on the stand itself. | **Keep.** It is the edge of the stand, not a translucent ring around the landmark. |
| Tree ring / lamp halos | `dioramaKit.ts` `addTreeRing()`, `getLampHaloGeo()` | Ring of trees around the site; halos around individual lamps. | **Keep.** Opaque geometry / local lamp FX, not landmark rings. |

**Why the fog cylinders are a performance problem:** each visible layer covers a
large part of the screen and runs two `fbm()` noise evaluations plus a `discard`
per fragment, with back-to-front alpha blending and no culling. At high quality
on a HiDPI desktop (`devicePixelRatio` up to 2, pixel ratio base 2 in
`applyRenderScale()` L2896) this is hundreds of thousands of shaded, blended
fragments per frame before N8AO, bloom and SMAA even run.

## 2. Performance hotspots (verified against current code)

Existing audit figures (`docs/IMPROVEMENT-BRAINSTORM.md:327-354`): noon avg
**2,236 draw calls / 1.22M triangles**, worst Bo-Kaap **6,556 calls / 8.61M
tris**. Those are high but the following audit ideas were **already implemented**
and must not be redone:

- `CB()` size-aware segments — `primitives.ts:758-770` (`segs=1/2/3` by size). DONE.
- Auto-exposure async readback — `CitylitEngine.ts:2660-2702` uses
  `readRenderTargetPixelsAsync` every 12th frame, not every frame. DONE.
- `manualChunks` WebGPU split — `vite.config.ts:141-155`. DONE.
- LRU landmark pool + idle prewarm, dynamic resolution 0.75–1.0, strided
  shadow updates, `compileAsync`, GPU-timestamp benchmark. DONE.

Remaining, low-risk wins:

1. **Transparent overdraw** — removing the ring layers (plan 021) removes ~15
   full-screen-ish blended `fbm` layers and their per-frame JS uniform/rotation
   updates. Highest impact for this user's complaint.
2. **HiDPI pixel count** — `applyRenderScale()` allows a tier-0 base pixel ratio
   of 2 (`Math.min(devicePixelRatio, 2)`). Combined with `antialias:true` in
   `createRenderer.ts:31-35`, a Retina desktop shades 4× the pixels with 4× MSAA.
   Cap tier-0 at 1.5 and disable MSAA when DPR > 1.25 (high-DPR already smooths
   edges). Should be visually near-identical and removes ~44% of fragments.
3. **Always-on rAF** — the idle throttle at `CitylitEngine.ts:5374-5399` only
   engages for reduced motion (66 ms) or software GL (50 ms). A settled,
   non-reduced desktop scene renders at full rate forever. Add a 30 fps cap
   (33 ms) when the camera, tweens and interactions have been quiet for >2 s.
   `lastInteractAt` is already updated by pointer move/down/wheel and preset
   changes, so interaction stays at full rate.

Deferred (higher risk, not needed for this pass): scene-level static batching
(`mergeByMaterial` is per-assembly; a global merge must exclude interactive,
animated, dissolve and cutaway meshes), lazy per-builder chunks, WebGPU SSAO
normal-pass reduction.

## 3. Fit-to-stand status

`src/lib/fitMath.ts` already publishes `PLINTH_HALF_EXTENT = 8.52`,
`PLINTH_FRAME_WIDTH = 0.06`, `PLINTH_INNER_HALF_EXTENT = 8.46`,
`fitBoundsToPlinth()` (scale ≤ 1 + centring offset) and `boundsFitPlinth()`.

But `CitylitEngine.showLandmarkImmediate()` L2293–2304 only **audits**:

```ts
this.currentGroup.userData.plinthFit = fitBoundsToPlinth(plinthFootprint);
this.currentGroup.userData.fitsPlinth = boundsFitPlinth(plinthFootprint);
```

The comment explicitly says "without silently rescaling the hero". So a site
whose authored props spill past the rim is *detected* but never corrected; the
stand does not actually contain every landmark. The fix (plan 022) is to apply
that same fit inside `buildLandmarkGroup()` (before the group is mounted and
before anchors/markers/shadows are collected), so every site — cached,
prewarmed or freshly built — is scaled and centred onto the plinth by
construction. The audit then becomes a live guarantee rather than a report.
Pure-math tests already exist in `src/lib/fitMath.test.ts`; the transform is
verified live via `window.citylitEngine` in the dev contact-sheet harness.

## 4. Implementation results (2026-11-23)

**Rings (021).** Deleted the 15-cylinder `RING_SPECS` shell and its GLSL/noise
material from `siteAtmosphere.ts`, plus `seaRings()` and all 12 builder call
sites. The live scene now has 4 atmosphere objects (tablecloth plane, two
valley-mist planes, wildlife points) instead of 19. Screenshot inspection of
the hero confirms no translucent bands or water ripples remain, while the
tablecloth, valley mist, horizon skyline and plinth trim are intact.

**Plinth fit (022).** The naive build-time fit missed sites whose large
geometry only becomes visible when `LOD.update()` runs (e.g. Nelson Mandela
Bridge's 18-unit deck), and the first bounds query after a transform restore
could under-report. The final implementation therefore:

- includes the union of hidden LOD levels in fit bounds
  (`computeDioramaBounds(group, includeHiddenLods = true)`);
- restores an authored transform before each pass so repeated fits never
  compound;
- re-measures up to three times and verifies the *post-fit* footprint, so
  `fitsPlinth` is a guarantee, not an authored-footprint report;
- runs once at build and again just before mounting (after visibility settles).

Live dev audit over all 43 landmarks: **43/43 `fitsPlinth === true`**; 40 sites
needed a uniform downscale (customary sites ≈0.993, smallest 0.8534). No site
crosses the rim.

**Render cost (023).** Tier-0 pixel ratio is capped at 1.5 (tier 1 at 1.25),
MSAA is disabled only when DPR > 1.25, and a settled scene renders at ~30 fps
(measured 48 renders in 2 s in the headless browser) while interaction remains
full-rate. Reduced-motion (15 fps) and software-GL (20 fps) caps are unchanged.

**Verification.** `pnpm lint` (only a pre-existing warning in
`.opencode/plugins/graphify.js`), `pnpm test` (104/104) and `pnpm build` pass;
no browser console errors. The test browser used the WebGPU backend at DPR 1,
so the MSAA/HiDPI savings are primarily for WebGL/Retina desktops, while ring
removal benefits every backend.

**Deliberately kept:** the distant horizon-scenery cylinders. If those are the
"rings" you meant rather than the close mist bands, they live in
`src/three/horizonScenery.ts` (`createHorizonRing()`) and can be removed in a
separate, purely visual change.
