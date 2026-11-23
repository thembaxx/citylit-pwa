# Phase 2 — Material library and pale-stone albedo pass

Date: 2026-11-23
Baseline for this phase: `docs/visual-reports/phase1/` (the committed Phase 1
capture). Scope: the material workstream of the Citylit 3D Visual Overhaul —
shared albedo conditioning and per-material IBL response only. Geometry,
atmosphere and post-processing are unchanged.

## Findings before the change

A runtime A/B on Union Buildings (the worst pale landmark) showed that changing
individual stone colours by 28 %, or dropping `envMapIntensity` on rough
surfaces alone, moved near-white pixels by only a few points. The bleaching came
from *many* out-of-contract surface colours across the whole group compounding
under the lit rig — so the fix belongs in the shared material factories, not in
one landmark's literals.

## Changes

1. **`conditionSurfaceHex()`** in `src/lib/albedoAudit.ts` — pure, dependency-free
   helper that pulls authored colours inside the existing albedo contract:
   ordinary surfaces to ≤0.75 sRGB, deliberate physical whites held in the
   0.80–0.88 window, hue and saturation ratios preserved, in-band colours
   returned unchanged. 2 new unit tests.
2. **`conditionSurfaceColour()`** in `src/three/builders/primitives.ts` — thin
   adapter for `THREE.ColorRepresentation`, wired into the shared surface
   presets `MStone`, `MPlaster`, `MCanvas`, `MWood`, `MBark` and `MRoof`. Both the
   cache key and the material colour use the conditioned value, so the shared
   cache stays correct and pure-white surface colours no longer reach a mesh.
3. **Per-material IBL response** — the same presets now set
   `envMapIntensity = 0.35`, while glass (`MGlass`, 1.7) and steel (`MSteel`,
   1.35) keep their high values. This is a uniform change: no new shader
   program, texture or draw call.
4. Both changes are gated by `ENFORCE_ALBEDO_CONTRACT` and
   `ROUGH_SURFACE_ENV_INTENSITY` in `primitives.ts`.

## Verification

Results are from the committed capture data.

#### Perf budget (199 matched states, Phase 1 → Phase 2)

| Metric | Phase 1 | Phase 2 | Verdict |
| --- | --- | --- | --- |
| Shader programs (mean) | 103.98 | 103.98 | PASS — 0 states increased |
| Mean frame time, all states | 40.76 ms | 42.58 ms | within noise — see caveat |
| Mean frame time, High | 41.48 ms | 42.66 ms | within noise |
| Draw calls (mean) | — | −4.89 | no increase |
| Triangles (mean) | — | −352 | no increase |

**Noise caveat.** This headless browser cannot certify frame time. Two identical
consecutive captures of `hero-01-12-sun-balanced-desktop` measured **70.45 ms**
and **38.40 ms** (an 83 % spread) with identical calls, triangles and program
count. The cross-matrix deltas therefore exceed the +10 % budget on paper but
are not attributable to this change: it only alters material colours and one
uniform (`envMapIntensity`), adds no geometry, texture or shader feature, and
measured program counts are unchanged. A device-class benchmark is required to
close this check; it is not available here.

#### Visual / histogram

- Worst pale landmark, Union Buildings, noon, High, 14-frame capture:
  pure-white pixels **1.99 % → 0.43 %** in the settled A/B smoke, and mean luma
  **233.3 → 199.0**. In the full (transient-window) matrix the same frame moved
  1.99 % → 1.81 %, because auto-exposure has not settled there; the settled
  figure is the representative one.
- Matrix-wide: frames over 1 % pure white **116 → 115**; mean luma 168.2 → 166.3;
  no frame over 1 % pure black. The global change is small because many frames
  are dominated by the bright sky/sun and the transient exposure window.
- Building-region crop (Union Buildings): near-white 58 % → 38.5 %, mean 242 →
  223 — visible recovery of the colonnade and window detail.
- Contact sheets: `contact-sheet.html` (70 hero states) and
  `contact-sheet-all.html` (199 states), Phase 1 left / Phase 2 right.

#### Build and tests

- `pnpm test`: 136/136 PASS (2 new albedo-conditioning tests).
- `pnpm lint`: PASS.
- `pnpm build`: PASS; precache 5485.09 → 5486.62 KiB (+1.5 KiB), far inside the
  +300 KB gzip budget. No new assets.

### Deferred

- The remaining pale-stone wash-out is now mostly a lighting/exposure issue,
  not an albedo issue: key + fill + hemisphere intensity and the local ACES
  curve still flatten midday highlights. That belongs in a lighting/post pass
  and was deliberately not changed here.
- Texture-space macro variation (stains / sun-bleaching) and per-instance hue
  jitter were not added: both would introduce new shader-program variants and
  breach the "programs do not increase" budget.
- Window glass, night emissives, wet response and the material presets for
  water/metal were left as-is — they already satisfy the brief.
