# Graph Report - citylit-pwa  (2026-11-23)

## Corpus Check
- 150 files · ~342,323 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1823 nodes · 5430 edges · 80 communities (68 shown, 12 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 194 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a0387919`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- finalizeTreeBatch
- citylit.ts
- PassportModal.tsx
- PlacesOverlay.tsx
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- three
- dioramaKit.ts
- animalKit.ts
- WeatherWidget.tsx
- CitylitEngine
- compilerOptions
- lightingRig.ts
- osmService.ts
- placesScene.ts
- LandmarkCard.tsx
- ScaleRulerModal.tsx
- daylightBirds.ts
- ref_node_assert
- devDependencies
- package.json
- getSoftTexture
- AmbientAudioController
- server.js
- CitylitEngine.ts
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- albedoAudit.ts
- scripts
- applyDioramaUpgrade
- with
- .frame
- ref_node_test
- windowLights.ts
- overrides
- capture-contact-sheets.mjs
- memory.js
- weatherScene.ts
- .frame
- mediaService.ts
- run
- contact-sheet.ts
- fitMath.ts
- vehicleLightKit.ts
- placesInteriors.ts
- qualityBenchmark.ts
- prepareCanvasTexture
- horizonScenery.ts
- nativeHost.ts
- three
- weatherScene.ts
- WebGPUPostFX
- WebGPUSceneRenderer
- skyEvents.ts
- DaylightBirdsController
- WebGLSceneRenderer
- LandmarkBiome
- webgpuPostFX.ts
- ambientAudio.ts
- globalIllumination.ts
- .dispose
- placesScene.ts
- windParticles.ts
- waterize
- .constructor
- SceneRenderer.ts
- PlacesOverlay.tsx
- .applyPostGrade
- tide.test.ts
- createWebGPUCompat
- markSharedGeo
- webgpuCompat.ts
- addCraftedRim
- addSiteMotion
- addWildlifeLayer

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 149 edges
2. `add()` - 102 edges
3. `M()` - 81 edges
4. `C()` - 81 edges
5. `CB()` - 71 edges
6. `R()` - 60 edges
7. `MStone()` - 57 edges
8. `mergeByMaterial()` - 57 edges
9. `addStreetLampSet()` - 56 edges
10. `App()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `memoryApiPlugin()` --calls--> `createMemoryMiddleware()`  [EXTRACTED]
  vite.config.ts → server/memory.js
- `EngineCallbacks` --references--> `PlacesSelectionInfo`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts
- `AtmosphereSite` --references--> `LandmarkBiome`  [EXTRACTED]
  src/three/siteAtmosphere.ts → src/types/citylit.ts
- `App()` --calls--> `Compass()`  [EXTRACTED]
  src/App.tsx → src/components/Compass.tsx
- `App()` --calls--> `GalleryModal()`  [EXTRACTED]
  src/App.tsx → src/components/GalleryModal.tsx

## Import Cycles
- None detected.

## Communities (80 total, 12 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (218): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+210 more)

### Community 1 - "finalizeTreeBatch"
Cohesion: 0.50
Nodes (4): finalizeTreeBatch(), stampContactShadow(), stampContactShadowsFromMeshes(), treeMaterial()

### Community 2 - "citylit.ts"
Cohesion: 0.09
Nodes (31): ambientAudio, ScaleRulerModalProps, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, FPS_OPTIONS, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS (+23 more)

### Community 3 - "PassportModal.tsx"
Cohesion: 0.06
Nodes (52): motion, react, react-dom, formatCoords(), InfoDrawer(), InfoDrawerProps, CATEGORY_COLORS, PASSPORT_TABS (+44 more)

### Community 4 - "PlacesOverlay.tsx"
Cohesion: 0.10
Nodes (32): GlobeOverlayProps, SearchSheet(), SearchSheetProps, DropdownTokens, Menu(), MenuItem, MenuProps, readDropdownTokens() (+24 more)

### Community 5 - "App.tsx"
Cohesion: 0.07
Nodes (49): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+41 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.12
Nodes (33): getGrassMaterial(), BESPOKE_INTERIORS, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers() (+25 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (20): bindVolumetricFogUniforms(), createStrataTerrainMaterial(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX (+12 more)

### Community 8 - "three"
Cohesion: 0.16
Nodes (24): AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry, GEO_AFRICA (+16 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.06
Nodes (34): accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE, getLampBulbMat() (+26 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.08
Nodes (37): WILDLIFE, WildlifeSpot, advanceAnimalTime(), AnimalIdle, AnimalKind, AnimalLodSpec, AnimalMember, AnimalPose (+29 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.08
Nodes (42): HourlyForecast(), HourlyForecastProps, AnimatedNumber(), WeatherIcon(), pad2(), PresetKey, SKY_EVENT_ICON, TIME_PRESETS (+34 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.07
Nodes (5): CompassProps, SwayItem, WetMaterialEntry, CitylitEngine, fitDioramaShadowBounds()

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "lightingRig.ts"
Cohesion: 0.12
Nodes (16): BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, configureDioramaShadow(), createBounceLight(), createRimLight(), DIORAMA_SHADOW_EXTENT (+8 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "placesScene.ts"
Cohesion: 0.17
Nodes (17): StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), pointOnRoad(), polygonShape(), readTag() (+9 more)

### Community 17 - "LandmarkCard.tsx"
Cohesion: 0.06
Nodes (39): CARDINAL_TARGETS, CARDINALS_8, Compass(), formatBearing(), TICKS, GalleryDialog(), GalleryModal(), GalleryModalProps (+31 more)

### Community 18 - "ScaleRulerModal.tsx"
Cohesion: 0.24
Nodes (11): formatMetres(), REFERENCE_HEIGHTS, referenceHeightM(), SCALE_FACTS, ScaleFact, ScaleMeasure, scaleRatio(), MAX_REFERENCE_UNITS (+3 more)

### Community 19 - "daylightBirds.ts"
Cohesion: 0.20
Nodes (10): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+2 more)

### Community 20 - "ref_node_assert"
Cohesion: 0.17
Nodes (8): EASTER_EGGS, EasterEgg, EasterEggKind, getWeatherMoment(), isSnowCode(), WEATHER_MOMENT_SITES, LiveWeatherSample, WeatherMomentKind

### Community 21 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, playwright, puppeteer

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (41): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, pastdotdev@^0.0.1, @phosphor-icons/react@2.1.10 (+33 more)

### Community 23 - "getSoftTexture"
Cohesion: 0.13
Nodes (19): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, resolveRegionalPalette(), rule(), SITE_RULES, SiteRule (+11 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.07
Nodes (30): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, glowMaterials, resetSceneDynamicLists(), swayItems (+22 more)

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
Nodes (22): ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), DEFAULT_SATURATION_REDUCTION, GRADE_GUARDRAILS (+14 more)

### Community 31 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format, format:check, lint, preview, qa:capture (+5 more)

### Community 32 - "applyDioramaUpgrade"
Cohesion: 0.12
Nodes (17): addDioramaClouds(), addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addStandUnderside(), applyDioramaUpgrade(), buildSpatialSources(), getDioramaCloudMat() (+9 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - ".frame"
Cohesion: 0.13
Nodes (3): setContactShadowFade(), streetLampNightFactor(), sunAltitudeDeg()

### Community 35 - "ref_node_test"
Cohesion: 0.13
Nodes (12): createWebGLRendererSelection(), decideRendererBackend(), GPUCapableNavigator, readRendererPreference(), RendererProbe, selectRenderer(), StubWindow, wantsMsaa() (+4 more)

### Community 36 - "windowLights.ts"
Cohesion: 0.23
Nodes (11): bake(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES, tmpLit, updateWindowLights(), WindowFacade (+3 more)

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.08
Nodes (24): CDP, clickAria(), listTargets(), run(), sleep(), acquirePageTarget(), BASELINE_PATH, captureHour() (+16 more)

### Community 39 - "memory.js"
Cohesion: 0.36
Nodes (11): createMemoryMiddleware(), getClient(), HttpError, isTimestamp(), optionalEnum(), optionalInt(), optionalString(), pick() (+3 more)

### Community 40 - "weatherScene.ts"
Cohesion: 0.16
Nodes (14): monthToSeasonWeights(), SeasonWeights, MID_MONTH_DAY, solarDeclination(), southernSunDirection(), CloudAssets, CloudPuffInstance, createCloudPuffMesh() (+6 more)

### Community 44 - "mediaService.ts"
Cohesion: 0.27
Nodes (8): cleanCaption(), CommonsImageInfo, CommonsPage, loadLandmarkMedia(), MEDIA_CACHE, stripHtml(), SUMMARY_CACHE, WikiSummary

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 47 - "fitMath.ts"
Cohesion: 0.36
Nodes (8): boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT, PLINTH_INNER_HALF_EXTENT, PlinthFit

### Community 48 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.09
Nodes (50): buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats(), fBench() (+42 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.14
Nodes (12): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+4 more)

### Community 51 - "prepareCanvasTexture"
Cohesion: 0.06
Nodes (59): applyDissolveToShader(), cascadeize(), configureTextureQuality(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture() (+51 more)

### Community 52 - "horizonScenery.ts"
Cohesion: 0.28
Nodes (8): RegionalPaletteKey, BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonUpdateOptions, SIGNATURE_PARTS, SignaturePart, weightsForBiome()

### Community 53 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 54 - "three"
Cohesion: 0.12
Nodes (11): three, createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureShader, MiniatureTuning, n8ao (+3 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.33
Nodes (9): getSeasonMonth(), isSpeciesBlooming(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, setSeasonMonth(), addTreeRing() (+1 more)

### Community 58 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 59 - "DaylightBirdsController"
Cohesion: 0.32
Nodes (3): DaylightBirdsController, paletteKeyForBiome(), tagBirdPart()

### Community 61 - "LandmarkBiome"
Cohesion: 0.16
Nodes (5): extractRegionName(), SiteProfile, HorizonSceneryController, AmbientSiteProfile, LandmarkBiome

### Community 62 - "webgpuPostFX.ts"
Cohesion: 0.15
Nodes (8): MiniatureGradeOptions, BloomModule, DOFModule, makeUniforms(), SSAOModule, TSL, Uniforms, WebGPUModule

### Community 63 - "ambientAudio.ts"
Cohesion: 0.13
Nodes (15): AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell(), smoothstep() (+7 more)

### Community 64 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 66 - "placesScene.ts"
Cohesion: 0.19
Nodes (14): OsmPlaceData, OsmSliceResult, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, createPlacesShaderEnv() (+6 more)

### Community 67 - "windParticles.ts"
Cohesion: 0.31
Nodes (8): GlobeController, BIOME_PALETTES, createLeafWispTexture(), createWindParticles(), seeded(), WindParticlesController, WindParticlesUpdateOptions, QualityIndex

### Community 71 - "PlacesOverlay.tsx"
Cohesion: 0.21
Nodes (12): @phosphor-icons/react, MOBILE_WEATHER_ICONS, PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIconCondition, WeatherIconProps (+4 more)

### Community 73 - "tide.test.ts"
Cohesion: 0.60
Nodes (4): computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE

### Community 75 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 76 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 77 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

### Community 78 - "addCraftedRim"
Cohesion: 0.60
Nodes (5): addCraftedRim(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata()

### Community 79 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

### Community 80 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

## Knowledge Gaps
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `three` to `landmarksB.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `three`, `dioramaKit.ts`, `animalKit.ts`, `lightingRig.ts`, `placesScene.ts`, `daylightBirds.ts`, `package.json`, `CitylitEngine.ts`, `ref_node_test`, `windowLights.ts`, `weatherScene.ts`, `vehicleLightKit.ts`, `placesInteriors.ts`, `prepareCanvasTexture`, `horizonScenery.ts`, `webgpuPostFX.ts`, `globalIllumination.ts`, `placesScene.ts`, `windParticles.ts`, `SceneRenderer.ts`, `webgpuCompat.ts`?**
  _High betweenness centrality (0.235) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.060476190476190475 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `citylit.ts`, `App.tsx`, `animalKit.ts`, `WeatherWidget.tsx`, `LandmarkCard.tsx`, `ref_node_assert`, `getSoftTexture`, `CitylitEngine.ts`, `.frame`, `ref_node_test`, `.frame`, `contact-sheet.ts`, `qualityBenchmark.ts`, `prepareCanvasTexture`, `three`, `DaylightBirdsController`, `LandmarkBiome`, `.dispose`, `placesScene.ts`, `windParticles.ts`, `.constructor`, `.applyPostGrade`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08571428571428572 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `devDependencies` to `capture-contact-sheets.mjs`, `package.json`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
- **Should `PlacesOverlay.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10121457489878542 - nodes in this community are weakly interconnected._