# Graph Report - citylit-pwa  (2026-11-21)

## Corpus Check
- 75 files · ~167,089 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 922 nodes · 2839 edges · 47 communities (36 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a78f2d8c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- AmbientAudioController
- SettingsModal.tsx
- primitives.ts
- contact-sheet.ts
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- GalleryModal.tsx
- dioramaKit.ts
- CitylitEngine.ts
- SearchSheet.tsx
- CitylitEngine
- compilerOptions
- siteAtmosphere.ts
- osmService.ts
- .frame
- react-dom
- motion.ts
- shaders.ts
- citylit.ts
- package.json
- dependencies
- globeScene.ts
- weatherScene.ts
- server.js
- PlacesSelectionInfo
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- scripts
- TopBar.tsx
- with
- placesScene.ts
- citylit.ts
- MiniaturePass
- overrides
- .frame
- windy
- oxlint@1.94.0
- nativeHost.ts
- recharts
- @types/react@19.3.0
- osmSlice.ts
- @types/react-dom@19.3.0
- @ui-sdk/core@0.1.0-beta.13

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 74 edges
2. `add()` - 69 edges
3. `R()` - 57 edges
4. `C()` - 55 edges
5. `M()` - 50 edges
6. `MStone()` - 50 edges
7. `CB()` - 48 edges
8. `App()` - 37 edges
9. `AmbientAudioController` - 36 edges
10. `tree()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
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

## Communities (47 total, 11 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.16
Nodes (105): addAnchor(), addBaseScatter(), addBollards(), addDeck(), addJetty(), addReedbed(), addWindpump(), anchorGroup() (+97 more)

### Community 1 - "AmbientAudioController"
Cohesion: 0.07
Nodes (21): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+13 more)

### Community 2 - "SettingsModal.tsx"
Cohesion: 0.09
Nodes (33): motion, ambientAudio, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps (+25 more)

### Community 3 - "primitives.ts"
Cohesion: 0.05
Nodes (46): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes (+38 more)

### Community 4 - "contact-sheet.ts"
Cohesion: 0.14
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 5 - "App.tsx"
Cohesion: 0.11
Nodes (31): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredSet(), AudioVisualizerBar(), BootSplash(), BootSplashProps (+23 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.16
Nodes (26): createCloudPuffMesh(), createSliceCloudLayer(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers() (+18 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.16
Nodes (18): bindVolumetricFogUniforms(), createStrataTerrainMaterial(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, STRATA_COLOR_FRAGMENT (+10 more)

### Community 8 - "GalleryModal.tsx"
Cohesion: 0.12
Nodes (18): GalleryDialog(), GalleryModalProps, applyRubberBand(), project(), rubberBand(), DragOptions, Point, useDrag() (+10 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.09
Nodes (36): addCraftedRim(), addDioramaClouds(), addSiteMotion(), addSoaringBirds(), addSquareRim(), addSquareWaterPlate(), addTreeRing(), addWeatherFx() (+28 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.10
Nodes (24): LANDMARK_BUILDERS, glowMaterials, SwayItem, swayItems, WetMaterialEntry, wetMaterials, audioForward, audioRight (+16 more)

### Community 11 - "SearchSheet.tsx"
Cohesion: 0.12
Nodes (20): react, formatCoords(), InfoDrawer(), InfoDrawerProps, SearchSheetProps, TIME_PHRASES, Sheet(), SheetProps (+12 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "siteAtmosphere.ts"
Cohesion: 0.15
Nodes (17): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), createClothMaterial() (+9 more)

### Community 15 - "osmService.ts"
Cohesion: 0.13
Nodes (19): parseSearch(), SearchSheet(), cacheKey(), fallbackPatch(), GEO_CACHE, geocodePlace(), loadElevation(), loadOsmPlace() (+11 more)

### Community 16 - ".frame"
Cohesion: 0.22
Nodes (4): resetSceneDynamicLists(), setContactShadowFade(), updateWetSurfaces(), setBounceLightBiome()

### Community 18 - "motion.ts"
Cohesion: 0.10
Nodes (18): DARK_PALETTE, LIGHT_PALETTE, bodySlideVariants, headerSlideVariants, LandmarkCardProps, SlideCustom, UnfoldAccordionProps, UnfoldItem (+10 more)

### Community 19 - "shaders.ts"
Cohesion: 0.17
Nodes (25): getRoofDirtMap(), MSteel(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getPlasterBumpTexture(), getPlasterNormalTexture() (+17 more)

### Community 20 - "citylit.ts"
Cohesion: 0.20
Nodes (12): @phosphor-icons/react, GlobeOverlayProps, PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIconCondition, WeatherIconProps (+4 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): goeist@0.1.0, oxfmt@0.79.0, typescript@7.0.2, workbox-window@7.4.1, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, motion@14.14.0, n8ao@2.1.0, @phosphor-icons/react@2.1.10, react@19.3.1, tailwindcss@4.3.5, three@0.187.0, @types/node@^24.0.0 (+7 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.09
Nodes (29): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+21 more)

### Community 24 - "weatherScene.ts"
Cohesion: 0.16
Nodes (13): clamp01(), LiveWeatherVisual, liveWeatherVisual(), CloudAssets, CloudPuffInstance, SliceCloudLayer, getSoftTexture(), SKY_NOISE_GLSL (+5 more)

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
Cohesion: 0.22
Nodes (9): scripts, build, dev, format, format:check, lint, preview, start (+1 more)

### Community 32 - "TopBar.tsx"
Cohesion: 0.21
Nodes (12): AudioVisualizerBarProps, IconButton(), IconButtonProps, TopBar(), TopBarProps, swapTransition, getLandmarkSignature(), loadCachedThumbnails() (+4 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "placesScene.ts"
Cohesion: 0.20
Nodes (13): createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, createPlacesShaderEnv(), createPlacesVolumetricFogLayer(), createPlacesWeatherParticles(), createSliceCloudMaterial() (+5 more)

### Community 35 - "citylit.ts"
Cohesion: 0.11
Nodes (28): WeatherIcon(), PresetKey, TIME_PRESETS, WARNING_STYLE, WeatherWidget(), WeatherWidgetProps, buildLiveForecast(), conditionFromCode() (+20 more)

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 39 - "windy"
Cohesion: 0.25
Nodes (8): getGrassMaterial(), treeMaterial(), applyDissolveToShader(), cascadeize(), grassWindy(), installDissolveShader(), lights(), windy()

### Community 41 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 46 - "osmSlice.ts"
Cohesion: 0.19
Nodes (14): LocalPoint, OsmArea, OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult (+6 more)

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `placesScene.ts`, `primitives.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `osmSlice.ts`, `siteAtmosphere.ts`, `shaders.ts`, `package.json`, `dependencies`, `weatherScene.ts`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Should `AmbientAudioController` be split into smaller, more focused modules?**
  _Cohesion score 0.0734006734006734 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `landmarksB.ts`, `TopBar.tsx`, `citylit.ts`, `contact-sheet.ts`, `App.tsx`, `MiniaturePass`, `.frame`, `CitylitEngine.ts`, `osmSlice.ts`, `siteAtmosphere.ts`, `.frame`, `PlacesSelectionInfo`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Should `SettingsModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08846153846153847 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05272895467160037 - nodes in this community are weakly interconnected._
- **Should `contact-sheet.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10796221322537113 - nodes in this community are weakly interconnected._