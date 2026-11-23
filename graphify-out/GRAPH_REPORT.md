# Graph Report - citylit-pwa  (2026-11-23)

## Corpus Check
- 148 files · ~331,403 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1799 nodes · 5385 edges · 71 communities (62 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 192 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d92b293c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- getSoftTexture
- citylit.ts
- .showLandmarkImmediate
- PlacesOverlay.tsx
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- TopBar.tsx
- dioramaKit.ts
- animalKit.ts
- WeatherWidget.tsx
- CitylitEngine
- compilerOptions
- motion.ts
- osmService.ts
- osmSlice.ts
- LandmarkCard.tsx
- ScaleRulerModal.tsx
- DaylightBirdsController
- PassportModal.tsx
- devDependencies
- package.json
- globeScene.ts
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
- siteVisuals.ts
- SceneRenderer.ts
- .updateSpatial
- overrides
- capture-contact-sheets.mjs
- memory.js
- placesClouds.ts
- .frame
- siteAtmosphere.ts
- run
- contact-sheet.ts
- citylit.ts
- vehicleLightKit.ts
- placesInteriors.ts
- qualityBenchmark.ts
- prepareCanvasTexture
- .setQualityIndex
- webgpuCompat.ts
- three
- weatherScene.ts
- WebGPUSceneRenderer
- skyEvents.ts
- placesScene.ts
- WebGLSceneRenderer
- LandmarkBiome
- ambientAudio.ts
- .constructor
- WebGPUPostFX
- createWebGPUCompat
- applyDissolveToShader
- AmbientSiteProfile
- tide.test.ts
- addCraftedRim
- addSiteMotion
- addWildlifeLayer

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 146 edges
2. `add()` - 103 edges
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
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `WildlifeSpot` --references--> `LandmarkBiome`  [EXTRACTED]
  src/data/wildlife.ts → src/types/citylit.ts
- `hole()` --calls--> `getSoftTexture()`  [EXTRACTED]
  src/three/builders/landmarksA.ts → src/three/shaders.ts
- `AtmosphereSite` --references--> `LandmarkBiome`  [EXTRACTED]
  src/three/siteAtmosphere.ts → src/types/citylit.ts

## Import Cycles
- None detected.

## Communities (71 total, 9 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (219): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+211 more)

### Community 1 - "getSoftTexture"
Cohesion: 0.14
Nodes (17): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+9 more)

### Community 2 - "citylit.ts"
Cohesion: 0.08
Nodes (31): motion, ambientAudio, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets() (+23 more)

### Community 4 - "PlacesOverlay.tsx"
Cohesion: 0.11
Nodes (29): GlobeOverlayProps, SearchSheet(), SearchSheetProps, DropdownTokens, Menu(), MenuItem, MenuProps, readDropdownTokens() (+21 more)

### Community 5 - "App.tsx"
Cohesion: 0.08
Nodes (43): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+35 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.12
Nodes (32): getGrassMaterial(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers(), addInstancedRocks() (+24 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (20): bindVolumetricFogUniforms(), createStrataTerrainMaterial(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX (+12 more)

### Community 8 - "TopBar.tsx"
Cohesion: 0.15
Nodes (19): AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps, swapTransition (+11 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (45): accentFor(), addLampWaterReflections(), addWetRoadStreaks(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec (+37 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.07
Nodes (40): IDLES, KINDS, SEASONS, WILDLIFE, WildlifeSpot, advanceAnimalTime(), AnimalIdle, AnimalKind (+32 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.10
Nodes (31): @phosphor-icons/react, HourlyForecast(), HourlyForecastProps, MOBILE_WEATHER_ICONS, PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION (+23 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.06
Nodes (4): CitylitEngine, fitDioramaShadowBounds(), NoteCategory, QualitySetting

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "motion.ts"
Cohesion: 0.07
Nodes (33): react, react-dom, CARDINAL_TARGETS, CARDINALS_8, Compass(), CompassProps, formatBearing(), TICKS (+25 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.17
Nodes (17): StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), pointOnRoad(), polygonShape(), readTag() (+9 more)

### Community 17 - "LandmarkCard.tsx"
Cohesion: 0.08
Nodes (31): GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants (+23 more)

### Community 18 - "ScaleRulerModal.tsx"
Cohesion: 0.12
Nodes (23): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), ScaleRulerModalProps (+15 more)

### Community 19 - "DaylightBirdsController"
Cohesion: 0.13
Nodes (13): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+5 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.10
Nodes (25): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+17 more)

### Community 21 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, playwright, puppeteer

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (41): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, pastdotdev@^0.0.1, @phosphor-icons/react@2.1.10 (+33 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.07
Nodes (41): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+33 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.05
Nodes (51): boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT, PLINTH_INNER_HALF_EXTENT, PlinthFit (+43 more)

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
Nodes (19): addDioramaClouds(), addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), applyDioramaUpgrade(), buildSpatialSources(), getDioramaCloudMat(), getSiteProfile() (+11 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "siteVisuals.ts"
Cohesion: 0.24
Nodes (10): blendHex(), DEFAULT_BY_BIOME, getSiteVisualProfile(), normalizeSiteVisualKey(), REGIONAL_BLEND_WEIGHTS, RegionalColourField, SITE_VISUALS_MAP, SitePointLightSpec (+2 more)

### Community 35 - "SceneRenderer.ts"
Cohesion: 0.10
Nodes (15): createDitherPass(), createMiniaturePass(), DitherShader, fallbackDepth, MiniatureGradeOptions, MiniatureShader, MiniatureTuning, createSceneRenderer() (+7 more)

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
Cohesion: 0.33
Nodes (5): CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer

### Community 42 - ".frame"
Cohesion: 0.09
Nodes (3): SwayItem, WetMaterialEntry, SceneRenderer

### Community 44 - "siteAtmosphere.ts"
Cohesion: 0.15
Nodes (17): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), createClothMaterial() (+9 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 47 - "citylit.ts"
Cohesion: 0.11
Nodes (23): WeatherWidgetProps, clamp01(), LiveWeatherVisual, liveWeatherVisual(), getWeatherMoment(), isSnowCode(), WEATHER_MOMENT_SITES, SeasonWeights (+15 more)

### Community 48 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.09
Nodes (51): BESPOKE_INTERIORS, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats() (+43 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.13
Nodes (12): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+4 more)

### Community 51 - "prepareCanvasTexture"
Cohesion: 0.14
Nodes (25): getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getPlasterBumpTexture(), getPlasterNormalTexture(), getRoofBumpTexture(), getRoofNormalTexture() (+17 more)

### Community 53 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

### Community 54 - "three"
Cohesion: 0.15
Nodes (9): createWebGLRendererSelection(), GPUCapableNavigator, readRendererPreference(), selectRenderer(), AnyRenderer, PMREMResult, RendererBackend, RendererPreference (+1 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.30
Nodes (10): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, setSeasonMonth() (+2 more)

### Community 58 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 59 - "placesScene.ts"
Cohesion: 0.19
Nodes (14): OsmPlaceData, OsmSliceResult, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, createPlacesShaderEnv() (+6 more)

### Community 61 - "LandmarkBiome"
Cohesion: 0.29
Nodes (4): extractRegionName(), HorizonSceneryController, AtmosphereSite, LandmarkBiome

### Community 63 - "ambientAudio.ts"
Cohesion: 0.15
Nodes (12): AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener, UI_CUE_CATEGORY, UiCueCategory (+4 more)

### Community 64 - ".constructor"
Cohesion: 0.06
Nodes (27): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+19 more)

### Community 69 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 71 - "applyDissolveToShader"
Cohesion: 0.20
Nodes (10): addSquareWaterPlate(), addStandUnderside(), getUndersideMaterial(), applyDissolveToShader(), cascadeize(), flagWindy(), installDissolveShader(), lights() (+2 more)

### Community 73 - "tide.test.ts"
Cohesion: 0.60
Nodes (4): computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE

### Community 74 - "addCraftedRim"
Cohesion: 0.60
Nodes (5): addCraftedRim(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata()

### Community 76 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

### Community 77 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `getSoftTexture`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `animalKit.ts`, `osmSlice.ts`, `DaylightBirdsController`, `package.json`, `CitylitEngine.ts`, `SceneRenderer.ts`, `placesClouds.ts`, `siteAtmosphere.ts`, `citylit.ts`, `vehicleLightKit.ts`, `placesInteriors.ts`, `prepareCanvasTexture`, `webgpuCompat.ts`, `three`, `placesScene.ts`, `.constructor`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.060570304818092426 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `citylit.ts`, `.showLandmarkImmediate`, `App.tsx`, `animalKit.ts`, `motion.ts`, `ScaleRulerModal.tsx`, `DaylightBirdsController`, `CitylitEngine.ts`, `siteVisuals.ts`, `SceneRenderer.ts`, `.frame`, `siteAtmosphere.ts`, `contact-sheet.ts`, `citylit.ts`, `qualityBenchmark.ts`, `.setQualityIndex`, `three`, `placesScene.ts`, `LandmarkBiome`, `.constructor`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Should `getSoftTexture` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `WebGLSceneRenderer` connect `WebGLSceneRenderer` to `.constructor`, `.frame`, `SceneRenderer.ts`, `three`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07957957957957958 - nodes in this community are weakly interconnected._
- **Should `PlacesOverlay.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10810810810810811 - nodes in this community are weakly interconnected._