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

## Recommended execution order

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
- `ease-in` — none found.
