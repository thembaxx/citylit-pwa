# Plan 011 — Scale mode, wildlife layer & hidden details

**Status:** Draft — design/implementation plan only. No runtime code is changed by this document.
**Date:** 2026-11-22
**Applies to:** citylit-pwa (43 landmarks, Three.js dioramas, React DOM UI)

---

## 1. Goal

Add three discovery layers to the diorama stage:

1. **Scale mode** — place a human, springbok or Eiffel Tower silhouette next to the active
   diorama, plus a "ruler" view that lines up the real heights of all landmarks.
2. **Wildlife layer** — small animated, season-aware animals at the right biomes/sites
   (penguins at Boulders, whales off Hermanus, flamingos on pans, …), tappable for a fact.
3. **Hidden details** — exactly one tiny easter egg per diorama (lighthouse keeper, baboon, …);
   finding it counts toward passport progress.

All three must work offline, honour reduced motion, and add no per-frame main-thread work
beyond what the diorama tick already does.

---

## 2. What already exists (anchors, as of this date)

| Concern | Location | Notes |
| --- | --- | --- |
| Landmark catalogue | `src/data/landmarks.ts:13` (`LANDMARKS`, 43 entries) | `LandmarkMeta` in `src/types/citylit.ts:159` has `k, c, f, wikiTitle, ambient, biome, tags, coords, climatology, dots`. **No numeric height field.** |
| Real-world scale strings | `src/data/landmarkDetails.ts:1` (`LandmarkDetail.scale`) | Free text such as `"1,086 m summit · ~3 km upper plateau"`; consumed by `InfoDrawer.tsx:65`. |
| Diorama fan-in | `src/three/builders/landmarksB.ts:3124` (`RAW_BUILDERS`) → `:3175` (`LANDMARK_BUILDERS`) | Every one of the 43 builders is wrapped by `applyDioramaUpgrade()` — the single best insertion point for shared layers. |
| Shared diorama upgrade | `src/three/builders/dioramaKit.ts:3344` (`applyDioramaUpgrade`) | Adds rim, underside, water, scatter, trees, anchor, weather FX, birds, vibrancy; composes `group.userData.tick`, `audioProfile`, `biome`. |
| Animal infrastructure | `src/three/builders/animalKit.ts` | `createAnimalScaffold`, `AnimalKind` (`generic/elephant/penguin/whale/hippo/gemsbok`), `AnimalSeason`, month/season gates (`isAnimalActive`), idle poses, contact shadows, distance LOD. |
| Existing animal sites | `landmarksA.ts:3237` (Boulders penguins), `landmarksB.ts:1846` (Hermanus winter whale pod), `landmarksB.ts:1330` (Kgalagadi gemsbok) | Wildlife layer should **extend** these, not replace them. |
| Season plumbing | `CitylitEngine.ts:2235` (`setSeasonMonth`) → `setAnimalSeasonMonth`, `setFoliageSeasonMonth`, weather, audio; App sets it at `:518` and `:667`. | Month already reaches the animal gates. |
| Tappable 3D pins | `CitylitEngine.ts:1147` (`rebuildMarkers`), `:3386` (hover), `:3518` (tap) | Sprites in `markerSprites`, raycast + touch-friendly screen-space radius; callbacks `onFactDot`, `onUserNotePin`. |
| Passport progress | `App.tsx:200` (`visited` set), `:771` (3-second stamp), `:780` (`localStorage 'cl-vs'`), `PassportModal.tsx:155` (UI with 4 tabs) | `readStoredSet()` at `App.tsx:69` is the reusable persistence helper. |
| Settings | `CitylitSettings` in `src/types/citylit.ts:19`, `readSettings()` in `App.tsx:145` (`'cl-st'`), `SettingsModal.tsx:126`, effects at `App.tsx:604` | Add toggles/choices here. |
| Plinth | `src/lib/fitMath.ts:9` — `PLINTH_HALF_EXTENT = 8.52`, `PLINTH_INNER_HALF_EXTENT = 8.46` | Gives a safe front-right slot for a scale figure. |
| UI primitives | `SettleModal`, `PillNavigation`, `LiquidToggle`, `motion.ts` tokens, phosphor icons | Reuse; no new design language. |

---

## 3. Key decisions (with rationale)

- **D1 — Extend `applyDioramaUpgrade`, not each of the 43 builders.** The upgrade already runs
  for every site, owns the `userData.tick` composition and the contact-shadow pass. A scale
  figure, wildlife layer and hidden detail become three small shared helpers called there.
  Individual builders are only touched where a bespoke animal position or egg is needed.
- **D2 — One interaction registry in the engine.** Pins, wildlife and eggs all need
  hover/tap dispatch. Rather than three parallel raycasts, introduce an `InteractiveTarget`
  list (§4) and keep existing pins as its first entries. Existing behaviour stays intact; new
  target kinds are added without touching pointer code again.
- **D3 — Wildlife uses `animalKit`; hidden details use existing primitives.** No new model
  library, no textures, no API calls. Each hidden detail is a handful of boxes/spheres/cylinders.
- **D4 — Height data becomes explicit and numeric.** Add `src/data/scaleFacts.ts` with a
  `heightM` and `measure` per landmark, seeded from `LANDMARK_DETAILS.scale` strings but
  curated. Free text is unsuitable for sorting, ratios or a ruler.
- **D5 — Vertical exaggeration must be disclosed, not hidden.** Dioramas are stylised: a
  true-to-scale 1.7 m person at Table Mountain's model height would be ~0.005 world units —
  invisible. Compute the honest ratio, then clamp the reference to a legible minimum and show
  an on-screen badge (`Reference enlarged ×N for legibility`). The ruler view is 2D and stays
  mathematically honest, with a linear/log switch because heights span ~8 m to 1,200 m.
- **D6 — Passport semantics stay separate.** Stamp progress remains "landmarks visited".
  Hidden details get their own `X / 43 found` counter and their own section; a combined
  completion figure is shown as a second bar, not substituted into the stamp count. Reset
  passport clears both.
- **D7 — Hidden eggs are raycast-only, pins are not.** An egg has no visible marker and no
  touch-radius fallback; you have to actually see and tap it. An accessible "Look closer"
  path in `InfoDrawer` exposes the clue as a button so keyboard/screen-reader users can
  participate without guessing pixel coordinates.

---

## 4. Shared foundation: one interactive-target registry

This is step zero; do it before any of the three features so the rest are small.

### 4.1 Proposed types — `src/types/citylit.ts`

```ts
export type InteractiveKind = 'fact' | 'note' | 'wildlife' | 'egg';

export interface InteractiveTarget {
  /** Sprite or mesh; sprites keep the existing touch-radius behaviour. */
  object: THREE.Object3D; // prefer a structural type if importing THREE here is undesirable
  kind: InteractiveKind;
  /** Stable id for found-egg / wildlife bookkeeping. */
  id?: string;
  /** Fact shown in the existing callout. */
  text?: string;
  noteId?: string;
  /** Screen-space pick radius in CSS px; 0 = exact hit only (hidden eggs). */
  touchRadius?: number;
}
```

If importing `three` into the shared types module is unwanted, define this interface locally in
`CitylitEngine.ts` and export it from there; `EngineCallbacks` already lives there.

### 4.2 Engine changes — `src/three/CitylitEngine.ts`

1. Replace `markerSprites: THREE.Sprite[]` with `interactives: InteractiveTarget[]`; keep
   `markerSprites` as a derived getter if other code (`:4062`, `:4443`) needs the sprite list.
2. `rebuildMarkers()` (`:1147`) still creates fact/note sprites, but pushes targets with
   `kind: 'fact' | 'note'`, `touchRadius: 16` (28 touch, matching today's behaviour).
3. After `showLandmarkImmediate()` builds `currentGroup` (`:1583`), traverse it once for
   `userData.interactiveTargets` contributed by the shared helpers, append them to the list.
   Hidden eggs and wildlife groups register themselves there.
4. Unify `:3386` (hover) and `:3518` (tap):
   - `raycaster.intersectObjects(targets.map(t => t.object), false)`
   - if no hit, screen-space fallback for targets with `touchRadius > 0` only
   - set cursor `pointer` on any hit; for eggs use a subtler cue (e.g. `help`) so nothing is given away.
5. Dispatch by kind:
   - `fact` → existing `onFactDot(text)` + `focusOnFactPoint`
   - `note` → existing `onUserNotePin(noteId)`
   - `wildlife` → `onWildlifeTap(id, fact)` + ping + haptics + small focus nudge
   - `egg` → `onHiddenDetailFound(id, label, fact)` + `ambientAudio.playUi('success')` +
     confetti via the existing callback/helper, then mark the target consumed (hide mesh).
6. Guard all new picking behind `!pinDropMode`, `!globe.isOpen`, `!places.isOpen`, exactly as
   today. Keep `stepInteractivePin()` working on the fact/note subset only.

### 4.3 App callbacks — `src/App.tsx:467`

Add to the `new Engine(host, { … })` call:

```ts
onWildlifeTap: (id, fact) => {
  ambientAudio.playUi('subtle', { intensity: 0.7 });
  ambientAudio.vibrate(10);
  showFact(fact);
},
onHiddenDetailFound: (id, label, fact) => {
  setFoundEggs(prev => addStoredEgg(prev, id));
  setFactText(`${label} — ${fact}`);
  launchConfetti();
  showToast('Hidden detail found');
},
```

Reuse `showFact()` (`:362`), `showToast()` (`:355`) and `launchConfetti()` (`:378`); do not
introduce a second callout system.

---

## 5. Feature A — Scale mode

### A.1 Data — new `src/data/scaleFacts.ts`

```ts
export type ScaleMeasure = 'height' | 'span' | 'length' | 'depth';

export interface ScaleFact {
  /** Real-world magnitude in metres; null when no defensible number exists. */
  magnitudeM: number | null;
  measure: ScaleMeasure;
  /** Short label used on the ruler and in the badge, e.g. 'summit height'. */
  label: string;
  /** Authored height of the landmark in diorama units (fallback: bounding box max Y). */
  modelUnits?: number;
}

export const SCALE_FACTS: Readonly<Record<string, ScaleFact>> = {
  'Table Mountain':        { magnitudeM: 1086, measure: 'height', label: 'summit height', modelUnits: 3.0 },
  'Moses Mabhida Stadium': { magnitudeM: 106,  measure: 'height', label: 'arch height',   modelUnits: 7.3 },
  'Nelson Mandela Bridge': { magnitudeM: 42,   measure: 'height', label: 'north pylon',   modelUnits: 8.3 },
  // … all 43 keys; reuse the numbers already in landmarkDetails.ts where they exist.
};
```

Pure helpers in the same file (or `src/lib/scale.ts`): `formatMetres()`, `scaleRatio()`,
`referenceHeightM(kind)`, `compareToReference(magnitudeM, kind)`.

Reference constants: person **1.7 m**, springbok **0.9 m** at shoulder, Eiffel Tower
**330 m** (antenna); document the source/assumption in comments. Eiffel is deliberately a
"bigger than the landmark" reference for small sites — that is the point of the comparison.

### A.2 In-scene reference — `src/three/builders/dioramaKit.ts`

New helper `addScaleReference(group, key, profile)`:

- Build one `THREE.Group` at roughly `(6.4, 0, 5.0)` — inside `PLINTH_INNER_HALF_EXTENT`,
  front-right, away from most anchors. Put it at plinth-top y.
- Three silhouettes, all built from existing primitives and shared materials:
  - **person** — capsule/cylinder torso + sphere head, matte charcoal;
  - **springbok** — reuse `gemsbok()` scaled to ~0.9 m shoulder equivalent, with a simplified
    fawn/white palette;
  - **Eiffel** — four splayed legs + two cross-decks + tapered mast (`catenaryTube` or thin
    cylinders), shared iron material.
- Compute `unitsPerMetre = (fact.modelUnits ?? measuredModelHeight) / fact.magnitudeM`.
  Reference height in units = `referenceHeightM * unitsPerMetre`.
  If that is below `MIN_REFERENCE_UNITS` (start at `0.35`), scale up by
  `enlargeFactor = MIN_REFERENCE_UNITS / rawHeight` and store the factor in
  `group.userData.scaleReference = { kind, enlargeFactor, magnitudeM }`.
- Register `userData.noShadow`, `userData.cannotReceiveAO`, `userData.noDissolve` so the
  silhouette is not stamped, AO-tinted or dissolved with the landmark.
- Keep the group **hidden by default**; `CitylitEngine.setScaleReference(kind | null)`
  traverses `currentGroup.userData.scaleReference` and toggles visibility. Because dioramas
  are cached (`CitylitEngine.ts:1575`), the group is built once per site and toggling is free.
- When enabled, extend hero framing using the existing `heroFitCenter` / `heroFitDirection`
  logic (`:283–286`) so a 330 m Eiffel beside a 106 m stadium is not clipped.

DOM badge (in `LandmarkCard.tsx` or a small fixed pill near the stage):
`1,086 m summit · ≈639 people tall` and, when enlarged, `Reference enlarged ×N for legibility`.
Text only; no extra 3D text meshes.

### A.3 Ruler view — new `src/components/ScaleRulerModal.tsx`

- Centred `SettleModal`, consistent with `PassportModal`, titled **Height ruler**.
- `PillNavigation` controls: `Sort: Tallest | Province | Visited` and `Scale: Log | Linear`
  (default **Log**, because 8 m → 1,200 m makes small sites invisible on a linear axis).
- One horizontal bar per landmark: name, province, formatted magnitude, bar length;
  visited bars use the passport green (`#7dffb0`), unvisited use gold (`#e8b04a`).
- Reference lines for person / springbok / Eiffel drawn as labelled rules at the bottom;
  toggle which one to compare with the same `scaleReference` setting.
- Bars are real `<button>` elements: `aria-label="Table Mountain, 1,086 metres, visited"`,
  click → close ruler + `selectLandmark(index)` (deep-link URL already handled by
  `setUrlForLandmark`). Include a visually hidden `<ul>` summary for screen readers, same
  pattern as `GlobeOverlay`.
- Entry points: **Passport → Stats → "Compare heights"** button, and SearchSheet quick action
  next to "Explorer Passport" (`SearchSheet.tsx:200`). Optional keyboard shortcut `H` if the
  handler at `App.tsx:888` has no conflict.

### A.4 Tests

`src/lib/scale.test.ts`: all 43 keys have a finite `magnitudeM`; sorting is stable; ratios are
correct for known values; `formatMetres()` handles decimal and thousands; log positions stay
within 0–1; enlarged-factor badge appears only when clamped.

---

## 6. Feature B — Wildlife layer

### B.1 Data — new `src/data/wildlife.ts`

```ts
export interface WildlifeSpot {
  id: string;                     // 'boulders-penguins'
  siteKey: string;                // must match LANDMARKS[].k
  species: AnimalKind;            // from animalKit
  label: string;                  // 'African penguin'
  fact: string;                   // one tap = one fact
  position: readonly [number, number, number];
  count?: number;
  scale?: number;
  idle?: AnimalIdle;              // 'waddle' | 'submerge' | 'graze' | …
  months?: readonly number[];     // 1–12, ANDed with seasons by isAnimalActive
  seasons?: readonly AnimalSeason[];
  biome: LandmarkBiome;           // sanity-check against LANDMARKS[].biome
}
```

Seed list (first pass, ~12 spots across biomes/seasons):

| Site | Species | Gate | Fact theme |
| --- | --- | --- | --- |
| Boulders Beach | penguin (`waddle`) | year-round | African penguins nest among the granite boulders. |
| Hermanus Whale Watching | whale (`submerge`) | months 6–10 (winter/spring) | Southern right whales calve in Walker Bay. |
| iSimangaliso Wetland Park | `generic` flamingo-pink (`rock`) | months 5–9 | Greater flamingos filter-feed on the pans. |
| Hartbeespoort Dam | `generic` flamingo-pink | months 5–9 | Flamingos gather on the shallow pans. |
| Kgalagadi Red Dunes | gemsbok (`graze`) | year-round | Gemsbok survive on fog moisture and tsama melons. |
| Kruger National Park | elephant (`graze`) | year-round | Elephants shape the savannah by browsing. |
| Pilanesberg Crater | elephant / gemsbok | year-round | The crater holds a mix of savannah species. |
| Cape Point Lighthouse | `generic` seabird (`bob`) | spring | Cape gannets nest on the nearby islands. |
| Storms River Mouth | `generic` (`bob`) | summer | Knysna loeries/forest birds in the canopy. |
| Augrabies Falls | `generic` (`graze`) | winter | Rock dassies shelter among the granite. |

`AnimalKind` gains `'flamingo'` and `'seabird'` variants only if a distinct template is worth
it; otherwise use `generic` with a per-spot `color`. Add a small template factory in
`animalKit.ts:230` for any new kind. Reuse the three existing scaffolds rather than adding
duplicates at Boulders/Hermanus/Kgalagadi — replace those builder-local calls with data-driven
ones from `WILDLIFE`, keeping their tuned positions.

### B.2 Build — `src/three/builders/dioramaKit.ts`

`addWildlifeLayer(group, key, spots)`:

- For each spot call `createAnimalScaffold({ kind, count, position, scale, idle, month, season,
  contact: true, lods: { farDistance: 30, farScale: 0.75, cullDistance: 60 } })`.
- Add the scaffold group to the landmark group, push its `update` into the `updates` array in
  `applyDioramaUpgrade` so month gating + idle motion run on the existing `userData.tick`.
- The engine already collects `userData.updateAnimalLod` by traversing `currentGroup`
  (`CitylitEngine.ts:1633`), so scaffold LOD works with no new engine code.
- Register an invisible-ish pick proxy per spot (a small `THREE.Mesh` at the herd centre,
  `visible = false` won't raycast — keep it transparent with `opacity: 0`, `depthWrite: false`)
  in `group.userData.interactiveTargets` with `kind: 'wildlife'`, `id`, `text: fact`,
  `touchRadius: 18`. The proxy should follow the scaffold's visibility so out-of-season
  animals cannot be tapped.
- Tag every new mesh `noShadow` / `cannotReceiveAO` where appropriate so the shared shadow
  stamp and vibrancy pass stay consistent.

### B.3 Settings & non-3D access

- `CitylitSettings.wildlife: boolean` (default `true`) + `LiquidToggle` in `SettingsModal`;
  effect in `App.tsx:604` calls `engineRef.current?.setWildlifeEnabled(settings.wildlife)`.
- `InfoDrawer.tsx` gains a compact **Wildlife here** section: species name + fact as a button,
  so facts are reachable without hitting a 3D target. It reads `WILDLIFE` filtered by
  `LANDMARKS[index].k` and the current month, and marks out-of-season species with a note
  ("Seasonal — visits Jun–Oct").

### B.4 Tests

`src/lib/wildlifeData.test.ts`: every spot's `siteKey` exists in `LANDMARKS`, `biome` agrees,
`fact` is non-empty, months are 1–12, positions finite, ids unique; every biome in
`LandmarkBiome` has at least one spot or an explicit "no wildlife" note. Extend
`animalScaffold.test.ts` with a gating + visibility case for the new kinds.

---

## 7. Feature C — Hidden details

### C.1 Data — new `src/data/easterEggs.ts`

```ts
export interface EasterEgg {
  id: string;                    // stable, e.g. 'cape-point-keeper'
  siteKey: string;               // one egg per diorama, 43 total
  label: string;                 // 'Lighthouse keeper'
  hint: string;                  // shown in Passport only after first visit
  fact: string;                  // reveal copy
  position: readonly [number, number, number];
  kind: 'keeper' | 'baboon' | 'tortoise' | 'bird' | 'tool' | 'mystery';
}
export const EASTER_EGGS: Readonly<Record<string, EasterEgg>> = { … };
```

Seed ideas (bespoke where obvious, `mystery` fallback elsewhere):

- Cape Point Lighthouse & Cape Agulhas Lighthouse → **lighthouse keeper** in a window.
- Blyde River Canyon / Three Rondavels → **baboon** on a ledge.
- Robben Island → **a single sunflower** by the quarry wall.
- Kruger / Pilanesberg → **a hornbill** in a marula tree.
- Boulders Beach → **a penguin chick** behind a boulder.
- Table Mountain → **Maclear's Beacon cairn's tiny plaque**.
- Nelson Mandela Bridge → **a signal lamp** at the rail-yard edge.
- Hermanus → **a whale-watching spotter** with a red flag on the cliff.
- Big Hole → **a solitary diamond lamp** at the rim.
- Remaining sites → a themed `mystery` micro-prop (a boot, a teacup, a camera) chosen per site,
  with bespoke hint/fact copy so no two read the same.

Validate in a test that `Object.keys(EASTER_EGGS).length === LANDMARKS.length` and every key
exists in `LANDMARKS`.

### C.2 Build — `src/three/builders/dioramaKit.ts`

`addHiddenDetail(group, key, egg)`:

- Build 3–8 primitives at `egg.position`, total footprint < ~0.15 world units so it reads as
  "tiny" at the default camera. Use existing `M`, `B`, `C`, `R`, `surfaceDetail` helpers.
- Tag the mesh `userData.hiddenDetail = egg.id`, `noShadow = true`, `cannotReceiveAO = true`.
- Register it in `group.userData.interactiveTargets` with `kind: 'egg'`, `id`, `touchRadius: 0`
  (exact raycast only), and `text: `${egg.label} — ${egg.fact}``.
- No shimmer, no glow, no marker: discovery is visual. A subtle one-shot scale pop is allowed
  after it is found, and that pop must be skipped when reduced motion is on.
- The target is removed from the registry after discovery (found eggs stay hidden).

### C.3 Passport state & UI

1. `App.tsx`: `const [foundEggs, setFoundEggs] = useState<Set<string>>(() => readStoredEggs())`
   with a `readStoredEggs()` helper mirroring `readStoredSet()` but validating against
   `Object.values(EASTER_EGGS).map(e => e.id)`. Storage key: **`cl-eggs`**.
2. `onHiddenDetailFound` callback (§4.3) persists the id and shows the reveal callout.
3. `PassportModal.tsx`:
   - props: `foundEggs: Set<string>`, `onResetEggs: () => void`.
   - Header: keep `{totalVisited}/{totalCount} Stamped`; add a slim second line
     `Hidden details {foundEggs.size}/{totalEggs}`.
   - New tab **`Hidden`** (5th pill) listing all 43 sites: found ones show the label + fact;
     undiscovered ones show only the site name and `egg.hint` (with a "Reveal another clue"
     button after the landmark itself has been visited). This preserves the surprise while
     keeping it discoverable and accessible.
   - `Stats` tab gains a small summary row; `onResetPassport` also clears `cl-eggs`, with a
     separate "Reset hidden details" action in the Hidden tab.
4. `InfoDrawer.tsx`: a small **Look closer** disclosure button reveals the hint for the
   current site (a11y-friendly path to the same egg). It does not auto-discover the egg.

### C.4 Tests

`src/lib/easterEggData.test.ts`: one egg per site, unique ids, finite positions, non-empty
hint/fact; `readStoredEggs()` drops unknown/corrupt ids (unit-test the validator by exporting it).

---

## 8. Settings, persistence & UI entry points (summary)

| Setting | Type / default | UI | Engine call |
| --- | --- | --- | --- |
| `scaleMode` | `boolean` / `false` | TopBar icon button (quick toggle) + Settings row | `setScaleReference(kind \| null)` |
| `scaleReference` | `'person' \| 'springbok' \| 'eiffel'` / `'person'` | `PillNavigation` in Settings and in ruler | `setScaleReference(kind)` |
| `wildlife` | `boolean` / `true` | `LiquidToggle` in Settings | `setWildlifeEnabled(bool)` |
| `hiddenDetails` | `boolean` / `true` | `LiquidToggle` in Settings (hides eggs, keeps progress) | `setHiddenDetailsEnabled(bool)` |

- `readSettings()` (`App.tsx:145`) supplies defaults for older `cl-st` payloads; no schema
  version bump needed because all new fields are optional in storage.
- Apply all four in the existing settings effect (`App.tsx:604`), next to `applyQuality` /
  `setTheme`.
- `cl-eggs` is a new key; no migration. Reset passport clears it.
- TopBar (`TopBar.tsx:15`) gains one optional `onToggleScale` prop and a phosphor `Ruler` icon;
  hide it while globe/places are open, same as the other buttons.

---

## 9. File-by-file change list (implementation order)

1. **`src/types/citylit.ts`** — `InteractiveKind`, `InteractiveTarget`, four new
   `CitylitSettings` fields (extend `:19`).
2. **`src/data/scaleFacts.ts`** (new), **`src/data/wildlife.ts`** (new),
   **`src/data/easterEggs.ts`** (new) — all 43-key datasets + pure helpers.
3. **`src/three/CitylitEngine.ts`** — §4 registry refactor; `setScaleReference`,
   `setWildlifeEnabled`, `setHiddenDetailsEnabled`; three new callbacks in `EngineCallbacks`
   (`:95`); camera framing expansion for tall references.
4. **`src/three/builders/animalKit.ts`** — add flamingo/seabird templates if needed; expose a
   `setVisible`-safe proxy registration helper.
5. **`src/three/builders/dioramaKit.ts`** — `addScaleReference`, `addWildlifeLayer`,
   `addHiddenDetail`; call all three from `applyDioramaUpgrade` (`:3344`) in this order:
   wildlife (before shadow stamping) → hidden detail → scale reference (last, so it stays out
   of the shadow/AO/vibrancy passes).
6. **`src/three/builders/landmarksA.ts` / `landmarksB.ts`** — remove the three builder-local
   animal scaffolds and let `WILDLIFE` supply them at the same tuned positions; no other
   builder edits.
7. **`src/components/SettingsModal.tsx`**, **`src/components/TopBar.tsx`** — controls.
8. **`src/components/ScaleRulerModal.tsx`** (new), **`SearchSheet.tsx`**,
   **`PassportModal.tsx`**, **`InfoDrawer.tsx`**, **`App.tsx`** — UI, state, callbacks,
   keyboard entry point.
9. **Tests** — `scale.test.ts`, `wildlifeData.test.ts`, `easterEggData.test.ts` plus updates
   to existing settings/animal tests.
10. **`graphify update .`** — required by `AGENTS.md` after code changes.

---

## 10. Test & QA plan

- `pnpm lint` (oxlint) and `pnpm build` (`tsc --noEmit` + Vite).
- `pnpm test` — new pure-data/helper tests, existing season and animal-scaffold tests.
- Manual matrix:
  - Each of the three reference silhouettes on a short site (Ponte? Donkin?) and a tall site
    (Table Mountain, Amphitheatre); verify the enlargement badge appears/doesn't.
  - Ruler log vs linear, sorting, click-to-open, keyboard-only navigation, screen-reader list.
  - Boulders in January vs July; Hermanus whale pod in July vs January; flamingos on/off season.
  - Reduced motion on/off: idle motion freezes; egg pop skipped.
  - Tap accuracy on touch (28 px radius for pins/wildlife, exact for eggs).
  - Passport: stamp → find egg → progress numbers → reset clears both; reload persists.
  - Offline (`pnpm preview`, service worker): all three layers work with no network.
  - `docs/qa-mobile.md` checklist on a real device.

---

## 11. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Scale figure too small to see | Clamp to `MIN_REFERENCE_UNITS`, disclose enlargement in DOM badge; ruler stays exact. |
| Eiffel reference dwarfs small dioramas / clips camera | Expand hero framing only when scale mode is on; keep it a silhouette, no lighting cost. |
| Extra pick targets steal taps from pins | Single registry with explicit priority: notes → facts → wildlife → eggs; pin-drop and globe/places guards unchanged. |
| Hidden egg invisible on low-end/low quality | Tiny but high-contrast material; egg hint in Passport and InfoDrawer. |
| 43 eggs become repetitive | Distinct id/label/hint/fact per site; tests enforce uniqueness. |
| More draw calls per diorama | Shared geometries/materials; one scaffold per spot; LOD cull; audit draw calls with the existing contact sheet. |
| Cached dioramas keep old toggle state | Toggle visibility via `userData` on `currentGroup` after cache hit; no rebuild. |

---

## 12. Open questions for the owner

1. **Ruler placement** — Passport → Stats button (recommended) or a standalone top-level modal?
2. **Progress weighting** — should hidden details affect the headline completion percentage, or
   stay a separate counter only (recommended: separate)?
3. **Height values** — OK to curate `magnitudeM` from `LANDMARK_DETAILS.scale` plus known facts?
   Some sites (bridges, dams, craters) need a judgement call on "height" vs "span" vs "depth";
   `measure` records which was chosen.
4. **Flamingo site** — iSimangaliso + Hartbeespoort are proposed; is there a preferred pan?
5. **Egg difficulty** — exact-raycast only (recommended) vs a small touch radius for children?

---

## 13. Out of scope

- New animal species beyond the templates above; no external 3D assets or network fetches.
- Per-site 3D text labels (badges stay in DOM).
- Changing the existing 3-second stamp rule.
- Globe/province tinting by hidden-detail progress (possible follow-up once data is trusted).
