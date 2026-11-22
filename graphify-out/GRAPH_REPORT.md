# Graph Report - citylit-pwa  (2026-11-22)

## Corpus Check
- 123 files · ~289,677 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1474 nodes · 4475 edges · 76 communities (62 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `caab385e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- biomePalette.ts
- citylit.ts
- primitives.ts
- skyEvents.ts
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- SearchSheet.tsx
- dioramaKit.ts
- animalKit.ts
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
- albedoAudit.ts
- scripts
- .frame
- with
- globalIllumination.ts
- .constructor
- ambientAudio.ts
- overrides
- capture-contact-sheets.mjs
- windowLights.ts
- placesClouds.ts
- ScaleRulerModal.tsx
- .showLandmarkImmediate
- siteAtmosphere.ts
- run
- contact-sheet.ts
- recharts
- vehicleLightKit.ts
- placesInteriors.ts
- PlacesOverlay.tsx
- weatherScene.ts
- .isStudio
- InfoDrawer.tsx
- applyDioramaUpgrade
- season.ts
- nativeHost.ts
- markSharedGeo
- siteVisuals.ts
- wildlife.ts
- applyDissolveToShader
- LandmarkBiome
- @types/react@19.3.0
- @ui-sdk/react
- ScaleReferenceKind
- addCraftedRim
- addSiteMotion
- AnimalScaffold
- addWildlifeLayer
- @types/node@^24.0.0
- @types/three@0.187.0
- @ui-sdk/core@0.1.0-beta.13
- workbox-window@7.4.1
- addDioramaClouds
- waterize

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 120 edges
2. `add()` - 86 edges
3. `M()` - 64 edges
4. `C()` - 64 edges
5. `CB()` - 63 edges
6. `R()` - 60 edges
7. `MStone()` - 56 edges
8. `App()` - 50 edges
9. `addStreetLampSet()` - 50 edges
10. `instancedMeshes()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `Compass()`  [EXTRACTED]
  src/App.tsx → src/components/Compass.tsx
- `App()` --calls--> `InfoDrawer()`  [EXTRACTED]
  src/App.tsx → src/components/InfoDrawer.tsx
- `App()` --calls--> `LandmarkCard()`  [EXTRACTED]
  src/App.tsx → src/components/LandmarkCard.tsx
- `App()` --calls--> `PassportModal()`  [EXTRACTED]
  src/App.tsx → src/components/PassportModal.tsx
- `App()` --calls--> `PlacesOverlay()`  [EXTRACTED]
  src/App.tsx → src/components/PlacesOverlay.tsx

## Import Cycles
- None detected.

## Communities (76 total, 14 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.11
Nodes (146): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+138 more)

### Community 1 - "biomePalette.ts"
Cohesion: 0.22
Nodes (10): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+2 more)

### Community 2 - "citylit.ts"
Cohesion: 0.09
Nodes (35): pad2(), PresetKey, SKY_EVENT_ICON, TIME_PRESETS, WARNING_STYLE, WEATHER_MOMENT_ICON, WeatherWidget(), WeatherWidgetProps (+27 more)

### Community 3 - "primitives.ts"
Cohesion: 0.04
Nodes (50): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cableDir, cableEnd, cableMid, cableStart, cableUp (+42 more)

### Community 4 - "skyEvents.ts"
Cohesion: 0.18
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 5 - "App.tsx"
Cohesion: 0.10
Nodes (37): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+29 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (35): getGrassMaterial(), BespokeInteriorContext, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), PlacesShaderEnvironment (+27 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.15
Nodes (19): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL (+11 more)

### Community 8 - "SearchSheet.tsx"
Cohesion: 0.17
Nodes (20): GlobeOverlayProps, SearchSheet(), SearchSheetProps, LANDMARK_TAGS, LANDMARKS, PROVINCES, usePWAInstall(), countLandmarksByTag() (+12 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.06
Nodes (30): accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE, getLampBulbMat() (+22 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.13
Nodes (22): advanceAnimalTime(), AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffoldSpec, animalSeasonForMonth(), AnimalVec3, createAnimalScaffold() (+14 more)

### Community 11 - "fitMath.ts"
Cohesion: 0.36
Nodes (8): boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT, PLINTH_INNER_HALF_EXTENT, PlinthFit

### Community 12 - "CitylitEngine"
Cohesion: 0.07
Nodes (3): CompassProps, CitylitEngine, QualitySetting

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "motion.ts"
Cohesion: 0.08
Nodes (29): ambientAudio, AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8, Compass(), formatBearing() (+21 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "placesScene.ts"
Cohesion: 0.15
Nodes (22): OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape(), BespokeInteriorKind (+14 more)

### Community 17 - "LandmarkCard.tsx"
Cohesion: 0.08
Nodes (31): GalleryDialog(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard() (+23 more)

### Community 18 - "SettingsModal.tsx"
Cohesion: 0.12
Nodes (21): motion, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), SCALE_REFERENCE_OPTIONS (+13 more)

### Community 19 - "shaders.ts"
Cohesion: 0.14
Nodes (27): getRoofDirtMap(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getPlasterBumpTexture(), getPlasterNormalTexture(), getRoofBumpTexture() (+19 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.12
Nodes (22): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+14 more)

### Community 21 - "package.json"
Cohesion: 0.15
Nodes (14): oxfmt@0.79.0, oxlint@1.94.0, description, devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, name, private (+6 more)

### Community 22 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, @phosphor-icons/react@2.1.10, react@19.3.1, react-dom@19.3.1, tailwindcss@4.3.5 (+8 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.11
Nodes (29): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+21 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.15
Nodes (3): AmbientAudioController, SiteProfile, AmbientSiteProfile

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.07
Nodes (37): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, glowMaterials, swayItems, wetMaterials (+29 more)

### Community 27 - ".oxfmtrc.json"
Cohesion: 0.22
Nodes (8): ignorePatterns, printWidth, $schema, semi, singleQuote, tabWidth, trailingComma, useTabs

### Community 28 - ".oxlintrc.json"
Cohesion: 0.22
Nodes (8): categories, correctness, suspicious, ignorePatterns, plugins, rules, react/react-in-jsx-scope, $schema

### Community 29 - "vite.config.ts"
Cohesion: 0.20
Nodes (8): @tailwindcss/vite@4.3.5, vite@8.3.8, vite-plugin-pwa@2.0.0, @vitejs/plugin-react@6.3.0, @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 30 - "albedoAudit.ts"
Cohesion: 0.18
Nodes (22): ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), DEFAULT_SATURATION_REDUCTION, GRADE_GUARDRAILS (+14 more)

### Community 31 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, format, format:check, lint, preview, qa:capture (+4 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 35 - ".constructor"
Cohesion: 0.10
Nodes (17): BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, configureDioramaShadow(), createBounceLight(), createRimLight(), DIORAMA_SHADOW_EXTENT (+9 more)

### Community 36 - "ambientAudio.ts"
Cohesion: 0.14
Nodes (15): BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell(), smoothstep(), SpatialEmitter (+7 more)

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.11
Nodes (18): CDP, clickAria(), listTargets(), run(), sleep(), acquirePageTarget(), captureHour(), CdpSession (+10 more)

### Community 39 - "windowLights.ts"
Cohesion: 0.22
Nodes (12): bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES, tmpLit, updateWindowLights() (+4 more)

### Community 40 - "placesClouds.ts"
Cohesion: 0.33
Nodes (5): CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer

### Community 41 - "ScaleRulerModal.tsx"
Cohesion: 0.17
Nodes (16): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), SORT_OPTIONS (+8 more)

### Community 42 - ".showLandmarkImmediate"
Cohesion: 0.13
Nodes (5): resetSceneDynamicLists(), setContactShadowFade(), SwayItem, updateWetSurfaces(), WetMaterialEntry

### Community 44 - "siteAtmosphere.ts"
Cohesion: 0.14
Nodes (18): SKY_NOISE_GLSL, AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+10 more)

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
Cohesion: 0.09
Nodes (51): BESPOKE_INTERIORS, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats() (+43 more)

### Community 50 - "PlacesOverlay.tsx"
Cohesion: 0.21
Nodes (13): @phosphor-icons/react, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIcon() (+5 more)

### Community 51 - "weatherScene.ts"
Cohesion: 0.09
Nodes (26): clamp01(), LiveWeatherVisual, liveWeatherVisual(), MID_MONTH_DAY, solarDeclination(), southernSunDirection(), BiomeWeights, createHorizonRing() (+18 more)

### Community 53 - "InfoDrawer.tsx"
Cohesion: 0.11
Nodes (18): react, react-dom, formatCoords(), InfoDrawer(), InfoDrawerProps, Sheet(), SheetProps, SheetSide (+10 more)

### Community 54 - "applyDioramaUpgrade"
Cohesion: 0.13
Nodes (16): addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addTreeRing(), applyDioramaUpgrade(), buildSpatialSources(), getSiteProfile(), hasSiteProfile() (+8 more)

### Community 55 - "season.ts"
Cohesion: 0.33
Nodes (9): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights (+1 more)

### Community 56 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 57 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 58 - "siteVisuals.ts"
Cohesion: 0.24
Nodes (10): blendHex(), DEFAULT_BY_BIOME, getSiteVisualProfile(), normalizeSiteVisualKey(), REGIONAL_BLEND_WEIGHTS, RegionalColourField, SITE_VISUALS_MAP, SitePointLightSpec (+2 more)

### Community 59 - "wildlife.ts"
Cohesion: 0.29
Nodes (8): IDLES, KINDS, SEASONS, WILDLIFE, WildlifeSpot, AnimalIdle, AnimalKind, AnimalSeason

### Community 60 - "applyDissolveToShader"
Cohesion: 0.20
Nodes (10): addStandUnderside(), getUndersideMaterial(), windowPaneMaterial(), applyDissolveToShader(), cascadeize(), flagWindy(), installDissolveShader(), interiorParallaxShader() (+2 more)

### Community 62 - "LandmarkBiome"
Cohesion: 0.28
Nodes (3): extractRegionName(), AtmosphereSite, LandmarkBiome

### Community 65 - "ScaleReferenceKind"
Cohesion: 0.33
Nodes (5): ScaleRulerModalProps, MAX_REFERENCE_UNITS, MIN_REFERENCE_UNITS, ScaleReferenceEntry, ScaleReferenceKind

### Community 66 - "addCraftedRim"
Cohesion: 0.60
Nodes (5): addCraftedRim(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata()

### Community 67 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

### Community 69 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

## Knowledge Gaps
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `primitives.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `animalKit.ts`, `placesScene.ts`, `shaders.ts`, `package.json`, `dependencies`, `CitylitEngine.ts`, `globalIllumination.ts`, `.constructor`, `windowLights.ts`, `placesClouds.ts`, `siteAtmosphere.ts`, `vehicleLightKit.ts`, `placesInteriors.ts`, `weatherScene.ts`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10822586266991983 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `.frame`, `landmarksB.ts`, `citylit.ts`, `.constructor`, `siteVisuals.ts`, `App.tsx`, `ScaleReferenceKind`, `.showLandmarkImmediate`, `animalKit.ts`, `siteAtmosphere.ts`, `contact-sheet.ts`, `motion.ts`, `placesScene.ts`, `LandmarkCard.tsx`, `weatherScene.ts`, `.isStudio`, `CitylitEngine.ts`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08562367864693446 - nodes in this community are weakly interconnected._
- **Why does `AmbientAudioController` connect `AmbientAudioController` to `ambientAudio.ts`, `.update`, `LandmarkBiome`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0444947209653092 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09595959595959595 - nodes in this community are weakly interconnected._