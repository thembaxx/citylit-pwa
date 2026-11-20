# Graph Report - citylit-pwa  (2026-11-20)

## Corpus Check
- 73 files · ~150,667 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 863 nodes · 2624 edges · 42 communities (32 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `103dd8f3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- AmbientAudioController
- PassportModal.tsx
- primitives.ts
- .frame
- App.tsx
- placesSliceBuilders.ts
- .constructor
- GalleryModal.tsx
- dioramaKit.ts
- CitylitEngine.ts
- motion.ts
- CitylitEngine
- compilerOptions
- osmService.ts
- siteAtmosphere.ts
- react-dom
- SearchSheet.tsx
- getStoneBumpTexture
- tailwindcss@4.3.5
- package.json
- dependencies
- globeScene.ts
- citylit.ts
- server.js
- typescript@7.0.2
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- mediaService.ts
- scripts
- finalizeTreeBatch
- with
- .setQualityIndex
- citylit.ts
- MiniaturePass
- overrides
- workbox-window@7.4.1
- nativeHost.ts
- @ui-sdk/react
- oxfmt@0.79.0

## God Nodes (most connected - your core abstractions)
1. `add()` - 65 edges
2. `CitylitEngine` - 64 edges
3. `R()` - 55 edges
4. `C()` - 54 edges
5. `MStone()` - 50 edges
6. `M()` - 49 edges
7. `CB()` - 44 edges
8. `tree()` - 38 edges
9. `AmbientAudioController` - 36 edges
10. `App()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `EngineCallbacks` --references--> `PlacesSelectionInfo`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts
- `CitylitEngine` --references--> `SwayItem`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/builders/primitives.ts
- `CitylitEngine` --references--> `WetMaterialEntry`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/builders/primitives.ts
- `CitylitEngine` --references--> `GlobeController`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/globeScene.ts
- `CitylitEngine` --references--> `PlacesController`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts

## Import Cycles
- None detected.

## Communities (42 total, 10 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.17
Nodes (97): addAnchor(), addBaseScatter(), addBollards(), addDeck(), addJetty(), addReedbed(), addWindpump(), anchorGroup() (+89 more)

### Community 1 - "AmbientAudioController"
Cohesion: 0.07
Nodes (21): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+13 more)

### Community 2 - "PassportModal.tsx"
Cohesion: 0.09
Nodes (30): ambientAudio, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+22 more)

### Community 3 - "primitives.ts"
Cohesion: 0.06
Nodes (36): archGeo(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes, ContactShadowSpec, createContactShadowMaterial() (+28 more)

### Community 4 - ".frame"
Cohesion: 0.20
Nodes (4): resetSceneDynamicLists(), setContactShadowFade(), updateWetSurfaces(), updateRimLight()

### Community 5 - "App.tsx"
Cohesion: 0.11
Nodes (30): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredSet(), BootSplash(), BootSplashProps, GlobeOverlay() (+22 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.05
Nodes (75): OsmArea, OsmPlaceData, getGrassMaterial(), centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult (+67 more)

### Community 7 - ".constructor"
Cohesion: 0.40
Nodes (3): configureDioramaShadow(), createRimLight(), DIORAMA_SHADOW_EXTENT

### Community 8 - "GalleryModal.tsx"
Cohesion: 0.10
Nodes (27): @phosphor-icons/react@2.1.10, motion, @phosphor-icons/react, GalleryDialog(), GalleryModal(), GalleryModalProps, GlobeOverlayProps, bodySlideVariants (+19 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.12
Nodes (26): addCraftedRim(), addDioramaClouds(), addSoaringBirds(), addSquareRim(), addTreeRing(), addWeatherFx(), AnchorKind, applyDioramaUpgrade() (+18 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.13
Nodes (16): LANDMARK_BUILDERS, glowMaterials, SwayItem, WetMaterialEntry, wetMaterials, audioForward, audioRight, EngineCallbacks (+8 more)

### Community 11 - "motion.ts"
Cohesion: 0.10
Nodes (20): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps (+12 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, geocodePlace(), loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE (+9 more)

### Community 16 - "siteAtmosphere.ts"
Cohesion: 0.14
Nodes (18): SKY_NOISE_GLSL, AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+10 more)

### Community 18 - "SearchSheet.tsx"
Cohesion: 0.12
Nodes (22): react, formatCoords(), InfoDrawer(), InfoDrawerProps, parseSearch(), SearchSheet(), SearchSheetProps, TIME_PHRASES (+14 more)

### Community 19 - "getStoneBumpTexture"
Cohesion: 0.19
Nodes (16): addSquareWaterPlate(), MCanvas(), MRoof(), applyDissolveToShader(), cascadeize(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getPlasterBumpTexture() (+8 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): goeist@0.1.0, recharts@3.11.0, @types/react-dom@19.3.0, @types/three@0.187.0, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, motion@14.14.0, n8ao@2.1.0, oxlint@1.94.0, react@19.3.1, three@0.187.0, @types/node@^24.0.0, @types/react@19.3.0 (+6 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.10
Nodes (27): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+19 more)

### Community 24 - "citylit.ts"
Cohesion: 0.13
Nodes (19): placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, AnimatedNumber(), AnimatedNumberProps, Digit(), WeatherIcon(), PresetKey (+11 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 27 - ".oxfmtrc.json"
Cohesion: 0.22
Nodes (8): ignorePatterns, printWidth, $schema, semi, singleQuote, tabWidth, trailingComma, useTabs

### Community 28 - ".oxlintrc.json"
Cohesion: 0.22
Nodes (8): categories, correctness, suspicious, ignorePatterns, plugins, rules, react/react-in-jsx-scope, $schema

### Community 29 - "vite.config.ts"
Cohesion: 0.20
Nodes (8): @tailwindcss/vite@4.3.5, vite@8.3.8, vite-plugin-pwa@2.0.0, @vitejs/plugin-react@6.3.0, @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 30 - "mediaService.ts"
Cohesion: 0.27
Nodes (8): cleanCaption(), CommonsImageInfo, CommonsPage, loadLandmarkMedia(), MEDIA_CACHE, stripHtml(), SUMMARY_CACHE, WikiSummary

### Community 31 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, format, format:check, lint, preview, start (+1 more)

### Community 32 - "finalizeTreeBatch"
Cohesion: 0.22
Nodes (10): buildTreeGeometry(), buildTreeLodGeometry(), crownGeo(), finalizeTreeBatch(), mergeTreeParts(), stampContactShadow(), stampContactShadowsFromMeshes(), treeGeometry() (+2 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 35 - "citylit.ts"
Cohesion: 0.09
Nodes (29): ANIMATED_BY_CONDITION, WeatherIconCondition, WeatherIconProps, buildLiveForecast(), clamp01(), conditionFromCode(), ExtremeWeatherWarning, fetchLiveWeather() (+21 more)

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 41 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `primitives.ts`, `citylit.ts`, `placesSliceBuilders.ts`, `.constructor`, `dioramaKit.ts`, `CitylitEngine.ts`, `siteAtmosphere.ts`, `getStoneBumpTexture`, `package.json`, `dependencies`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Should `AmbientAudioController` be split into smaller, more focused modules?**
  _Cohesion score 0.0734006734006734 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `landmarksB.ts`, `.setQualityIndex`, `citylit.ts`, `.frame`, `App.tsx`, `MiniaturePass`, `.constructor`, `placesSliceBuilders.ts`, `CitylitEngine.ts`, `motion.ts`, `siteAtmosphere.ts`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08888888888888889 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05855855855855856 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1076923076923077 - nodes in this community are weakly interconnected._
- **Should `placesSliceBuilders.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05126050420168067 - nodes in this community are weakly interconnected._