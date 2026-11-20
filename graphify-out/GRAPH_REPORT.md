# Graph Report - citylit-pwa  (2026-11-20)

## Corpus Check
- 67 files · ~127,346 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 825 nodes · 2548 edges · 46 communities (36 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d51bc38c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- AmbientAudioController
- PassportModal.tsx
- primitives.ts
- PassportModal.tsx
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- GalleryModal.tsx
- dioramaKit.ts
- CitylitEngine.ts
- motion.ts
- CitylitEngine
- compilerOptions
- PlacesOverlay.tsx
- osmService.ts
- siteAtmosphere.ts
- placesScene.ts
- shaders.ts
- getStoneBumpTexture
- osmSlice.ts
- package.json
- dependencies
- globeScene.ts
- citylit.ts
- server.js
- .frame
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- InfoDrawer.tsx
- scripts
- finalizeTreeBatch
- n8ao.d.ts
- CitylitEngine
- three
- MiniaturePass
- overrides
- n8ao
- oxlint@1.94.0
- @types/react@19.3.0
- @ui-sdk/core@0.1.0-beta.13
- tailwindcss@4.3.5
- @ui-sdk/react
- finalizeContactShadows

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 65 edges
2. `add()` - 65 edges
3. `R()` - 55 edges
4. `C()` - 54 edges
5. `MStone()` - 50 edges
6. `M()` - 49 edges
7. `CB()` - 44 edges
8. `tree()` - 38 edges
9. `App()` - 36 edges
10. `AmbientAudioController` - 36 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `GalleryModal()`  [EXTRACTED]
  src/App.tsx → src/components/GalleryModal.tsx
- `App()` --calls--> `InfoDrawer()`  [EXTRACTED]
  src/App.tsx → src/components/InfoDrawer.tsx
- `App()` --calls--> `LandmarkCard()`  [EXTRACTED]
  src/App.tsx → src/components/LandmarkCard.tsx
- `App()` --calls--> `PassportModal()`  [EXTRACTED]
  src/App.tsx → src/components/PassportModal.tsx
- `App()` --calls--> `PlacesOverlay()`  [EXTRACTED]
  src/App.tsx → src/components/PlacesOverlay.tsx

## Import Cycles
- None detected.

## Communities (46 total, 10 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.17
Nodes (96): addAnchor(), addBaseScatter(), addBollards(), addDeck(), addJetty(), addReedbed(), addWindpump(), anchorGroup() (+88 more)

### Community 1 - "AmbientAudioController"
Cohesion: 0.07
Nodes (21): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+13 more)

### Community 2 - "PassportModal.tsx"
Cohesion: 0.09
Nodes (26): motion@14.14.0, motion, ambientAudio, PostcardModal(), PostcardModalProps, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS (+18 more)

### Community 3 - "primitives.ts"
Cohesion: 0.06
Nodes (35): archGeo(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes, ContactShadowSpec, csTmpBox (+27 more)

### Community 4 - "PassportModal.tsx"
Cohesion: 0.11
Nodes (26): GlobeOverlayProps, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+18 more)

### Community 5 - "App.tsx"
Cohesion: 0.11
Nodes (28): App(), INITIAL_GLOBE, readInitialCoordinate(), readInitialLandmarkIndex(), readSettings(), readStoredSet(), setUrlForCoordinates(), setUrlForGlobe() (+20 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.17
Nodes (24): createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers(), addInstancedRocks(), addInstancedTrees() (+16 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.17
Nodes (17): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, STRATA_COLOR_FRAGMENT, STRATA_FRAG_COMMON (+9 more)

### Community 8 - "GalleryModal.tsx"
Cohesion: 0.10
Nodes (23): GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, headerSlideVariants, LandmarkCard(), LandmarkCardProps, SlideCustom (+15 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.12
Nodes (26): addCraftedRim(), addDioramaClouds(), addSoaringBirds(), addSquareRim(), addTreeRing(), addWeatherFx(), AnchorKind, applyDioramaUpgrade() (+18 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.13
Nodes (17): LANDMARK_BUILDERS, glowMaterials, SwayItem, swayItems, WetMaterialEntry, wetMaterials, audioForward, audioRight (+9 more)

### Community 11 - "motion.ts"
Cohesion: 0.11
Nodes (18): AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps, DURATION (+10 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "PlacesOverlay.tsx"
Cohesion: 0.16
Nodes (14): placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIcon(), WeatherIconCondition (+6 more)

### Community 15 - "osmService.ts"
Cohesion: 0.15
Nodes (16): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmBuilding (+8 more)

### Community 16 - "siteAtmosphere.ts"
Cohesion: 0.15
Nodes (17): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), createClothMaterial() (+9 more)

### Community 17 - "placesScene.ts"
Cohesion: 0.22
Nodes (13): createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, createPlacesShaderEnv(), createPlacesVolumetricFogLayer(), createPlacesWeatherParticles(), createSliceCloudMaterial() (+5 more)

### Community 18 - "shaders.ts"
Cohesion: 0.31
Nodes (9): addSquareWaterPlate(), applyDissolveToShader(), cascadeize(), grassWindy(), lights(), waterize(), windy(), WindyShaderOptions (+1 more)

### Community 19 - "getStoneBumpTexture"
Cohesion: 0.20
Nodes (10): MCanvas(), MRoof(), MSteel(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getPlasterBumpTexture(), getRoofBumpTexture(), getStoneBumpTexture() (+2 more)

### Community 20 - "osmSlice.ts"
Cohesion: 0.19
Nodes (14): OsmArea, OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape() (+6 more)

### Community 21 - "package.json"
Cohesion: 0.17
Nodes (11): goeist@0.1.0, oxfmt@0.79.0, @types/react-dom@19.3.0, description, name, private, type, version (+3 more)

### Community 22 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, react@19.3.1, react-dom@19.3.1, recharts@3.11.0, three@0.187.0, @types/three@0.187.0, typescript@7.0.2, workbox-window@7.4.1 (+5 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.19
Nodes (15): AFRICA_POLY, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, ProvinceGlobeEntry, createGlobeScene(), DimMaterial (+7 more)

### Community 24 - "citylit.ts"
Cohesion: 0.08
Nodes (37): AnimatedNumber(), AnimatedNumberProps, Digit(), PresetKey, TIME_PRESETS, WARNING_STYLE, WeatherWidget(), WeatherWidgetProps (+29 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - ".frame"
Cohesion: 0.22
Nodes (3): resetSceneDynamicLists(), setContactShadowFade(), updateWetSurfaces()

### Community 27 - ".oxfmtrc.json"
Cohesion: 0.22
Nodes (8): ignorePatterns, printWidth, $schema, semi, singleQuote, tabWidth, trailingComma, useTabs

### Community 28 - ".oxlintrc.json"
Cohesion: 0.22
Nodes (8): categories, correctness, suspicious, ignorePatterns, plugins, rules, react/react-in-jsx-scope, $schema

### Community 29 - "vite.config.ts"
Cohesion: 0.20
Nodes (8): @tailwindcss/vite@4.3.5, vite@8.3.8, vite-plugin-pwa@2.0.0, @vitejs/plugin-react@6.3.0, @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 30 - "InfoDrawer.tsx"
Cohesion: 0.14
Nodes (18): @phosphor-icons/react@2.1.10, @phosphor-icons/react, react, formatCoords(), InfoDrawer(), InfoDrawerProps, Sheet(), SheetProps (+10 more)

### Community 31 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, format, format:check, lint, preview, start

### Community 32 - "finalizeTreeBatch"
Cohesion: 0.22
Nodes (10): buildTreeGeometry(), buildTreeLodGeometry(), crownGeo(), finalizeTreeBatch(), mergeTreeParts(), stampContactShadow(), stampContactShadowsFromMeshes(), treeGeometry() (+2 more)

### Community 33 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 34 - "CitylitEngine"
Cohesion: 0.16
Nodes (3): CitylitEngine, QualityIndex, QualitySetting

### Community 35 - "three"
Cohesion: 0.33
Nodes (6): three, CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `three` to `landmarksB.ts`, `n8ao.d.ts`, `primitives.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `siteAtmosphere.ts`, `placesScene.ts`, `shaders.ts`, `osmSlice.ts`, `package.json`, `dependencies`, `globeScene.ts`, `citylit.ts`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Should `AmbientAudioController` be split into smaller, more focused modules?**
  _Cohesion score 0.0734006734006734 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `landmarksB.ts`, `MiniaturePass`, `App.tsx`, `CitylitEngine.ts`, `motion.ts`, `CitylitEngine`, `PlacesOverlay.tsx`, `siteAtmosphere.ts`, `osmSlice.ts`, `globeScene.ts`, `citylit.ts`, `.frame`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0946969696969697 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05873015873015873 - nodes in this community are weakly interconnected._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10967741935483871 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1126984126984127 - nodes in this community are weakly interconnected._