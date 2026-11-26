# Graph Report - citylit-pwa  (2026-11-26)

## Corpus Check
- 223 files · ~460,282 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .woff2 4, (none) 3, .css 2)

## Summary
- 2357 nodes · 6798 edges · 87 communities (82 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 236 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `511c6181`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- PassportModal.tsx
- citylit.ts
- standFootprint.ts
- server.js
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- windowLights.ts
- dioramaKit.ts
- animalKit.ts
- WeatherWidget.tsx
- CitylitEngine
- compilerOptions
- standAudit.ts
- osmService.ts
- osmSlice.ts
- ScaleRulerModal.tsx
- viewportFraming.ts
- skyEvents.ts
- prepareCanvasTexture
- playwright
- package.json
- LandmarkBiome
- AmbientAudioController
- markSharedGeo
- CitylitEngine.ts
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- albedoAudit.ts
- scripts
- applyDioramaUpgrade
- with
- placesClouds.ts
- postfx.ts
- LandmarkCard.tsx
- overrides
- capture-contact-sheets.mjs
- memory.js
- plinthKit.ts
- .frame
- vehicleLightKit.ts
- run
- globeScene.ts
- measure-idle-pacing.mjs
- species.ts
- placesInteriors.ts
- qualityBenchmark.ts
- DaylightBirdsController
- compare-metrics.mjs
- globalIllumination.ts
- MiniaturePass
- weatherScene.ts
- mediaService.ts
- WebGPUSceneRenderer
- ref_node_assert
- capture-visual-matrix.mjs
- WebGLSceneRenderer
- textureCache.ts
- PlacesOverlay.tsx
- run
- motion.ts
- placesScene.ts
- siteAtmosphere.ts
- check-exposure.mjs
- react
- layer.ts
- contact-sheet.ts
- framePacing.ts
- pastdotdev
- .constructor
- run-qa-capture.mjs
- make-contact-sheet.mjs
- CreatureField
- n8ao.d.ts
- addWildlifeLayer
- biomePalette.ts
- creaturesLab.ts
- cloudShape.ts
- roadRibbon.ts
- nativeHost.ts
- addCraftedRim
- InfoDrawer.tsx
- addSiteMotion

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 160 edges
2. `add()` - 104 edges
3. `M()` - 83 edges
4. `C()` - 82 edges
5. `CB()` - 71 edges
6. `mergeByMaterial()` - 60 edges
7. `App()` - 60 edges
8. `R()` - 59 edges
9. `addStreetLampSet()` - 56 edges
10. `MStone()` - 56 edges

## Surprising Connections (you probably didn't know these)
- `memoryApiPlugin()` --calls--> `createMemoryMiddleware()`  [EXTRACTED]
  vite.config.ts → server/memory.js
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `AudioVisualizerBarProps` --references--> `ThemeSetting`  [EXTRACTED]
  src/components/AudioVisualizerBar.tsx → src/types/citylit.ts
- `TopBarProps` --references--> `ThemeSetting`  [EXTRACTED]
  src/components/TopBar.tsx → src/types/citylit.ts
- `AtmosphereSite` --references--> `LandmarkBiome`  [EXTRACTED]
  src/three/siteAtmosphere.ts → src/types/citylit.ts

## Import Cycles
- None detected.

## Communities (87 total, 5 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (224): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+216 more)

### Community 1 - "PassportModal.tsx"
Cohesion: 0.09
Nodes (38): GlobeOverlay(), GlobeOverlayProps, CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportTab, ProvinceRing(), ProvinceRingProps (+30 more)

### Community 2 - "citylit.ts"
Cohesion: 0.07
Nodes (35): ambientAudio, AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener, UI_CUE_CATEGORY (+27 more)

### Community 3 - "standFootprint.ts"
Cohesion: 0.16
Nodes (27): boundsFitPlinth(), boundsFitStand(), fitBoundsToPlinth(), fitBoundsToStand(), footprintInsidePolygon(), innerStandPolygon(), PlanarBounds, PLINTH_FRAME_WIDTH (+19 more)

### Community 4 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 5 - "App.tsx"
Cohesion: 0.07
Nodes (48): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+40 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (35): getGrassMaterial(), createCloudPuffMesh(), createSliceCloudLayer(), BESPOKE_INTERIORS, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions (+27 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (20): bindVolumetricFogUniforms(), createStrataTerrainMaterial(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX (+12 more)

### Community 8 - "windowLights.ts"
Cohesion: 0.18
Nodes (14): windowPaneMaterial(), interiorParallaxShader(), bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES (+6 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (39): STAND_BLOCK_HALF, accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE (+31 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.08
Nodes (32): advanceAnimalTime(), AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffold, AnimalScaffoldSpec, animalSeasonForMonth(), AnimalVec3 (+24 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.07
Nodes (50): HourlyForecast(), HourlyForecastProps, WeatherIcon(), pad2(), PRESET_ICONS, PresetKey, SKY_EVENT_ICON, TIME_PRESETS (+42 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.06
Nodes (5): UiInsets, SwayItem, WetMaterialEntry, CitylitEngine, fitDioramaShadowBounds()

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "standAudit.ts"
Cohesion: 0.25
Nodes (7): standPolygonOverflow(), auditStandContainment(), isStandGeometry(), labelFor(), StandAudit, StandAuditOptions, StandOverflow

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.18
Nodes (17): StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, pointOnRoad(), polygonShape() (+9 more)

### Community 17 - "ScaleRulerModal.tsx"
Cohesion: 0.23
Nodes (11): REFERENCE_HEIGHTS, referenceHeightM(), SCALE_FACTS, ScaleFact, ScaleMeasure, scaleRatio(), MAX_REFERENCE_UNITS, metresToUnits() (+3 more)

### Community 18 - "viewportFraming.ts"
Cohesion: 0.13
Nodes (23): clampShift(), EMPTY_INSETS, FramingPlan, freeFitFactor(), freeRect(), isCompactViewport(), LayoutMode, layoutModeFor() (+15 more)

### Community 19 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 20 - "prepareCanvasTexture"
Cohesion: 0.11
Nodes (38): createHeroStrataMaterial(), getRoofDirtMap(), applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture() (+30 more)

### Community 21 - "playwright"
Cohesion: 0.08
Nodes (21): playwright, errors, errors, names, errors, failed, report, sites (+13 more)

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (39): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, @phosphor-icons/react@2.1.10, react@19.3.1 (+31 more)

### Community 23 - "LandmarkBiome"
Cohesion: 0.14
Nodes (22): IDLES, KINDS, SEASONS, WILDLIFE, WildlifeSpot, DAY, AnimalIdle, AnimalKind (+14 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.10
Nodes (8): AmbientAudioController, clamp01(), equalPower(), extractRegionName(), smoothBell(), smoothstep(), SiteProfile, AmbientSiteProfile

### Community 25 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.04
Nodes (66): three, BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, resetSceneDynamicLists(), audioForward (+58 more)

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
Cohesion: 0.18
Nodes (23): ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), conditionSurfaceHex(), DEFAULT_SATURATION_REDUCTION (+15 more)

### Community 31 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, dev, format, format:check, lint, preview, qa:capture (+6 more)

### Community 32 - "applyDioramaUpgrade"
Cohesion: 0.18
Nodes (18): addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), applyDioramaUpgrade(), buildSpatialSources(), finalizeLandmarkGroup(), getSiteProfile() (+10 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "placesClouds.ts"
Cohesion: 0.33
Nodes (5): CloudDrift, cloudDrift(), CloudAssets, CloudPuffInstance, SliceCloudLayer

### Community 35 - "postfx.ts"
Cohesion: 0.06
Nodes (30): createDitherPass(), createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureGradeOptions, MiniatureShader, MiniatureTuning (+22 more)

### Community 36 - "LandmarkCard.tsx"
Cohesion: 0.12
Nodes (21): airQualityInsight(), CAMERA_PRESETS, cardContentVariants, CARDINALS, cardItemVariants, getCategoryMeta(), LandmarkCard(), LandmarkCardProps (+13 more)

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.17
Nodes (16): acquirePageTarget(), BASELINE_PATH, captureHour(), CdpSession, checkPerfGuardrails(), HOUR_KEYS, main(), pad() (+8 more)

### Community 39 - "memory.js"
Cohesion: 0.36
Nodes (11): createMemoryMiddleware(), getClient(), HttpError, isTimestamp(), optionalEnum(), optionalInt(), optionalString(), pick() (+3 more)

### Community 40 - "plinthKit.ts"
Cohesion: 0.13
Nodes (34): clamp(), bouldersGroundHeight(), fbm2(), formatDmsCoords(), getPilotGroundHeightFn(), getPlinthOutlinePoints, hash2(), krugerGroundHeight() (+26 more)

### Community 42 - ".frame"
Cohesion: 0.08
Nodes (5): setContactShadowFade(), updateWetSurfaces(), setSpatialListener(), updateShadowMood(), SceneRenderer

### Community 44 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "globeScene.ts"
Cohesion: 0.16
Nodes (24): AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry, GEO_AFRICA (+16 more)

### Community 47 - "measure-idle-pacing.mjs"
Cohesion: 0.17
Nodes (5): cdp, CdpSession, ROOT, server, tab

### Community 48 - "species.ts"
Cohesion: 0.17
Nodes (31): CreatureAnimation, AssembledGeometry, assembleParts(), AXIS_DEFAULT, axisId(), ball(), box(), buildBat() (+23 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.09
Nodes (50): buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats(), fBench() (+42 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.09
Nodes (14): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+6 more)

### Community 51 - "DaylightBirdsController"
Cohesion: 0.13
Nodes (13): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+5 more)

### Community 52 - "compare-metrics.mjs"
Cohesion: 0.12
Nodes (12): fakeCtx, rows, after, afterByKey, before, breaches, key(), mean() (+4 more)

### Community 53 - "globalIllumination.ts"
Cohesion: 0.08
Nodes (20): createContactShadowMaterial(), attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin (+12 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.27
Nodes (11): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights (+3 more)

### Community 56 - "mediaService.ts"
Cohesion: 0.27
Nodes (8): cleanCaption(), CommonsImageInfo, CommonsPage, loadLandmarkMedia(), MEDIA_CACHE, stripHtml(), SUMMARY_CACHE, WikiSummary

### Community 57 - "WebGPUSceneRenderer"
Cohesion: 0.05
Nodes (23): WebGPUSceneRenderer, ALPHA_UNIFORMS, COLOR_UNIFORMS, createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform() (+15 more)

### Community 58 - "ref_node_assert"
Cohesion: 0.10
Nodes (18): condenseHistoryText(), splitSentences(), bridgeStayAnchors(), catenaryArchHeight(), StayAnchor, MID_MONTH_DAY, solarDeclination(), southernSunDirection() (+10 more)

### Community 59 - "capture-visual-matrix.mjs"
Cohesion: 0.32
Nodes (7): captureState(), Cdp, main(), parseCli(), sampleEval(), sleep(), stateEval()

### Community 61 - "textureCache.ts"
Cohesion: 0.43
Nodes (6): canvasCache, openTextureDb(), persistCanvas(), preloadProceduralCanvases(), StoredCanvas, storeGeneratedCanvas()

### Community 62 - "PlacesOverlay.tsx"
Cohesion: 0.10
Nodes (28): @phosphor-icons/react, EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES (+20 more)

### Community 63 - "run"
Cohesion: 0.32
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 64 - "motion.ts"
Cohesion: 0.05
Nodes (46): motion, AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8, Compass() (+38 more)

### Community 65 - "placesScene.ts"
Cohesion: 0.17
Nodes (14): OsmPlaceData, BespokeInteriorKind, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, createPlacesShaderEnv() (+6 more)

### Community 66 - "siteAtmosphere.ts"
Cohesion: 0.17
Nodes (14): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereSite, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+6 more)

### Community 67 - "check-exposure.mjs"
Cohesion: 0.22
Nodes (8): dir, evaluate(), files, pending, send(), target, { values, positionals }, ws

### Community 68 - "react"
Cohesion: 0.12
Nodes (20): react-dom, Sheet(), SheetProps, SheetSide, useFocusTrap(), shouldDismiss(), Z, clearSafeArea() (+12 more)

### Community 69 - "layer.ts"
Cohesion: 0.07
Nodes (27): addCreatureLife(), CREATURE_TIER_CAPS, CREATURE_TIER_LABELS, CreatureBudget, CreatureBudgetStats, CreaturePriority, CreatureReservation, CreatureTier (+19 more)

### Community 70 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 71 - "framePacing.ts"
Cohesion: 0.31
Nodes (8): DEFAULT_QUIET_SECONDS, FramePacingInput, frameThrottleMs(), IDLE_QUIET_MS, IDLE_REDUCED_MS, IDLE_SOFTWARE_MS, stageQuiet(), StageQuietInput

### Community 73 - ".constructor"
Cohesion: 0.19
Nodes (10): angularDistance(), createRng(), easeOutBack(), hashString(), mulberry32(), poissonInterval(), ScatterOptions, scatterRing() (+2 more)

### Community 74 - "run-qa-capture.mjs"
Cohesion: 0.11
Nodes (15): devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, puppeteer, outDir, results, viewports, startQaServer() (+7 more)

### Community 75 - "make-contact-sheet.mjs"
Cohesion: 0.53
Nodes (4): delta(), loadStats(), main(), parseCli()

### Community 76 - "CreatureField"
Cohesion: 0.10
Nodes (20): angleDelta(), CreatureField, CreatureFieldOptions, CreatureFieldStats, M_PERCH, CreatureZone, SpeciesId, createCreatureMaterial() (+12 more)

### Community 77 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 78 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

### Community 82 - "biomePalette.ts"
Cohesion: 0.12
Nodes (20): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+12 more)

### Community 86 - "creaturesLab.ts"
Cohesion: 0.08
Nodes (23): KEY_DAY, KEY_NIGHT, KEY_WARM, labelled(), mountCreaturesLab(), SKY_DAWN, SKY_DAY, SKY_DUSK (+15 more)

### Community 87 - "cloudShape.ts"
Cohesion: 0.36
Nodes (7): cloudOpacity(), LOBES, sampleCloudDensity(), smoothstep(), addDioramaClouds(), getDioramaCloudMat(), getDioramaCloudTexture()

### Community 88 - "roadRibbon.ts"
Cohesion: 0.47
Nodes (4): catmullRom(), RoadControlPoint, RoadSample, sampleRoadRibbon()

### Community 92 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 93 - "addCraftedRim"
Cohesion: 0.36
Nodes (8): addCraftedRim(), addRimEdgeContinuity(), addSquareRim(), getRimMaterial(), getRimPalette(), paintRadial(), paintStrata(), rimEdgeColor()

### Community 98 - "InfoDrawer.tsx"
Cohesion: 0.08
Nodes (39): react, formatCoords(), INFO_TABS, InfoDrawer(), InfoDrawerProps, InfoDrawerTab, barWidth(), REFERENCE_OPTIONS (+31 more)

### Community 103 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `CitylitEngine.ts` to `landmarksB.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `windowLights.ts`, `dioramaKit.ts`, `animalKit.ts`, `WeatherWidget.tsx`, `standAudit.ts`, `osmSlice.ts`, `prepareCanvasTexture`, `package.json`, `placesClouds.ts`, `postfx.ts`, `plinthKit.ts`, `vehicleLightKit.ts`, `globeScene.ts`, `species.ts`, `placesInteriors.ts`, `DaylightBirdsController`, `compare-metrics.mjs`, `globalIllumination.ts`, `WebGPUSceneRenderer`, `placesScene.ts`, `siteAtmosphere.ts`, `layer.ts`, `CreatureField`, `n8ao.d.ts`, `creaturesLab.ts`?**
  _High betweenness centrality (0.270) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05800865800865801 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `citylit.ts`, `standFootprint.ts`, `App.tsx`, `animalKit.ts`, `WeatherWidget.tsx`, `standAudit.ts`, `viewportFraming.ts`, `CitylitEngine.ts`, `postfx.ts`, `LandmarkCard.tsx`, `.frame`, `qualityBenchmark.ts`, `DaylightBirdsController`, `globalIllumination.ts`, `MiniaturePass`, `motion.ts`, `placesScene.ts`, `siteAtmosphere.ts`, `contact-sheet.ts`, `framePacing.ts`, `biomePalette.ts`, `InfoDrawer.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08603145235892692 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `run-qa-capture.mjs` to `package.json`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0679563492063492 - nodes in this community are weakly interconnected._