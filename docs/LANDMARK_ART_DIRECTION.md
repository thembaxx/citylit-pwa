# Landmark art direction — visual-form references

Text-only reference for the 43 procedural landmark dioramas. Every entry below is drawn from the full Wikipedia plain-text extract for the article named in `src/data/landmarks.ts` (plus one supplementary article on Cape Dutch architecture), fetched on 20 November 2026. Builder names are taken from `RAW_BUILDERS` in `src/three/builders/landmarksB.ts`; all builders are wrapped by `applyDioramaUpgrade()` in `src/three/builders/dioramaKit.ts`.

## Top 10 highest-impact changes

Ordered by how much a miniature-scale viewer gains from the change. Exact targets given.

1. **`src/three/builders/landmarksA.ts → stadium()` (Moses Mabhida)** — the split Y-arch is already modelled; keep it, but hang the translucent roof from it with visible steel stays and lower the bowl rim so the arch reads as the dominant silhouette. Source: 350 m span, 105 m rise, 106 m above pitch, 95 mm cables, 46,000 m² PTFE/glass-fibre roof.
2. **`src/three/builders/landmarksA.ts → table()` (Table Mountain)** — enforce one genuinely level plateau cap (not stepped blocks), cut a single deep notch for Platteklip Gorge on the cliff face, and keep the "tablecloth" cloud spilling over only one windward edge.
3. **`src/three/builders/landmarksA.ts → ponte()` (Ponte City)** — make the cylinder unmistakably hollow at the top (dark open core), keep 55 stacked balcony bands, and reinstate the rooftop neon sign frame; a solid-topped cylinder loses the whole point of the building.
4. **`src/three/builders/landmarksA.ts → soccer()` (FNB Stadium)** — give the bowl a calabash/gourd profile (swollen base, narrowing shoulder, flared rim), earthy fire-coloured mosaic cladding and a continuous ring of lights at the base simulating fire under the pot.
5. **`src/three/builders/landmarksA.ts → castle()` (Castle of Good Hope)** — preserve the five-point star plan and five bastions; keep walls low and thick with chamfered bastion faces, and make the bell tower over the main entrance legible.
6. **`src/three/builders/landmarksA.ts → agulhas()` (Cape Agulhas Lighthouse)** — simplest high-impact palette fix: round tower painted red with a single white band, lantern gallery, and a low attached keeper's house.
7. **`src/three/builders/landmarksA.ts → bokaap()` (Bo-Kaap)** — step the houses up a hillside rather than a flat strip, keep the saturated pink/red/blue/green/purple facade mix, and add cobble lanes plus the `voorstoep` bench terrace.
8. **`src/three/builders/landmarksA.ts → hole()` (The Big Hole)** — read as a void, not a mound: broad circular rim, steep benched walls descending to a dark water pool roughly a quarter of the way up.
9. **`src/three/builders/landmarksB.ts → salt()` (SALT Telescope)** — show the 91-piece hexagonal mirror glinting through an open shutter and add the adjacent tall, narrow alignment tower; both are unique to this telescope.
10. **`src/three/builders/landmarksB.ts → donkin()` (Donkin Reserve)** — the paired four-sided stone pyramid and small galleryed lighthouse is the town's actual symbol; keep them close together and balance their heights.

---

## Table Mountain

Source: <https://en.wikipedia.org/wiki/Table_Mountain> · builder `table()` (`landmarksA.ts`).

**Defining silhouette** A single level plateau, roughly 3 km side to side, on steep cliffs, with lower flanking peaks on either side. At miniature scale it must read as a flat table top, not a normal pointed mountain.

**Signature features to model**
- Level plateau with steep, near-vertical cliff edges all round.
- Devil's Peak to the east, Lion's Head to the west, Signal Hill further out.
- Platteklip Gorge cutting a notch through the main cliff face.
- Maclear's Beacon: a small stone cairn at the eastern (highest) end.
- Orographic "tablecloth" cloud pouring over one edge.

**Materials & palette** Sandstone range; grey-brown rock faces, green fynbos cover, white cloud.

**Scale cues** Plateau ~3 km across; highest point 1,086 m, about 19 m above the western cable station.

**Builder note** `table()` already builds a flat cap, flanks and cloud puffs. Tighten the cap to one level plane, add the gorge notch on one face, and place a tiny cairn at the east end.

## Union Buildings

Source: <https://en.wikipedia.org/wiki/Union_Buildings> · builder `union()` (`landmarksA.ts`).

**Defining silhouette** Two long equal wings joined by a wide semi-circular colonnade, with a dome on each wing. Symmetry and the curved central colonnade are the identifiers.

**Signature features to model**
- Semi-circular colonnade in the middle, backed by a curved central block.
- Two identical side wings, each ending in a twin-domed tower.
- Statues on the domes (Atlas holding up the world) and on the central rostrum (Mercury).
- Upper level Cape Dutch shuttered windows;Edwardian lower levels.
- Set on a hilltop above formal gardens.

**Materials & palette** Light sandstone outside; white plaster walls, dark teak fanlights and ceiling beams, heavy dark wood inside.

**Scale cues** Overall length 285 m; wings 95 m each.

**Builder note** `union()`: keep the two wings balanced, deepen the central curve so the colonnade reads from above, and add two small domes with figures rather than one central dome.

## Moses Mabhida Stadium

Source: <https://en.wikipedia.org/wiki/Moses_Mabhida_Stadium> · builder `stadium()` (`landmarksA.ts`).

**Defining silhouette** A huge free-spanning steel arch over a low circular bowl, with a translucent roof hung from the arch. The app's split Y-end is a deliberate convention already present in code.

**Signature features to model**
- Free arch 350 m long, rising 105 m; top 106 m above the pitch; 5 × 5 m steel hollow box section.
- Split into two legs at one end (app convention; Wikipedia describes a single free span and a funicular from the north side).
- Roof of Teflon-coated glass-fibre membrane, hung from the arch by 95 mm steel cables.
- Bowl formed from pre-cast concrete seating panels, ringed by over 100 columns and aluminium fins.
- Funicular / viewing platform at the arch top.

**Materials & palette** Pale steel arch, translucent white-grey membrane, white concrete seating, green pitch.

**Scale cues** Stadium 320 × 280 × 45 m; arch 350 m span, ~106 m high; 55,500 seats.

**Builder note** `stadium()` already has the Y-arch ribs and ladder bracing. Add the cable stays down to the roof rim, keep the roof low and translucent, and make sure one leg visibly forks at the north end.

## Nelson Mandela Bridge

Source: <https://en.wikipedia.org/wiki/Nelson_Mandela_Bridge> · builder `bridge()` (`landmarksA.ts`).

**Defining silhouette** A long, light steel deck carried on two very unequal pylons, high above a rail yard.

**Signature features to model**
- Two pylons, north 42 m and south 27 m high — deliberately different heights.
- Fan of stays from pylons to a slim deck with two lanes and side walkways.
- Structural steel with a concrete composite deck; heavier back spans at the banks.
- Crosses 42 railway lines, so it needs high clearance over a flat yard.
- Lit in rainbow colours at night (Optional toggle).

**Materials & palette** Structural steel, pale concrete deck; rainbow night lighting.

**Scale cues** 284 m long; pylons 42 m and 27 m; 4,000 m³ concrete, 1,000 t steel.

**Builder note** `bridge()`: make the two pylons visibly unequal and keep the deck thin; add a few rail lines beneath rather than solid ground so the span height registers.

## The Big Hole

Source: <https://en.wikipedia.org/wiki/Big_Hole> · builder `hole()` (`landmarksA.ts`).

**Defining silhouette** A very wide, steep-sided circular void in flat ground, with a dark pool at the bottom. It is a pit, never a mound.

**Signature features to model**
- Circular rim ~463 m wide, perimeter ~1.6 km, on flat ground.
- Benched/terraced walls descending steeply to a water-filled floor.
- About 40 m of water has accumulated; roughly 175 m of hole remains visible.
- Kimberlite rock — the diamond-bearing pipe that gave Kimberley its name.

**Materials & palette** Exposed yellow-brown kimberlite and rubble; dark still water at the base.

**Scale cues** 463 m across, 17 ha; excavated to 240 m, partly infilled to ~215 m, ~175 m visible.

**Builder note** `hole()`: if the current mesh reads as a cone, invert it. Concentrate detail on concentric benches inside the rim and a small dark water disc well below ground level.

## Voortrekker Monument

Source: <https://en.wikipedia.org/wiki/Voortrekker_Monument> · builder `voortrekker()` (`landmarksA.ts`).

**Defining silhouette** A massive square granite block with a domed roof, standing on a hill inside a ring of wagon-shaped stones.

**Signature features to model**
- Solid square mass, 40 × 40 m base, rising to a dome and an oculus at the top.
- Laager of 64 ox-wagons carved from decorative granite around the base.
- Four large arched windows in the domed Hall of Heroes; yellow Belgian glass.
- Central circular opening looking down to the cenotaph.
- Black wrought-iron entrance gate with an assegai (spear) motif.

**Materials & palette** Grey granite throughout; yellow glass in the arches; black iron gate.

**Scale cues** 62 m high on a 40 × 40 m base.

**Builder note** `voortrekker()`: keep the mass square and tall, cap it with a shallow dome, and make the wagon laager a clear ring of small wedge shapes at ground level.

## Cape Point Lighthouse

Source: <https://en.wikipedia.org/wiki/Cape_Point> · builder `capePoint()` (`landmarksA.ts`).

**Defining silhouette** A rugged two-peaked sandstone ridge, with a small lighthouse on the higher peak. The lower, newer light sits on a second shoulder.

**Signature features to model**
- Two peaks on a sandstone ridge rising straight from sea level, the smaller one ~100 m further south.
- Old lighthouse on the 262 m peak; the working light is much lower, at 87 m.
- Funicular line climbing from a car park to just below the old lighthouse.
- Short flight of steps and a viewing platform around the old light.
- Peninsula Sandstone Fynbos scrub, no trees.

**Materials & palette** Table Mountain sandstone (ochre-grey), dark green fynbos, white lighthouse towers, blue sea.

**Scale cues** Old light 262 m above sea; new light 87 m; peaks ~100 m apart.

**Builder note** `capePoint()`: give the ridge two distinct humps and put the visible light on the lower one; a thin funicular line up the cliff is a cheap, high-reading detail.

## Bo-Kaap

Source: <https://en.wikipedia.org/wiki/Bo-Kaap> · builder `bokaap()` (`landmarksA.ts`).

**Defining silhouette** A dense hillside of small, bright, flat-fronted houses stepping up a slope above the city.

**Signature features to model**
- Brightly painted facades in pink, red, blue, green and purple.
- Cape Dutch and Cape Georgian house forms built 1790–1825; some with central gables.
- Cobblestoned streets climbing the slope of Signal Hill.
- `Voorstoep`: a front terrace with a bench at each end.
- Nurul Islam Mosque (1844) in the quarter; Tana Baru cemetery nearby.

**Materials & palette** Vibrant plaster facades, dark roofs, grey cobble; green detailing on shutters is common in Cape Dutch work.

**Scale cues** Largest concentration of pre-1850 architecture in South Africa; roughly 600 protected homes.

**Builder note** `bokaap()`: the palette is already well chosen. Add a stronger stepped hillside and the `voorstoep` benches; keep the mosque as a distinct landmark within the cluster.

## FNB Stadium (Soccer City)

Source: <https://en.wikipedia.org/wiki/FNB_Stadium> · builder `soccer()` (`landmarksA.ts`).

**Defining silhouette** A vast rounded bowl shaped like an African pot or calabash, with an encircling roof and a ring of fire-like lights at its foot.

**Signature features to model**
- Pot/gourd profile: swollen body, shouldered rim, encircling roof.
- Mosaic cladding in fire and earthen colours.
- Continuous ring of lights around the base, simulating fire beneath the pot.
- Extended upper tier added for the 2010 World Cup; floodlights.
- No seat more than 100 m from the field — very steep, close seating.

**Materials & palette** Earthy mosaic — ochre, terracotta, burnt orange; white/grey roof ring.

**Scale cues** Africa's largest stadium, 94,736 capacity; opened 1989, rebuilt for 2010.

**Builder note** `soccer()`: exaggerate the gourd waist and flare at the rim, keep the cladding mosaic warm, and add the base light ring — it is the clearest visual metaphor in the whole set.

## Three Rondavels

Source: <https://en.wikipedia.org/wiki/Blyde_River_Canyon> and <https://en.wikipedia.org/wiki/Blyde_River_Canyon_Nature_Reserve> · builder `rondavels()` (`landmarksA.ts`).

**Defining silhouette** Three rounded, grass-covered rock tops with somewhat pointed peaks, standing side by side above a deep green canyon.

**Signature features to model**
- Three near-identical cylindrical/rounded summits with pointed grassy caps.
- Flat-topped Mapjaneng ("the chief") immediately beside them.
- Sheer cliffs falling over 700 m to the Lowveld.
- Resistant quartzite and shale over softer eroded rock.
- Subtropical "green canyon" vegetation, unlike the Grand Canyon.

**Materials & palette** Grey-tan quartzite and shale; green grass and subtropical scrub on the caps.

**Scale cues** Canyon 26 km long; cliffs over 700 m; Kadishi tufa waterfall nearby is 200 m.

**Builder note** `rondavels()`: keep the three caps rounded and roughly equal, add the flat neighbour, and drop the surrounding terrain sharply so they read as canyon-edge sentinels.

## Baobab

Source: <https://en.wikipedia.org/wiki/Adansonia_digitata> · builder `baobab()` (`landmarksA.ts`).

**Defining silhouette** An enormous fluted, bottle-shaped trunk topped by a sparse, root-like crown — the "upside-down tree".

**Signature features to model**
- Very broad, fluted or cylindrical trunk with a buttressed, spreading base.
- Trunk often formed from three to eight fused stems around a hollow core.
- Deciduous: leafless for about eight months of the year.
- Large white hanging flowers on long stalks; rounded buds.
- Solitary specimen dominating open savanna.

**Materials & palette** Broad pale-grey trunk (no bark colour given in source — keep current tone); white flowers; dry savanna grass.

**Scale cues** 5–25 m tall; trunk diameter 10–14 m; one dated individual 1,275 years old.

**Builder note** `baobab()`: prioritise trunk girth over crown size, add vertical fluting, and keep foliage sparse or absent so the reverse-root silhouette shows.

## Hole in the Wall

Source: <https://en.wikipedia.org/wiki/Hole-in-the-Wall_(Eastern_Cape)> · builder `holewall()` (`landmarksA.ts`).

**Defining silhouette** A single clean arch punched through a low rock island at the sea's edge — a hole in a wall, not a free-standing arch.

**Signature features to model**
- Tidal island with a natural arch, at the mouth of the Mpako River.
- Opening cut through layered sandstone and shale by wave action.
- Large enough for a sailboat to pass beneath.
- Joined to the land at low tide; shell/sand beach below.
- No buildings on the island itself.

**Materials & palette** Layered sandstone and shale in warm grey-brown; blue-green sea, sand at low tide.

**Scale cues** Arch clear enough for a sailboat; ~8 km south of Coffee Bay.

**Builder note** `holewall()`: keep the rock mass wall-like and low, with a single wide through-hole near water level; avoid a tall symmetrical bridge arch.

## Castle of Good Hope

Source: <https://en.wikipedia.org/wiki/Castle_of_Good_Hope> · builder `castle()` (`landmarksA.ts`).

**Defining silhouette** A low, star-shaped fort with five pointed bastions and a small bell tower over the main gate.

**Signature features to model**
- Pentagon plan with five bastions: Leerdam, Buuren, Katzenellenbogen, Nassau, Oranje.
- Built by the Dutch East India Company, 1666–1679, as a stone fortress.
- Bell tower over the main entrance, built 1684; bell cast in Amsterdam in 1697.
- Originally on the Table Bay shoreline; now inland after land reclamation.
- Thick, low curtain walls between the bastions.

**Materials & palette** Stone, now read as warm limewashed brick; grey slate/tiled caps; no colour specified in the source.

**Scale cues** Oldest surviving building in South Africa; five bastions; bell just over 300 kg.

**Builder note** `castle()` already has the pentagon, bastions and bell tower. Keep walls low relative to the bastions and make the star plan obvious from the raised camera angle.

## Drakensberg Amphitheatre

Source: <https://en.wikipedia.org/wiki/Amphitheatre_(Drakensberg)> · builder `amphi()` (`landmarksA.ts`).

**Defining silhouette** An enormous curved, flat-topped cliff wall with a single very tall, thin waterfall dropping from its rim.

**Signature features to model**
- Cliff face over 5 km long, rising ~1,220 m along its whole length.
- Broad crescent/amphitheatre curve rather than a straight wall.
- Tugela Falls plunging ~948 m from the cliff tops in five leaps.
- Green valley floor far below the summit.
- Rock type called basalt in the app copy; the fetched article does not name it, so verify before retinting.

**Materials & palette** Dark grey-brown cliff rock, green valley, white falls.

**Scale cues** Wall >5 km long, ~1,220 m high; summit over 3,050 m; falls ~948 m.

**Builder note** `amphi()`: make the wall much longer than it is tall and give it a visible curve; keep the waterfall narrow and tall, not a broad sheet.

## Palace of the Lost City

Source: <https://en.wikipedia.org/wiki/Sun_City_(South_Africa)> · builder `palace()` (`landmarksA.ts`).

**Defining silhouette** Only partially documented: the source calls it "The Palace of the Lost City", one of four themed hotels in the Sun City resort. No architectural description is given in the fetched text.

**Signature features to model**
- A themed "lost African kingdom" palace — the resort branding is the only sourced visual cue.
- Set within a multi-hotel resort beside the Elands River and Pilanesberg.
- Keep the existing fantasy-palace geometry; do not claim specific towers or gilding as sourced.
- The app copy mentions gilded towers and jungle gardens; treat these as artistic licence, not verified detail.

**Materials & palette** No palette given in source; retain current warm stone and gold accents as stylisation.

**Scale cues** Sun City is ~140 km north-west of Johannesburg; one of four hotels.

**Builder note** `palace()`: low-confidence entry. Make no geometry changes on the basis of this research; revisit only against photographs.

## Golden Gate Highlands

Source: <https://en.wikipedia.org/wiki/Golden_Gate_Highlands_National_Park> · builder `golden()` (`landmarksA.ts`).

**Defining silhouette** Golden, ochre and orange layered sandstone cliffs and outcrops flanking a valley, with one distinctive free-standing rock.

**Signature features to model**
- Deeply eroded, layered sandstone cliffs and outcrops.
- Brandwag rock — the park's most notable single formation.
- Cliffs on both sides of the valley at the Golden Gate dam.
- Caves and shelters with San rock paintings.
- Named for the last rays of the setting sun on the cliffs.

**Materials & palette** Golden, ochre and orange sandstone; iron oxides give the warm hues (per app copy); dry grassland green.

**Scale cues** Park 327 km²; elevations 1,646–2,829 m.

**Builder note** `golden()`: use strong horizontal banding in the cliff material and add one tall isolated outcrop; push the palette towards ochre/orange at low sun angles.

## Kruger National Park

Source: <https://en.wikipedia.org/wiki/Kruger_National_Park> · builder `kruger()` (`landmarksA.ts`).

**Defining silhouette** Wide, flat savanna with scattered thorn trees and a few low granite kopjes — landscape rather than a single structure.

**Signature features to model**
- Broad mopane and red bush-willow veld, thorn/acacia trees, marula.
- Granite inselberg (Khandzalive) as the highest point.
- Dry riverbeds and seasonal waterholes drawing game.
- Big Five: lion, leopard, rhino, elephant, buffalo.
- Open grass with red grass and buffalo grass, not dense forest.

**Materials & palette** Dry gold-green grass, red-brown earth, grey granite outcrops, acacia dark green.

**Scale cues** 19,623 km²; 360 km north–south, ~65 km wide; altitude 200–840 m.

**Builder note** `kruger()`: keep tree cover sparse and clumped, add a low rounded granite kopje, and place animals at a waterhole rather than scattered evenly.

## Ponte City

Source: <https://en.wikipedia.org/wiki/Ponte_City> · builder `ponte()` (`landmarksA.ts`).

**Defining silhouette** A very tall cylindrical concrete tower with a large open void down its centre and a neon sign on the roof.

**Signature features to model**
- Circular/cylindrical plan — Africa's first cylindrical skyscraper.
- Open central "core" running the full height, open to the sky.
- Wedge-shaped apartments facing both street and atrium.
- Neon sign on top, the largest in the Southern Hemisphere.
- Retail at the base; concrete construction throughout.

**Materials & palette** Grey concrete; dark interior core; bright neon sign.

**Scale cues** 173 m tall, 55 storeys; built 1975; tallest residential tower in Africa until 2023.

**Builder note** `ponte()`: keep the cylinder, darken the central opening so it reads as a hole, and add a thin framed sign above the roofline.

## Boulders Beach

Source: <https://en.wikipedia.org/wiki/Boulders_Beach> · builder `boulders()` (`landmarksA.ts`).

**Defining silhouette** Sheltered small coves formed among huge rounded granite boulders, with penguins on the sand.

**Signature features to model**
- Inlets between large granite boulders, ~540 million years old.
- Several small sheltered bays, bordered by indigenous bush above the high-water mark.
- African penguins nesting there since 1982.
- Boardwalks bringing visitors close to the birds at Foxy Beach.
- Clear, calm False Bay water.

**Materials & palette** Pale grey-pink granite, white sand, dark green bush, turquoise water, black-and-white penguins.

**Scale cues** Boulders ~540 million years old; colony founded 1982.

**Builder note** `boulders()`: group boulders into two or three tight clusters with water channels between, and keep penguins small and numerous — they are the scale cue.

## Cape Agulhas Lighthouse

Source: <https://en.wikipedia.org/wiki/Cape_Agulhas_Lighthouse> · builder `agulhas()` (`landmarksA.ts`).

**Defining silhouette** A round tower painted red with one broad white band, attached to a low keeper's house, on a flat rocky tip.

**Signature features to model**
- Round tower 27 m high, red with a white band.
- Attached keeper's house, now a museum and restaurant.
- Lantern gallery at the top; inspired by the Pharos of Alexandria.
- First lit 1 March 1849; first-order Fresnel lens installed 1910.
- Southernmost tip of Africa.

**Materials & palette** Red-painted masonry with a white band; dark lantern; pale stone house.

**Scale cues** Tower 27 m; focal plane 31 m above high water; range 30 nautical miles.

**Builder note** `agulhas()`: the red-and-white banding is the key miniature-scale identifier; keep it simple and add the attached house so it does not read as a lone column.

## Orlando Towers

Source: <https://en.wikipedia.org/wiki/Orlando_Power_Station> (redirected from "Orlando Towers") · builder `orlando()` / `coolingTowerMural()` (`landmarksB.ts`).

**Defining silhouette** Two tall hyperbolic cooling towers side by side, painted with bold murals, with a platform or bridge between their tops.

**Signature features to model**
- Two concrete cooling towers of a decommissioned coal-fired station.
- Both painted: one as an advertising billboard, one with the largest mural painting in South Africa.
- Bungee/BASE platform spanning between the tops; suspension bridge used in film.
- Low industrial base buildings around the towers.
- Prominent Soweto landmark.

**Materials & palette** Pale concrete structure; large blocks of saturated mural colour.

**Scale cues** Towers roughly 30 storeys high (per the bridge description); station closed in 1998.

**Builder note** `orlando()`: keep the waistline curve of each tower, add large mural colour blocks rather than fine detail, and make the connecting platform read clearly.

## Bourke’s Luck Potholes

Source: <https://en.wikipedia.org/wiki/Blyde_River_Canyon_Nature_Reserve> (redirected from "Bourke's Luck Potholes") · builder `bourke()` (`landmarksA.ts`).

**Defining silhouette** A rock shelf drilled with round cylindrical holes, crossed by small footbridges where the Treur River meets the Blyde.

**Signature features to model**
- Cylindrical potholes / giant's kettles eroded by sustained kolks in plunge pools.
- Swirling water in the holes; viewed safely from crags above.
- Pedestrian bridges connecting the various overlooks.
- Treur River tumbling into the Blyde below.
- Escarpment cliffs and viewpoint platforms nearby.

**Materials & palette** Warm grey quartzite/shale rock; white aerated water; wooden/metal footbridges.

**Scale cues** Reserve elevation 560–1,944 m; potholes large enough to be viewed from bridges above.

**Builder note** `bourke()`: model several deep round pockets in a flat rock slab with a different water tone inside each, then one or two thin railed bridges across them.

## Augrabies Falls

Source: <https://en.wikipedia.org/wiki/Augrabies_Falls> · builder `augrabies()` (`landmarksB.ts`).

**Defining silhouette** A single broad fall dropping into a very deep, narrow red granite gorge in a desolate landscape.

**Signature features to model**
- Main drop around 56 m from the Orange River.
- Granite gorge 240 m deep and 18 km long — far bigger than the fall itself.
- Jagged red-orange granite walls; rugged, barren surroundings.
- Khoikhoi name "Ankoerebis" — place of great noise.
- Large flood flows create heavy white spray.

**Materials & palette** Red-orange granite, dark brown rock, white water, pale dry scrub.

**Scale cues** Falls ~56 m; gorge 240 m deep, 18 km long; flood flow up to 7,800 m³/s.

**Builder note** `augrabies()` already has granite tiers and a multi-strand fall. Keep the gorge much deeper than the drop is tall and limit the number of visible chutes to one main plus two braids.

## SALT Telescope

Source: <https://en.wikipedia.org/wiki/Southern_African_Large_Telescope> · builder `salt()` (`landmarksB.ts`).

**Defining silhouette** A large white dome with a wide open shutter showing a hexagonal mirror, plus a tall narrow tower alongside it.

**Signature features to model**
- 91 hexagonal mirror segments, each 1 m inscribed diameter, forming an 11.1 × 9.8 m hexagon.
- Effective aperture 9.2 m; fixed-altitude (alt-azimuth-free) design.
- Four-mirror spherical aberration corrector at the top.
- Centre-of-curvature alignment sensor in a tall adjacent tower.
- Semi-desert Karoo setting near Sutherland.

**Materials & palette** Pale white/grey dome and enclosure; dark reflective hexagonal mirror segments; dry ochre ground.

**Scale cues** Primary 11.1 × 9.8 m; 91 segments; first light 2005.

**Builder note** `salt()` has the dome and mirror glint. Expose more of the hexagonal segment array through the shutter and raise the adjacent alignment tower so the paired silhouette is clear.

## Bloukrans Bridge

Source: <https://en.wikipedia.org/wiki/Bloukrans_Bridge> · builder `bloukrans()` (`landmarksB.ts`).

**Defining silhouette** A single concrete arch carrying a road deck high over a steep green gorge.

**Signature features to model**
- Concrete arch bridge, 216 m above the Bloukrans River.
- Central span 272 m; total length 451 m.
- Carries the N2 on the Garden Route.
- Bungee platform and cord beneath the deck — the world's highest commercial bridge jump.
- Deep wooded gorge below.

**Materials & palette** Pale grey concrete; green forested gorge; dark road surface.

**Scale cues** 216 m high; 272 m main span; 451 m total; built 1980–1983.

**Builder note** `bloukrans()`: keep the arch as a clean single curve with the deck sitting on top, and add a small bungee rig under midspan; avoid extra piers in the gorge.

## Pilanesberg Crater

Source: <https://en.wikipedia.org/wiki/Pilanesberg> · builder `pilanesberg()` (`landmarksB.ts`).

**Defining silhouette** Three concentric rings of hills rising from flat plains — a broad circular basin, not a sharp cone.

**Signature features to model**
- Ancient volcanic structure, circular in plan, rising from flat surrounding plains.
- Three concentric ridges or rings of hills; outer ring ~24 km across.
- Eroded to a cross-section through ancient magma pipes; syenite rocks.
- Mankwe Lake in the heart of the crater (per app copy).
- Game reserve inside the ring.

**Materials & palette** Green-brown savanna on the ridges, grey syenite rock, dark blue lake at the centre.

**Scale cues** Outer ring ~24 km diameter; original volcano possibly ~7,000 m high; ~100 km north-west of Pretoria.

**Builder note** `pilanesberg()` already warps a lathe mound. Separate the profile into three distinct rings with a low central basin, and keep the outer ring broad and flat-topped.

## Robben Island

Source: <https://en.wikipedia.org/wiki/Robben_Island> · builder `robben()` (`landmarksB.ts`).

**Defining silhouette** A low, flat oval island with a single small cylindrical lighthouse and a pale quarry scar.

**Signature features to model**
- Roughly oval: 3.3 km north–south, 1.9 km wide.
- Flat, only a few metres above sea level.
- 1865 lighthouse: cylindrical masonry tower, 18 m high, with lantern gallery and attached keeper's house.
- Limestone quarry — the glare damaged prisoners' eyesight (per app copy).
- Ferry arrival point; no large hills or cliffs.

**Materials & palette** Pale grey limestone rock, sparse low scrub, white lighthouse, blue sea.

**Scale cues** 5.1 km²; 3.3 × 1.9 km; lighthouse 18 m.

**Builder note** `robben()`: keep the island almost flat, put the lighthouse near one end with its gallery, and cut a pale rectangular quarry patch into the rock.

## Chapman’s Peak Drive

Source: <https://en.wikipedia.org/wiki/Chapman%27s_Peak> · builder `chapman()` (`landmarksB.ts`).

**Defining silhouette** A thin ribbon road carved into a near-vertical cliff above the Atlantic, with the sea immediately below.

**Signature features to model**
- Road hugging the near-vertical western flank of the mountain.
- Western flank falls sharply for hundreds of metres into the Atlantic.
- Flat sedimentary rock cap related to Table Mountain; Cape Granite at the base.
- Viewpoints and curves along the 9 km route (per app copy).
- Hout Bay / Noordhoek beach below.

**Materials & palette** Pale grey-tan sandstone cliff, dark granite base, grey road, deep blue Atlantic.

**Scale cues** Peak ~593 m above Hout Bay (per app copy); road cut 1915–1922; ~9 km long.

**Builder note** `chapman()`: make the cliff face dominate and the road a very thin dark line with tiny guardrail posts; keep the sea visible right at its foot.

## Isandlwana

Source: <https://en.wikipedia.org/wiki/Isandlwana> · builder `isandlwana()` (`landmarksB.ts`).

**Defining silhouette** A single isolating stumpy hill on open grassland — the name refers to its cow-stomach shape.

**Signature features to model**
- Isolated hill, name said to mean "abomasum" (second stomach of the cow) because of its shape.
- Battle site of 22 January 1879; Zulu victory over a British column.
- White cairns on the plain marking where soldiers fell (per app copy).
- Open grassland, no dense trees.
- Roughly 9.7 km east of Rorke's Drift.

**Materials & palette** Dry green-brown grassland, grey-brown rock outcrops, white stone cairns.

**Scale cues** ~1,300 British and colonial troops died here (per app copy); hill isolated above the plain.

**Builder note** `isandlwana()`: keep one rounded hill on an otherwise empty plain and scatter a few small white cairns — they are the strongest identifying detail.

## Gariep Dam

Source: <https://en.wikipedia.org/wiki/Gariep_Dam> · builder `gariep()` (`landmarksB.ts`).

**Defining silhouette** A long curved concrete wall across a gorge, holding a very broad calm reservoir.

**Signature features to model**
- Concrete gravity-arch hybrid: central arch with gravity abutments because the gorge is too wide for a full arch.
- Wall 88 m high, crest 914 m long, ~1.73 million m³ of concrete.
- On the Orange River in a gorge at the entrance to the Ruigte Valley.
- Reservoir surface over 370 km² when full.
- Largest dam in South Africa; completed 1971.

**Materials & palette** Pale grey concrete, dark blue-green reservoir water, dry brown hills.

**Scale cues** Wall 88 m high, 914 m crest; capacity ~5,340,000 ML; crest ~1,300 m above sea level.

**Builder note** `gariep()`: show the arch curve in plan, make the wall long and low relative to the reservoir, and add distinct spillway bays.

## Cradle of Humankind

Source: <https://en.wikipedia.org/wiki/Cradle_of_Humankind> · builder `maropeng()` (`landmarksB.ts`).

**Defining silhouette** A limestone cave landscape with a low visitor centre; the source gives no architectural description of Maropeng itself.

**Signature features to model**
- Complex system of limestone/dolomitic caves; fossils encased in breccia.
- Maropeng Visitors Centre opened 7 December 2005.
- Sterkfontein caves and exhibition nearby.
- Light movable steel structure called "the Beetle" over the Malapa dig site.
- Mrs Ples and Little Foot fossil finds (per app copy).

**Materials & palette** Pale limestone and dolomite, dark cave mouths, green scrub; the turf-covered visitor-centre form in the app is a stylisation, not sourced.

**Scale cues** Site ~47,000 ha, ~50 km north-west of Johannesburg; World Heritage Site since 1999.

**Builder note** `maropeng()`: low-confidence form. Keep the current low mound and dark cave opening; add only the small light "Beetle" frame as a sourced detail.

## Mapungubwe Hill

Source: <https://en.wikipedia.org/wiki/Kingdom_of_Mapungubwe> (redirected from "Mapungubwe") · builder `mapungubwe()` (`landmarksB.ts`).

**Defining silhouette** A flat-topped sandstone mesa rising abruptly above scrubland — the elite lived on the summit while people lived below.

**Signature features to model**
- Flat-topped summit where the royal court settled around 1220.
- Sandstone hills, Kalahari sands and scrubland.
- Rock shelter with San art on the east side of the hill.
- Palaces on the hill; settlement encircling its foot.
- Near the confluence of the Shashe and Limpopo rivers.

**Materials & palette** Warm sandstone cliff and summit, pale Kalahari sand, dry scrub green-brown.

**Scale cues** Capital population ~5,000 by 1250; state ~30,000 km²; hilltop is the sacred/rainmaking centre.

**Builder note** `mapungubwe()`: make the mesa flat-topped with steep sides and keep the summit mostly bare rock; a small shelter notch on one face is a cheap sourced detail.

## Kgalagadi Red Dunes

Source: <https://en.wikipedia.org/wiki/Kgalagadi_Transfrontier_Park> · builder `kgalagadi()` (`landmarksB.ts`).

**Defining silhouette** Rolling red dunes with sharp crests and long shadow faces, almost devoid of vegetation.

**Signature features to model**
- Red dunes with sparse vegetation and occasional trees.
- Dry riverbeds of the Nossob and Auob Rivers.
- Migratory herds: blue wildebeest, gemsbok, springbok, kudu, hartebeest.
- "Kgalagadi" means "place of thirst".
- Flat sandy plains elsewhere in the park.

**Materials & palette** Deep red/orange sand (iron oxide coating, per app copy), pale dry grass, dark scrub, hard blue sky.

**Scale cues** Park 38,000 km², three-quarters in Botswana; dunes are the dominant landform.

**Builder note** `kgalagadi()`: emphasise dune crests and shadow sides with strong colour contrast; keep trees to a few isolated specimens and include one dry riverbed line.

## Storms River Mouth

Source: <https://en.wikipedia.org/wiki/Tsitsikamma_National_Park> · builder `storms()` (`landmarksB.ts`).

**Defining silhouette** A slender suspension footbridge across a narrow river mouth, with forested gorge behind and rocky shore in front.

**Signature features to model**
- Suspension bridge across the mouth, reached by the Suspension Bridge and Lookout Trail.
- Indigenous forest and dramatic coastline of the Garden Route.
- Short steep climb to a lookout above the mouth and camp.
- Waterfalls and streams along the forest trails.
- Otter Trail starts here (per app copy).

**Materials & palette** Dark green forest, grey rock, blue-grey sea, tan bridge deck and cables.

**Scale cues** Park coastline 80 km long; Bloukrans Bridge (216 m) is nearby.

**Builder note** `storms()`: keep the bridge deck and cables thin so the gap reads; put dense forest immediately behind the mouth and keep the sea side rocky.

## Groot Constantia

Source: <https://en.wikipedia.org/wiki/Groot_Constantia> and <https://en.wikipedia.org/wiki/Cape_Dutch_architecture> · builder `groot()` (`landmarksB.ts`).

**Defining silhouette** A long, low, symmetrical white manor house with a central gable and thatched roof, fronted by vineyards.

**Signature features to model**
- Cape Dutch-style manor house, estate founded 1685.
- Central ornate rounded gable (typical of the style, though not universal).
- Whitewashed walls, thatched roofing, wooden sash windows with external wooden shutters.
- Long horizontal form, single or double storey, often with dormers.
- Green detailing on doors and shutters; extensive vineyards.

**Materials & palette** White plaster, dark thatch, dark green shutters and doors, green vine rows.

**Scale cues** Oldest wine estate in South Africa; manor rebuilt to original Cape Dutch form after a 1925 fire.

**Builder note** `groot()`: keep the house long and low, give it one clear central gable and a thatch roof, and add ordered vine rows in front to establish scale.

## Hermanus Whale Watching

Source: <https://en.wikipedia.org/wiki/Hermanus> · builder `hermanus()` (`landmarksB.ts`).

**Defining silhouette** A low cliff-top town above a bay, with whales surfacing just offshore.

**Signature features to model**
- Southern right whales seen from the cliffs June to early December.
- Cliff path running along the shore (about 12 km, per app copy).
- Grotto Beach, the largest beach in town.
- Whales watched from cliff-tops, air or boats.
- Coastal fynbos above the cliffs.

**Materials & palette** Dark grey whale backs, white spray, blue-green Walker Bay, pale sandstone cliffs, green scrub.

**Scale cues** Adult southern right whales ~16 m long (per app copy); cliff path ~12 km.

**Builder note** `hermanus()`: make the whale surfacing the focal point — a few dark backs and spouts just beyond the surf line, with a thin cliff path above.

## iSimangaliso Wetland Park

Source: <https://en.wikipedia.org/wiki/ISimangaliso_Wetland_Park> · builder `isimangaliso()` (`landmarksB.ts`).

**Defining silhouette** A broad calm estuary and lake framed by forested dunes, with hippos and crocodiles at the water's edge.

**Signature features to model**
- Lake St Lucia estuary, part of Africa's largest estuarine system (per app copy).
- 280 km of coastline from Mozambique to Mapelane; ~3,280 km².
- Hippos, crocodiles, elephant, rhino and buffalo.
- Underwater reefs with brightly coloured fish and corals.
- Forested dunes (per app copy); reed fringes.

**Materials & palette** Dark green-brown estuary water, green reed beds, forest green dunes, grey mud banks.

**Scale cues** ~800 hippos in the estuary (per app copy); park ~280 km long by coastline.

**Builder note** `isimangaliso()`: keep water surfaces broad and calm, place hippo heads and a crocodile log at the edges, and back the scene with a continuous forested dune ridge.

## Sani Pass

Source: <https://en.wikipedia.org/wiki/Sani_Pass> · builder `sani()` (`landmarksB.ts`).

**Defining silhouette** Tight gravel hairpins cut into a very steep escarpment face, ending at a small summit lodge.

**Signature features to model**
- Route climbs from 1,544 m to 2,876 m — a 1,332 m rise.
- Gradients up to 1:3; steep gravel road with hairpin bends.
- Only 4x4 vehicles generally allowed.
- Snow and ice possible in winter.
- Summit lodge, billed as Africa's highest pub (per app copy).

**Materials & palette** Brown unpaved gravel, cold grey basalt rock, dry green alpine scrub, white cloud/fog.

**Scale cues** 2,876 m summit; 1,332 m climb; Drakensberg peaks over 3,000 m nearby.

**Builder note** `sani()`: make the switchbacks tight and closely stacked on a steep face, add one small flat-roofed lodge at the top, and keep the road unpaved brown.

## Richtersveld

Source: <https://en.wikipedia.org/wiki/Richtersveld> · builder `richtersveld()` (`landmarksB.ts`).

**Defining silhouette** Barren jagged volcanic mountains rising from flat sandy plains, with sparse upright quiver trees.

**Signature features to model**
- Rugged kloofs and high craggy mountains of volcanic rock.
- From flat sandy coastal plains to mountains up to 1,377 m (Cornellberg).
- Orange River forms the border with Namibia.
- Quiver trees / kokerbooms (*Aloidendron ramosissimum*) with umbrella-like crowns.
- Halfmensboom (*Pachypodium namaquanum*) — "half-person tree".
- Succulent and aloe species; arid biodiversity hotspot.

**Materials & palette** Ochre-grey volcanic rock, pale sandy plains, dull green succulents, dark green river strip.

**Scale cues** Area 1,624 km²; altitude sea level to 1,377 m; ~4,849 plant species.

**Builder note** `richtersveld()`: use sharp angular rock forms and only a handful of trees; the quiver tree's bare trunk and flat crown are the key silhouette cue.

## Vredefort Dome

Source: <https://en.wikipedia.org/wiki/Vredefort_impact_structure> (redirected from "Vredefort Dome") · builder `vredefort()` (`landmarksB.ts`).

**Defining silhouette** A broad, low partial ring of rounded hills around a gentle central uplift — the crater itself has been eroded away.

**Signature features to model**
- Central uplift (the "Dome") ~100–120 km across.
- Remaining partial ring of hills ~70 km in diameter.
- Original crater estimated 170–300 km across; landscape eroded 7–11 km down.
- No intact crater rim or steep bowl.
- World Heritage Site since 2005.

**Materials & palette** Green farmland over rounded grey-brown hills; no exposed fresh crater wall.

**Scale cues** Ring ~70 km; uplift ~100–120 km; original crater up to ~300 km.

**Builder note** `vredefort()`: avoid a steep bowl. Make a wide, broken ring of low hills with a slightly raised centre and green cover.

## Hartbeespoort Dam

Source: <https://en.wikipedia.org/wiki/Hartbeespoort_Dam> · builder `harties()` (`landmarksB.ts`).

**Defining silhouette** A curved arch dam wall across a narrow valley, with a broad reservoir behind and a cableway to a ridge viewpoint.

**Signature features to model**
- Arch-type dam across the Crocodile River in a valley south of the Magaliesberg.
- Wall curves in plan; road crosses over the wall through a tunnel.
- Construction 1916–1923; first overflowed March 1925.
- Hypereutrophic water — green, algae-rich reservoir.
- Aerial cableway up the Magaliesberg to a viewpoint (per app copy).

**Materials & palette** Pale concrete wall, green reservoir water, dry green-brown hills.

**Scale cues** Completed 1923; ~35 km north-west of Johannesburg; reservoir large relative to the wall.

**Builder note** `harties()`: curve the wall visibly in plan, tint the reservoir green rather than blue, and add a thin cableway line to a ridge-top station.

## Knysna Heads

Source: <https://en.wikipedia.org/wiki/Knysna> · builder `knysna()` (`landmarksB.ts`).

**Defining silhouette** Two tall, warm-coloured headlands flaring apart to form a narrow, dangerous entrance between a calm lagoon and the open sea.

**Signature features to model**
- Two large headlands made of Peninsula Formation quartzites, known as "The Heads".
- Large warm-water estuary (Knysna Lagoon) fed by the Knysna River.
- Narrow, treacherous passage with reef and strong currents (per app copy).
- Ships wrecked passing through — the eastern headland has a recorded 1903 sinking.
- Town built mainly on the northern shore of the lagoon.

**Materials & palette** Warm grey-tan quartzite cliffs, green lagoon water, dark blue sea, green forest behind.

**Scale cues** Heads are large headlands flanking a narrow mouth; town ~60 km east of George.

**Builder note** `knysna()`: give the two cliffs different heights and angles, keep the gap narrow, and make the lagoon water noticeably calmer and greener than the sea.

## Donkin Reserve

Source: <https://en.wikipedia.org/wiki/Donkin_Memorial> · builder `donkin()` (`landmarksB.ts`).

**Defining silhouette** A four-sided stone pyramid and a small galleryed lighthouse standing side by side on a low hill — the old Port Elizabeth symbol.

**Signature features to model**
- Four-sided stone pyramid, 10 m high, built in 1820 by Sir Rufane Donkin for his wife Elizabeth.
- Pyramid stands on a chamfered/stepped plinth and bears an inscription.
- Lighthouse built 1861 beside it, serving the harbour below.
- Land declared a reserve "open to all in perpetuity".
- Combination of the two forms is used as the town's symbol.

**Materials & palette** Local pale stone for both structures; dark lantern and gallery; green reserve lawn.

**Scale cues** Pyramid 10 m high; lighthouse 1861.

**Builder note** `donkin()` already has both forms. Keep them close together, make the four-sided pyramid slightly taller than the lighthouse, and preserve the gallery railing as the lighthouse's identifying detail.

---

## Sources & limits

- All 43 landmark articles were fetched as full plain-text extracts through the MediaWiki action API (`action=query&prop=extracts&explaintext=1&redirects=1`) on 20 November 2026, plus the supplementary article *Cape Dutch architecture*. Source URLs are linked in each section.
- Several `wikiTitle` values resolve to different articles: "Orlando Towers" → *Orlando Power Station*; "Bourke's Luck Potholes" → *Blyde River Canyon Nature Reserve*; "Chapman's Peak Drive" → *Chapman's Peak*; "Mapungubwe" → *Kingdom of Mapungubwe*; "Vredefort Dome" → *Vredefort impact structure*; "Maropeng" → *Cradle of Humankind*. Those resolved articles were the ones read.
- Two landmarks are thinly documented: **Palace of the Lost City** (only described as one of four themed hotel complexes at Sun City) and **Cradle of Humankind / Maropeng** (no architectural description of the visitor centre). Their notes are flagged as low-confidence.
- Some details in `src/data/landmarks.ts` are **not** in the fetched Wikipedia text — notably the Auwal Mosque founding date, cairns at Isandlwana, Mankwe Lake, the golden rhino, whale length, and quiver-tree specifics at Richtersveld (quiver trees *are* confirmed in the Richtersveld article). These are marked "per app copy" above and should not be presented as Wikipedia-sourced.
- Wikipedia occasionally disagrees with the app copy on numbers (for example Cape Point lighthouse heights); the Wikipedia figures are used here. Where the source gives no colour (castle, baobab bark, Lost City), no palette claim is made.
- **These are text references, not photographs.** They describe observable form, style, materials and dimensions, but precise proportions, silhouettes and colour balance still need direct photo comparison before the procedural models can be called faithful. No images were fetched or compared for this document.
