# Landmark Accuracy & Render Spec — citylit-pwa

Research-backed corrections and colour specs for the 43 procedural three.js landmark
dioramas in `src/three/builders/landmarksA.ts` and `landmarksB.ts`.

Every claim below is sourced. Where a model is already right, it says so — the goal is
recognisability at miniature scale on a screen, not photoreal reconstruction.

---

## 1. How the renderer actually turns your hex into pixels

This matters more than the reference photo, because the pipeline is **not** a neutral
sRGB display. Any palette copied straight from a photo will land bright and flat.

| Stage | Value | Source |
| --- | --- | --- |
| Renderer tone mapping | `ACESFilmicToneMapping` | `CitylitEngine.ts:304` |
| Renderer exposure | `1.08` | `CitylitEngine.ts:305` |
| Composer target | `HalfFloatType` render target | `CitylitEngine.ts:423-427` |
| N8AO | `intensity 2.4`, `aoRadius 0.58`, half-res (High on GPU) | `CitylitEngine.ts:433-443` |
| Bloom | `0.18 / 0.62 / 0.9` | `CitylitEngine.ts:445-453` |
| Miniature pass | tilt-shift DoF + custom ACES + grade | `postfx.ts:15-120` |
| Grade | `mix(grey, colour, 1.05)` → **+5 % saturation** | `postfx.ts:62-68` |
| Split tone | shadows ×`(0.97,0.99,1.05)`, highlights ×`(1.04,1.01,0.96)` | `postfx.ts:66` |
| Vignette | up to `0.2` by default | `postfx.ts:102` |
| Final ACES | `c * (toneMappingExposure / 0.6)` → **×1.80** | `postfx.ts:114` |

### The critical consequence

Three.js **skips** renderer tone mapping when drawing into a render target
(`WebGLRenderer`: tone mapping is only applied to the default framebuffer). The
composer renders into a HalfFloat target, so materials stay **linear HDR** and the
miniature pass applies its own ACES at an effective **1.8× exposure**.

Practical rules that follow:

1. **Do not author albedo above ~0.75 sRGB.** At 1.8× a linear 0.75 clip-compresses
   to a flat near-white and loses all form. Physical whites (lighthouse, penguin
   breast, foam, PTFE roof) are the deliberate exception — keep those at 0.80–0.88
   and let bloom carry them.
2. **Target linear luminance 0.15–0.35** for hero surfaces. In sRGB that is roughly
   `#6B6B6B` → `#9A9A9A` equivalent *value*, with hue applied on top.
3. **Author 5–12 % less saturated than the reference photo.** The grade already adds
   5 % saturation, and the cool-shadow/warm-highlight split will push warm ochres and
   reds further than you expect.
4. **Hue is preserved, value is not.** Use the photo for hue and relative
   relationships; derive value from the rules above.
5. **Deep shadows read.** Hemisphere ground colour is `#3a2d20` at `0.7`, fill is
   `#7298c8` at `0.95`, key is warm `#fff5dd` at `3.1` (`CitylitEngine.ts:394-407`).
   Anything under ~L\*25 crushes to black under the vignette.

### Standing material table

Use the existing helpers in `src/three/builders/primitives.ts` rather than raw
`MeshStandardMaterial`; they already carry the correct bump/normal plumbing and the
cache keys that keep draw calls down.

| Surface | Helper | Roughness | Metalness | Notes |
| --- | --- | --- | --- | --- |
| Sandstone / granite / basalt | `MStone(c, r, bump)` | 0.90–0.96 | 0.02 | Bump 0.018–0.03 reads at diorama scale |
| Painted plaster / face brick | `MPlaster(c)` | 0.72–0.82 | 0.02 | Never below 0.55 — gloss looks like plastic |
| Thatch / raw timber | `MWood(c)` | 0.84–0.94 | 0 | |
| Concrete (dams, bridges, towers) | `MStone` or `MPlaster` | 0.80–0.88 | 0.02–0.06 | Vertical stain streaks matter more than hue |
| Asphalt | `MWet('#…', 0.84, 0.15, 0.05, 'plaster')` | 0.84 dry | 0.05 | Keeps the rain reaction |
| Standing water | `MWater(c, 0.09, 0.25)` | 0.09 | 0.25 | Never use a bright turquoise default |
| Falls / white water | `MCascade(c, opacity)` | 0.22 | 0.05 | Opacity 0.84–0.90 |
| Emissive glass / lamps | `G(c, intensity)` | — | — | Already AE-registered |
| Foliage | `Mc(c)` | 0.88 | 0.02 | Wind-animated + instanced |

Anti-patterns to avoid: `metalness > 0.2` on anything that is not steel or the SALT
mirror; `roughness < 0.3` on rock or masonry; pure `#ffffff` on large areas; and
`MeshBasicMaterial` for anything that should receive light.

---

## 2. Cross-cutting fixes worth doing once

1. **Trunk-authentic water.** Most SA inland water is silt-laden or tannin-stained.
   Replace the recurring `MWater('#288ca8' / '#3394b4' / '#3fa4be')` set in inland
   sites with olive-grey / tea-brown values. Keep saturated teal only for the
   Mozambique-facing Indian Ocean and deep offshore False Bay.
2. **Vegetation hue stratification.** Right now most sites use one green family
   (`#4d6b34`–`#8aa04a`). Real SA biomes differ sharply: fynbos is grey-green and
   olive (`#5f6b4a`), highveld is straw (`#b0a066`), Karoo is silver-grey
   (`#7a7d6a`), KZN coast is deep saturated green (`#3f6b35`). Differentiate by
   biome, not by taste.
3. **Sky/atmosphere per biome.** `FogExp2(SKY_COLOR, 0.01)` is global
   (`CitylitEngine.ts:323`). Tan/red sites (Kgalagadi, Richtersveld, Augrabies) need
   a warmer fog tint than coastal sites, or they read as cold and overcast.
4. **Don't model what a viewer can't resolve at 14 units.** A 0.05-unit window frame
   on a 4-unit building is ~1 px at default framing. Prefer fewer, larger cues.
5. **Silver/white structures need a value floor.** Adding a subtle
   `#b9c4cc`-ish tint to any "white" surface stops it clipping to flat white under
   the 1.8× exposure.

---

## 3. Per-landmark specs

Legend: **Palette** = recommended base albedo (sRGB hex) per role.
**Model** = what to change in the builder. **Source** = verification.

---

### 3.1 Table Mountain — `table()`

**Verified.** A level, irregular plateau roughly **3 km across** of hard quartzitic
**Table Mountain Sandstone** — grey upper crags, *not* a granite tower — with
near-vertical escarpments and the deep **Platteklip Gorge** notch. Maclear's Beacon is
an **1865 stone trigonometrical cairn**, commonly cited at 1,086 m. The cableway runs
**two counterbalanced 65-person Rotair cabins**, not a fleet of coloured gondolas.

**Palette.** sandstone sunlit `#aaa394` · cliff face `#797a73` · fissure `#565d5b` ·
fynbos `#697051` · cabin graphite `#444d51` · summit gravel `#a89377` ·
tablecloth cloud `#eef3f8`

**Model.**
- Keep the single flat cap plane — it is the defining silhouette. Do not add summit noise.
- Deepen Platteklip as a **V-notch cut into the north face only**, not a radial groove.
- Shift the rock from warm brown toward **grey sandstone**. The grey crags are the
  site's true colour *and* they separate it from Golden Gate and the Drakensberg.
- Lion's Head should be a **separate pointed cone**; Signal Hill a low ridge, not a lump.
- Cairn is right; keep it small and stone-grey.
- Cableway: **two cabins only, graphite-silver** (`#444d51`). Delete the red/blue
  liveries — they are not permanent geography.
- Remove the evenly spaced "buttress" rocks that read as teeth.

**Source.** Wikimedia Commons: [Table Mountain from Bloubergstrand](https://commons.wikimedia.org/wiki/File:Table_Mountain_from_Bloubergstrand.jpg) (CC BY-SA), [Platteklip Gorge](https://commons.wikimedia.org/wiki/File:Platteklip_Gorge,_Table_Mountain.jpg).

---

### 3.2 Union Buildings — `union()`

**Verified.** Herbert Baker's symmetrical complex, **285 m long**, with two long wings
joined by a **semicircular colonnade** and twin **domed clock towers**. The visible
façades are **light creamy sandstone** above granite — the 14 million bricks were used
*inside* office walls, which is why "honey-gold face brick" reads wrong outdoors. Roofs
are **red clay tile** from Vereeniging; three broad terraced gardens descend from the
amphitheatre.

**Palette.** sandstone light `#c5af8a` · sandstone shade `#91816b` · pale trim `#d6c5a4` ·
terracotta roof `#a96345` · stone dome `#b9a888` · garden green `#66704a` ·
flag `#007749`

**Model.**
- **Domes are stone-coloured, not verdigris copper.** Replace `cu = M('#4f9e8c')` with a
  warm pale stone `#b9a888` plus vertical ribbing. This is the clearest single error.
- The exterior is sandstone, not orange brick — pull the wall colour toward `#c5af8a`.
- Widen the mass so the wings read at roughly 4–5× tower height.
- Group the colonnade columns visually; at 4 units wide the fine 18/14 spacing moirés.
- Three terraced lawns: correct, keep.
- Give each tower a readable clock disk and a tiny Atlas globe; those sell the silhouette.

**Source.** [Union Buildings (Wikipedia)](https://en.wikipedia.org/wiki/Union_Buildings); Commons: [Union Buildings facade](https://commons.wikimedia.org/wiki/File:Union_Buildings,_Pretoria.jpg).

---

### 3.3 Moses Mabhida Stadium — `stadium()`

**Verified.** Durban's 2010 stadium. The free-span steel arch is **350 m long and 106 m
high** — roughly twice the bowl height — and the roof is **46,000 m² of PTFE-coated
glass-fibre membrane**, translucent when lit. Seating deliberately fades from
**blue-green at the bottom to ivory at the top**, evoking sea meeting beach.

**Palette.** PTFE roof `#dce1df` · arch aluminium `#c6cecf` · concrete columns `#909ba0` ·
maritime seat teal `#437783` · seat ivory `#e2dfd2` · red SkyCar `#b94838` ·
pitch `#3b8a47`

**Model.**
- The arch must stay **~2× bowl height** and read exceptionally slender. Currently good.
- Bifurcate only the **southern** end into two gateway legs; the northern leg is one
  continuous SkyCar line.
- Replace the saturated red/blue tier bands with a **blue-green → ivory vertical fade**.
  This is the colour error: the real palette is maritime, not club colours.
- Roof: keep opacity ~0.55 so it stays a membrane; opaque white swallows the bowl.
- Freeze the HSL cycling on the ring lights to neutral cool white — noon floodlights
  are white, not decorative.
- Keep the 48 instanced fins; cheap and effective.

**Source.** [Moses Mabhida Stadium (Wikipedia)](https://en.wikipedia.org/wiki/Moses_Mabhida_Stadium).

---

### 3.4 Nelson Mandela Bridge — `bridge()`

**Verified.** **284 m** cable-stayed bridge linking **Braamfontein and Newtown**, with
exactly two unequal pylons — **42 m north, 27 m south** — over 42 railway lines. The
unequal heights exist because those were the only structurally suitable support
positions. Slender composite deck with illuminated handrails and glass pedestrian infill.

**Palette.** pylon white `#d4d9d8` · cable stay `#bcc6c8` · asphalt `#41474b` ·
rail-yard steel/gravel `#6e6960` · city towers `#657580` · lamp warm `#ffd79a`

**Model.**
- Unequal pylons are correct — **north ≈ 1.55× south**. Keep, and exaggerate slightly.
- Fan the stays **narrowly** toward both deck directions. It is cable-stayed: do not add
  a suspension main cable or hangers.
- Expose a few straight dark railway tracks beneath; 42 is the fact, three read fine.
- Reduce deck clutter — nine streetlight pairs is too many at this scale.
- Desaturate the skyline window emissive so it doesn't compete with the bridge.

**Source.** [Nelson Mandela Bridge (Wikipedia)](https://en.wikipedia.org/wiki/Nelson_Mandela_Bridge).

---

### 3.5 The Big Hole — `hole()`

**Verified.** **17 ha, 463 m wide, excavated to 240 m** between 1871 and 1914 from what
was originally a flat-topped hill. Debris has since filled it to ~215 m, and about
**40 m of water** leaves roughly 175 m visible. Walls mix **buff/ochre upper ground with
prominent grey rock faces** — not uniform red-brown kimberlite. Water reads bright teal
in sun and near-black green in shadow.

**Palette.** ochre upper ground `#a68b61` · grey cliff `#787973` · shadowed lower wall
`#4a4a46` · sunlit water `#177c77` · shadowed water `#173d3d` · rust steel `#8d4e38` ·
museum wall `#e3d9c2`

**Model.**
- Add **grey rock faces below the ochre benches**. The current warm gradient is too
  uniform, and the grey lower walls are a genuine identifying feature.
- Water: teal `#177c77` on the sunlit side, near-black `#173d3d` in shadow. A single
  flat navy disk is the current weakness.
- Keep two or three **irregular** benches — avoid wedding-cake concentric rings.
- Headgear is the strongest identifier; make the wheel/pulley slightly larger.
- Keep the viewing platform and glass balustrade; good scale cue.
- Replace the three "spoil heap" cones with low irregular mounds if they read as craters.

**Source.** [Big Hole (Wikipedia)](https://en.wikipedia.org/wiki/Big_Hole); Commons: [Big Hole Kimberley](https://commons.wikimedia.org/wiki/File:Big_Hole,_Kimberley.jpg).

---

### 3.6 Voortrekker Monument — `voortrekker()`

**Verified.** **40 × 40 × 40 m granite**, but heavily articulated rather than a bare
cube: a stepped, inset upper stage with enormous recessed arched windows and a chevron
band. Encircled by a laager of **64 wagons** (313 m of wall) in cement/marble/blue-granite
terrazzo. The four exterior corners carry **statues** of Retief, Pretorius, Potgieter and
an unnamed leader — not towers. Van Wouw's bronze is a woman with **two children**.

**Palette.** warm granite `#9d8f78` · recessed stone `#685f52` · upper trim `#b6a58a` ·
yellow glass `#b69c55` · dark bronze `#4d5548` · plaza `#b5a486`

**Model.**
- Keep the wagon laager — it is the identity. It is instanced, so go to the full **64**.
- **The four corners carry statues, not towers.** Currently modelled as corner columns
  with caps; convert them to low statue/buttress markers so they stop reading as turrets.
- Make the mass **stepped with an inset upper stage**, not a smooth cube.
- Exaggerate the recessed arched windows and the chevron band; they carry the silhouette.
- Laager ring should be monument-coloured terrazzo, not white marble.
- Nudge the granite warmer; currently it reads grey.

**Source.** [Voortrekker Monument (Wikipedia)](https://en.wikipedia.org/wiki/Voortrekker_Monument).

---

### 3.7 Cape Point Lighthouse — `capePoint()`

**Verified.** The **old 1860 light** is a **circular prefabricated cast-iron tower**
high on the cliff (~262 m), now a lookout. The **working light** is a separate **9 m
square masonry lighthouse with a white lantern**, commissioned 1919 at ~87 m on Dias
Point — it was moved lower because cloud obscured the original. The Flying Dutchman
funicular runs 585 m and climbs 87 m to just below the old light.

**Palette.** aged whitewash `#d9d5c5` · iron cap `#343c3d` · lamp `#fff3b0` ·
cliff/fynbos olive-grey `#73755d` · sea storm `#28627c` · sea shallow `#3fa3b5` ·
Dias sand `#c8b793`

**Model.**
- Two lighthouses at different heights: **correct**, and it is the best detail here.
- The old light should read **cast iron**: a slimmer, darker drum with a white lantern.
  It is currently too whitewashed and cone-heavy.
- The new light must be **square masonry with a white lantern** — a clearly different
  form. Do not let both read as round towers.
- Sea: **storm-blue offshore** `#28627c`, turquoise only in local shallows. The current
  cyan is too tropical for the Atlantic.
- Dias sand is pale buff `#c8b793`, not orange dune sand.
- Keep the funicular rail lines — good scale cue.

**Source.** [Cape Point (Wikipedia)](https://en.wikipedia.org/wiki/Cape_Point); Commons: [Cape Point old lighthouse](https://commons.wikimedia.org/wiki/File:Cape_Point_Lighthouse.jpg).

---

### 3.8 Bo-Kaap — `bokaap()`

**Verified.** Mostly **single-storey, flat-roofed limewashed terraces** stepping downhill
behind narrow stoeps, with occasional two-storey examples on Wale Street. Houses share
moulded parapets, sash windows and doors; the bright paint is largely a **late-20th-century
tradition**. Auwal Mosque (Dorp Street, 1794) has **one square-tiered minaret** in muted
olive-green plaster with white bands and reddish shutters — **there is no large green dome**.

**Palette.** coral `#d94b64` · golden `#c7a43a` · turquoise `#30a5ac` ·
warm-white trim `#f1e6d2` · mosque sage `#9a9c7a` · cornice shadow `#b8a992` ·
roof slate `#4a5058`

**Model.**
- Build **one connected, staggered terrace** with alternating saturated houses — not
  scattered detached cottages. The continuous frontage is what makes it read as Bo-Kaap.
- Make **straight parapets dominant**; use curved Cape Dutch gables only occasionally.
  The current model is too gable-heavy and reads Cape Dutch.
- Elevate shallow **stoeps** (raised front steps) along the terrace.
- Enlarge and lighten the **cornices**; they cast the sharp horizontal shadow bands that
  define the streetscape.
- Auwal Mosque: model a **rectangular green minaret with a small dark cap**, not a dome.
- Cut saturation ~8 % on the two hottest hues (`#d94a5b`, `#d8628c`) so the +5 % grade
  doesn't blow them.
- Remove universal pilasters, window bars and individual cobbles.

**Source.** [Heritage Portal — Bo-Kaap history and style](https://www.theheritageportal.co.za/article/history-and-style-bo-kaap); [Auwal Mosque](https://en.wikipedia.org/wiki/Auwal_Mosque); Commons: [Wale Street](https://commons.wikimedia.org/wiki/File:Cape_Town_%28ZA%29,_Wale_Street_--_2024_--_3544.jpg).

---

### 3.9 FNB Stadium / Soccer City — `soccer()`

**Verified.** The elliptical calabash bowl is clad in earth-coloured **glass-fibre-reinforced
concrete (GFRC) façade panels**, not clay tile, under a PTFE/glass membrane roof. **Six
façade colours and three textures** form an irregular rectangular mosaic that includes
substantial **cream and grey-brown** areas — it is not uniformly terracotta. **Ten broad
charcoal vertical lines** articulate the bowl, with a warm ring of light below evoking fire
under the pot. Roof is pale sand/off-white with a dark rim.

**Palette.** hero terracotta `#b77a54` · pale ochre-sand `#c99a6b` · rust `#944d3e` ·
ribs/rim `#343536` · roof membrane `#d5c5a6` · cream panel `#cdbfa4`

**Model.**
- Keep the calabash lathe form — it is correct and is the identity.
- Replace the uniformly terracotta mosaic with an **irregular rectangular patchwork**
  including cream and grey-brown panels. Uniform terracotta is the colour error.
- **Ten strong vertical seams**, not a rib around every mosaic cell. The current dark
  ribs are too dense and read as a cage.
- Leave the dark central roof opening; scalloped pale roof ring.
- Remove the four corner floodlight pylons and tiny numbered tiles; keep only small
  integrated roof hardware.
- Delete the animated fire-lamp ring; it fights the form.

**Source.** [SBP structural engineer](https://www.sbp.de/en/project/soccer-city-stadium/); [WikiArquitectura](https://en.wikiarquitectura.com/building/soccer-city-stadium/); [Hightex roof fabric](https://www.stylepark.com/en/hightex/ptfe-coated-sand-coloured-glass-fabric-soccer-city-stadium).

---

### 3.10 Three Rondavels — `rondavels()`

**Verified.** Three roughly **700 m beehive-like pinnacles** named left-to-right
**Magabolie (Magabolle), Mogoladikwe and Maseroto**, representing three of chief Maripi's
wives. Their tops are **rounded and slightly pointed** — the flat-topped slab beside them
is **Mapjaneng**, "the chief". Stepped rust, buff and grey-brown rock beds sit under
rounded green crowns; slopes are heavily forested. The characteristic view includes the
Blyde Dam far below in deep green-teal.

**Palette.** cliff ochre `#aa6b48` · bedding buff `#c0a078` · crown grass `#627640` ·
forest `#3b613b` · water `#4f7c77` · rock shadow `#6d4a33`

**Model.**
- Three **unequal** rounded/conical buttresses emerging from **one forested ridge** — not
  three isolated cylinders. The shared ridge is what makes the formation legible.
- **Make the three crowns rounded and gently pointed.** The current flat mushroom caps are
  wrong; only Mapjaneng is flat-topped.
- Concentrate 4–6 thick irregular horizontal ledges on the upper cliffs; avoid
  candy-stripe banding.
- Carpet the slopes with broad low-poly forest facets, not single trees.
- Place Mapjaneng's flat slab behind/right, and add distant teal water for depth.
- Avoid asserting a settled geology (sources split between quartzite/shale and dolomite).

**Source.** [South African Tourism — Three Rondavels](https://www.southafrica.net/gl/en/travel/article/a-trio-of-mountain-tops-the-three-rondavels-mpumalanga); [MTPA](https://www.mpumalanga.com/our-provincial-parks/blyde-river-canyon-nature-reserve).

---

### 3.11 Baobab — `baobab()`

**Verified.** *Adansonia digitata* has a massive cylindrical/fluted trunk with a flared
buttressed base and normally **smooth grey bark** — silver-taupe to pinkish-grey, with dark
furrows. Copper is only a warm undertone. It stays **leafless roughly eight months a year**.
Sagole is South Africa's largest intact baobab (20.5 m high, 10.8 m trunk diameter,
38.2 m crown); the famous Sunland specimen collapsed and died in 2016–17, so model Sagole.

**Palette.** bark `#9a8b82` · sunlit bark `#b7a29a` · furrow `#71635b` ·
leaf `#6d8d45` · dry veld `#b09a58` · burl `#857468`

**Model.**
- Trunk girth is the whole point — currently good. Add **multi-lobed irregularity** and a
  short flared root base.
- **5–8 massive, unequal branches** spreading broadly, ending in blunt upward twig
  clusters. Currently too many thin, long limbs.
- Prefer a **bare crown**; sparse leaf pads only at branch tips. Never a dense sphere.
- **Bark must be matte grey/taupe**, not glossy copper. Add deep vertical grooves and a
  couple of burls.
- Remove long snake-like roots and mirror gloss.

**Source.** [Adansonia digitata](https://en.wikipedia.org/wiki/Adansonia_digitata); [Sagole Baobab](https://en.wikipedia.org/wiki/Sagole_Baobab); [Sunland history](https://en.wikipedia.org/wiki/Sunland_Baobab).

---

### 3.12 Hole in the Wall — `holewall()`

**Verified.** A wave-cut arch pierces a **sandstone/shale tidal island** at the Mpako River
mouth, ~8 km south of Coffee Bay, reachable on foot at low tide. The silhouette is an
**elongated cliff-wall with an uneven grassy plateau**, not a narrow cylindrical stack; the
opening sits at water level and is wide enough for a sailboat. Dry faces are umber/ochre
with darker shale beds; wet lower rock approaches black.

**Palette.** rock ochre `#95724f` · wet umber `#5d5047` · grassy cap `#536d3f` ·
sea `#497b81` · foam `#d6e3dd` · shale band `#6b5a4a`

**Model.**
- Keep a genuine **see-through opening at water level** — it is the primary recognition cue.
- Rebuild the mass as an **extended cliff wall with an irregular grassy plateau** and
  visible horizontal ledges. The current arch is too symmetric and too "stack-like".
- The hole should occupy only the **lower portion** of a much larger cliff mass.
- Surround the base with churning white foam, teal water and a low-tide shore connection.
- Rondavels are **optional regional context**, not a defining foreground — don't stereotype
  the nearby settlement as entirely thatched huts.
- Remove tropical palms.

**Source.** [Hole-in-the-Wall (Eastern Cape)](https://en.wikipedia.org/wiki/Hole-in-the_Wall_(Eastern_Cape)); Commons: [Hole In The Wall](https://commons.wikimedia.org/wiki/File:Hole_In_The_Wall.jpg).

---

### 3.13 Castle of Good Hope — `castle()`

**Verified.** Built 1666–1679 as a **stone pentagon with five blunt bastions** — Leerdam,
Buuren, Katzenellenbogen, Nassau and Oranje. Entrance bell tower 1684; De Kat Balcony
rebuilt 1786–1790. Crucially, the **outer curtain walls are largely weathered rubble
stone and brick** — the ochre-yellow with pale trim belongs especially to the **interior**
De Kat façade, columns and balcony. The moat combines **grass-covered banks with a
water-filled canal**.

**Palette.** De Kat ochre `#c9a353` · weathered outer stone `#887c69` · pale trim `#e1d8bd` ·
brick parapet `#635049` · moat water `#4f6b6e` · grass bank `#71805c` ·
roof terracotta `#8a4932`

**Model.**
- **Do not paint the entire outer wall yellow.** Exterior curtains are stone/brick
  (`#887c69`); reserve ochre `#c9a353` for the De Kat façade inside the courtyard and for
  trim. This inverts the current treatment.
- Keep the five blunt bastions and low, thick plan — visible from an oblique elevated view.
- Centre a simple **arched gate** with an ornate grey pediment and an open **brick bell
  tower**; avoid medieval crenellations.
- Reveal enough courtyard to show the yellow De Kat façade with its white colonnaded
  balcony.
- Moat: grass banks **plus a water canal**, not one or the other.
- Remove fairy-tale towers and universal Dutch gables.

**Source.** [Official Castle history](https://www.castleofgoodhope.co.za/); Commons: [gateway and bell tower](https://commons.wikimedia.org/wiki/File:Castle_of_Good_Hope,_Cape_Town_01.jpg), [De Kat courtyard](https://commons.wikimedia.org/wiki/File:Castle_of_Good_Hope,_Cape_Town_02.jpg).

---

### 3.14 Drakensberg Amphitheatre — `amphi()`

**Verified.** A **crescent wall of basalt** ~5 km wide and ~1,220 m high, over Clarens
sandstone, with the multi-stage **Tugela Falls** (948 m, five drops) below. Alpine
grassland, bright green in summer.

**Palette.** basalt `#687169` · basalt light `#8d938b` · basalt shadow `#4e554f` ·
summer grass `#78a84e` · tussock `#8d8746` · falls `#82b6ba` · foam `#e8f6ff`

**Model.**
- **This is currently modelled as brown sandstone and should be grey-green basalt.**
  That is the single biggest colour error in the file. Replace
  `bandCols = ['#5d4a3a','#6b563f','#7a6047','#67503a']` with a grey family.
- Build a **concave crescent**, not a straight stepped wall.
- Tugela should be one dominant pale thread with 2–3 short leaps, not a continuous
  sheet.
- Remove the alpine trees scattered at the base; that's not Drakensberg foothill.

**Source.** [Amphitheatre (Wikipedia)](https://en.wikipedia.org/wiki/Amphitheatre_(Drakensberg)); [Tugela Falls](https://en.wikipedia.org/wiki/Tugela_Falls).

---

### 3.15 Palace of the Lost City — `palace()`

**Verified.** 1992 themed resort: buff/beige aged stone façades, **teal-turquoise
conical spire roofs** with **gold finials**, symmetric wings around a taller central
cluster, pools and palms.

**Palette.** stone `#b8a581` · stone shadow `#8f7d5e` · teal roof `#2f8b8c` ·
teal deep `#246f70` · gold finial `#c9a54b` · pool `#52a8b0` · planting `#6d964c`

**Model.**
- Teal cones + gold tips: correct, and they are the identity. Keep, but desaturate
  the teal ~10 % — it currently reads tropical-toy.
- Remove the crenellations if present; this is a fantasy hotel, not a castle.
- Increase symmetry — the real building is strongly axial.
- Keep the water feature; make it turquoise and not sky-blue.

**Source.** [Sun City (Wikipedia)](https://en.wikipedia.org/wiki/Sun_City_(South_Africa)); [official Palace page](https://www.suninternational.com/palace/).

---

### 3.16 Golden Gate Highlands — `golden()`

**Verified.** Maluti/Clarens **sandstone** cliffs in ochre-gold-orange with red
mudstone bands; **Brandwag Buttress** is the mushroom-shaped icon. Highveld grassland.

**Palette.** sandstone gold `#c99559` · orange shadow `#b77b43` · red band `#a7674f` ·
grass `#a4a35e` · stream `#6e9e9b`

**Model.**
- Add the **mushroom cap over a narrower stem** for the main buttress — currently the
  rocks are generic cones.
- Add large, sparse horizontal red bands; currently too uniformly golden.
- Ground is too green; highveld winter grass is straw.

**Source.** [Golden Gate Highlands National Park (Wikipedia)](https://en.wikipedia.org/wiki/Golden_Gate_Highlands_National_Park); [SANParks](https://www.sanparks.org/parks/golden-gate-highlands).

---

### 3.17 Kruger National Park — `kruger()`

**Verified.** Savanna elephants with **grey skin that is usually dust-coated
reddish-brown**, large triangular ears, concave back. Umbrella thorn acacias with
flat wide crowns. Golden grass, muddy waterholes.

**Palette.** elephant grey `#817466` · dust coat `#a77857` · acacia leaf `#647d52` ·
grass `#bea861` · water `#6f9491` · ivory `#c0ac83`

**Model.**
- **Vary elephant colour per animal** — one dusty red, one grey, one darker. Flat
  grey for every elephant is the main inaccuracy.
- Ears are too small relative to the head; enlarge ~20 %.
- Acacias should have **wide flat umbrella crowns**, not rounded blobs.
- Waterhole: make it irregular and muddy-edged `#6f9491`, not a blue disc.

**Source.** [African bush elephant (Wikipedia)](https://en.wikipedia.org/wiki/African_bush_elephant#Description); [SANParks vegetation](https://www.sanparks.org/parks/kruger/explore/fauna-flora/vegetation).

---

### 3.18 Ponte City — `ponte()`

**Verified.** 173 m, 55-storey **hollow cylinder** with an open central light well,
tightly repeated balcony bands, weathered grey-brown concrete. Rooftop signage is
currently **VodaPay red**.

**Palette.** concrete `#8a8172` · balcony band `#a29785` · glazing recess `#607477` ·
sign red `#d74444` · ground `#8e8b62`

**Model.**
- The open core must stay visible. Currently the inner cylinder is present — good.
  Do not cap the top with a solid disc.
- Sign: keep red but drop the rainbow HSL cycling. Pin to `#d74444`.
- Add subtle vertical staining; this building's grime is part of its identity.
- Remove the antenna/spire — there isn't one.

**Source.** [Ponte City (Wikipedia)](https://en.wikipedia.org/wiki/Ponte_City).

---

### 3.19 Boulders Beach — `boulders()`

**Verified.** ~540-million-year-old rounded Cape granite boulders enclosing sheltered
False Bay inlets. African penguins: black back and mask, white breast with an
inverted horseshoe band, **pink bare skin above the eye**, black feet.

**Palette.** granite `#8d8c82` · granite light `#b0a698` · sea `#599eab` ·
penguin black `#343a3a` · penguin white `#d5d2c4` · eye patch `#d0919b` ·
scrub `#73865e`

**Model.**
- Penguins are the whole point. Currently `#f4f4f2` breast, `#1b1d22` back,
  `#e8903a` (orange) beak/feet. **Feet should be black/dark**, and add the pink
  eye patch — that's the species tell.
- Boulders should be **more numerous and more tightly clustered**; the current three
  clusters read as separate islands.
- Sea should be cooler/deeper than the current bright `#33b5c4`.

**Source.** [Boulders Beach (Wikipedia)](https://en.wikipedia.org/wiki/Boulders_Beach); [African penguin](https://en.wikipedia.org/wiki/African_penguin).

---

### 3.20 Orlando Towers — `orlando()`

**Verified.** Two decommissioned Soweto **cooling towers**, each painted with a
different large mural (portrait/community imagery), linked by a Skyviews platform
used for bungee. Surrounding colourful township houses and lattice pylons.

**Palette.** concrete `#a4a798` · mural teal `#458f96` · mural ochre `#be8655` ·
mural coral `#b85e50` · grass `#80965b` · steel `#6a7478`

**Model.**
- Two towers must have **different murals**. Currently `coolingTowerMural(seed)` is
  called per tower, so this may already differ — verify the seed actually varies.
- Murals are too abstract (four flat rectangles). Add at least one recognisable
  figurative band — a face silhouette or a crowd of figures — read as blocks.
- Remove steam plumes if present.
- Keep the Skyviews bridge; it's the best structural cue.

**Source.** [Orlando Power Station (Wikipedia)](https://en.wikipedia.org/wiki/Orlando_Power_Station#Cooling_towers).

---

### 3.21 Augrabies Falls — `augrabies()`

**Verified.** The Orange River's main fall drops **56 m** into an 18 km granite
gorge; massed vertical-jointed granite, not a thin curtain. Water is silt-grey to
olive-brown, foam brilliant white. Quiver trees: golden-brown scaly bark, blue-green
rosettes.

**Palette.** granite shadow `#796b60` · granite mid `#9a7660` · granite sun `#b88a65` ·
silt water `#7e8a7d` · foam `#dcddd1` · bark `#bda474` · rosette `#65745d` ·
flower `#c5a447`

**Model.**
- **Water colour is the main error** — currently bright turquoise `#3aa6bd`. Change
  to silt olive-grey `#7e8a7d`.
- One dominant irregular fall + 2–4 subordinate chutes. Currently three near-equal
  ribbons.
- Add a darker **wet-rock apron** around each channel.
- Quiver trees: repeatedly forked silhouette, not flat crowns.

**Source.** [SANParks Augrabies](https://www.sanparks.org/parks/augrabies-falls); [SANBI quiver tree](https://pza.sanbi.org/aloidendron-dichotomum).

---

### 3.22 SALT Telescope — `salt()`

**Verified.** 91 hexagonal 1 m segments (~11 m primary) inside a **25 m half-spherical
dome** of aluminium panels with a broad shutter. Tall rectangular building below.
Separate narrow **CCAS alignment tower**. Karoo scrub surroundings.

**Palette.** cladding `#d4d5ce` · dome panel `#aebfc4` · seam `#78868b` ·
structure `#647479` · mirror `#819eaa` · soil `#a88462` · scrub `#73795f`

**Model.**
- **The exterior is not mirror-tiled or geodesic.** Currently six torus rings imply a
  ribbed dome — acceptable as panel seams, but remove any suggestion of exposed mirror.
- Emphasise **box base + half dome + thin CCAS mast** as one silhouette.
- Mirror should only be visible through an open shutter or a deliberate cutaway.
- Add 2–3 much smaller white observatory domes for context.

**Source.** [SAAO SALT](https://www.saao.ac.za/explore/our-telescopes/salt); [SALT telescope](https://www.salt.ac.za/telescope).

---

### 3.23 Bloukrans Bridge — `bloukrans()`

**Verified.** 451 m long, **272 m concrete arch span**, **216 m above the Bloukrans
River**, with vertical spandrel piers and a bungee catwalk at midspan. Forested gorge.

**Palette.** sunlit concrete `#aaada6` · stained concrete `#858d86` · asphalt `#646b66` ·
forest `#596f53` · foliage light `#7d8b5f` · river `#72968c` · mist `#cfd7ce`

**Model.**
- Preserve the **272:216 span-to-height ratio** — the arch must look high, not flat.
- Extend the deck on approach piers beyond the central arch.
- No suspension towers or cables: stays seen in construction photos were temporary.
- Add the tiny under-deck platform at midspan, slightly oversized.

**Source.** [Face Adrenalin bridge history](https://faceadrenalin.com/bloukrans-bridge-history).

---

### 3.24 Pilanesberg Crater — `pilanesberg()`

**Verified.** An ancient **alkaline ring-dyke complex** (~1.3 Ga), concentric broken
hill rings, with **Mankwe Dam** in the central lowland. Red syenite and pale foyaite
outcrops. Not a volcanic crater.

**Palette.** syenite `#a27c61` · pale outcrop `#b89d7b` · hillside olive `#7a8059` ·
canopy `#647354` · dry grass `#b6a06d` · water `#748f8b` · reflection `#9aada2`

**Model.**
- Build **several broken nested arcs**, not one steep crater wall. Currently the lathe
  produces a single ring — this is the key structural fix.
- Central lake should be irregular with visible shoreline shelves.
- Keep animal groups sparse and separated near water.
- Remove any central cone.

**Source.** [NASA Earth Observatory](https://science.nasa.gov/earth/earth-observatory/pilanesberg-ring-dike-complex-86248); [SANParks Pilanesberg].

---

### 3.25 Robben Island — `robben()`

**Verified.** Minto Hill lighthouse: 18 m round masonry tower, **white with a black
vertical stripe on the eastern side; lantern and dome are red**. Maximum Security
Prison: four H-block sections plus a U-shaped isolation block, five watchtowers,
double fencing. Limestone quarry inland **south-west of Murray's Bay Harbour**. Low,
flat, wind-clipped island.

**Palette.** tower white `#d5d4c7` · lantern red `#a35c4c` · daymark black `#606862` ·
prison buff `#aa987a` · limestone `#c3bba3` · scrub `#79836a` · sea `#6c929c`

**Model.**
- **The lantern is red, not dark grey.** Change `dk` on the lantern gallery.
- **Add the black vertical daymark stripe** on the tower; it's the identifying feature.
- **Remove the star-shaped fort.** Robben Island's prison is H/U blocks; the pentagon
  star fort is the Castle of Good Hope on the mainland. This is a factual error.
- Quarry should be a chalky excavation with one stone cairn, south-west of the harbour.
- Keep the island flat; no cliffs.

**Source.** [Lighthouses of South Africa — Robben Island PDF](https://www.lighthousessouthafrica.com/uploads/1/3/7/1/137110215/robben_island_lighthouse.pdf); [Robben Island Museum](https://www.robben-island.org.za/banishment-1960-now).

---

### 3.26 Chapman's Peak Drive — `chapman()`

**Verified.** 9 km, 114 curves, carved into the flank of a **593 m peak** (not the
road's altitude). Narrow asphalt ribbon under enormous warm fractured orange-brown
cliffs, dropping to the Atlantic. Stone parapets and net catch-fences.

**Palette.** sandstone `#b18460` · granite `#918c7c` · rock shadow `#706c61` ·
asphalt `#636a64` · parapet steel `#a1a79e` · fynbos `#798365` · Atlantic `#638d9d`

**Model.**
- Compose **two sweeping parallel ribbons**: cliff road and shoreline.
- Use large angular slabs and overhangs, not a smooth wall.
- Include one half-tunnel/canopy and one dark mesh catch-fence panel.
- Low masonry parapets, not continuous armco.

**Source.** [Chapman's Peak Drive official](https://www.chapmanspeakdrive.co.za/the-drive.html).

---

### 3.27 Isandlwana — `isandlwana()`

**Verified.** The battlefield sits below a distinctive **stepped, asymmetric
flat-topped hill** (the "Sphinx"). White-painted cairns mark **communal burial
trenches**, not individual graves.

**Palette.** cliff base `#8b7d69` · warm rock `#a18868` · deep band `#716c5d` ·
summer grass `#858f64` · dry grass `#b7a36f` · soil `#988366` · cairns `#d7d6c8`

**Model.**
- Hill must be **stepped with a long lower shoulder**, not conical.
- Cairns in **irregular groups of varied size**, not rows.
- Scale up a few cairns so they read at miniature scale.
- Support the dry-grass variant.

**Source.** [Battlefields Route](https://www.battlefieldsroute.co.za/place/isandlwana-battlefield).

---

### 3.28 Gariep Dam — `gariep()`

**Verified.** South Africa's largest reservoir on the **Orange River**; **88 m high,
914 m crest**, double-curvature arch-gravity hybrid. **Six radial spillway gates,
three on each flank**. Weathered grey/tan concrete.

**Palette.** concrete light `#aaa99e` · concrete mid `#8c8d83` · stains `#777c72` ·
gate steel `#7b8584` · reservoir `#668e9d` · hills `#a0805f`

**Model.**
- Long curved crest is correct — preserve it.
- **Gates should be on both flanks**, not a single central row. Currently six gates
  spread over an arc — verify they read as two groups of three.
- Add vertical construction joints and restrained dark staining.
- Remove any suggestion of a second confluence; Gariep is not at the Orange–Vaal
  confluence.

**Source.** [SAnews Gariep](https://www.sanews.gov.za/south-africa/gariep-dam-heritage-pride-free-state).

---

### 3.29 Cradle of Humankind / Maropeng — `maropeng()`

**Verified.** The **Tumulus Building**: a grass-covered organic mound on approach,
with the museum below ground, rust-ochre and pale-grey concrete, dark glazing and
upright concrete "bone" fins.

**Palette.** turf `#858a5b` · dry grass `#aca57c` · ochre concrete `#9b624c` ·
pale concrete `#aaa394` · shaded concrete `#79786e` · glass `#60777d`

**Model.**
- Make the mound **asymmetric**, not a hemisphere.
- Cut one dark entrance.
- Add **upright concrete fins** — they are the recognisable motif.
- Remove any glass dome or geodesic ribs.

**Source.** [Gauteng Tourism Maropeng](https://visit.gauteng.net/visit/maropeng-visitor-centre); [MMA Studio](https://mmastudio.co.za/portfolio-item/maropeng-cradle-of-humankind-world-heritage-site).

---

### 3.30 Mapungubwe Hill — `mapungubwe()`

**Verified.** The hill is approximately **30 m high** (not 150 m), with near-vertical
sandstone cliffs, terraces and a flat summit roughly 300 m long. Buff-gold sandstone
dominates; mopane veld and baobabs surround it.

**Palette.** sandstone `#ba9369` · buff band `#c6ab82` · ochre face `#a87855` ·
crevice `#675b4d` · soil `#9f8866` · mopane `#737d50` · baobab bark `#8c8171`

**Model.**
- **Scale is the biggest error**: the model's 3.5-unit mesa on a 15-unit base implies
  a much taller hill than 30 m. Flatten it and widen the summit.
- Use 2–3 broken terrace levels, not uniform striped sides.
- Mark one narrow ascent cleft.
- **Remove the giant rhinoceros on the summit** — the Golden Rhino is a small
  museum artifact, not a summit sculpture.

**Source.** [SANParks Mapungubwe Hill](https://www.sanparks.org/parks/mapungubwe/explore/heritage/mapungubwe-hill); [UNESCO nomination](https://whc.unesco.org/uploads/nominations/1099.pdf).

---

### 3.31 Kgalagadi Red Dunes — `kgalagadi()`

**Verified.** Long parallel **red and pale dunes** with grassed slopes; red colour
from iron-oxide coatings on quartz. Camel thorn trees, straw grass, gemsbok and
springbok. Slip faces look deeper red because of illumination.

**Palette.** lit sand `#d78655` · dune red `#c96e45` · shaded sand `#9e5039` ·
pale interdune `#c8af89` · straw `#b4a170` · scrub `#858764`

**Model.**
- Form **long parallel dune ribbons**, not repeated sinuous mounds.
- Grass the upper and lower slopes; keep slip faces bare.
- Remove lush green carpet; use straw and grey-green.

**Source.** [SANParks Kgalagadi](https://www.sanparks.org/conservation/transfrontier/kgalagadi/major-features).

---

### 3.32 Storms River Mouth — `storms()`

**Verified.** 77 m suspension bridge (1969, plus two more in 2006) across a narrow
forested gorge. Decking is weathered grey-brown, cables fine, water **dark tannin**.

**Palette.** boards `#99846a` · board light `#b6a58c` · cable `#abb2af` ·
dark steel `#626b6b` · forest `#526f4c` · rock `#a18d72` · tannin water `#4c5147`

**Model.**
- **Water is tannin brown-green, not turquoise.** Currently `MWater('#3394b4')` —
  change to `#4c5147`.
- Near-horizontal deck with subtly sagging main cables and mesh sides.
- Anchor into rock; no monumental towers.
- Reserve white foam only for the seaward edge.

**Source.** [SANParks suspension bridge](https://www.sanparks.org/parks/garden-route/explore/heritage/suspension-bridge).

---

### 3.33 Groot Constantia — `groot()`

**Verified.** Estate from 1685; the manor has long white walls, a tall **curvilinear
central gable**, additional end gables, charcoal/grey-brown thatch, dark-green
shutters and multi-pane sash windows, framed by oaks and contour vineyards.

**Palette.** whitewash `#ddd9cb` · shaded plaster `#c1c1b3` · thatch `#716b60` ·
fresh thatch `#94836a` · shutters `#526452` · vines `#74804e` · soil `#b69b77`

**Model.**
- The **central sculpted gable is the recognition anchor** — make it larger and
  more curvilinear than the wings'.
- **Thatch should be grey-charcoal, not warm brown.** Current `#6f5a33` is too warm.
- Shutters: `#526452` dark green, currently green but too bright.
- Keep the contour vine rows and pond.

**Source.** [Iziko Groot Constantia](https://www.iziko.org.za/museums/groot-constantia/).

---

### 3.34 Hermanus Whale Watching — `hermanus()`

**Verified.** Southern right whales: **stocky black/charcoal bodies, callosities on
the head, no dorsal fin**, broad flippers. Walker Bay, winter/spring.

**Palette.** whale `#3d4547` · wet highlight `#5a6362` · callosity `#c9c6b4` ·
belly `#b8bbb2` · ocean `#507d91` · shallows `#62969d` · foam `#d5e1da`

**Model.**
- Whale currently `#424c58` with a `#38424e` fluke. Darken toward `#3d4547` and add
  **irregular pale callosity patches on the head**.
- Remove any dorsal fin — this is the species tell.
- Breach animation is good; keep it.

**Source.** [NOAA southern right whale](https://www.fisheries.noaa.gov/species/southern-right-whale).

---

### 3.35 iSimangaliso Wetland Park — `isimangaliso()`

**Verified.** Papyrus wetlands, forested dunes and a shallow, variable estuary.
Hippos usually show only backs, ears and eyes; water is grey-brown, not deep teal.

**Palette.** estuary `#748783` · silty `#8b9178` · hippo `#79756d` · wet hide `#5d625d` ·
pink-brown skin `#aa8c82` · papyrus `#879669` · forest `#536f4e`

**Model.**
- Hippos: only backs/ears/eyes above water, not whole bodies on land.
- Papyrus: narrow stems with **starburst/umbrella seed heads**.
- Water should be grey-brown `#748783`, not `#28859b`.
- Dunes should be forest-covered, not bare white.

**Source.** [iSimangaliso Authority](https://www.isimangaliso.com/about/).

---

### 3.36 Sani Pass — `sani()`

**Verified.** 26.9 km pass descending from 2,876 m to 1,544 m with 180° switchbacks,
mixed tar/gravel. Lodge at 2,874 m has **grey corrugated roofing, pale masonry and
one red-timber gable**.

**Palette.** road `#c4ad85` · dry tussock `#a79a69` · olive grass `#85855e` ·
basalt `#6b6b60` · weathered rock `#8f8370` · lodge masonry `#b0a58d` ·
red gable `#99513f` · snow `#d8dad2`

**Model.**
- Lodge roof should be **grey corrugated, with a red gable** — currently `#a8452a`
  red roof. Change roof to `#8c8f88`, add one red gable panel.
- Road must be visibly **pale and narrow**; currently `#8a7456` is too dark.
- Compress to 5–7 exaggerated hairpins.

**Source.** [Mountain Passes South Africa](https://www.mountainpassessouthafrica.co.za/find-a-pass/kwazulu-natal/410-sani-pass.html).

---

### 3.37 Richtersveld — `richtersveld()`

**Verified.** Stark mountain desert with mixed geology, ochre/rust/tan rock, and
quiver trees with **dichotomous candelabra branching** and **terminal succulent
rosettes** — not flat acacia crowns.

**Palette.** ochre rock `#ac7958` · tan `#bc9672` · rust `#925f49` · grey stone `#827c72` ·
ground `#b29c7e` · golden bark `#c0a064` · leaves `#7b8060`

**Model.**
- Quiver crowns: **repeat the fork** and terminate in compact rosettes. Currently a
  flat disc cap — this is the main silhouette error.
- Mix sharp ridges with chaotic boulder piles.
- Reduce green; keep muted olive-grey.

**Source.** [SANParks Richtersveld](https://sanparks.org/conservation/transfrontier/ai-ais-richtersveld/overview).

---

### 3.38 Vredefort Dome — `vredefort()`

**Verified.** The visible ~90 km dome is the eroded **central uplift** of a
180–300 km impact structure. Surviving **concentric ridges** from differential
erosion. Rolling grassland, farms, the Vaal River — not a fresh bowl crater.

**Palette.** grass `#848a57` · dry pasture `#aca277` · granite `#857f72` ·
quartzite ridge `#aaa18d` · wooded ridge `#586b4d` · Vaal `#657f82`

**Model.**
- Central uplift **plus 2–3 broken concentric ridges**; a soft dome alone is
  insufficient.
- Arc the Vaal through a ridge gap.
- **Remove the falling meteorite and impact-fireball animation** — it's a 2-billion-
  year-old eroded structure, not an active impact.

**Source.** [IUGS Vredefort Dome](https://iugs-geoheritage.org/geoheritage_sites/vredefort-dome/); [NASA Earth Observatory](https://science.nasa.gov/earth/earth-observatory/vredefort-crater-92689/).

---

### 3.39 Hartbeespoort Dam — `harties()`

**Verified.** **Varying-radius concrete arch dam** with **ten radial crest sluices**
and a distinctive **Victory Arch**. Reservoir water olive, often covered in
**water-hyacinth mats**. Modern cableway cars are smoked glass with green edging.

**Palette.** concrete `#aaa291` · stains `#817d6e` · recess `#666b66` ·
water `#778878` · hyacinth `#82934f` · pylon `#c3c5bb` · cabin green `#4f8c7d`

**Model.**
- Add the **Victory Arch** — it is a stronger identifier than the wall curvature.
- Model hyacinth as **separate irregular floating patches**, not water colour.
- Cable car: current red/blue gondolas are outdated; use smoked glass + green edge.
- Remove the rainbow gondola scheme.

**Source.** [Harties Cableway](https://hartiescableway.co.za/news/entry/the-harties-cableway-of-1973-a-photo-story-that-captures-the-past); [ICID dam record](https://icid-ciid.org/award/his_details/236).

---

### 3.40 Knysna Heads — `knysna()`

**Verified.** Two **unequal, non-mirrored** sandstone headlands at the estuary mouth,
with sea caves at the **eastern** base, dense indigenous forest on top, a white
beacon, and mostly **neutral white/grey** houses — not brightly coloured cottages.

**Palette.** cliff ochre `#b58d66` · pale rock `#ccac82` · rock shadow `#877561` ·
scrub `#637850` · forest `#4f6748` · lagoon `#568592` · turquoise `#70a1a3`

**Model.**
- Make the two headlands clearly **different heights and shapes**.
- Carve caves at the eastern base only.
- Houses should be `#e8e4da` / `#c9c6bd`, not the current multicolour set.
- Channel water darker than lagoon.

**Source.** [SANParks Garden Route](https://sanparks.org/parks/garden-route/explore/natural-cultural-history).

---

### 3.41 Donkin Reserve — `donkin()`

**Verified.** **1820 stone pyramid**, ~10 m high on an 8 m square stepped plinth;
adjacent **1861 lighthouse** (white, tapered, gallery + red lantern); South Africa's
largest flag; Victorian terrace cottages below.

**Palette.** pyramid stone `#8d806e` · lighter masonry `#a99b86` · lighthouse `#dbd7cb` ·
lantern red `#88483f` · lawn `#818455` · cottage rust `#a06f62` · flag green `#3d7257`

**Model.**
- Pyramid proportions are close — keep the stepped plinth.
- Lighthouse lantern should be **red**, currently `dk` dark grey.
- Enlarge the flag; it's advertised as the country's largest.
- Cottages: muted Victorian, not saturated.

**Source.** [Nelson Mandela Bay Tourism](https://nmbt.co.za/listing/donkin-reserve-pyramid-and-lighthouse.html).

---

### 3.42 Cape Agulhas Lighthouse — `agulhas()`

**Verified.** 27 m round **sandstone** tower, **painted red with a single white band**,
**white lantern**, attached to a one-storey keeper's house (now museum/restaurant).
Design inspired by the Pharos of Alexandria. First lit 1 March 1849; decommissioned
1968–1988; recommissioned 1988. Provincial heritage site.

**Palette.** tower red `#b23a2c` · white band `#e9e5d9` · lantern white `#f2efe6` ·
stone base `#b5a98e` · sea `#1f6285` · strandveld `#7c8460` · roof slate `#b8352d`

**Model.**
- **This one is already correct** — red tower, single white band, white lantern.
  Preserve it.
- The keeper's house should be **attached to the tower base**, not offset at
  `x = -2.4`; the attached mass is part of the silhouette.
- Red is slightly too orange; `#b23a2c` is a truer weathered oxide red.
- Sea should be deeper/cooler.

**Source.** [Cape Agulhas Lighthouse (Wikipedia)](https://en.wikipedia.org/wiki/Cape_Agulhas_Lighthouse); [SAHRA heritage record](http://196.35.231.29/sahra/HeritageSitesDetail.aspx?id=13046).

---

### 3.43 Bourke's Luck Potholes — `bourke()`

**Verified.** At the confluence of the **Treur and Blyde rivers**, sustained **kolks**
(vortices) in plunge pools have eroded **cylindrical potholes / giant's kettles**.
Viewed from crags above via **pedestrian bridges** connecting overlooks. Marks the
beginning of the Blyde River Canyon. Rock is pale buff/cream dolomite and quartzite
with darker bands.

**Palette.** rock pale `#cfc0a2` · rock buff `#b7a482` · rock dark band `#7d6f57` ·
pothole shadow `#4a4438` · water tea `#5c5a45` · foam `#dcdcd0` · timber `#7a583a`

**Model.**
- The disc-with-holes concept is right; make the holes **deep smooth cylinders** with
  visible inner walls and a swirling rim bevel.
- **Water should be tea-brown `#5c5a45`**, not turquoise `#288ca8`. This is the
  biggest colour error here.
- Rock should be **pale buff/cream**, not the current brown gradient `#867154`→
  `#e2d2ae`.
- Add 2–3 small **pedestrian bridges and viewpoints** — they are a defining part of
  the site experience and give scale.

**Source.** [Blyde River Canyon Nature Reserve (Wikipedia)](https://en.wikipedia.org/wiki/Blyde_River_Canyon_Nature_Reserve#Bourke's_Luck_Potholes).

---

## 4. Priority matrix

Ordered by visual impact per unit of effort.

| # | Landmark | Fix | Severity |
| --- | --- | --- | --- |
| 1 | Robben Island | Remove star fort; red lantern; black daymark stripe | **Factual error** |
| 2 | Mapungubwe | Remove summit rhino; flatten to ~30 m | **Factual error** |
| 3 | Vredefort | Remove meteor/fireball; add concentric ridges | **Factual error** |
| 4 | Drakensberg | Brown → grey-green basalt | **Colour error** |
| 5 | Storms River | Turquoise → tannin water | **Colour error** |
| 6 | Bourke's Luck | Turquoise → tea water; brown → pale buff rock | **Colour error** |
| 7 | Augrabies | Turquoise → silt-grey water | **Colour error** |
| 8 | Richtersveld | Flat crown → candelabra branching | **Silhouette** |
| 9 | Kruger | Uniform grey → varied dust-coated elephants | **Colour** |
| 10 | Pilanesberg | Single ring → nested broken arcs | **Structure** |
| 11 | Gariep | Gates on both flanks | **Structure** |
| 12 | Cape Agulhas | Attach keeper's house to tower | **Structure** |
| 13 | Sani Pass | Red roof → grey corrugated + red gable | **Colour** |
| 14 | Boulders | Orange feet → black; add pink eye patch | **Detail** |
| 15 | Groot Constantia | Warm brown thatch → grey-charcoal | **Colour** |
| 16 | Ponte City | Freeze sign colour; remove spire | **Detail** |
| 17 | Bo-Kaap | Desaturate two hottest hues ~8 % | **Tuning** |
| 18 | Castle | Stone/brick outer walls; ochre only on De Kat interior | **Factual error** |
| 19 | Union Buildings | Teal copper domes → pale stone; brick → sandstone | **Colour error** |
| 20 | Table Mountain | Two graphite cabins, not 5 coloured gondolas | **Factual** |
| 21 | Moses Mabhida | Red/blue tiers → blue-green→ivory fade | **Colour** |
| 22 | Voortrekker | Corner towers → corner statues; step the mass | **Structure** |
| 23 | Cape Point | Old = cast iron; new = square masonry | **Structure** |
| 24 | Big Hole | Add grey lower rock faces; teal/shadow water split | **Colour** |
| 25 | Soccer City | Terracotta clay → pigmented GFRC with cream/grey panels | **Colour error** |
| 26 | Bo-Kaap | Auwal dome → square green minaret; straight parapets | **Factual error** |
| 27 | Three Rondavels | Flat caps → rounded/pointed; shared forested ridge | **Silhouette** |
| 28 | Baobab | Copper gloss → matte grey bark; 5–8 huge branches | **Colour** |
| 29 | Hole in the Wall | Cylindrical stack → long cliff wall, hole low | **Silhouette** |

---

## 5. Source & licence appendix

All reference imagery used is freely licensed. Verify before publication.

| Landmark | Reference | Licence | Creator |
| --- | --- | --- | --- |
| Augrabies | [Falls, March 2008](https://commons.wikimedia.org/wiki/File:Augrabies_Falls,_March_2008.jpg) | PD | Zaian |
| Augrabies | [Falls from left bank](https://commons.wikimedia.org/wiki/File:Augrabies_Falls_National_Park_Augrabies_Falls_seen_from_the_left_bank_02.jpg) | CC BY-SA 4.0 | Ymblanter |
| SALT | [SALT Observatory](https://commons.wikimedia.org/wiki/File:SALT_Observatory.jpg) | CC BY-SA 4.0 | Frank Fouché |
| Bloukrans | [Bridge over Bloukrans](https://commons.wikimedia.org/wiki/File:Bloukrans_Bridge_over_the_Bloukrans_River.jpg) | CC BY-SA 2.0 | Maurits Vermeulen |
| Pilanesberg | [Ring complex, ESA](https://commons.wikimedia.org/wiki/File:Pilanesberg,_South_Africa_ESA380982.jpg) | CC BY-SA 3.0 IGO | ESA |
| Robben Island | [Lighthouse](https://commons.wikimedia.org/wiki/File:Robben_Island-003.jpg) | CC BY-SA 2.0 | Harvey Barrison |
| Chapman's Peak | [Road and half-tunnel](https://commons.wikimedia.org/wiki/File:Chapman%27s_Peak_Drive,_Sud%C3%A1frica,_2018-07-23,_DD_134.jpg) | CC BY-SA 4.0 | Diego Delso |
| Isandlwana | [Hill and battlefield](https://commons.wikimedia.org/wiki/File:View_of_Isandlwana_Hill_and_Battlefield.jpg) | CC BY-SA 4.0 | Michael Gundelfinger |
| Gariep | [Wall and crest road](https://commons.wikimedia.org/wiki/File:Gariep_Dam_Wall,_Free_State,_South_Africa_(20544151311).jpg) | CC BY 2.0 | South African Tourism |
| Maropeng | [Rear elevation](https://commons.wikimedia.org/wiki/File:South_Africa-Gauteng-Maropeng01.jpg) | CC BY-SA 3.0 | NJR ZA |
| Mapungubwe | [Hill from north](https://commons.wikimedia.org/wiki/File:Mapungubwe_hill_limpopo.jpg) | CC BY-SA 3.0 | Marius Loots |
| Kgalagadi | [Red dunes](https://commons.wikimedia.org/wiki/File:Dunes_rouges_du_Kgalagadi_kalahari.JPG) | CC BY-SA 3.0 | Bougnat87 |
| Storms River | [Gorge estuary](https://commons.wikimedia.org/wiki/File:Storms_River_Gorge_estuary_suspension_bridge.jpg) | CC BY 2.0 | Brian Snelson |
| Groot Constantia | [Gable elevation](https://commons.wikimedia.org/wiki/File:Groot_Constantia_gevel.JPG) | CC BY-SA 2.5 | Vincent Steenberg |
| Hermanus | [Breaching whale](https://commons.wikimedia.org/wiki/File:HER_-_Breaching_southern_right_whale_near_Hermanus,_South_Africa,_2017.jpg) | CC BY-SA 4.0 | Josep M. Gracia |
| iSimangaliso | [Hippos and estuary](https://commons.wikimedia.org/wiki/File:Hippopotamus_and_Hippo_tour_boat,_iSimangaliso_Wetland_Park.jpg) | CC BY-SA 4.0 | Ossewa |
| Sani Pass | [Summit switchbacks](https://commons.wikimedia.org/wiki/File:Sani_Pass_Lesotho.jpg) | CC BY-SA 3.0 | Martin Schärli |
| Richtersveld | [Quiver tree forest](https://commons.wikimedia.org/wiki/File:Quiver_tree_forest.jpg) | CC BY-SA 3.0 | Hein waschefort |
| Vredefort | [Landsat overview](https://commons.wikimedia.org/wiki/File:Vredefort_Crater,_South_Africa,_OLI_satellite_image,_27_June_2018_cropped.png) | PD | NASA/USGS |
| Hartbeespoort | [Wall and hyacinth](https://commons.wikimedia.org/wiki/File:Dam_Wall_of_Hartbeespoort_Dam,_South_Africa_(2019).jpg) | CC BY-SA 4.0 | Olga Ernst |
| Knysna | [East and West Head](https://commons.wikimedia.org/wiki/File:Knysna_%28ZA%29,_Knysna_River,_East_and_West_Head_--_2024_--_2456.jpg) | CC BY-SA 4.0 | Dietmar Rabich |
| Donkin | [Pyramid and lighthouse](https://commons.wikimedia.org/wiki/File:Donkin_Reserve_Pyramid_and_Lighthouse.jpg) | CC BY-SA 3.0 | Portiatn |
| Amphitheatre | [Amphitheatre wall](https://commons.wikimedia.org/wiki/File:Amphitheatre_Drakensberg.jpg) | PD | Rudolph Botha |
| Tugela | [Falls in flow](https://commons.wikimedia.org/wiki/File:Tugela_falls.jpg) | CC BY-SA 4.0 | Juniper339 |
| Palace | [Palace exterior](https://commons.wikimedia.org/wiki/File:The_Palace_of_the_Lost_City,_Sun_City,_North_West,_South_Africa_(20503766606).jpg) | CC BY 2.0 | South African Tourism |
| Golden Gate | [Brandwag](https://commons.wikimedia.org/wiki/File:Brandwag_-_panoramio.jpg) | CC BY-SA 3.0 | Graham Maclachlan |
| Kruger | [Elephants at waterhole](https://commons.wikimedia.org/wiki/File:Elephants_(Loxodonta_africana)_at_waterhole_(12011746915).jpg) | CC BY-SA 2.0 | Bernard DUPONT |
| Ponte | [Exterior](https://commons.wikimedia.org/wiki/File:Ponte_City_(3464450399).jpg) | CC BY-SA 2.0 | Geoffrey Hancock |
| Boulders | [Penguins and granite](https://commons.wikimedia.org/wiki/File:Boulders_Beach_Suedafrika.jpg) | CC BY-SA 4.0 | Olga Ernst |
| Orlando | [Vivid towers](https://commons.wikimedia.org/wiki/File:Orlando_Power_Station_HDR.jpg) | CC BY-SA 4.0 | Prosthetic Head |
| Table Mountain | [2024 panorama](https://commons.wikimedia.org/wiki/File:Cape_Town_(ZA),_Table_Mountain_--_2024_--_2794%2B96%2B98%2B2800%2B01.jpg) | CC BY-SA 4.0 | Dietmar Rabich |
| Table Mountain | [2024 cable car](https://commons.wikimedia.org/wiki/File:Cape_Town_(ZA),_Table_Mountain,_Seilbahn_--_2024_--_2846.jpg) | CC BY-SA 4.0 | Dietmar Rabich |
| Union Buildings | [Façade and gardens](https://commons.wikimedia.org/wiki/File:Uniegebou.jpg) | CC BY-SA 3.0 | Davinci77 |
| Union Buildings | [East tower detail](https://commons.wikimedia.org/wiki/File:Union_Buildings_-_East_tower.jpg) | CC BY-SA 4.0 | Bernard Gagnon |
| Moses Mabhida | [Exterior](https://commons.wikimedia.org/wiki/File:Moses_Mabhida_Stadium,_Durban,_KwaZulu_Natal,_South_Africa_(20513002075).jpg) | CC BY 2.0 | South African Tourism |
| Moses Mabhida | [Bowl and seating](https://commons.wikimedia.org/wiki/File:Moses_Mabhida_Stadium,_Durban,_KwaZulu_Natal,_South_Africa_(20519302751).jpg) | CC BY 2.0 | South African Tourism |
| Mandela Bridge | [Daylight bridge](https://commons.wikimedia.org/wiki/File:South_Africa-Johannesburg-Nelson_Mandela_Bridge001.jpg) | Public domain | NJR ZA |
| Mandela Bridge | [Bridge and city](https://commons.wikimedia.org/wiki/File:Mandela_Bridge,_Johannesburg,_Gauteng,_South_Africa.jpg) | CC BY 2.0 | South African Tourism |
| Big Hole | [Pit and water](https://commons.wikimedia.org/wiki/File:Open_pit_mine.jpg) | CC BY 2.0 | Irene2005 |
| Big Hole | [Historic headgear](https://commons.wikimedia.org/wiki/File:Headgear_at_Kimberley.jpg) | CC BY-SA 3.0 | Hein Waschefort |
| Voortrekker | [Northeast exterior](https://commons.wikimedia.org/wiki/File:Pretoria_Voortrekker_Monument_seen_from_the_northeast.jpg) | CC BY-SA 4.0 | Ymblanter |
| Voortrekker | [Wagon laager](https://commons.wikimedia.org/wiki/File:Voortrekker_Monument_Laager.JPG) | Public domain | Tim Giddings |
| Cape Point | [Old lighthouse](https://commons.wikimedia.org/wiki/File:Antiguo_faro,_Cape_Point,_Sud%C3%A1frica,_2018-07-23,_DD_100.jpg) | CC BY-SA 4.0 | Diego Delso |
| Cape Point | [New lighthouse on Dias Point](https://commons.wikimedia.org/wiki/File:Cape_Point_Lighthouse_1860-1919._11_New_Lighthouse_on_Dias_Point..JPG) | CC BY-SA 4.0 | A3alb |
| Bo-Kaap | [Wale Street](https://commons.wikimedia.org/wiki/File:Cape_Town_%28ZA%29,_Wale_Street_--_2024_--_3544.jpg) | CC BY-SA 4.0 | Dietmar Rabich |
| Bo-Kaap | [Auwal Mosque](https://commons.wikimedia.org/wiki/File:Auwal_Mosque_in_Bo-Kaap.jpg) | CC BY-SA 4.0 | LiebeB |
| Soccer City | [Stadium from parkland](https://commons.wikimedia.org/wiki/File:Johannesburg-_Part_II_-_Johannesburg4245.jpg) | CC0 | lumoplank |
| Soccer City | [Soccer City 2010](https://commons.wikimedia.org/wiki/File:Soccer_City_2010_jun_10_4.jpg) | CC BY 3.0 BR | Marcello Casal Jr. / Agência Brasil |
| Three Rondavels | [Three Rondavels](https://commons.wikimedia.org/wiki/File:ThreeRondavels.jpg) | CC BY-SA 4.0 | EGilham |
| Three Rondavels | [Blyde River Canyon](https://commons.wikimedia.org/wiki/File:Blyde_River_Canyon,_Mpumalanga,_South_Africa_%2819894758393%29.jpg) | CC BY 2.0 | South African Tourism |
| Baobab | [Sagole Baobab](https://commons.wikimedia.org/wiki/File:Sagole_Baobab.jpg) | CC BY-SA 3.0 | Scott Davies |
| Baobab | [Sunland trunk and crown](https://commons.wikimedia.org/wiki/File:Adansonia_digitata_50D_0753.jpg) | CC BY-SA 4.0 | SAplants |
| Hole in the Wall | [Hole In The Wall](https://commons.wikimedia.org/wiki/File:Hole_In_The_Wall.jpg) | CC0 | Vincentvanoosten |
| Hole in the Wall | [Hole with swimmers](https://commons.wikimedia.org/wiki/File:Kristenmarie82.Gat-in-die-muur,_Koffiebaai.2.jpg) | CC BY 2.0 | kristenmarie82 |
| Castle | [Gate and bell tower](https://commons.wikimedia.org/wiki/File:Castle_of_Good_Hope,_Cape_Town_01.jpg) | CC BY-SA 4.0 | Bernard Gagnon |
| Castle | [De Kat courtyard](https://commons.wikimedia.org/wiki/File:Castle_of_Good_Hope,_Cape_Town_02.jpg) | CC BY-SA 4.0 | Bernard Gagnon |
