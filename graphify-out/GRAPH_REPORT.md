# Graph Report - citylit-pwa  (2026-11-22)

## Corpus Check
- 115 files · ~277,810 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1411 nodes · 4297 edges · 54 communities (47 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 121 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `19058853`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- horizonScenery.ts
- citylit.ts
- primitives.ts
- skyEvents.ts
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- SearchSheet.tsx
- dioramaKit.ts
- streetLights.ts
- fitMath.ts
- CitylitEngine
- compilerOptions
- motion.ts
- osmService.ts
- placesScene.ts
- LandmarkCard.tsx
- SettingsModal.tsx
- shaders.ts
- PassportModal.tsx
- package.json
- dependencies
- globeScene.ts
- AmbientAudioController
- server.js
- CitylitEngine.ts
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- animalKit.ts
- scripts
- .frame
- with
- globalIllumination.ts
- overrides
- capture-contact-sheets.mjs
- windowLights.ts
- placesClouds.ts
- .showLandmarkImmediate
- tailwindcss@4.3.5
- run
- contact-sheet.ts
- recharts
- vehicleLightKit.ts
- placesInteriors.ts
- PlacesOverlay.tsx
- weatherScene.ts
- react-dom
- nativeHost.ts
- oxfmt@0.79.0
- @types/react@19.3.0
- @ui-sdk/react

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 111 edges
2. `add()` - 84 edges
3. `C()` - 62 edges
4. `CB()` - 62 edges
5. `M()` - 62 edges
6. `R()` - 60 edges
7. `MStone()` - 56 edges
8. `addStreetLampSet()` - 50 edges
9. `App()` - 43 edges
10. `instancedMeshes()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `App()` --calls--> `Compass()`  [EXTRACTED]
  src/App.tsx → src/components/Compass.tsx
- `App()` --calls--> `GalleryModal()`  [EXTRACTED]
  src/App.tsx → src/components/GalleryModal.tsx
- `App()` --calls--> `InfoDrawer()`  [EXTRACTED]
  src/App.tsx → src/components/InfoDrawer.tsx
- `App()` --calls--> `LandmarkCard()`  [EXTRACTED]
  src/App.tsx → src/components/LandmarkCard.tsx

## Import Cycles
- None detected.

## Communities (54 total, 7 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.11
Nodes (144): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), getAnimalSeasonMonth(), addAnchor(), addBaseScatter() (+136 more)

### Community 1 - "horizonScenery.ts"
Cohesion: 0.09
Nodes (28): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+20 more)

### Community 2 - "citylit.ts"
Cohesion: 0.08
Nodes (33): PillNavigation(), pad2(), PresetKey, SKY_EVENT_ICON, TIME_PRESETS, WARNING_STYLE, WEATHER_MOMENT_ICON, WeatherWidget() (+25 more)

### Community 3 - "primitives.ts"
Cohesion: 0.04
Nodes (57): archGeo(), boostBuiltVibrancy(), buildTreeGeometry(), buildTreeLodGeometry(), cableDir, cableEnd, cableMid, cableStart (+49 more)

### Community 4 - "skyEvents.ts"
Cohesion: 0.23
Nodes (14): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+6 more)

### Community 5 - "App.tsx"
Cohesion: 0.10
Nodes (33): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet(), AudioVisualizerBar() (+25 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.12
Nodes (32): createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), patchPlacesVolumetricFog(), addInstancedFlowers(), addInstancedRocks() (+24 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (19): PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL (+11 more)

### Community 8 - "SearchSheet.tsx"
Cohesion: 0.17
Nodes (20): GlobeOverlayProps, SearchSheet(), SearchSheetProps, LANDMARK_TAGS, LANDMARKS, PROVINCES, usePWAInstall(), countLandmarksByTag() (+12 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (62): accentFor(), addCraftedRim(), addDioramaClouds(), addEdgeWaterfall(), addLampWaterReflections(), addSiteMotion(), addSoaringBirds(), addSquareRim() (+54 more)

### Community 10 - "streetLights.ts"
Cohesion: 0.16
Nodes (11): EngineCallbacks, PlacesSelectionInfo, collectStreetLampAnchors(), createStreetLampPool(), LAMP_TINT, lampTintForBiome(), solarHalfDay(), STREET_LAMP_POOL_SIZE (+3 more)

### Community 11 - "fitMath.ts"
Cohesion: 0.36
Nodes (8): boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT, PLINTH_INNER_HALF_EXTENT, PlinthFit

### Community 12 - "CitylitEngine"
Cohesion: 0.09
Nodes (3): CitylitEngine, fitDioramaShadowBounds(), NoteCategory

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "motion.ts"
Cohesion: 0.06
Nodes (47): motion, react, ambientAudio, AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8 (+39 more)

### Community 15 - "osmService.ts"
Cohesion: 0.16
Nodes (15): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), MEMORY_CACHE, OsmBuilding, OsmRoad (+7 more)

### Community 16 - "placesScene.ts"
Cohesion: 0.13
Nodes (25): LocalPoint, OsmArea, OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult (+17 more)

### Community 17 - "LandmarkCard.tsx"
Cohesion: 0.08
Nodes (31): GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants (+23 more)

### Community 18 - "SettingsModal.tsx"
Cohesion: 0.11
Nodes (22): BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), SettingsModal(), SettingsModalProps (+14 more)

### Community 19 - "shaders.ts"
Cohesion: 0.12
Nodes (32): getRoofDirtMap(), MSteel(), applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture() (+24 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.12
Nodes (23): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+15 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): oxlint@1.94.0, @types/node@^24.0.0, @types/react-dom@19.3.0, workbox-window@7.4.1, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, @phosphor-icons/react@2.1.10, react@19.3.1, three@0.187.0, @types/three@0.187.0 (+7 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.11
Nodes (29): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+21 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.05
Nodes (37): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+29 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.05
Nodes (48): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, glowMaterials, swayItems, wetMaterials (+40 more)

### Community 27 - ".oxfmtrc.json"
Cohesion: 0.22
Nodes (8): ignorePatterns, printWidth, $schema, semi, singleQuote, tabWidth, trailingComma, useTabs

### Community 28 - ".oxlintrc.json"
Cohesion: 0.22
Nodes (8): categories, correctness, suspicious, ignorePatterns, plugins, rules, react/react-in-jsx-scope, $schema

### Community 29 - "vite.config.ts"
Cohesion: 0.20
Nodes (8): @tailwindcss/vite@4.3.5, vite@8.3.8, vite-plugin-pwa@2.0.0, @vitejs/plugin-react@6.3.0, @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 30 - "animalKit.ts"
Cohesion: 0.06
Nodes (49): SKY_CALENDAR_SIZE, ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), DEFAULT_SATURATION_REDUCTION (+41 more)

### Community 31 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, format, format:check, lint, preview, qa:capture (+4 more)

### Community 32 - ".frame"
Cohesion: 0.12
Nodes (4): updateWetSurfaces(), updateBounceLightMood(), updateShadowMood(), MiniaturePass

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.11
Nodes (18): CDP, clickAria(), listTargets(), run(), sleep(), acquirePageTarget(), captureHour(), CdpSession (+10 more)

### Community 39 - "windowLights.ts"
Cohesion: 0.18
Nodes (14): windowPaneMaterial(), interiorParallaxShader(), bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES (+6 more)

### Community 40 - "placesClouds.ts"
Cohesion: 0.32
Nodes (6): CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer, getSoftTexture()

### Community 42 - ".showLandmarkImmediate"
Cohesion: 0.15
Nodes (4): resetSceneDynamicLists(), setContactShadowFade(), SwayItem, WetMaterialEntry

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 48 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.08
Nodes (54): BESPOKE_INTERIORS, BespokeInteriorContext, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy() (+46 more)

### Community 50 - "PlacesOverlay.tsx"
Cohesion: 0.21
Nodes (13): @phosphor-icons/react, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIcon() (+5 more)

### Community 51 - "weatherScene.ts"
Cohesion: 0.14
Nodes (19): clamp01(), LiveWeatherVisual, liveWeatherVisual(), WEATHER_CONDITIONS, getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth() (+11 more)

### Community 56 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `horizonScenery.ts`, `primitives.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `streetLights.ts`, `placesScene.ts`, `shaders.ts`, `package.json`, `dependencies`, `AmbientAudioController`, `CitylitEngine.ts`, `animalKit.ts`, `globalIllumination.ts`, `windowLights.ts`, `placesClouds.ts`, `vehicleLightKit.ts`, `placesInteriors.ts`, `weatherScene.ts`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11033557046979865 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `.frame`, `landmarksB.ts`, `citylit.ts`, `horizonScenery.ts`, `App.tsx`, `.showLandmarkImmediate`, `streetLights.ts`, `contact-sheet.ts`, `motion.ts`, `placesScene.ts`, `SettingsModal.tsx`, `AmbientAudioController`, `CitylitEngine.ts`, `animalKit.ts`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Should `horizonScenery.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08170731707317073 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.040911747516072475 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09966777408637874 - nodes in this community are weakly interconnected._