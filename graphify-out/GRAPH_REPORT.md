# Graph Report - citylit-pwa  (2026-11-22)

## Corpus Check
- 110 files · ~266,206 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1312 nodes · 4042 edges · 54 communities (45 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 90 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `88010f8d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- albedoAudit.ts
- WeatherWidget.tsx
- primitives.ts
- motion.ts
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- SearchSheet.tsx
- dioramaKit.ts
- CitylitEngine.ts
- Compass.tsx
- CitylitEngine
- compilerOptions
- AmbientAudioController
- osmService.ts
- placesScene.ts
- motion.ts
- SettingsModal.tsx
- shaders.ts
- PassportModal.tsx
- package.json
- dependencies
- globeScene.ts
- .isStudio
- server.js
- .frame
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- animalKit.ts
- scripts
- MiniaturePass
- with
- .constructor
- windParticles.ts
- oxfmt@0.79.0
- overrides
- capture-contact-sheets.mjs
- windowLights.ts
- placesClouds.ts
- placesScene.ts
- .showLandmarkImmediate
- tailwindcss@4.3.5
- run
- contact-sheet.ts
- recharts
- vehicleLightKit.ts
- @ui-sdk/react
- PlacesSelectionInfo
- react-dom
- @types/react@19.3.0
- horizonScenery.ts

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 109 edges
2. `add()` - 84 edges
3. `M()` - 62 edges
4. `CB()` - 62 edges
5. `C()` - 62 edges
6. `R()` - 60 edges
7. `MStone()` - 56 edges
8. `addStreetLampSet()` - 50 edges
9. `instancedMeshes()` - 41 edges
10. `App()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `AudioVisualizerBar()`  [EXTRACTED]
  src/App.tsx → src/components/AudioVisualizerBar.tsx
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

## Communities (54 total, 9 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.11
Nodes (143): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), getAnimalSeasonMonth(), addAnchor(), addBaseScatter() (+135 more)

### Community 1 - "albedoAudit.ts"
Cohesion: 0.18
Nodes (22): ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), DEFAULT_SATURATION_REDUCTION, GRADE_GUARDRAILS (+14 more)

### Community 2 - "WeatherWidget.tsx"
Cohesion: 0.09
Nodes (30): placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIcon(), WeatherIconCondition (+22 more)

### Community 3 - "primitives.ts"
Cohesion: 0.04
Nodes (56): archGeo(), boostBuiltVibrancy(), buildTreeGeometry(), buildTreeLodGeometry(), cableDir, cableEnd, cableMid, cableStart (+48 more)

### Community 4 - "motion.ts"
Cohesion: 0.08
Nodes (38): motion, @phosphor-icons/react, react, ambientAudio, GlobeOverlayProps, formatCoords(), InfoDrawer(), InfoDrawerProps (+30 more)

### Community 5 - "App.tsx"
Cohesion: 0.08
Nodes (37): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet(), BootSplash() (+29 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.13
Nodes (30): getGrassMaterial(), createCloudPuffMesh(), createSliceCloudLayer(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture() (+22 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.15
Nodes (19): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL (+11 more)

### Community 8 - "SearchSheet.tsx"
Cohesion: 0.21
Nodes (17): SearchSheet(), LANDMARK_TAGS, LANDMARKS, PROVINCES, usePWAInstall(), countLandmarksByTag(), filterLandmarks(), IndexedLandmark (+9 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (65): accentFor(), addCraftedRim(), addDioramaClouds(), addEdgeWaterfall(), addLampWaterReflections(), addSiteMotion(), addSoaringBirds(), addSquareRim() (+57 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.09
Nodes (30): boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT, PLINTH_INNER_HALF_EXTENT, PlinthFit (+22 more)

### Community 11 - "Compass.tsx"
Cohesion: 0.14
Nodes (15): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8, Compass(), formatBearing() (+7 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.08
Nodes (3): CompassProps, CitylitEngine, QualitySetting

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "AmbientAudioController"
Cohesion: 0.05
Nodes (38): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+30 more)

### Community 15 - "osmService.ts"
Cohesion: 0.13
Nodes (18): cacheKey(), fallbackPatch(), formatCoordinates(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE (+10 more)

### Community 16 - "placesScene.ts"
Cohesion: 0.21
Nodes (13): OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape(), PlacesController (+5 more)

### Community 17 - "motion.ts"
Cohesion: 0.07
Nodes (37): GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants (+29 more)

### Community 18 - "SettingsModal.tsx"
Cohesion: 0.09
Nodes (25): BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), SettingsModal(), SettingsModalProps (+17 more)

### Community 19 - "shaders.ts"
Cohesion: 0.12
Nodes (34): MSteel(), applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture() (+26 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.16
Nodes (16): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow, StatsTooltip() (+8 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): oxlint@1.94.0, @types/node@^24.0.0, @types/react-dom@19.3.0, workbox-window@7.4.1, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, @phosphor-icons/react@2.1.10, react@19.3.1, three@0.187.0, @types/three@0.187.0 (+7 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.11
Nodes (29): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+21 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - ".frame"
Cohesion: 0.12
Nodes (14): updateWetSurfaces(), BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, DIORAMA_SHADOW_EXTENT, rimBaseCol, rimSiteCol (+6 more)

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
Nodes (38): clamp01(), LiveWeatherVisual, liveWeatherVisual(), WEATHER_CONDITIONS, monthToSeasonWeights(), SeasonWeights, MID_MONTH_DAY, solarDeclination() (+30 more)

### Community 31 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, format, format:check, lint, preview, qa:capture (+4 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - ".constructor"
Cohesion: 0.09
Nodes (20): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+12 more)

### Community 35 - "windParticles.ts"
Cohesion: 0.31
Nodes (8): GlobeController, BIOME_PALETTES, createLeafWispTexture(), createWindParticles(), seeded(), WindParticlesController, WindParticlesUpdateOptions, QualityIndex

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.11
Nodes (18): CDP, clickAria(), listTargets(), run(), sleep(), acquirePageTarget(), captureHour(), CdpSession (+10 more)

### Community 39 - "windowLights.ts"
Cohesion: 0.20
Nodes (13): windowPaneMaterial(), bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES, tmpLit (+5 more)

### Community 40 - "placesClouds.ts"
Cohesion: 0.40
Nodes (3): CloudAssets, CloudPuffInstance, SliceCloudLayer

### Community 41 - "placesScene.ts"
Cohesion: 0.21
Nodes (13): createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, createPlacesShaderEnv(), createPlacesVolumetricFogLayer(), createPlacesWeatherParticles(), createSliceCloudMaterial() (+5 more)

### Community 42 - ".showLandmarkImmediate"
Cohesion: 0.15
Nodes (7): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), resetSceneDynamicLists(), SwayItem, WetMaterialEntry

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 48 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 50 - "PlacesSelectionInfo"
Cohesion: 0.32
Nodes (3): setContactShadowFade(), EngineCallbacks, PlacesSelectionInfo

### Community 58 - "horizonScenery.ts"
Cohesion: 0.09
Nodes (28): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+20 more)

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `primitives.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `AmbientAudioController`, `placesScene.ts`, `shaders.ts`, `package.json`, `dependencies`, `.frame`, `animalKit.ts`, `.constructor`, `windParticles.ts`, `windowLights.ts`, `placesClouds.ts`, `placesScene.ts`, `.showLandmarkImmediate`, `vehicleLightKit.ts`, `horizonScenery.ts`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11270454127596985 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `MiniaturePass`, `.constructor`, `WeatherWidget.tsx`, `windParticles.ts`, `App.tsx`, `placesSliceBuilders.ts`, `horizonScenery.ts`, `CitylitEngine.ts`, `Compass.tsx`, `.showLandmarkImmediate`, `contact-sheet.ts`, `AmbientAudioController`, `placesScene.ts`, `motion.ts`, `PlacesSelectionInfo`, `.isStudio`, `.frame`, `animalKit.ts`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `WeatherWidget.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09269162210338681 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.041742286751361164 - nodes in this community are weakly interconnected._
- **Should `motion.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08148148148148149 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08421985815602837 - nodes in this community are weakly interconnected._