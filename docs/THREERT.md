# ThreeRT — optional high-fidelity tier

## What it is

[ThreeRT](https://github.com/meshy-dev/ThreeRT) is a research project from Meshy:
a native JS runtime with a hardware-accelerated, real-time path tracer behind a
three.js-style API. Every light is traced (shadows, bounce light, reflections,
emissive surfaces) with no shadow maps, probes, lightmaps or baking. The engine
is MIT licensed; the native clients (macOS/iOS closed source, Windows/Android/
Steam Deck) are not.

The key property for this app: **the same scene file runs as plain three.js in
any browser.** That makes it a progressive-enhancement target, not a rewrite.

## What is actually implemented here

A browser PWA cannot run ThreeRT's native path tracer. This repo therefore
uses a capability-based bridge:

- `src/three/cinematic/nativeHost.ts` detects a host-injected
  `window.__CITYLIT_NATIVE_HOST__` object and exposes `captureFrame()` /
  `setCinematic()` if the host provides them. With no host, detection returns
  `null` and the WebGL renderer is used unchanged.
- The **Cinematic lighting** toggle in Settings applies a WebGL-side
  high-quality preset when no native host is present (larger shadow maps,
  stronger ambient occlusion, richer tone mapping). It is a graceful
  approximation, labelled as such in the UI.
- Postcards/gallery captures ask the native host for a traced still when
  available and otherwise capture the regular canvas.

## Contract for a native host

```ts
window.__CITYLIT_NATIVE_HOST__ = {
  name: 'ThreeRT',
  version: '0.1.0',
  setCinematic(enabled) { /* switch renderer to path-traced lighting */ },
  async captureFrame({ width, height, samples }) { /* return a data URL */ },
}
```

Keep the three.js scene graph identical in both renderers. Do not introduce
materials or shaders that only exist in one path; use standard `MeshStandardMaterial`
where fidelity matters, since that is what a path tracer understands.

## If you want real in-browser ray tracing

`three-gpu-pathtracer` (github.com/gkjohnson/three-gpu-pathtracer, MIT) is a
WebGL path-tracing renderer built on `three-mesh-bvh`. It could back a future
"Cinematic" mode on capable desktops, with the existing raster renderer kept
as the fallback for mobile and offline use. It is not bundled today because it
would substantially increase the PWA payload.

## Attribution

ThreeRT is a Meshy research project, MIT licensed engine. OpenStreetMap-derived
imagery used by the coordinate explorer is © OpenStreetMap contributors (ODbL).
