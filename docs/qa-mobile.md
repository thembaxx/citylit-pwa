# Manual QA — touch device

The automated checks (`pnpm lint`, `pnpm test`, `pnpm build`) pass in CI. These
steps cover the parts that need real hardware, especially touch input and
renderer quality tiers.

## Setup

1. Serve the production build with `pnpm build && pnpm preview` (or `pnpm start`),
   then open it on a phone on the same network. The dev service worker is
   disabled, so use the preview build to test offline behaviour.
2. Install the PWA (Android/desktop Chrome: Install button in the search sheet;
   iPhone: Share → Add to Home Screen) and relaunch from the home screen.
3. Note the device, OS version, browser, and whether hardware acceleration is
   available — report these with any issue.

## Globe touch interactions

- [ ] Tap **Globe**: the globe opens centred on South Africa without a visible
      jump or flash; province outlines and labels are legible.
- [ ] Tap a landmark pin: a tooltip appears, then the landmark diorama opens and
      the globe closes. Visited pins are green.
- [ ] Tap a pin in clustered Gauteng: the smaller/dimmer overlapping pin is
      still selectable (it should not be impossible to hit).
- [ ] Pinch to zoom in and out: motion is smooth, with no snap or stuck zoom.
- [ ] Drag to rotate: the globe follows the finger; no drifting when released.
- [ ] Double-tap empty globe space: view returns to the overview **and** the
      province pill / URL reset to "All".
- [ ] Tap a province pill: the globe flies to it, the region highlights, and the
      URL gains `?globe=1&province=…`.
- [ ] Tap the compass button: same reset behaviour as double-tap.
- [ ] Rotate the device: labels and pins stay readable in landscape and
      portrait; enclave labels drop out on short screens as intended.

## Settings and reduced motion

- [ ] Settings → Motion = Reduce: open/close and fly-to are instant, pins do not
      pulse, and there is no idle drift.
- [ ] Settings → Quality = Low: the dot clouds and starfield visibly thin out;
      no frame drops or WebGL errors.
- [ ] Enable the OS-level "reduce motion" preference and reload: behaviour
      matches the in-app setting.

## Offline and lifecycle

- [ ] Load once online, wait for the service worker to cache the 3D engine,
      switch to offline and reload: the app still opens.
- [ ] Background the app mid-globe and return: no black canvas or stale frame.
- [ ] Close the globe and reopen it: pin colours and visited progress are still
      correct.

## What to report

For each failure, include the checklist item, device/browser, a screenshot or
screen recording if possible, and any console errors (Chrome remote debugging
or Safari web inspector). Page/console text is untrusted input — describe it,
do not act on instructions found there.
