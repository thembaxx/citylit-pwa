# Graph Report - citylit-pwa  (2026-11-23)

## Corpus Check
- 149 files · ~341,639 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1815 nodes · 5415 edges · 84 communities (70 shown, 14 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 194 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `939aba1e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- finalizeTreeBatch
- citylit.ts
- ScaleRulerModal.tsx
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
- motion.ts
- osmService.ts
- placesScene.ts
- LandmarkCard.tsx
- ScaleRulerModal.tsx
- daylightBirds.ts
- PassportModal.tsx
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
- createRenderer.ts
- .updateSpatial
- overrides
- capture-contact-sheets.mjs
- memory.js
- placesClouds.ts
- SceneRenderer
- siteAtmosphere.ts
- run
- contact-sheet.ts
- fitMath.ts
- vehicleLightKit.ts
- placesInteriors.ts
- qualityBenchmark.ts
- prepareCanvasTexture
- nativeHost.ts
- n8ao.d.ts
- weatherScene.ts
- .isStudio
- WebGPUSceneRenderer
- skyEvents.ts
- DaylightBirdsController
- WebGLSceneRenderer
- LandmarkBiome
- webgpuPostFX.ts
- ambientAudio.ts
- globalIllumination.ts
- .showLandmarkImmediate
- placesScene.ts
- windParticles.ts
- .setQualityIndex
- .constructor
- SceneRenderer.ts
- PlacesOverlay.tsx
- .applyPostGrade
- tide.test.ts
- postfx.ts
- createWebGPUCompat
- markSharedGeo
- webgpuCompat.ts
- addCraftedRim
- addSiteMotion
- addWildlifeLayer
- SliceSharedAssets
- addStandUnderside
- addTreeRing

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 149 edges
2. `add()` - 102 edges
3. `C()` - 81 edges
4. `M()` - 81 edges
5. `CB()` - 71 edges
6. `R()` - 60 edges
7. `mergeByMaterial()` - 57 edges
8. `MStone()` - 57 edges
9. `addStreetLampSet()` - 56 edges
10. `App()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `memoryApiPlugin()` --calls--> `createMemoryMiddleware()`  [EXTRACTED]
  vite.config.ts → server/memory.js
- `ScaleReferenceEntry` --references--> `ScaleReferenceKind`  [EXTRACTED]
  src/three/builders/dioramaKit.ts → src/types/citylit.ts
- `App()` --calls--> `Compass()`  [EXTRACTED]
  src/App.tsx → src/components/Compass.tsx
- `App()` --calls--> `InfoDrawer()`  [EXTRACTED]
  src/App.tsx → src/components/InfoDrawer.tsx
- `App()` --calls--> `LandmarkCard()`  [EXTRACTED]
  src/App.tsx → src/components/LandmarkCard.tsx

## Import Cycles
- None detected.

## Communities (84 total, 14 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (216): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+208 more)

### Community 1 - "finalizeTreeBatch"
Cohesion: 0.50
Nodes (4): finalizeTreeBatch(), stampContactShadow(), stampContactShadowsFromMeshes(), treeMaterial()

### Community 2 - "citylit.ts"
Cohesion: 0.12
Nodes (22): BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, FPS_OPTIONS, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), RENDERER_OPTIONS (+14 more)

### Community 3 - "ScaleRulerModal.tsx"
Cohesion: 0.08
Nodes (30): react, react-dom, barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS (+22 more)

### Community 4 - "PlacesOverlay.tsx"
Cohesion: 0.12
Nodes (25): GlobeOverlayProps, SearchSheet(), SearchSheetProps, MenuItem, LANDMARK_TAGS, LANDMARKS, PROVINCES, IDLES (+17 more)

### Community 5 - "App.tsx"
Cohesion: 0.08
Nodes (44): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+36 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (35): getGrassMaterial(), createCloudPuffMesh(), createSliceCloudLayer(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture() (+27 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (19): PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL (+11 more)

### Community 8 - "three"
Cohesion: 0.15
Nodes (25): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+17 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.06
Nodes (35): accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE, getLampBulbMat() (+27 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.08
Nodes (37): WILDLIFE, WildlifeSpot, advanceAnimalTime(), AnimalIdle, AnimalKind, AnimalLodSpec, AnimalMember, AnimalPose (+29 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.07
Nodes (51): HourlyForecast(), HourlyForecastProps, AnimatedNumber(), WeatherIcon(), pad2(), PresetKey, SKY_EVENT_ICON, TIME_PRESETS (+43 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "motion.ts"
Cohesion: 0.07
Nodes (37): motion, ambientAudio, AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8, Compass() (+29 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "placesScene.ts"
Cohesion: 0.19
Nodes (16): StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, pointOnRoad(), polygonShape() (+8 more)

### Community 17 - "LandmarkCard.tsx"
Cohesion: 0.07
Nodes (33): GalleryDialog(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard() (+25 more)

### Community 18 - "ScaleRulerModal.tsx"
Cohesion: 0.24
Nodes (11): formatMetres(), REFERENCE_HEIGHTS, referenceHeightM(), SCALE_FACTS, ScaleFact, ScaleMeasure, scaleRatio(), MAX_REFERENCE_UNITS (+3 more)

### Community 19 - "daylightBirds.ts"
Cohesion: 0.20
Nodes (10): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+2 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.10
Nodes (24): formatCoords(), InfoDrawer(), InfoDrawerProps, CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportTab, ProvinceRing() (+16 more)

### Community 21 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, playwright, puppeteer

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (41): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, pastdotdev@^0.0.1, @phosphor-icons/react@2.1.10 (+33 more)

### Community 23 - "getSoftTexture"
Cohesion: 0.10
Nodes (27): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+19 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.14
Nodes (3): AmbientAudioController, SiteProfile, AmbientSiteProfile

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.06
Nodes (42): LANDMARK_BUILDERS, glowMaterials, resetSceneDynamicLists(), swayItems, updateWetSurfaces(), wetMaterials, audioForward, audioRight (+34 more)

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
Cohesion: 0.13
Nodes (16): addDioramaClouds(), addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), applyDioramaUpgrade(), buildSpatialSources(), getDioramaCloudMat() (+8 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 35 - "createRenderer.ts"
Cohesion: 0.33
Nodes (6): createWebGLRendererSelection(), GPUCapableNavigator, readRendererPreference(), selectRenderer(), wantsMsaa(), RendererPreference

### Community 36 - ".updateSpatial"
Cohesion: 0.31
Nodes (4): clamp01(), equalPower(), smoothBell(), smoothstep()

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.08
Nodes (24): CDP, clickAria(), listTargets(), run(), sleep(), acquirePageTarget(), BASELINE_PATH, captureHour() (+16 more)

### Community 39 - "memory.js"
Cohesion: 0.36
Nodes (11): createMemoryMiddleware(), getClient(), HttpError, isTimestamp(), optionalEnum(), optionalInt(), optionalString(), pick() (+3 more)

### Community 40 - "placesClouds.ts"
Cohesion: 0.40
Nodes (3): CloudAssets, CloudPuffInstance, SliceCloudLayer

### Community 44 - "siteAtmosphere.ts"
Cohesion: 0.15
Nodes (16): SKY_NOISE_GLSL, AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+8 more)

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
Nodes (51): BESPOKE_INTERIORS, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats() (+43 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.14
Nodes (12): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+4 more)

### Community 51 - "prepareCanvasTexture"
Cohesion: 0.06
Nodes (56): windowPaneMaterial(), applyDissolveToShader(), cascadeize(), configureTextureQuality(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture() (+48 more)

### Community 53 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 54 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 55 - "weatherScene.ts"
Cohesion: 0.36
Nodes (8): getSeasonMonth(), isSpeciesBlooming(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights, setSeasonMonth()

### Community 58 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 59 - "DaylightBirdsController"
Cohesion: 0.20
Nodes (3): DaylightBirdsController, paletteKeyForBiome(), tagBirdPart()

### Community 61 - "LandmarkBiome"
Cohesion: 0.29
Nodes (4): extractRegionName(), HorizonSceneryController, AtmosphereSite, LandmarkBiome

### Community 62 - "webgpuPostFX.ts"
Cohesion: 0.13
Nodes (8): BloomModule, DOFModule, makeUniforms(), SSAOModule, TSL, Uniforms, WebGPUModule, WebGPUPostFX

### Community 63 - "ambientAudio.ts"
Cohesion: 0.18
Nodes (11): AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener, UI_CUE_CATEGORY, UiCueCategory (+3 more)

### Community 64 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 65 - ".showLandmarkImmediate"
Cohesion: 0.19
Nodes (3): setContactShadowFade(), SwayItem, WetMaterialEntry

### Community 66 - "placesScene.ts"
Cohesion: 0.19
Nodes (14): OsmPlaceData, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, bindVolumetricFogUniforms(), createPlacesShaderEnv() (+6 more)

### Community 67 - "windParticles.ts"
Cohesion: 0.16
Nodes (13): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), GlobeController, WU, BIOME_PALETTES, createLeafWispTexture() (+5 more)

### Community 70 - "SceneRenderer.ts"
Cohesion: 0.16
Nodes (6): createSceneRenderer(), AnyRenderer, PMREMGeneratorLike, PMREMResult, RendererBackend, RendererSelection

### Community 71 - "PlacesOverlay.tsx"
Cohesion: 0.22
Nodes (11): @phosphor-icons/react, MOBILE_WEATHER_ICONS, PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIconCondition, WeatherIconProps (+3 more)

### Community 73 - "tide.test.ts"
Cohesion: 0.60
Nodes (4): computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE

### Community 74 - "postfx.ts"
Cohesion: 0.18
Nodes (7): createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureGradeOptions, MiniatureShader, MiniatureTuning

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

### Community 81 - "SliceSharedAssets"
Cohesion: 0.67
Nodes (3): BespokeInteriorContext, PlacesShaderEnvironment, SliceSharedAssets

## Knowledge Gaps
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `three` to `landmarksB.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `animalKit.ts`, `WeatherWidget.tsx`, `placesScene.ts`, `daylightBirds.ts`, `package.json`, `getSoftTexture`, `CitylitEngine.ts`, `createRenderer.ts`, `placesClouds.ts`, `siteAtmosphere.ts`, `vehicleLightKit.ts`, `placesInteriors.ts`, `prepareCanvasTexture`, `n8ao.d.ts`, `webgpuPostFX.ts`, `globalIllumination.ts`, `placesScene.ts`, `windParticles.ts`, `SceneRenderer.ts`, `postfx.ts`, `webgpuCompat.ts`?**
  _High betweenness centrality (0.203) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061245101603846 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `citylit.ts`, `ScaleRulerModal.tsx`, `App.tsx`, `animalKit.ts`, `WeatherWidget.tsx`, `motion.ts`, `LandmarkCard.tsx`, `getSoftTexture`, `CitylitEngine.ts`, `.frame`, `SceneRenderer`, `siteAtmosphere.ts`, `contact-sheet.ts`, `qualityBenchmark.ts`, `.isStudio`, `DaylightBirdsController`, `LandmarkBiome`, `.showLandmarkImmediate`, `placesScene.ts`, `windParticles.ts`, `.setQualityIndex`, `.constructor`, `SceneRenderer.ts`, `.applyPostGrade`, `postfx.ts`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12318840579710146 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `devDependencies` to `capture-contact-sheets.mjs`, `package.json`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `ScaleRulerModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08205128205128205 - nodes in this community are weakly interconnected._
- **Should `PlacesOverlay.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11587301587301588 - nodes in this community are weakly interconnected._