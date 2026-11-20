# Graph Report - citylit-pwa  (2026-11-20)

## Corpus Check
- 63 files · ~120,277 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 764 nodes · 2421 edges · 35 communities (30 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9002911b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- AmbientAudioController
- PassportModal.tsx
- primitives.ts
- InfoDrawer.tsx
- App.tsx
- placesSliceBuilders.ts
- SettingsModal.tsx
- GalleryModal.tsx
- dioramaKit.ts
- CitylitEngine.ts
- motion.ts
- CitylitEngine
- compilerOptions
- WeatherWidget.tsx
- citylit.ts
- siteAtmosphere.ts
- landmarks.ts
- recharts
- shaders.ts
- @types/three@0.187.0
- package.json
- dependencies
- globeScene.ts
- weatherScene.ts
- server.js
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- scripts
- n8ao.d.ts
- overrides
- n8ao
- oxlint@1.94.0

## God Nodes (most connected - your core abstractions)
1. `add()` - 65 edges
2. `CitylitEngine` - 63 edges
3. `R()` - 55 edges
4. `C()` - 54 edges
5. `MStone()` - 50 edges
6. `M()` - 49 edges
7. `CB()` - 44 edges
8. `tree()` - 38 edges
9. `AmbientAudioController` - 36 edges
10. `drift()` - 34 edges

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

## Communities (35 total, 5 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.19
Nodes (89): addBaseScatter(), addReedbed(), agulhas(), amphi(), baobab(), bokaap(), boulders(), bourke() (+81 more)

### Community 1 - "AmbientAudioController"
Cohesion: 0.07
Nodes (21): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+13 more)

### Community 2 - "PassportModal.tsx"
Cohesion: 0.13
Nodes (19): PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow, StatsTooltip() (+11 more)

### Community 3 - "primitives.ts"
Cohesion: 0.06
Nodes (44): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes (+36 more)

### Community 4 - "InfoDrawer.tsx"
Cohesion: 0.10
Nodes (20): react-dom, formatCoords(), InfoDrawer(), InfoDrawerProps, parseSearch(), SearchSheet(), SearchSheetProps, TIME_PHRASES (+12 more)

### Community 5 - "App.tsx"
Cohesion: 0.12
Nodes (33): App(), readInitialLandmarkIndex(), readSettings(), readStoredSet(), AudioVisualizerBar(), BootSplash(), BootSplashProps, GlobeOverlay() (+25 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.06
Nodes (63): CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer, createPlacesScene(), HERO_CAM, HERO_TARGET (+55 more)

### Community 7 - "SettingsModal.tsx"
Cohesion: 0.15
Nodes (16): ambientAudio, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, SettingsModal(), SettingsModalProps, THEME_OPTIONS (+8 more)

### Community 8 - "GalleryModal.tsx"
Cohesion: 0.14
Nodes (16): react, GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, headerSlideVariants, LandmarkCard(), LandmarkCardProps (+8 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.11
Nodes (36): addAnchor(), addBollards(), addCraftedRim(), addDeck(), addDioramaClouds(), addJetty(), addSoaringBirds(), addSquareRim() (+28 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.11
Nodes (20): three@0.187.0, three, LANDMARK_BUILDERS, glowMaterials, resetSceneDynamicLists(), SwayItem, updateWetSurfaces(), WetMaterialEntry (+12 more)

### Community 11 - "motion.ts"
Cohesion: 0.13
Nodes (14): motion, DARK_PALETTE, LIGHT_PALETTE, UnfoldAccordionProps, UnfoldItem, DURATION, EASE_IN_OUT, EASE_SMOOTH_OUT (+6 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.08
Nodes (5): setContactShadowFade(), CitylitEngine, MiniaturePass, QualityIndex, QualitySetting

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "WeatherWidget.tsx"
Cohesion: 0.11
Nodes (24): @phosphor-icons/react, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIcon() (+16 more)

### Community 15 - "citylit.ts"
Cohesion: 0.19
Nodes (11): AudioVisualizerBarProps, IconButton(), IconButtonProps, TopBar(), TopBarProps, swapTransition, AmbientEvent, LandmarkDot (+3 more)

### Community 16 - "siteAtmosphere.ts"
Cohesion: 0.14
Nodes (18): SKY_NOISE_GLSL, AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+10 more)

### Community 17 - "landmarks.ts"
Cohesion: 0.17
Nodes (12): GlobeOverlayProps, LANDMARKS, PROVINCES, cleanCaption(), CommonsImageInfo, CommonsPage, loadLandmarkMedia(), MEDIA_CACHE (+4 more)

### Community 19 - "shaders.ts"
Cohesion: 0.18
Nodes (17): getGrassMaterial(), MCanvas(), MRoof(), applyDissolveToShader(), cascadeize(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getPlasterBumpTexture() (+9 more)

### Community 21 - "package.json"
Cohesion: 0.17
Nodes (11): goeist@0.1.0, @types/react@19.3.0, @types/react-dom@19.3.0, description, name, private, type, version (+3 more)

### Community 22 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, motion@14.14.0, oxfmt@0.79.0, @phosphor-icons/react@2.1.10, react@19.3.1, react-dom@19.3.1, tailwindcss@4.3.5, typescript@7.0.2 (+5 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.27
Nodes (10): AFRICA_POLY, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, ProvinceGlobeEntry, createGlobeScene(), GlobeController (+2 more)

### Community 24 - "weatherScene.ts"
Cohesion: 0.19
Nodes (12): clamp01(), liveWeatherVisual(), createContactShadowMaterial(), finalizeContactShadows(), getSoftTexture(), WU, createWeatherScene(), monthToSeasonWeights() (+4 more)

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

### Community 31 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, format, format:check, lint, preview, start

### Community 33 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `CitylitEngine.ts` to `landmarksB.ts`, `n8ao.d.ts`, `primitives.ts`, `placesSliceBuilders.ts`, `dioramaKit.ts`, `siteAtmosphere.ts`, `shaders.ts`, `package.json`, `globeScene.ts`, `weatherScene.ts`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Should `AmbientAudioController` be split into smaller, more focused modules?**
  _Cohesion score 0.0734006734006734 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `landmarksB.ts`, `App.tsx`, `placesSliceBuilders.ts`, `CitylitEngine.ts`, `WeatherWidget.tsx`, `citylit.ts`, `siteAtmosphere.ts`, `globeScene.ts`, `weatherScene.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05656565656565657 - nodes in this community are weakly interconnected._
- **Should `InfoDrawer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10344827586206896 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11806543385490754 - nodes in this community are weakly interconnected._