# Graph Report - citylit-pwa  (2026-11-22)

## Corpus Check
- 92 files · ~241,351 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1161 nodes · 3626 edges · 62 communities (50 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 83 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `165a3b10`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- siteAtmosphere.ts
- citylit.ts
- primitives.ts
- windParticles.ts
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- SearchSheet.tsx
- dioramaKit.ts
- CitylitEngine.ts
- motion.ts
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
- PlacesOverlay.tsx
- server.js
- .isStudio
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- oxfmt@0.79.0
- scripts
- MiniaturePass
- with
- .frame
- addLampWaterReflections
- shaders.ts
- overrides
- run
- windowLights.ts
- placesClouds.ts
- placesScene.ts
- .showLandmarkImmediate
- applyDioramaUpgrade
- run
- contact-sheet.ts
- recharts
- globalIllumination.ts
- @types/three@0.187.0
- markSharedGeo
- finalizeTreeBatch
- streetLights.ts
- addCraftedRim
- addSiteMotion
- tailwindcss@4.3.5
- siteVisuals.ts
- typescript@7.0.2
- @ui-sdk/react
- addDioramaClouds
- addStandUnderside
- stampContactShadow

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 108 edges
2. `add()` - 77 edges
3. `R()` - 60 edges
4. `CB()` - 58 edges
5. `C()` - 57 edges
6. `M()` - 55 edges
7. `MStone()` - 54 edges
8. `addStreetLampSet()` - 50 edges
9. `App()` - 40 edges
10. `instancedMeshes()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `AtmosphereSite` --references--> `LandmarkBiome`  [EXTRACTED]
  src/three/siteAtmosphere.ts → src/types/citylit.ts
- `EngineCallbacks` --references--> `PlacesSelectionInfo`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts
- `CitylitEngine` --references--> `SwayItem`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/builders/primitives.ts
- `CitylitEngine` --references--> `WetMaterialEntry`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/builders/primitives.ts

## Import Cycles
- None detected.

## Communities (62 total, 12 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.14
Nodes (123): registerBeacons(), addAnchor(), addBaseScatter(), addBollards(), addDeck(), addJetty(), addLighthouseSweep(), addReedbed() (+115 more)

### Community 1 - "siteAtmosphere.ts"
Cohesion: 0.14
Nodes (18): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereSite, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+10 more)

### Community 2 - "citylit.ts"
Cohesion: 0.10
Nodes (28): AnimatedNumber(), AnimatedNumberProps, Digit(), PillNavigation(), PresetKey, TIME_PRESETS, WARNING_STYLE, WeatherWidget() (+20 more)

### Community 3 - "primitives.ts"
Cohesion: 0.04
Nodes (47): archGeo(), cableDir, cableEnd, cableMid, cableStart, cableUp, contactShadowBatches, contactShadowMaterials (+39 more)

### Community 4 - "windParticles.ts"
Cohesion: 0.31
Nodes (8): GlobeController, BIOME_PALETTES, createLeafWispTexture(), createWindParticles(), seeded(), WindParticlesController, WindParticlesUpdateOptions, QualityIndex

### Community 5 - "App.tsx"
Cohesion: 0.10
Nodes (33): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet(), AudioVisualizerBar() (+25 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.14
Nodes (30): createCloudPuffMesh(), createSliceCloudLayer(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers() (+22 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.15
Nodes (19): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL (+11 more)

### Community 8 - "SearchSheet.tsx"
Cohesion: 0.17
Nodes (20): GlobeOverlayProps, SearchSheet(), SearchSheetProps, LANDMARK_TAGS, LANDMARKS, PROVINCES, usePWAInstall(), countLandmarksByTag() (+12 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.07
Nodes (28): accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE, getLampBulbMat() (+20 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.07
Nodes (32): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, glowMaterials, swayItems, wetMaterials (+24 more)

### Community 11 - "motion.ts"
Cohesion: 0.06
Nodes (52): motion@14.14.0, motion, react, ambientAudio, AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS (+44 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.09
Nodes (3): CitylitEngine, NoteCategory, QualitySetting

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "AmbientAudioController"
Cohesion: 0.07
Nodes (20): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+12 more)

### Community 15 - "osmService.ts"
Cohesion: 0.13
Nodes (18): cacheKey(), fallbackPatch(), formatCoordinates(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE (+10 more)

### Community 16 - "placesScene.ts"
Cohesion: 0.21
Nodes (13): OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape(), PlacesController (+5 more)

### Community 17 - "motion.ts"
Cohesion: 0.07
Nodes (36): GalleryDialog(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard() (+28 more)

### Community 18 - "SettingsModal.tsx"
Cohesion: 0.11
Nodes (22): BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), SettingsModal(), SettingsModalProps (+14 more)

### Community 19 - "shaders.ts"
Cohesion: 0.20
Nodes (18): MSteel(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getPlasterBumpTexture(), getPlasterNormalTexture(), getRoofBumpTexture() (+10 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.19
Nodes (13): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow, StatsTooltip() (+5 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): goeist@0.1.0, n8ao@2.1.0, oxlint@1.94.0, @types/node@^24.0.0, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, react@19.3.1, react-dom@19.3.1, three@0.187.0, @types/react@19.3.0, @types/react-dom@19.3.0, @ui-sdk/core@0.1.0-beta.13, workbox-window@7.4.1 (+5 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.07
Nodes (38): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+30 more)

### Community 24 - "PlacesOverlay.tsx"
Cohesion: 0.18
Nodes (15): @phosphor-icons/react@2.1.10, @phosphor-icons/react, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION (+7 more)

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

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - ".frame"
Cohesion: 0.12
Nodes (15): updateWetSurfaces(), BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, createBounceLight(), DIORAMA_SHADOW_EXTENT, rimBaseCol (+7 more)

### Community 35 - "addLampWaterReflections"
Cohesion: 0.40
Nodes (5): addLampWaterReflections(), addWetRoadStreaks(), getLampReflectionGeo(), getLampReflectionMat(), getWetRoadMat()

### Community 36 - "shaders.ts"
Cohesion: 0.16
Nodes (17): getGrassMaterial(), applyDissolveToShader(), cascadeize(), flagWindy(), grassWindy(), installDissolveShader(), interiorParallaxShader(), lights() (+9 more)

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 38 - "run"
Cohesion: 0.32
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 39 - "windowLights.ts"
Cohesion: 0.20
Nodes (13): windowPaneMaterial(), bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES, tmpLit (+5 more)

### Community 40 - "placesClouds.ts"
Cohesion: 0.40
Nodes (3): CloudAssets, CloudPuffInstance, SliceCloudLayer

### Community 41 - "placesScene.ts"
Cohesion: 0.26
Nodes (11): createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, createPlacesShaderEnv(), createPlacesVolumetricFogLayer(), createPlacesWeatherParticles(), createSliceCloudMaterial() (+3 more)

### Community 42 - ".showLandmarkImmediate"
Cohesion: 0.15
Nodes (4): resetSceneDynamicLists(), setContactShadowFade(), SwayItem, WetMaterialEntry

### Community 44 - "applyDioramaUpgrade"
Cohesion: 0.15
Nodes (14): addEdgeWaterfall(), addSoaringBirds(), addSquareWaterPlate(), addTreeRing(), applyDioramaUpgrade(), buildSpatialSources(), getSiteProfile(), hasSiteProfile() (+6 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 48 - "globalIllumination.ts"
Cohesion: 0.15
Nodes (12): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+4 more)

### Community 50 - "markSharedGeo"
Cohesion: 0.33
Nodes (6): getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), markSharedGeo()

### Community 51 - "finalizeTreeBatch"
Cohesion: 0.29
Nodes (8): buildTreeGeometry(), buildTreeLodGeometry(), crownGeo(), finalizeTreeBatch(), mergeTreeParts(), treeGeometry(), treeLodGeometry(), treeMaterial()

### Community 52 - "streetLights.ts"
Cohesion: 0.16
Nodes (9): collectStreetLampAnchors(), createStreetLampPool(), LAMP_TINT, lampTintForBiome(), solarHalfDay(), STREET_LAMP_POOL_SIZE, StreetLampAnchor, streetLampNightFactor() (+1 more)

### Community 54 - "addCraftedRim"
Cohesion: 0.60
Nodes (5): addCraftedRim(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata()

### Community 55 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

### Community 58 - "siteVisuals.ts"
Cohesion: 0.33
Nodes (6): DEFAULT_BY_BIOME, getSiteVisualProfile(), normalizeSiteVisualKey(), SITE_VISUALS_MAP, SitePointLightSpec, SiteVisualProfile

## Knowledge Gaps
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `siteAtmosphere.ts`, `.frame`, `primitives.ts`, `shaders.ts`, `windParticles.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `placesClouds.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `placesScene.ts`, `windowLights.ts`, `globalIllumination.ts`, `placesScene.ts`, `streetLights.ts`, `package.json`, `dependencies`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `MiniaturePass`, `siteAtmosphere.ts`, `.frame`, `citylit.ts`, `shaders.ts`, `App.tsx`, `windParticles.ts`, `siteVisuals.ts`, `CitylitEngine.ts`, `motion.ts`, `.showLandmarkImmediate`, `contact-sheet.ts`, `globalIllumination.ts`, `placesScene.ts`, `streetLights.ts`, `.isStudio`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Should `siteAtmosphere.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `motion.ts`, `recharts`, `@types/three@0.187.0`, `package.json`, `PlacesOverlay.tsx`, `server.js`, `typescript@7.0.2`, `@ui-sdk/react`, `vite.config.ts`, `oxfmt@0.79.0`, `tailwindcss@4.3.5`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09982174688057041 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._