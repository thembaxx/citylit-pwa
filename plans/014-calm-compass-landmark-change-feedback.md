# 014 — Shorten and stabilize the compass landmark-change feedback

- **Status**: TODO
- **Commit**: e5b288e
- **Severity**: MEDIUM
- **Category**: Purpose & frequency (1)
- **Estimated scope**: 1 file, ~12 lines

## Problem

Every landmark change — including the repeatable `ArrowRight` / `ArrowLeft` / `]` /
`[` shortcuts at `src/App.tsx:1079-1080` — retriggers two decorative animations on the
compass, and one of them remounts the drag target:

```tsx
// src/components/Compass.tsx:435 — current
        {!reduce && pulseState.seq > 0 && (
          <motion.span
            key={`lm-pulse-${pulseState.seq}`}
            aria-hidden="true"
            initial={{ scale: 0.92, opacity: 0.72 }}
            animate={{ scale: 1.45, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_SMOOTH_OUT }}
            className="pointer-events-none absolute inset-0 rounded-full border border-[#e8b04a]/80"
          />
        )}
```

```tsx
// src/components/Compass.tsx:455 — current
        <motion.div
          ref={dialRef}
          key={`dial-settle-${pulseState.seq}`}
          {...tapFeedback}
          animate={reduce || pulseState.seq === 0 ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 0.32, ease: EASE_SMOOTH_OUT }}
          className="compass__dial focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b04a]"
```

A 450ms ring plus a 320ms keyframe settle is too much for a keyboard action hit tens of
times a session, and both exceed the 300ms UI budget (AUDIT.md §2). The `key` on the
dial replaces the element on every landmark change, so a switch mid-drag discards the
live gesture target. The existing `{...tapFeedback}` (`src/components/Compass.tsx:104-111`)
already gives a 100ms press cue; the settle is redundant decoration.

## Target

Keep one short pulse, remove the settle and the remount:

```tsx
// target — src/components/Compass.tsx:435-443 (only the duration changes)
        {!reduce && pulseState.seq > 0 && (
          <motion.span
            key={`lm-pulse-${pulseState.seq}`}
            aria-hidden="true"
            initial={{ scale: 0.92, opacity: 0.72 }}
            animate={{ scale: 1.45, opacity: 0 }}
            transition={{ duration: DURATION.quick, ease: EASE_SMOOTH_OUT }}
            className="pointer-events-none absolute inset-0 rounded-full border border-[#e8b04a]/80"
          />
        )}
```

```tsx
// target — src/components/Compass.tsx:455 (drop key, animate and transition)
        <motion.div
          ref={dialRef}
          {...tapFeedback}
          className="compass__dial focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b04a]"
```

`DURATION.quick = 0.15` (150ms, `src/lib/motion.ts:46`) and `DURATION` is already
imported at `src/components/Compass.tsx:4` — no import edit needed. The ring's scale
(`0.92 → 1.45`), opacity (`0.72 → 0`), colour and the `reduce` guard are unchanged.
`pulseState` still drives the ring's `key`; only the dial stops remounting.

## Repo conventions to follow

- `src/components/Compass.tsx:103-111` is the exemplar for HUD feedback: one 100ms
  press cue, dropped entirely under reduced motion (`reduce`).
- `src/lib/motion.ts:43-51` holds the duration scale; use the token, never a literal.
- AUDIT.md §1: high-frequency controls get drastically reduced motion, not decoration.
- AUDIT.md §4: don't restart a keyframe animation on a rapidly-triggered, reversible
  control; keep the gesture target mounted.

## Steps

1. In `src/components/Compass.tsx:441`, change `duration: 0.45` to
   `duration: DURATION.quick`.
2. In `src/components/Compass.tsx:457-460`, delete the `key={\`dial-settle-${pulseState.seq}\`}`,
   the `animate={...}` and the `transition={{ duration: 0.32, ease: EASE_SMOOTH_OUT }}`
   props from the dial `motion.div`, leaving `ref`, `{...tapFeedback}` and `className`.
3. Change nothing else.

## Boundaries

- Do NOT remove `pulseState` or the landmark pulse ring — it is genuine state feedback,
  just shortened.
- Do NOT touch `{...tapFeedback}`, the drag handlers, `useSpringFor`, or the reset pulse.
- Do NOT change `App.tsx` keyboard shortcuts.
- Do NOT add dependencies.
- If either excerpt at `src/components/Compass.tsx:435` or `:455` no longer matches
  verbatim, STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**:
  - Hold `ArrowRight` and watch the compass: the gold ring is a quick 150ms blip, not
    a 450ms linger, and the dial itself no longer bounces on each press.
  - With DevTools Animations at 10% playback, confirm the ring starts at scale 0.92
    and ends at 1.45/0 opacity in 150ms.
  - Start a compass drag, then press `ArrowRight` mid-drag: the dial element is not
    replaced and the drag continues (no pointer-cancel, no snap).
  - Toggle the app's reduced-motion setting and `prefers-reduced-motion`: neither the
    ring nor any settle appears; the 100ms press cue still works on pointer devices.
- **Done when**: landmark switching feels immediate and no key remount remains on the dial.
