# QA capture tooling

`capture-contact-sheets.mjs` reproduces the Phase 0 / Phase 1 contact-sheet
screenshots and renderer stats for the Living Diorama upgrade without any MCP
browser tools. It drives Chrome directly over the DevTools Protocol using only
Node built-ins (`fetch` + global `WebSocket`); **no dependency is added** and
Node >= 22 is required.

## Prerequisites

- **The dev server must already be running.** `contact-sheet.html` is
  **dev-only** — it is not a production Vite entry. Default base URL is
  `http://localhost:3004` (the port used for the Phase 0/Phase 1 captures).
  Do not start or stop the server from this tool.
- **Chrome/Chromium must already be running with remote debugging**, e.g.:

  ```sh
  chrome --remote-debugging-port=9222 --headless=new about:blank
  ```

  The tool opens and closes its own tab on that browser via
  `http://127.0.0.1:9222` (configurable with `--cdp`).

## Scripts

| pnpm command | What it does |
| --- | --- |
| `pnpm qa:capture` | Screenshots **and** `stats.json` for hours 12 / 18 / 22. |
| `pnpm qa:shots` | Screenshots only. |
| `pnpm qa:stats` | Stats only (no screenshots). |

Examples:

```sh
pnpm qa:capture
pnpm qa:capture -- --base-url http://localhost:3004 --out docs/qa/latest
pnpm qa:stats -- --cdp http://127.0.0.1:9222 --chunk-size 9
node scripts/capture-contact-sheets.mjs --help
```

Files are written to `docs/qa/latest` by default:

- `contact-sheet-noon.png` (hour 12)
- `contact-sheet-dusk.png` (hour 18)
- `contact-sheet-night.png` (hour 22)
- `stats.json`

## What is captured

For each hour the tool waits for the status line
`43 landmarks · daylight · HH:00`, then sets `isSoftwareGl=false`, calls
`applyQuality('high')` (`qualitySetting=high`, `qualityIndex=0`) and sets
`renderer.info.autoReset=false`. It samples all 43 sites with
`showLandmarkImmediate(i)`: two warmup rAF frames, `info.reset()`, then 8 rAF
samples per site. FPS is `1000 / mean(frame ms)`; calls/triangles are read after
the 8-frame window. Sampling is split into bounded chunks (default 9 sites) so
no single page evaluation runs long. `renderer.info.autoReset` is restored in a
`finally` block.

`stats.json` is compatible with `docs/baseline/baseline-stats.json` and
`docs/phase1/phase1-stats.json`: top-level `noon`, `golden`, `night` arrays of
`{ i, name, calls, tris, fps }`, plus the same descriptive metadata keys.

As in Phase 0/1, numbers come from a headless/remote browser: FPS is a relative
comparison for regression checks, not a device certification. The contact sheet
uses a fixed thumbnail camera and covers the hero diorama only.

## Live-app visual matrix (preferred for visual comparisons)

`capture-contact-sheets.mjs` relies on `readRenderTargetPixels()`, which returns
an **empty buffer** in some headless Chrome builds — the resulting thumbnails are
blank even though the on-screen canvas renders correctly. For visual comparisons
use `capture-visual-matrix.mjs`, which drives the live app and screenshots the
composited canvas instead:

```sh
node scripts/capture-visual-matrix.mjs --out docs/visual-baseline
node scripts/capture-visual-matrix.mjs --out docs/visual-reports/phase1
node scripts/make-contact-sheet.mjs --before docs/visual-baseline \
  --after docs/visual-reports/phase1 --out docs/visual-reports/phase1/contact-sheet.html
node scripts/compare-metrics.mjs docs/visual-baseline/stats.json docs/visual-reports/phase1/stats.json
```

It captures a reproducible matrix: 5 hero landmarks × dawn/noon/dusk/night ×
High/Balanced (clear), a rain/fog sweep at noon and night, a mobile 390×844 @3x
sweep, and all 43 landmarks at noon/dusk/night. Motion is frozen, theme pinned to
daylight and each state is applied immediately before a fixed warmup/sample
window. `stats.json` contains `calls`, `triangles`, `programs`, `textures`,
`geometries` and mean `frameMs` per state. Both capture directions use the same
harness, so before/after figures are directly comparable.
