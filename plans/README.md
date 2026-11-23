# Animation improvement plans

Generated from the `improve-animations` audit (commit `e444ba6`). Each plan is self-contained: exact file paths, current code, target values, steps, boundaries and a feel check. The executor needs no context from the audit.

All plans were implemented and merged into main as commit `b379a1e` (`feat: improve app-wide motion polish and reduced-motion handling`). Review adjustments: StrictMode-safe state for the keyboard-instant search flag, restored the 2px blur on the weather-details reveal, and added reduced-motion transform opt-outs for province pills.

| # | Plan | Severity | Category | Status |
|---|------|----------|----------|--------|
| 001 | [Replace global reduced-motion nuke](001-replace-global-reduced-motion-nuke.md) | HIGH | Accessibility | DONE |
| 002 | [Gate component motion on reduced motion + pointer](002-gate-component-motion-on-reduced-motion-and-pointer.md) | HIGH | Accessibility | DONE |
| 003 | [Instant search sheet for `/`](003-instant-search-sheet-for-keyboard-open.md) | HIGH | Purpose/frequency | DONE |
| 004 | [Correct scale entrance values](004-correct-scale-entrance-values.md) | HIGH | Physicality | DONE |
| 005 | [Replace pillJelly keyframes](005-replace-pilljelly-keyframes-with-transition.md) | MED | Interruptibility | DONE |
| 006 | [Remove layout-property animations over canvas](006-remove-layout-property-animations-over-canvas.md) | MED | Performance | DONE |
| 007 | [Scope card-height CSS variable](007-scope-the-card-height-css-variable.md) | MED | Performance | DONE |
| 008 | [Promote strong ease-in-out token](008-promote-strong-ease-in-out-token.md) | MED | Easing/cohesion | DONE |
| 009 | [Consolidate hand-typed motion values](009-consolidate-hand-typed-motion-values.md) | LOW | Cohesion | DONE |
| 010 | [Animate offline pill + letterbox bars](010-animate-offline-pill-and-letterbox-bars.md) | LOW | Missed opportunities | DONE |

## Second audit — 2026-11-23 (commit `e5b288e`)

A fresh full audit of the current code. The earlier fixes (001–010) are still in place
and were not re-reported. The plans below are self-contained: exact file paths, current
code, target values, steps, boundaries and a feel check.

| # | Plan | Severity | Category | Status |
|---|------|----------|----------|--------|
| 012 | [Gate compass hover on fine pointer](012-gate-compass-hover-on-fine-pointer.md) | MED | Accessibility | TODO |
| 013 | [Anchor menu popover scale to trigger](013-anchor-menu-popover-scale-to-trigger.md) | MED | Physicality | TODO |
| 014 | [Calm compass landmark-change feedback](014-calm-compass-landmark-change-feedback.md) | MED | Purpose/frequency | TODO |
| 015 | [Shorten theme crossfade durations](015-shorten-theme-crossfade-durations.md) | MED | Easing/duration | TODO |
| 016 | [Shorten weather-details disclosure](016-shorten-weather-details-disclosure.md) | MED | Easing/duration | TODO |
| 017 | [Scale-ruler bar: transform, not width](017-scale-ruler-bar-transform-not-width.md) | LOW | Performance | TODO |
| 018 | [Consolidate hand-typed motion literals](018-consolidate-hand-typed-motion-literals.md) | LOW | Cohesion/tokens | TODO |
| 019 | [Boot scan: transform, not top](019-boot-scan-transform-not-top.md) | LOW | Performance | TODO |
| 020 | [Smooth three teleporting state swaps](020-smooth-three-teleporting-state-swaps.md) | LOW | Missed opportunities | TODO |

### Third pass — 2026-11-23 (rings, plinth fit, render cost)

Research: [`docs/PERFORMANCE-AND-FITS-RESEARCH.md`](../docs/PERFORMANCE-AND-FITS-RESEARCH.md).
These plans are self-contained: exact files, current code, target and checks.

| # | Plan | Severity | Category | Status |
|---|------|----------|----------|--------|
| 021 | [Remove the semi-transparent landmark rings](021-remove-landmark-rings.md) | HIGH | Performance + visuals | DONE |
| 022 | [Fit every landmark to the plinth](022-fit-all-landmarks-to-plinth.md) | HIGH | Correctness | DONE |
| 023 | [Cut idle and HiDPI render cost](023-cut-idle-and-hidpi-render-cost.md) | HIGH | Performance | DONE |

Verified 2026-11-23: atmosphere shell went from 19 to 4 scene objects; all 43
landmarks report `fitsPlinth === true` in the live dev audit; idle render is
capped; `pnpm lint`, `pnpm test` (104/104) and `pnpm build` all pass.

Recommended order: **021 → 022 → 023** (021 removes the biggest overdraw;
022 is independent; 023 is independent but easiest to verify last).

## Recommended execution order (second audit)

11. **012** — pure CSS gate, zero risk; do it first.
12. **014** — compass feedback; touches the same component area as 012 but different code.
13. **013** — menu origin; independent.
14. **015** — theme durations; 2 files, independent.
15. **016** — weather disclosure; imports `DURATION` (see 018's note below).
16. **017** — scale-ruler bar; must precede 020 (both edit the import at `ScaleRulerModal.tsx:10`).
17. **019** — boot scan; independent.
18. **018** — token consolidation; do this after 016 so `DURATION` is already imported
    in `WeatherWidget.tsx` (018 does not list that import, it only changes the literal
    in `HourlyForecast`, `InfoDrawer`, `Menu`, `LandmarkCard`, `PassportModal` and CSS).
19. **020** — missed opportunities; after 017 (shared file) and after 018 (swap tokens
    are final).

### Dependencies (second audit)

- **017 → 020**: both edit `src/components/ScaleRulerModal.tsx`; apply 017 first so the
  `../lib/motion` import already contains `DURATION, EASE_SMOOTH_OUT`, then add `SPRING`.
- **016 → 018**: both touch `src/components/WeatherWidget.tsx` motion imports; 016 adds
  `DURATION` first.
- **018 → 020**: 020 consumes the final `swapVariants` / `swapTransition` token set.
- 012, 013, 014, 015, 019 are independent of each other and of the chain above.

## Recommended execution order (first audit)

1. **001** — the global reduced-motion rule; everything else assumes it is in place.
2. **002** — component reduced-motion / pointer gates (pairs with 001; also prepares 006's reduced branches).
3. **003** — keyboard-instant search sheet (touches `Sheet`, so do it before other `Sheet` edits).
4. **004** — scale entrance values (independent, quick win).
5. **005** — pillJelly retargeting.
6. **006** — layout-property replacements (depends on 002 for its reduced-motion branches).
7. **007** — card-height variable throttling (independent).
8. **008** — strong ease-in-out token (change TS and CSS together).
9. **009** — token consolidation (do after 008 so the token set is final).
10. **010** — missed opportunities (uses `toastVariants` and tokens from 008/009).

## Dependencies

- 002 depends on 001 for consistent reduced-motion semantics.
- 006 references the reduced-motion branches introduced in 002; execute 002 first.
- 009 should follow 008 so it consolidates onto the final token set.
- 003 and 004 both touch `Sheet`/`WeatherWidget` areas but do not conflict; 003 first is safer.

## Deliberately excluded (vetted, not findings)

- Camera motion on arrow/`R` shortcuts and gallery coverflow — core scene navigation, symmetric with pointer input.
- Drag springs, velocity-based dismissal and rubber-band bounds — already correct.
- `scale: 0.96` in shared variants, 2px crossfade blurs, 30–80ms staggers — already correct.
- `ease-in` — none found in the first audit, and none found in the second audit either.
- `TopBar.tsx:108` 400ms header entrance — occasional surface mount (boot / globe close),
  not a high-frequency action; matches the repo's panel budget.
- `App.tsx:2135` `ease: 'easeOut'` on the 2.2s cinematic title — a deliberate rare moment.
- Compass pulse/settle (012/014), menu transform-origin (013), theme duration mismatch
  (015), weather disclosure (016), scale-ruler bar (017), boot scan (019) and the three
  state swaps (020) are the second audit's findings; drag springs and camera shortcuts
  remain vetted and out of scope.
