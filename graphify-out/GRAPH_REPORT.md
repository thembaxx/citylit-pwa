# Graph Report - citylit-pwa  (2026-11-25)

## Corpus Check
- 209 files · ~451,688 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .woff2 4, (none) 3, .css 2)

## Summary
- 2312 nodes · 6697 edges · 96 communities (84 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 233 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0689c59a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- scaleFacts.ts
- citylit.ts
- viewportFraming.ts
- server.js
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- InfoDrawer.tsx
- dioramaKit.ts
- animalKit.ts
- WeatherWidget.tsx
- CitylitEngine
- compilerOptions
- lightingRig.ts
- osmService.ts
- osmSlice.ts
- .isStudio
- MiniaturePass
- skyEvents.ts
- prepareCanvasTexture
- playwright
- package.json
- layer.ts
- AmbientAudioController
- .fitHeroCamera
- CitylitEngine.ts
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- albedoAudit.ts
- scripts
- applyDioramaUpgrade
- with
- primitives.ts
- ref_node_test
- citylit.ts
- overrides
- capture-contact-sheets.mjs
- memory.js
- textureCache.ts
- .frame
- SearchSheet.tsx
- run
- globeScene.ts
- measure-idle-pacing.mjs
- species.ts
- placesInteriors.ts
- qualityBenchmark.ts
- daylightBirds.ts
- compare-metrics.mjs
- placesScene.ts
- timePresets.ts
- weatherScene.ts
- .constructor
- WebGPUSceneRenderer
- plinthKit.ts
- capture-visual-matrix.mjs
- WebGLSceneRenderer
- vehicleLightKit.ts
- PlacesOverlay.tsx
- run
- motion.ts
- windowLights.ts
- siteAtmosphere.ts
- check-exposure.mjs
- webgpuPostFX.ts
- budget.ts
- contact-sheet.ts
- framePacing.ts
- TopBar.tsx
- .constructor
- ref_node_fs
- make-contact-sheet.mjs
- CreatureField
- field.ts
- field.ts
- DaylightBirdsController
- createWebGPUCompat
- AmbientSiteProfile
- biomePalette.ts
- globalIllumination.ts
- ScaleRulerModal.tsx
- creaturesLab.ts
- webgpuCompat.ts
- n8ao.d.ts
- nativeHost.ts
- .updateSpatial
- tide.test.ts
- devDependencies
- PassportModal.tsx
- .setQualityIndex
- getSoftTexture
- postfx.ts

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 160 edges
2. `add()` - 104 edges
3. `M()` - 83 edges
4. `C()` - 82 edges
5. `CB()` - 71 edges
6. `mergeByMaterial()` - 60 edges
7. `R()` - 60 edges
8. `App()` - 56 edges
9. `addStreetLampSet()` - 56 edges
10. `MStone()` - 56 edges

## Surprising Connections (you probably didn't know these)
- `memoryApiPlugin()` --calls--> `createMemoryMiddleware()`  [EXTRACTED]
  vite.config.ts → server/memory.js
- `main()` --indirect_call--> `setupEval()`  [INFERRED]
  scripts/capture-visual-matrix.mjs → scripts/capture-contact-sheets.mjs
- `ScaleReferenceEntry` --references--> `ScaleReferenceKind`  [EXTRACTED]
  src/three/builders/dioramaKit.ts → src/types/citylit.ts
- `App()` --calls--> `AudioVisualizerBar()`  [EXTRACTED]
  src/App.tsx → src/components/AudioVisualizerBar.tsx
- `App()` --calls--> `Compass()`  [EXTRACTED]
  src/App.tsx → src/components/Compass.tsx

## Import Cycles
- None detected.

## Communities (96 total, 12 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.09
Nodes (171): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+163 more)

### Community 1 - "scaleFacts.ts"
Cohesion: 0.12
Nodes (23): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), ScaleRulerModalProps (+15 more)

### Community 2 - "citylit.ts"
Cohesion: 0.08
Nodes (35): AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener, UI_CUE_CATEGORY (+27 more)

### Community 3 - "viewportFraming.ts"
Cohesion: 0.14
Nodes (23): clampShift(), EMPTY_INSETS, FramingPlan, freeFitFactor(), freeRect(), isCompactViewport(), LayoutMode, layoutModeFor() (+15 more)

### Community 4 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 5 - "App.tsx"
Cohesion: 0.08
Nodes (45): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+37 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.10
Nodes (37): getGrassMaterial(), CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial() (+29 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.13
Nodes (21): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL (+13 more)

### Community 8 - "InfoDrawer.tsx"
Cohesion: 0.11
Nodes (25): formatCoords(), INFO_TABS, InfoDrawer(), InfoDrawerProps, InfoDrawerTab, UnfoldAccordion(), EASTER_EGGS, EasterEgg (+17 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.04
Nodes (62): getAnimalSeasonMonth(), accentFor(), addCraftedRim(), addDioramaClouds(), addLampWaterReflections(), addSquareRim(), addWetRoadStreaks(), addWildlifeLayer() (+54 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.07
Nodes (38): WILDLIFE, WildlifeSpot, advanceAnimalTime(), AnimalIdle, AnimalKind, AnimalLodSpec, AnimalMember, AnimalPose (+30 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.14
Nodes (22): HourlyForecast(), HourlyForecastProps, AnimatedNumber(), pad2(), PRESET_ICONS, PresetKey, SKY_EVENT_ICON, TIME_PRESETS (+14 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.06
Nodes (4): CompassProps, SwayItem, WetMaterialEntry, CitylitEngine

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "lightingRig.ts"
Cohesion: 0.06
Nodes (41): clamp01(), LiveWeatherVisual, liveWeatherVisual(), WEATHER_CONDITIONS, MID_MONTH_DAY, solarDeclination(), southernSunDirection(), AUTO_EXPOSURE_ADAPT_RATE (+33 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.19
Nodes (16): StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, pointOnRoad(), polygonShape() (+8 more)

### Community 19 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 20 - "prepareCanvasTexture"
Cohesion: 0.13
Nodes (33): applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getOrCreateCanvas() (+25 more)

### Community 21 - "playwright"
Cohesion: 0.08
Nodes (21): playwright, errors, errors, names, errors, failed, report, sites (+13 more)

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (41): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, pastdotdev@^0.0.1, @phosphor-icons/react@2.1.10 (+33 more)

### Community 23 - "layer.ts"
Cohesion: 0.10
Nodes (26): DAY, CreatureTier, CREATURE_ENV, CreatureEnvSnapshot, currentTimeBand(), publishCreatureEnvironment(), setCreatureEnvironment(), clampHour() (+18 more)

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.06
Nodes (46): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, glowMaterials, resetSceneDynamicLists(), updateWetSurfaces() (+38 more)

### Community 27 - ".oxfmtrc.json"
Cohesion: 0.22
Nodes (8): ignorePatterns, printWidth, $schema, semi, singleQuote, tabWidth, trailingComma, useTabs

### Community 28 - ".oxlintrc.json"
Cohesion: 0.22
Nodes (8): categories, correctness, suspicious, ignorePatterns, plugins, rules, react/react-in-jsx-scope, $schema

### Community 29 - "vite.config.ts"
Cohesion: 0.18
Nodes (9): @tailwindcss/vite@4.3.5, vite@8.3.8, vite-plugin-pwa@2.0.0, @vitejs/plugin-react@6.3.0, @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react (+1 more)

### Community 30 - "albedoAudit.ts"
Cohesion: 0.19
Nodes (22): ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), conditionSurfaceHex(), DEFAULT_SATURATION_REDUCTION (+14 more)

### Community 31 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format, format:check, lint, preview, qa:capture (+5 more)

### Community 32 - "applyDioramaUpgrade"
Cohesion: 0.14
Nodes (23): addCreatureLife(), addEdgeWaterfall(), addRimEdgeContinuity(), addScaleReference(), addSiteMotion(), addSoaringBirds(), addSquareWaterPlate(), addWeatherFx() (+15 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "primitives.ts"
Cohesion: 0.04
Nodes (56): archGeo(), boostBuiltVibrancy(), buildTreeGeometry(), buildTreeLodGeometry(), cableDir, cableEnd, cableMid, cableStart (+48 more)

### Community 35 - "ref_node_test"
Cohesion: 0.10
Nodes (17): IDLES, KINDS, SEASONS, condenseHistoryText(), splitSentences(), bridgeStayAnchors(), catenaryArchHeight(), StayAnchor (+9 more)

### Community 36 - "citylit.ts"
Cohesion: 0.10
Nodes (26): GalleryDialog(), GalleryModal(), GalleryModalProps, airQualityInsight(), CAMERA_PRESETS, cardContentVariants, CARDINALS, cardItemVariants (+18 more)

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.17
Nodes (16): acquirePageTarget(), BASELINE_PATH, captureHour(), CdpSession, checkPerfGuardrails(), HOUR_KEYS, main(), pad() (+8 more)

### Community 39 - "memory.js"
Cohesion: 0.36
Nodes (11): createMemoryMiddleware(), getClient(), HttpError, isTimestamp(), optionalEnum(), optionalInt(), optionalString(), pick() (+3 more)

### Community 40 - "textureCache.ts"
Cohesion: 0.36
Nodes (7): preloadProceduralTextures(), canvasCache, openTextureDb(), persistCanvas(), preloadProceduralCanvases(), StoredCanvas, storeGeneratedCanvas()

### Community 44 - "SearchSheet.tsx"
Cohesion: 0.12
Nodes (29): GlobeOverlay(), GlobeOverlayProps, SearchSheet(), SearchSheetProps, DropdownTokens, Menu(), MenuItem, MenuProps (+21 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "globeScene.ts"
Cohesion: 0.15
Nodes (26): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+18 more)

### Community 47 - "measure-idle-pacing.mjs"
Cohesion: 0.14
Nodes (5): cdp, CdpSession, ROOT, server, tab

### Community 48 - "species.ts"
Cohesion: 0.19
Nodes (29): AssembledGeometry, assembleParts(), AXIS_DEFAULT, axisId(), ball(), box(), buildBat(), buildButterfly() (+21 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.08
Nodes (54): BESPOKE_INTERIORS, BespokeInteriorContext, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy() (+46 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.14
Nodes (12): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+4 more)

### Community 51 - "daylightBirds.ts"
Cohesion: 0.20
Nodes (10): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+2 more)

### Community 52 - "compare-metrics.mjs"
Cohesion: 0.12
Nodes (12): fakeCtx, rows, after, afterByKey, before, breaches, key(), mean() (+4 more)

### Community 53 - "placesScene.ts"
Cohesion: 0.17
Nodes (14): HIGHLIGHT_COLORS, OsmPlaceData, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, createPlacesShaderEnv() (+6 more)

### Community 54 - "timePresets.ts"
Cohesion: 0.43
Nodes (5): GOLDEN_HOUR_END, GOLDEN_HOUR_START, TIME_PRESETS, TimePreset, TimePresetKey

### Community 55 - "weatherScene.ts"
Cohesion: 0.27
Nodes (11): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights (+3 more)

### Community 58 - "plinthKit.ts"
Cohesion: 0.07
Nodes (67): boundsFitPlinth(), boundsFitStand(), clamp(), fitBoundsToPlinth(), fitBoundsToStand(), footprintInsidePolygon(), innerStandPolygon(), PlanarBounds (+59 more)

### Community 59 - "capture-visual-matrix.mjs"
Cohesion: 0.32
Nodes (7): captureState(), Cdp, main(), parseCli(), sampleEval(), sleep(), stateEval()

### Community 61 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 62 - "PlacesOverlay.tsx"
Cohesion: 0.11
Nodes (27): @phosphor-icons/react, EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES (+19 more)

### Community 63 - "run"
Cohesion: 0.36
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 64 - "motion.ts"
Cohesion: 0.08
Nodes (30): motion, ambientAudio, CARDINAL_TARGETS, CARDINALS_8, Compass(), formatBearing(), TICKS, AnimatedNumberProps (+22 more)

### Community 65 - "windowLights.ts"
Cohesion: 0.18
Nodes (14): windowPaneMaterial(), interiorParallaxShader(), bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES (+6 more)

### Community 66 - "siteAtmosphere.ts"
Cohesion: 0.19
Nodes (13): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), effectOpacity() (+5 more)

### Community 67 - "check-exposure.mjs"
Cohesion: 0.22
Nodes (8): dir, evaluate(), files, pending, send(), target, { values, positionals }, ws

### Community 68 - "webgpuPostFX.ts"
Cohesion: 0.13
Nodes (8): BloomModule, DOFModule, makeUniforms(), SSAOModule, TSL, Uniforms, WebGPUModule, WebGPUPostFX

### Community 69 - "budget.ts"
Cohesion: 0.14
Nodes (10): CREATURE_TIER_CAPS, CREATURE_TIER_LABELS, CreatureBudget, CreatureBudgetStats, CreaturePriority, CreatureReservation, PRIORITY_WEIGHT, TierCaps (+2 more)

### Community 70 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 71 - "framePacing.ts"
Cohesion: 0.31
Nodes (8): DEFAULT_QUIET_SECONDS, FramePacingInput, frameThrottleMs(), IDLE_QUIET_MS, IDLE_REDUCED_MS, IDLE_SOFTWARE_MS, stageQuiet(), StageQuietInput

### Community 72 - "TopBar.tsx"
Cohesion: 0.14
Nodes (20): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps (+12 more)

### Community 73 - ".constructor"
Cohesion: 0.21
Nodes (10): angularDistance(), createRng(), easeOutBack(), hashString(), mulberry32(), poissonInterval(), ScatterOptions, scatterRing() (+2 more)

### Community 74 - "ref_node_fs"
Cohesion: 0.33
Nodes (3): outDir, results, viewports

### Community 75 - "make-contact-sheet.mjs"
Cohesion: 0.53
Nodes (4): delta(), loadStats(), main(), parseCli()

### Community 76 - "CreatureField"
Cohesion: 0.13
Nodes (5): angleDelta(), CreatureField, SpeciesId, CreatureAnimState, encodeCreatureState()

### Community 77 - "field.ts"
Cohesion: 0.18
Nodes (12): CreatureAnimation, createCreatureMaterial(), CREATURE_ANIM_STATES, CREATURE_STATE_VALUE, CREATURE_UNIFORMS, CreatureMaterialOptions, CreatureUniforms, deformation() (+4 more)

### Community 78 - "field.ts"
Cohesion: 0.17
Nodes (13): CreatureEffectsStats, DEFAULT_DUST_COLOR, DEFAULT_RIPPLE_COLOR, DEFAULT_SPLASH_COLOR, POOL_CAPS, CreatureFieldOptions, CreatureFieldStats, M_PERCH (+5 more)

### Community 79 - "DaylightBirdsController"
Cohesion: 0.29
Nodes (3): DaylightBirdsController, paletteKeyForBiome(), tagBirdPart()

### Community 80 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 82 - "biomePalette.ts"
Cohesion: 0.12
Nodes (20): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+12 more)

### Community 83 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 84 - "ScaleRulerModal.tsx"
Cohesion: 0.11
Nodes (20): react, react-dom, Sheet(), SheetProps, SheetSide, useFocusTrap(), shouldDismiss(), clearSafeArea() (+12 more)

### Community 86 - "creaturesLab.ts"
Cohesion: 0.12
Nodes (17): KEY_DAY, KEY_NIGHT, KEY_WARM, labelled(), mountCreaturesLab(), SKY_DAWN, SKY_DAY, SKY_DUSK (+9 more)

### Community 88 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

### Community 89 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 92 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 95 - ".updateSpatial"
Cohesion: 0.27
Nodes (4): clamp01(), equalPower(), smoothBell(), smoothstep()

### Community 96 - "tide.test.ts"
Cohesion: 0.60
Nodes (4): computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE

### Community 97 - "devDependencies"
Cohesion: 0.50
Nodes (4): devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, puppeteer

### Community 98 - "PassportModal.tsx"
Cohesion: 0.11
Nodes (25): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+17 more)

### Community 101 - "getSoftTexture"
Cohesion: 0.25
Nodes (8): BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonSceneryController, HorizonUpdateOptions, weightsForBiome(), AtmosphereSite, LandmarkBiome

### Community 105 - "postfx.ts"
Cohesion: 0.11
Nodes (13): GRADE_GUARDRAILS, createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureGradeOptions, MiniatureShader, MiniatureTuning (+5 more)

## Knowledge Gaps
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `animalKit.ts`, `lightingRig.ts`, `osmSlice.ts`, `prepareCanvasTexture`, `package.json`, `layer.ts`, `CitylitEngine.ts`, `primitives.ts`, `ref_node_test`, `species.ts`, `placesInteriors.ts`, `daylightBirds.ts`, `compare-metrics.mjs`, `placesScene.ts`, `plinthKit.ts`, `vehicleLightKit.ts`, `windowLights.ts`, `siteAtmosphere.ts`, `webgpuPostFX.ts`, `field.ts`, `field.ts`, `globalIllumination.ts`, `creaturesLab.ts`, `webgpuCompat.ts`, `n8ao.d.ts`, `getSoftTexture`, `postfx.ts`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0911038961038961 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `scaleFacts.ts`, `citylit.ts`, `App.tsx`, `animalKit.ts`, `.isStudio`, `MiniaturePass`, `.fitHeroCamera`, `CitylitEngine.ts`, `citylit.ts`, `.frame`, `qualityBenchmark.ts`, `placesScene.ts`, `.constructor`, `plinthKit.ts`, `motion.ts`, `siteAtmosphere.ts`, `contact-sheet.ts`, `framePacing.ts`, `DaylightBirdsController`, `biomePalette.ts`, `.setQualityIndex`, `getSoftTexture`, `postfx.ts`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Should `scaleFacts.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12169312169312169 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `devDependencies` to `ref_node_fs`, `package.json`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07539118065433854 - nodes in this community are weakly interconnected._
- **Should `viewportFraming.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._