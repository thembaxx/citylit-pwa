# Graph Report - citylit-pwa  (2026-11-22)

## Corpus Check
- 111 files · ~270,284 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1335 nodes · 4106 edges · 68 communities (58 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6c420e54`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- albedoAudit.ts
- citylit.ts
- primitives.ts
- react
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- SearchSheet.tsx
- dioramaKit.ts
- CitylitEngine.ts
- motion.ts
- CitylitEngine
- compilerOptions
- ambientAudio.ts
- osmService.ts
- placesScene.ts
- motion.ts
- SettingsModal.tsx
- shaders.ts
- PassportModal.tsx
- package.json
- dependencies
- globeScene.ts
- AmbientAudioController
- server.js
- .frame
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- animalKit.ts
- scripts
- .frame
- with
- globalIllumination.ts
- siteAtmosphere.ts
- applyDioramaUpgrade
- overrides
- capture-contact-sheets.mjs
- windowLights.ts
- placesClouds.ts
- biomePalette.ts
- .showLandmarkImmediate
- tailwindcss@4.3.5
- run
- contact-sheet.ts
- recharts
- vehicleLightKit.ts
- placesInteriors.ts
- PlacesOverlay.tsx
- season.ts
- markSharedGeo
- react-dom
- applyDissolveToShader
- LandmarkBiome
- fitMath.ts
- streetLights.ts
- horizonScenery.ts
- solarPosition.ts
- addCraftedRim
- addSiteMotion
- AnimalScaffold
- typescript@7.0.2
- workbox-window@7.4.1
- addDioramaClouds
- addStandUnderside

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 109 edges
2. `add()` - 84 edges
3. `C()` - 62 edges
4. `CB()` - 62 edges
5. `M()` - 62 edges
6. `R()` - 60 edges
7. `MStone()` - 56 edges
8. `addStreetLampSet()` - 50 edges
9. `instancedMeshes()` - 41 edges
10. `App()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `createWeatherScene()` --calls--> `monthToSeasonWeights()`  [EXTRACTED]
  src/three/weatherScene.ts → src/lib/season.ts
- `buildPlaceSlice()` --calls--> `getSeasonMonth()`  [EXTRACTED]
  src/three/placesSliceBuilders.ts → src/lib/season.ts
- `buildPlaceSlice()` --calls--> `isSpeciesBlooming()`  [EXTRACTED]
  src/three/placesSliceBuilders.ts → src/lib/season.ts
- `EngineCallbacks` --references--> `PlacesSelectionInfo`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts

## Import Cycles
- None detected.

## Communities (68 total, 10 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.11
Nodes (144): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), getAnimalSeasonMonth(), addAnchor(), addBaseScatter() (+136 more)

### Community 1 - "albedoAudit.ts"
Cohesion: 0.18
Nodes (22): ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), DEFAULT_SATURATION_REDUCTION, GRADE_GUARDRAILS (+14 more)

### Community 2 - "citylit.ts"
Cohesion: 0.09
Nodes (33): AnimatedNumber(), AnimatedNumberProps, Digit(), PresetKey, TIME_PRESETS, WARNING_STYLE, WeatherWidget(), WeatherWidgetProps (+25 more)

### Community 3 - "primitives.ts"
Cohesion: 0.04
Nodes (50): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cableDir, cableEnd, cableMid, cableStart, cableUp (+42 more)

### Community 4 - "react"
Cohesion: 0.14
Nodes (19): @phosphor-icons/react@2.1.10, @phosphor-icons/react, react, formatCoords(), InfoDrawer(), InfoDrawerProps, Sheet(), SheetProps (+11 more)

### Community 5 - "App.tsx"
Cohesion: 0.10
Nodes (33): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet(), AudioVisualizerBar() (+25 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.12
Nodes (32): createCloudPuffMesh(), createSliceCloudLayer(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), patchPlacesVolumetricFog() (+24 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (19): PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL (+11 more)

### Community 8 - "SearchSheet.tsx"
Cohesion: 0.17
Nodes (20): GlobeOverlayProps, SearchSheet(), SearchSheetProps, LANDMARK_TAGS, LANDMARKS, PROVINCES, usePWAInstall(), countLandmarksByTag() (+12 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.07
Nodes (28): accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE, getLampBulbMat() (+20 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.08
Nodes (33): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, glowMaterials, swayItems, wetMaterials (+25 more)

### Community 11 - "motion.ts"
Cohesion: 0.09
Nodes (28): motion@14.14.0, motion, AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8, Compass() (+20 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.08
Nodes (3): CitylitEngine, fitDioramaShadowBounds(), NoteCategory

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "ambientAudio.ts"
Cohesion: 0.14
Nodes (15): BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell(), smoothstep(), SpatialEmitter (+7 more)

### Community 15 - "osmService.ts"
Cohesion: 0.15
Nodes (16): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmBuilding (+8 more)

### Community 16 - "placesScene.ts"
Cohesion: 0.13
Nodes (24): OsmArea, OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape() (+16 more)

### Community 17 - "motion.ts"
Cohesion: 0.08
Nodes (31): GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants (+23 more)

### Community 18 - "SettingsModal.tsx"
Cohesion: 0.10
Nodes (23): ambientAudio, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), SettingsModal() (+15 more)

### Community 19 - "shaders.ts"
Cohesion: 0.16
Nodes (26): getRoofDirtMap(), MSteel(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getPlasterBumpTexture(), getPlasterNormalTexture() (+18 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.12
Nodes (23): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+15 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): goeist@0.1.0, oxfmt@0.79.0, oxlint@1.94.0, @ui-sdk/core@0.1.0-beta.13, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, n8ao@2.1.0, react@19.3.1, three@0.187.0, @types/node@^24.0.0, @types/react@19.3.0, @types/react-dom@19.3.0, @types/three@0.187.0 (+7 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.11
Nodes (29): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+21 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.15
Nodes (3): AmbientAudioController, SiteProfile, AmbientSiteProfile

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - ".frame"
Cohesion: 0.12
Nodes (15): BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, configureDioramaShadow(), createBounceLight(), createRimLight(), DIORAMA_SHADOW_EXTENT (+7 more)

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
Cohesion: 0.11
Nodes (25): advanceAnimalTime(), AnimalIdle, AnimalKind, AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffoldSpec, AnimalSeason (+17 more)

### Community 31 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, format, format:check, lint, preview, qa:capture (+4 more)

### Community 32 - ".frame"
Cohesion: 0.10
Nodes (6): updateWetSurfaces(), updateBounceLightMood(), updateShadowMood(), MiniaturePass, windowLitFraction(), QualitySetting

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 35 - "siteAtmosphere.ts"
Cohesion: 0.14
Nodes (18): SKY_NOISE_GLSL, AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+10 more)

### Community 36 - "applyDioramaUpgrade"
Cohesion: 0.13
Nodes (16): addEdgeWaterfall(), addSoaringBirds(), addSquareWaterPlate(), addTreeRing(), applyDioramaUpgrade(), buildSpatialSources(), getSiteProfile(), hasSiteProfile() (+8 more)

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.11
Nodes (18): CDP, clickAria(), listTargets(), run(), sleep(), acquirePageTarget(), captureHour(), CdpSession (+10 more)

### Community 39 - "windowLights.ts"
Cohesion: 0.20
Nodes (13): windowPaneMaterial(), interiorParallaxShader(), bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES (+5 more)

### Community 40 - "placesClouds.ts"
Cohesion: 0.40
Nodes (3): CloudAssets, CloudPuffInstance, SliceCloudLayer

### Community 41 - "biomePalette.ts"
Cohesion: 0.18
Nodes (9): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, rule(), SITE_RULES, SiteRule (+1 more)

### Community 42 - ".showLandmarkImmediate"
Cohesion: 0.16
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
Cohesion: 0.35
Nodes (13): BESPOKE_INTERIORS, BespokeInteriorContext, box(), colonnade(), InteriorBuilder, manorRoom(), onTerrain(), openRoom() (+5 more)

### Community 50 - "PlacesOverlay.tsx"
Cohesion: 0.20
Nodes (13): placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIcon(), WeatherIconCondition (+5 more)

### Community 51 - "season.ts"
Cohesion: 0.33
Nodes (9): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights (+1 more)

### Community 52 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 54 - "applyDissolveToShader"
Cohesion: 0.20
Nodes (10): getGrassMaterial(), applyDissolveToShader(), cascadeize(), flagWindy(), grassWindy(), installDissolveShader(), lights(), waterize() (+2 more)

### Community 55 - "LandmarkBiome"
Cohesion: 0.24
Nodes (4): extractRegionName(), HorizonSceneryController, AtmosphereSite, LandmarkBiome

### Community 56 - "fitMath.ts"
Cohesion: 0.36
Nodes (8): boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT, PLINTH_INNER_HALF_EXTENT, PlinthFit

### Community 57 - "streetLights.ts"
Cohesion: 0.24
Nodes (9): collectStreetLampAnchors(), createStreetLampPool(), LAMP_TINT, lampTintForBiome(), solarHalfDay(), STREET_LAMP_POOL_SIZE, StreetLampAnchor, streetLampNightFactor() (+1 more)

### Community 58 - "horizonScenery.ts"
Cohesion: 0.11
Nodes (22): clamp01(), liveWeatherVisual(), resolveRegionalPalette(), BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonUpdateOptions, SIGNATURE_PARTS (+14 more)

### Community 60 - "solarPosition.ts"
Cohesion: 0.70
Nodes (3): MID_MONTH_DAY, solarDeclination(), southernSunDirection()

### Community 61 - "addCraftedRim"
Cohesion: 0.60
Nodes (5): addCraftedRim(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata()

### Community 62 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `citylit.ts`, `primitives.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `placesScene.ts`, `shaders.ts`, `package.json`, `dependencies`, `.frame`, `animalKit.ts`, `globalIllumination.ts`, `siteAtmosphere.ts`, `windowLights.ts`, `placesClouds.ts`, `vehicleLightKit.ts`, `placesInteriors.ts`, `streetLights.ts`, `horizonScenery.ts`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11146381280609469 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `.frame`, `citylit.ts`, `siteAtmosphere.ts`, `horizonScenery.ts`, `App.tsx`, `CitylitEngine.ts`, `motion.ts`, `.showLandmarkImmediate`, `contact-sheet.ts`, `placesScene.ts`, `applyDissolveToShader`, `LandmarkBiome`, `streetLights.ts`, `.frame`, `animalKit.ts`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09358974358974359 - nodes in this community are weakly interconnected._
- **Why does `AmbientAudioController` connect `AmbientAudioController` to `.update`, `ambientAudio.ts`, `LandmarkBiome`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0444947209653092 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.13666666666666666 - nodes in this community are weakly interconnected._