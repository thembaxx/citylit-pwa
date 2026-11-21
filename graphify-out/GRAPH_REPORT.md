# Graph Report - animation-improvements  (2026-11-21)

## Corpus Check
- 83 files · ~194,976 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .woff2 4, (none) 3, .css 2)

## Summary
- 1011 nodes · 3109 edges · 48 communities (40 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6a609476`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- AmbientAudioController
- SettingsModal.tsx
- primitives.ts
- TopBar.tsx
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- LandmarkCard.tsx
- dioramaKit.ts
- CitylitEngine.ts
- react
- CitylitEngine
- compilerOptions
- SettleModal.tsx
- osmService.ts
- PlacesOverlay.tsx
- windy
- motion.ts
- shaders.ts
- PassportModal.tsx
- package.json
- dependencies
- globeScene.ts
- windParticles.ts
- server.js
- .showLandmarkImmediate
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- globalIllumination.ts
- scripts
- contact-sheet.ts
- with
- applyDissolveToShader
- citylit.ts
- .frame
- overrides
- oxfmt@0.79.0
- tailwindcss@4.3.5
- getSoftTexture
- nativeHost.ts
- @types/three@0.187.0
- recharts
- typescript@7.0.2
- placesScene.ts
- @ui-sdk/react

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 99 edges
2. `add()` - 70 edges
3. `R()` - 57 edges
4. `C()` - 50 edges
5. `M()` - 50 edges
6. `MStone()` - 50 edges
7. `CB()` - 49 edges
8. `App()` - 40 edges
9. `AmbientAudioController` - 37 edges
10. `tree()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `App()` --calls--> `AudioVisualizerBar()`  [EXTRACTED]
  src/App.tsx → src/components/AudioVisualizerBar.tsx
- `App()` --calls--> `Compass()`  [EXTRACTED]
  src/App.tsx → src/components/Compass.tsx
- `App()` --calls--> `GalleryModal()`  [EXTRACTED]
  src/App.tsx → src/components/GalleryModal.tsx
- `App()` --calls--> `InfoDrawer()`  [EXTRACTED]
  src/App.tsx → src/components/InfoDrawer.tsx

## Import Cycles
- None detected.

## Communities (48 total, 8 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.16
Nodes (106): addAnchor(), addBaseScatter(), addBollards(), addDeck(), addJetty(), addReedbed(), addSiteMotion(), addWindpump() (+98 more)

### Community 1 - "AmbientAudioController"
Cohesion: 0.05
Nodes (38): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+30 more)

### Community 2 - "SettingsModal.tsx"
Cohesion: 0.09
Nodes (33): motion@14.14.0, motion, ambientAudio, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS (+25 more)

### Community 3 - "primitives.ts"
Cohesion: 0.05
Nodes (44): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes (+36 more)

### Community 4 - "TopBar.tsx"
Cohesion: 0.21
Nodes (11): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps (+3 more)

### Community 5 - "App.tsx"
Cohesion: 0.09
Nodes (34): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet(), BootSplash() (+26 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.13
Nodes (29): createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), PlacesShaderEnvironment, addInstancedFlowers(), addInstancedRocks() (+21 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.15
Nodes (19): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL (+11 more)

### Community 8 - "LandmarkCard.tsx"
Cohesion: 0.13
Nodes (16): bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard(), LandmarkCardProps, nextBearingSummary() (+8 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.09
Nodes (35): addCraftedRim(), addDioramaClouds(), addSoaringBirds(), addSquareRim(), addSquareWaterPlate(), addTreeRing(), addWeatherFx(), AnchorKind (+27 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.07
Nodes (35): LANDMARK_BUILDERS, glowMaterials, SwayItem, WetMaterialEntry, wetMaterials, audioForward, audioRight, compassDir (+27 more)

### Community 11 - "react"
Cohesion: 0.10
Nodes (28): @phosphor-icons/react@2.1.10, @phosphor-icons/react, react, formatCoords(), InfoDrawer(), InfoDrawerProps, parseSearch(), SearchSheet() (+20 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.09
Nodes (3): CitylitEngine, NoteCategory, QualitySetting

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "SettleModal.tsx"
Cohesion: 0.24
Nodes (9): PassportModalProps, PostcardModal(), PostcardModalProps, SKY_PRESETS, inner, SettleModal(), SettleModalProps, EASE_SMOOTH_OUT (+1 more)

### Community 15 - "osmService.ts"
Cohesion: 0.13
Nodes (18): cacheKey(), fallbackPatch(), formatCoordinates(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE (+10 more)

### Community 16 - "PlacesOverlay.tsx"
Cohesion: 0.21
Nodes (11): PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIconCondition, WeatherIconProps, WeatherWidgetProps, PlacesWeatherMode (+3 more)

### Community 17 - "windy"
Cohesion: 0.29
Nodes (7): finalizeTreeBatch(), getGrassMaterial(), stampContactShadow(), stampContactShadowsFromMeshes(), treeMaterial(), grassWindy(), windy()

### Community 18 - "motion.ts"
Cohesion: 0.07
Nodes (29): CARDINAL_TARGETS, CARDINALS_8, Compass(), CompassProps, formatBearing(), TICKS, GalleryDialog(), GalleryModal() (+21 more)

### Community 19 - "shaders.ts"
Cohesion: 0.18
Nodes (24): MSteel(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getPlasterBumpTexture(), getPlasterNormalTexture(), getRoofBumpTexture() (+16 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.18
Nodes (15): GlobeOverlayProps, CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+7 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): goeist@0.1.0, n8ao@2.1.0, oxlint@1.94.0, @types/node@^24.0.0, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, react@19.3.1, react-dom@19.3.1, three@0.187.0, @types/react@19.3.0, @types/react-dom@19.3.0, @ui-sdk/core@0.1.0-beta.13, workbox-window@7.4.1 (+5 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.11
Nodes (29): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+21 more)

### Community 24 - "windParticles.ts"
Cohesion: 0.27
Nodes (9): GlobeController, WU, BIOME_PALETTES, createLeafWispTexture(), createWindParticles(), seeded(), WindParticlesController, WindParticlesUpdateOptions (+1 more)

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

### Community 30 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 31 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, format, format:check, lint, preview, start (+1 more)

### Community 32 - "contact-sheet.ts"
Cohesion: 0.15
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "applyDissolveToShader"
Cohesion: 0.40
Nodes (5): applyDissolveToShader(), cascadeize(), flagWindy(), installDissolveShader(), lights()

### Community 35 - "citylit.ts"
Cohesion: 0.11
Nodes (27): buildLiveForecast(), clamp01(), conditionFromCode(), ExtremeWeatherWarning, ExtremeWeatherWarningKind, fetchLiveWeather(), HourlyWeather, liveConditionLabel() (+19 more)

### Community 36 - ".frame"
Cohesion: 0.13
Nodes (3): setContactShadowFade(), updateWetSurfaces(), MiniaturePass

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 40 - "getSoftTexture"
Cohesion: 0.38
Nodes (6): CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer, getSoftTexture()

### Community 41 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 46 - "placesScene.ts"
Cohesion: 0.16
Nodes (20): OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape(), createPlacesScene() (+12 more)

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `AmbientAudioController`, `primitives.ts`, `citylit.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `getSoftTexture`, `dioramaKit.ts`, `CitylitEngine.ts`, `placesScene.ts`, `shaders.ts`, `package.json`, `dependencies`, `windParticles.ts`, `globalIllumination.ts`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Should `AmbientAudioController` be split into smaller, more focused modules?**
  _Cohesion score 0.05098934550989345 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `contact-sheet.ts`, `AmbientAudioController`, `citylit.ts`, `.frame`, `App.tsx`, `TopBar.tsx`, `CitylitEngine.ts`, `placesScene.ts`, `windy`, `motion.ts`, `windParticles.ts`, `.showLandmarkImmediate`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Should `SettingsModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08906882591093117 - nodes in this community are weakly interconnected._
- **Why does `AmbientAudioController` connect `AmbientAudioController` to `react`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051515151515151514 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0851063829787234 - nodes in this community are weakly interconnected._