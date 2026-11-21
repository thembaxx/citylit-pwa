# 005 — Replace pillJelly keyframes with a retargetable 180ms transition

- **Status**: DONE
- **Commit**: e444ba6
- **Severity**: MEDIUM
- **Category**: Interruptibility (4), Easing & duration (2)
- **Estimated scope**: 1 CSS file, ~20 lines

## Problem

```css
/* src/index.css:373-395 — current */
@keyframes pillJelly {
  0%   { transform: scale(1); }
  35%  { transform: scale(0.93, 1.07); }
  70%  { transform: scale(1.05, 0.96); }
  100% { transform: scale(1); }
}

.province-pill[aria-pressed='true'] {
  animation: pillJelly 0.42s cubic-bezier(0.33, 1.4, 0.55, 1);
}
```

Two issues: a 420ms keyframe animation exceeds AUDIT.md §2's 300ms UI budget, and keyframes restart from zero when the user rapidly re-toggles provinces, so the pill visibly jumps instead of retargeting from its current scale. AUDIT.md §4 requires transitions or springs for anything triggered rapidly.

## Target

Express the same squash as a state-driven CSS transition on the pressed state, retargetable from the current value:

```css
/* target */
.province-pill {
  transition: transform 180ms var(--ease-out), background-color 180ms var(--ease-out);
}

.province-pill[aria-pressed='true'] {
  transform: scale(0.96);
}

.province-pill:active {
  transform: scale(0.94);
  transition-duration: 100ms;
}
```

`var(--ease-out)` is the built-in strong-ease-out token; plan 008 may strengthen it to `cubic-bezier(0.23, 1, 0.32, 1)` later. `180ms` sits in the 150–250ms dropdown/select band; `100ms` is the button-press band. Drop the `@keyframes pillJelly` block entirely. Keep the existing reduced-motion opt-out:

```css
[data-motion='reduce'] .province-pill[aria-pressed='true'] {
  animation: none;
}
```

Replace that rule with `transform: none;` (no animation to disable once keyframes are gone).

## Repo conventions to follow

- `src/transitions.css:12` `--duration-quick: 150ms` and `:13` `--duration-fast: 250ms`; 180ms is between them and inside the audit band. If the repo token must be used, pick `--duration-quick` (150ms) over inventing a new token.
- `src/transitions.css:25` `--ease-out: ease-out` is the repo's existing "tooltip open/close" curve; reference it, don't hand-type a new one.
- The file already uses `[data-motion='reduce']` at `src/index.css:393` — keep that mechanism.

## Steps

1. Delete the `@keyframes pillJelly` block at `src/index.css:374-387`.
2. Replace the `.province-pill[aria-pressed='true']` rule at `:389-391` with the three target rules above (base transition, pressed scale, active press).
3. Change `[data-motion='reduce'] .province-pill[aria-pressed='true']` at `:393-395` from `animation: none;` to `transform: none;`.
4. Do not change any JS handlers or other pill styles.

## Boundaries

- Do NOT add a motion library; CSS transition is the cheapest tool that works.
- Do NOT change the province filter logic or `aria-pressed` semantics.
- Do NOT alter other keyframes in `index.css`.
- If the pillJelly block is no longer present verbatim, STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**: run the app and click province pills rapidly (3–5 times in a second):
  - The pill should retarget smoothly from its current scale; no snap back to full size between clicks.
  - Press feedback is visible but subtle; release settles within ~180ms.
  - In DevTools Animations at 10% playback, confirm a single transition per state change, not a restarting keyframe.
  - With `[data-motion='reduce']` set, the pill changes colour/pressed state but does not scale.
- **Done when**: no `pillJelly` keyframes remain and rapid toggles never restart an animation from zero.
