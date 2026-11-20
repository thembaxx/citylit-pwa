# Graph Report - citylit-pwa  (2026-11-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 762 nodes · 2427 edges · 44 communities (35 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `adfb79dc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42

## God Nodes (most connected - your core abstractions)
1. `add()` - 65 edges
2. `CitylitEngine` - 64 edges
3. `R()` - 55 edges
4. `C()` - 54 edges
5. `MStone()` - 50 edges
6. `M()` - 49 edges
7. `CB()` - 44 edges
8. `tree()` - 38 edges
9. `App()` - 38 edges
10. `AmbientAudioController` - 36 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `CitylitEngine`  [EXTRACTED]
  src/App.tsx → src/three/CitylitEngine.ts
- `CitylitEngine` --references--> `SwayItem`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/builders/primitives.ts
- `CitylitEngine` --references--> `WetMaterialEntry`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/builders/primitives.ts
- `CitylitEngine` --references--> `GlobeController`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/globeScene.ts
- `CitylitEngine` --references--> `PlacesController`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts

## Import Cycles
- None detected.

## Communities (44 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.17
Nodes (95): addAnchor(), addBaseScatter(), addBollards(), addDeck(), addJetty(), addReedbed(), addWindpump(), anchorGroup() (+87 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (21): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (28): motion, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (35): archGeo(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes, ContactShadowSpec, createContactShadowMaterial() (+27 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (22): react, formatCoords(), InfoDrawer(), InfoDrawerProps, parseSearch(), SearchSheet(), SearchSheetProps, TIME_PHRASES (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (28): App(), readInitialLandmarkIndex(), readSettings(), readStoredSet(), AudioVisualizerBar(), BootSplash(), BootSplashProps, GalleryModal() (+20 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (31): getGrassMaterial(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), patchPlacesVolumetricFog(), PlacesShaderEnvironment (+23 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (27): ambientAudio, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, SettingsModal(), SettingsModalProps, THEME_OPTIONS (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (21): GalleryDialog(), GalleryModalProps, bodySlideVariants, headerSlideVariants, LandmarkCardProps, SlideCustom, LANDMARKS, project() (+13 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (25): addCraftedRim(), addDioramaClouds(), addSoaringBirds(), addSquareRim(), addTreeRing(), addWeatherFx(), AnchorKind, applyDioramaUpgrade() (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (17): LANDMARK_BUILDERS, glowMaterials, SwayItem, swayItems, WetMaterialEntry, wetMaterials, audioForward, audioRight (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.19
Nodes (15): PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, STRATA_COLOR_FRAGMENT, STRATA_FRAG_COMMON, STRATA_ROUGHNESS_FRAGMENT, STRATA_VERT_BEGIN (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.16
Nodes (3): CitylitEngine, QualityIndex, QualitySetting

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (14): @phosphor-icons/react, GlobeOverlayProps, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (15): AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps, DURATION (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (17): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), createClothMaterial() (+9 more)

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (16): createPlacesScene(), HERO_CAM, HERO_TARGET, PlacesController, bindVolumetricFogUniforms(), createPlacesShaderEnv(), createPlacesVolumetricFogLayer(), createPlacesWeatherParticles() (+8 more)

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (4): resetSceneDynamicLists(), setContactShadowFade(), updateWetSurfaces(), updateRimLight()

### Community 19 - "Community 19"
Cohesion: 0.23
Nodes (14): addSquareWaterPlate(), applyDissolveToShader(), cascadeize(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getPlasterBumpTexture(), getRoofBumpTexture(), getStoneBumpTexture() (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.19
Nodes (3): configureDioramaShadow(), createRimLight(), DIORAMA_SHADOW_EXTENT

### Community 21 - "Community 21"
Cohesion: 0.17
Nodes (11): goeist@0.1.0, tailwindcss@4.3.5, @types/three@0.187.0, description, name, private, type, version (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (12): dependencies, motion@14.14.0, oxfmt@0.79.0, @phosphor-icons/react@2.1.10, react@19.3.1, recharts@3.11.0, @types/react@19.3.0, @types/react-dom@19.3.0 (+4 more)

### Community 23 - "Community 23"
Cohesion: 0.27
Nodes (10): AFRICA_POLY, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, ProvinceGlobeEntry, createGlobeScene(), GlobeController (+2 more)

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (10): clamp01(), LiveWeatherVisual, liveWeatherVisual(), WEATHER_CONDITIONS, SKY_NOISE_GLSL, WU, createWeatherScene(), monthToSeasonWeights() (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (10): buildTreeGeometry(), buildTreeLodGeometry(), crownGeo(), finalizeTreeBatch(), mergeTreeParts(), stampContactShadow(), stampContactShadowsFromMeshes(), treeGeometry() (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (8): ignorePatterns, printWidth, $schema, semi, singleQuote, tabWidth, trailingComma, useTabs

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (8): categories, correctness, suspicious, ignorePatterns, plugins, rules, react/react-in-jsx-scope, $schema

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (8): @tailwindcss/vite@4.3.5, vite@8.3.8, vite-plugin-pwa@2.0.0, @vitejs/plugin-react@6.3.0, @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (7): three@0.187.0, three, CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer

### Community 31 - "Community 31"
Cohesion: 0.25
Nodes (8): scripts, build, dev, format, format:check, lint, preview, start

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 35 - "Community 35"
Cohesion: 0.60
Nodes (5): getLandmarkSignature(), loadCachedThumbnails(), openThumbDb(), saveCachedThumbnails(), StoredThumbBundle

### Community 36 - "Community 36"
Cohesion: 0.40
Nodes (5): cacheMat(), MCanvas(), MGlass(), MRoof(), MSteel()

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `Community 30` to `Community 0`, `Community 33`, `Community 3`, `Community 6`, `Community 9`, `Community 10`, `Community 11`, `Community 16`, `Community 17`, `Community 19`, `Community 20`, `Community 21`, `Community 23`, `Community 24`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0734006734006734 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `Community 12` to `Community 32`, `Community 0`, `Community 34`, `Community 5`, `Community 10`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 20`, `Community 23`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08888888888888889 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06031746031746032 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.10080645161290322 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.14112903225806453 - nodes in this community are weakly interconnected._