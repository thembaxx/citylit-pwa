# THROWAWAY PROTOTYPE — citylit × ThreeRT lighting parity

**Branch:** `prototype/threert-parity` · **Not production code.** Nothing here is imported by the app.

## Question it answers

> Can a citylit diorama be expressed with the real ThreeRT scene API, and what changes if we adopt it?

## Run it

```bash
bun run proto:threert
```

Then open **http://localhost:3001**. The same command first writes `parity.json` from a real headless
ThreeRT binding probe (no Rust needed), then serves the interactive page.

## What's in it

- **`parity.ts`** — builds a simplified Table Mountain with real `@threert/scene` classes, binds it with
  ThreeRT's own `SceneBinding` + `RecordingEngine`, and dumps what the engine actually receives
  (90,000 lux sun, atmosphere sky, emissive material, volumetric fog, object/material counts).
  Writes `parity.json`.
- **`index.html` / `app.ts` / `mountain.ts` / `style.css`** — side-by-side interactive comparison of
  today's WebGL lighting vs a ThreeRT-style physical setup, with sliders, time presets, a porting
  inventory and the live state panel.

## Limits (important)

- No native renderer on this machine (Rust not installed). The probe verifies **scene binding**, not pixels.
- The right-hand panel is an **approximation in three.js**, not path tracing.
- The stand-in geometry omits the real `warpTable`, bump textures, instancing and GLSL effects.

## Verdict

Scene API compatibility: **yes** — the diorama binds cleanly. Biggest payoff: physical time-of-day,
bounce light, emissive lighting and rain reflections (core to citylit's pitch). Biggest blocker:
ThreeRT renders in a native client, so the PWA stays WebGL. Recommended next step: install Rust and
render one real diorama with `threert-render render ... --spp 32`, then diff against
`captureGalleryShots()`.
