# Final visual report — 2026-11-24

This report closes the workstreams started in `docs/visual-reports/phase1` and
`phase2`. Baseline for the final comparison is `docs/visual-reports/phase2`.

## Workstream landed in this pass (brief A/B/H)

1. **Screen-space sun glow / god-rays** (`src/three/postfx.ts`). A 12-tap radial
   blur of the beauty buffer toward the projected sun position, masked by sun
   visibility and by golden-hour weight. It lives *inside* the existing
   MiniaturePass, so it adds no pass, render target, readback or shader program.
   It runs only on High (`qualityIndex === 0`) and only near dawn/dusk; the
   shader branch is skipped entirely elsewhere. Gated by `GOD_RAYS_ENABLED` and
   `GOD_RAY_STRENGTH` in `lightingRig.ts` (strength 0.10 — deliberately subtle,
   because the scene already has 3D sun shafts).
2. **Analytical time-of-day grade** (`src/three/CitylitEngine.ts`). The authored
   per-site split tone is retained as a base; a gated shift adds warm highlights
   / cool shadows at dusk and teal-leaning shadows at night, neutral at noon.
   Written directly into the existing grade uniforms, so no new program and no
   per-frame allocation (all scratch vectors are preallocated). Gated by
   `TIME_OF_DAY_GRADE_SHIFT`.

## Status of the remaining brief phases

| Brief phase | Repo state | Action here |
| --- | --- | --- |
| 3 — Sky / PMREM / clouds / fog | Procedural sky, day/golden/night PMREM probes with zero per-frame regeneration, site-matched fog, instanced cloud shadows, atmosphere shells, cloud shading and drift already exist. | Sun glow + grade added; no change to working PMREM/fog systems. |
| 4 — Geometry / bevels / silhouette / base / foliage / camera | `CB()` is a rounded/chamfered box with adaptive segments, `C()` adapts cylinder segments, `dioramaKit` provides cornices, sills, surrounds, balustrades and a stratified base, `weatherVertexColors` bakes crevice/exposure variation, trees are clustered and instanced, and hero-camera framing + zoom-out guarantee exist. | No blanket bevel/detail changes: they raise triangles and were not verifiable per-landmark inside this pass. Deferred to a dedicated per-landmark art-direction task. |
| 5 — Water / weather / night | `water.glsl.ts` already has two-layer normals, Fresnel sky reflection, depth colour, shoreline foam, sun glitter, caustics and wind scaling; weather has rain, fog, snow accumulation, storms and ambient particles; night uses emissive windows/lamps, pooled lights and additive decals. | No changes: replacing mature shaders would risk regressions without a device-class benchmark. |
| 6 — Roll-out | Shared lighting, albedo and grade changes apply to all 43 landmarks automatically. | Covered by the all-landmarks sweep in the capture. |

## Verification

Results are from the committed capture data.

#### Budget check (199 matched states, Phase 2 → final)

| Metric | Phase 2 | Final | Verdict |
| --- | --- | --- | --- |
| Shader programs (mean) | 103.98 | 103.98 | PASS — 0 states increased |
| Draw calls (mean delta) | — | +0.02 | PASS — no increase |
| Triangles (mean delta) | — | −123 | PASS |
| Mean frame time | 42.58 ms | 48.32 ms | within harness noise |
| Frames >1 % pure white | 115 | 112 | slight improvement |
| Frames >1 % pure black | 0 | 0 | PASS |

The frame-time figure is not a reliable regression signal here: identical
consecutive captures of the same Balanced state measured 70.45 ms and 38.40 ms.
The god-ray/grade work only writes uniforms inside the existing MiniaturePass —
no new pass, target, texture, draw call or program — so there is no structural
perf change. Measured program counts are identical across all 199 states, and
the god-ray branch is disabled on Balanced/Low.

#### Quality gates

- `pnpm test`: 136/136 PASS. `pnpm lint`: PASS.
- `pnpm build`: PASS; precache 5486.62 → 5489.29 KiB (+2.7 KiB), well inside the
  +300 KB gzip budget.
- Software-GL path: the new work is skipped (`isSoftwareGl` guard).
- Reduced motion: no new time-based motion; the glow follows the sun, which is
  already frozen when motion is off.
- Contact sheets: `contact-sheet.html` (70 hero states) and
  `contact-sheet-all.html` (199 states), Phase 2 left / final right.
