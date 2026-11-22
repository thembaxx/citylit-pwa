# Graph Report - citylit-pwa  (2026-11-22)

## Corpus Check
- 85 files · ~213,555 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1041 nodes · 3189 edges · 52 communities (42 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 82 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `048d2cc0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- siteAtmosphere.ts
- WeatherWidget.tsx
- primitives.ts
- nativeHost.ts
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- LandmarkCard.tsx
- dioramaKit.ts
- CitylitEngine.ts
- SearchSheet.tsx
- CitylitEngine
- compilerOptions
- AmbientAudioController
- osmService.ts
- placesScene.ts
- motion.ts
- citylit.ts
- shaders.ts
- PassportModal.tsx
- package.json
- dependencies
- globeScene.ts
- windParticles.ts
- server.js
- .isStudio
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- PlacesOverlay.tsx
- scripts
- MiniaturePass
- with
- MiniaturePass
- weatherData.ts
- waterize
- overrides
- run
- TopBar.tsx
- placesClouds.ts
- placesScene.ts
- .showLandmarkImmediate
- recharts
- run
- contact-sheet.ts
- oxfmt@0.79.0
- tailwindcss@4.3.5
- @types/three@0.187.0
- typescript@7.0.2
- @ui-sdk/react

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 100 edges
2. `add()` - 70 edges
3. `R()` - 59 edges
4. `MStone()` - 52 edges
5. `M()` - 50 edges
6. `CB()` - 50 edges
7. `C()` - 49 edges
8. `App()` - 40 edges
9. `AmbientAudioController` - 37 edges
10. `tree()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `getRimMaterial()` --calls--> `surfaceDetail()`  [EXTRACTED]
  src/three/builders/dioramaKit.ts → src/three/builders/primitives.ts
- `getUndersideMaterial()` --calls--> `surfaceDetail()`  [EXTRACTED]
  src/three/builders/dioramaKit.ts → src/three/builders/primitives.ts
- `surfaceDetail()` --calls--> `getSurfaceRoughnessTexture()`  [EXTRACTED]
  src/three/builders/primitives.ts → src/three/shaders.ts
- `surfaceDetail()` --calls--> `normalMapsActive()`  [EXTRACTED]
  src/three/builders/primitives.ts → src/three/shaders.ts

## Import Cycles
- None detected.

## Communities (52 total, 10 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.16
Nodes (106): addAnchor(), addBaseScatter(), addBollards(), addDeck(), addJetty(), addReedbed(), addSiteMotion(), addWindpump() (+98 more)

### Community 1 - "siteAtmosphere.ts"
Cohesion: 0.14
Nodes (18): SKY_NOISE_GLSL, AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+10 more)

### Community 2 - "WeatherWidget.tsx"
Cohesion: 0.17
Nodes (15): AnimatedNumber(), AnimatedNumberProps, Digit(), PresetKey, TIME_PRESETS, WARNING_STYLE, WeatherWidget(), WeatherWidgetProps (+7 more)

### Community 3 - "primitives.ts"
Cohesion: 0.05
Nodes (50): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes (+42 more)

### Community 4 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 5 - "App.tsx"
Cohesion: 0.12
Nodes (24): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet(), BootSplash() (+16 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.13
Nodes (31): createCloudPuffMesh(), createSliceCloudLayer(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), patchPlacesVolumetricFog() (+23 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.16
Nodes (17): PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL, STRATA_COLOR_FRAGMENT, STRATA_FRAG_COMMON (+9 more)

### Community 8 - "LandmarkCard.tsx"
Cohesion: 0.11
Nodes (19): bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard(), LandmarkCardProps, nextBearingSummary() (+11 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.09
Nodes (35): addCraftedRim(), addDioramaClouds(), addEdgeWaterfall(), addSoaringBirds(), addSquareRim(), addStandUnderside(), addTreeRing(), addWeatherFx() (+27 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.06
Nodes (40): LANDMARK_BUILDERS, SwayItem, WetMaterialEntry, wetMaterials, audioForward, audioRight, compassDir, compassOffset (+32 more)

### Community 11 - "SearchSheet.tsx"
Cohesion: 0.11
Nodes (27): @phosphor-icons/react@2.1.10, @phosphor-icons/react, react, formatCoords(), InfoDrawer(), InfoDrawerProps, parseSearch(), SearchSheet() (+19 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.09
Nodes (3): CitylitEngine, NoteCategory, QualitySetting

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "AmbientAudioController"
Cohesion: 0.07
Nodes (21): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+13 more)

### Community 15 - "osmService.ts"
Cohesion: 0.13
Nodes (18): cacheKey(), fallbackPatch(), formatCoordinates(), GEO_CACHE, geocodePlace(), loadElevation(), loadOsmPlace(), LocalPoint (+10 more)

### Community 16 - "placesScene.ts"
Cohesion: 0.19
Nodes (14): OsmArea, OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape() (+6 more)

### Community 17 - "motion.ts"
Cohesion: 0.11
Nodes (20): GalleryDialog(), GalleryModal(), GalleryModalProps, applyRubberBand(), EASE_IN_OUT, modalVariants, panelVariants, project() (+12 more)

### Community 18 - "citylit.ts"
Cohesion: 0.07
Nodes (36): motion@14.14.0, motion, ambientAudio, CARDINAL_TARGETS, CARDINALS_8, Compass(), CompassProps, formatBearing() (+28 more)

### Community 19 - "shaders.ts"
Cohesion: 0.18
Nodes (24): MSteel(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getPlasterBumpTexture(), getPlasterNormalTexture(), getRoofBumpTexture() (+16 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.11
Nodes (26): GlobeOverlay(), GlobeOverlayProps, CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportTab, ProvinceRing(), ProvinceRingProps (+18 more)

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

### Community 30 - "PlacesOverlay.tsx"
Cohesion: 0.16
Nodes (15): placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIcon(), WeatherIconCondition (+7 more)

### Community 31 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, format, format:check, lint, preview, start (+1 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 35 - "weatherData.ts"
Cohesion: 0.14
Nodes (20): buildLiveForecast(), clamp01(), conditionFromCode(), ExtremeWeatherWarning, fetchLiveWeather(), getClimateRegime(), HourlyWeather, liveConditionLabel() (+12 more)

### Community 36 - "waterize"
Cohesion: 0.20
Nodes (10): addSquareWaterPlate(), getGrassMaterial(), treeMaterial(), applyDissolveToShader(), cascadeize(), flagWindy(), grassWindy(), lights() (+2 more)

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 38 - "run"
Cohesion: 0.32
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 39 - "TopBar.tsx"
Cohesion: 0.21
Nodes (11): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps (+3 more)

### Community 40 - "placesClouds.ts"
Cohesion: 0.40
Nodes (3): CloudAssets, CloudPuffInstance, SliceCloudLayer

### Community 41 - "placesScene.ts"
Cohesion: 0.26
Nodes (11): createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, bindVolumetricFogUniforms(), createPlacesShaderEnv(), createPlacesVolumetricFogLayer(), createPlacesWeatherParticles() (+3 more)

### Community 42 - ".showLandmarkImmediate"
Cohesion: 0.14
Nodes (3): resetSceneDynamicLists(), setContactShadowFade(), setBounceLightBiome()

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `siteAtmosphere.ts`, `primitives.ts`, `weatherData.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `placesClouds.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `placesScene.ts`, `placesScene.ts`, `shaders.ts`, `package.json`, `dependencies`, `windParticles.ts`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Should `siteAtmosphere.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `MiniaturePass`, `landmarksB.ts`, `MiniaturePass`, `siteAtmosphere.ts`, `weatherData.ts`, `App.tsx`, `TopBar.tsx`, `CitylitEngine.ts`, `.showLandmarkImmediate`, `contact-sheet.ts`, `placesScene.ts`, `citylit.ts`, `windParticles.ts`, `.isStudio`, `PlacesOverlay.tsx`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04862745098039216 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11942959001782531 - nodes in this community are weakly interconnected._
- **Should `placesSliceBuilders.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Should `LandmarkCard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11231884057971014 - nodes in this community are weakly interconnected._