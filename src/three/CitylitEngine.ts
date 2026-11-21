import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { N8AOPass } from 'n8ao';
import { ambientAudio } from '../audio/ambientAudio';
import { LANDMARKS } from '../data/landmarks';
import type { OsmPlaceData } from '../services/osmService';
import type {
  AmbientSiteProfile,
  CameraPreset,
  CompassState,
  LandmarkNote,
  LiveWeatherSample,
  MediaItem,
  NoteCategory,
  QualityIndex,
  QualitySetting,
  ThemeSetting,
  WeatherConditionKey,
} from '../types/citylit';
import { LANDMARK_BUILDERS } from './builders/landmarksB';
import {
  glowMaterials,
  G,
  Mc,
  MCascade,
  MWater,
  resetSceneDynamicLists,
  setContactShadowFade,
  SwayItem,
  swayItems,
  updateWetSurfaces,
  WetMaterialEntry,
  wetMaterials,
} from './builders/primitives';
import { createGlobeScene, type GlobeController } from './globeScene';
import { createPlacesScene, type PlacesController, type PlacesSelectionInfo } from './placesScene';
import {
  createDitherPass,
  createMiniaturePass,
  type MiniaturePass,
  type MiniatureTuning,
} from './postfx';
import {
  configureTextureQuality,
  getSoftTexture,
  grassWindy,
  installDissolveShader,
  windy,
  WU,
} from './shaders';
import {
  configureDioramaShadow,
  createBounceLight,
  createRimLight,
  fitDioramaShadowBounds,
  setBounceLightBiome,
  updateRimLight,
} from './lightingRig';
import { createHorizonScenery, type HorizonSceneryController } from './horizonScenery';
import { createAtmosphereScene, type AtmosphereSceneController } from './siteAtmosphere';
import { createWeatherScene, type WeatherSceneController } from './weatherScene';
import { createWindParticles, type WindParticlesController } from './windParticles';
import { attachEquirect, installGI } from './globalIllumination';

export interface EngineCallbacks {
  onSelectLandmarkFromGlobe?: (index: number) => void;
  onGlobePinHover?: (index: number | null, clientX?: number, clientY?: number) => void;
  onGlobeReset?: () => void;
  onSelectPlaceSlice?: (info: PlacesSelectionInfo) => void;
  onOpenLandmarkFromPlaces?: (index: number) => void;
  onFactDot?: (text: string) => void;
  onUserNotePin?: (noteId: string) => void;
  onPinDropPosition?: (pos: [number, number, number] | null) => void;
  onFirstInteract?: () => void;
  onThunder?: () => void;
  onSwipeLandmark?: (dir: 1 | -1) => void;
}

const audioRight = new THREE.Vector3();
const audioForward = new THREE.Vector3();
const compassOffset = new THREE.Vector3();
const compassDir = new THREE.Vector3();

/** Default night sky. Shared by the background, fog and particles so they stay in sync. */
const SKY_COLOR = new THREE.Color('#0e0f13');

export class CitylitEngine {
  readonly container: HTMLElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly isSoftwareGl: boolean;
  readonly weather: WeatherSceneController;
  readonly windParticles: WindParticlesController;
  readonly horizon: HorizonSceneryController;
  readonly globe: GlobeController;
  readonly places: PlacesController;
  readonly atmosphere: AtmosphereSceneController;

  readonly miniatureTuning: MiniatureTuning = {
    focusY: 0.49,
    focusRange: 0.24,
    blur: 2.0,
    vignette: 0.22,
    aperture: 1.0,
  };

  private readonly pmrem: THREE.PMREMGenerator;
  private envTex: THREE.Texture;
  private readonly composer: EffectComposer;
  private readonly renderPass: RenderPass;
  private readonly n8aoPass: N8AOPass;
  private autoExposureValue = 1.08;
  private exposureBuf: Uint16Array | null = null;
  private readonly bloomPass: UnrealBloomPass;
  private readonly miniaturePass: MiniaturePass;
  private readonly smaaPass: SMAAPass;
  private readonly ditherPass: ReturnType<typeof createDitherPass>;

  private readonly keyLight: THREE.DirectionalLight;
  private readonly fillLight: THREE.DirectionalLight;
  private readonly rimLight: THREE.DirectionalLight;
  /** Soft, shadowless biome-tinted bounce fill. Deliberately not driven by weather. */
  private readonly bounceLight: THREE.DirectionalLight;
  private readonly hemiLight: THREE.HemisphereLight;
  /** Subtle warm ground/apron spill lighting architectural facades at dusk & night. */
  private readonly nightApronLight: THREE.PointLight;
  private readonly plinthGroup: THREE.Group;
  private readonly plinthTopMat: THREE.MeshStandardMaterial;
  private readonly plinthBaseMat: THREE.MeshStandardMaterial;
  private readonly ringMat: THREE.MeshStandardMaterial;
  /** Kept alive so Studio mode can switch away from the sky HDRI without breaking it. */
  private readonly roomEnvTex: THREE.Texture;
  /** Soft elliptical shadow that makes the block read as a floating paper miniature. */
  private readonly studioShadow: THREE.Mesh;
  private readonly heroRoot: THREE.Group;
  private readonly markerGroup: THREE.Group;
  private readonly directionGroup: THREE.Group;
  private readonly directionGeo: THREE.BufferGeometry;
  private readonly directionPointsMat: THREE.ShaderMaterial;
  private readonly directionChevron: THREE.Mesh;
  private readonly directionChevronMat: THREE.MeshBasicMaterial;
  private readonly directionPulse: THREE.Mesh;
  private readonly directionPulseMat: THREE.MeshBasicMaterial;
  private readonly dustPoints: THREE.Points;
  private readonly dustGeo: THREE.BufferGeometry;
  private readonly dustMat: THREE.ShaderMaterial;

  private currentGroup: THREE.Group | null = null;
  private outgoingGroup: THREE.Group | null = null;
  private markerSprites: THREE.Sprite[] = [];
  private activeLods: THREE.LOD[] = [];
  private activeIndex = 0;

  private dissolvePhase = 0;
  private dissolveT = 0;
  private pendingIndex: number | null = null;
  private lastTick = 0;
  private elapsed = 0;
  /** Accumulated, motion-scaled time for shader animations. Continuous when motion toggles. */
  private shaderTime = 0;
  private rafId = 0;
  private disposed = false;
  private paused = false;
  private warmupDone = false;
  private afterDrawTimer = 0;

  private qualitySetting: QualitySetting = 'auto';
  private qualityIndex: QualityIndex = 0;
  /** Optional WebGL approximation of ThreeRT-style path-traced lighting. */
  private cinematic = false;
  private theme: ThemeSetting = 'daylight';
  private studioWeight = 0;
  private targetPlinthTop = new THREE.Color('#1a1c24');
  private targetPlinthBase = new THREE.Color('#111218');
  private targetRingCol = new THREE.Color('#e8b04a');
  private targetRingEmissive = 0.35;
  private targetBloomThreshold = 0.9;
  private motionScale = 1;
  private autoRotateSpeed = 0.3;
  private contextLost = false;
  private usingSkyHdr = false;
  private shadowFrameCounter = 0;
  private hasAnimatedShadowScene = false;
  private lastGlowLit = -1;
  private hoveredMarkerIndex = -1;
  private hoveredHero = false;
  private hoverRimBoost = 0;
  private readonly hoverRaycaster = new THREE.Raycaster();
  private readonly hoverNdc = new THREE.Vector2();
  private readonly hoverHits: THREE.Intersection[] = [];
  private autoScaleTimer = 0;
  private autoScaleSamples = 0;
  private autoScaleAcc = 0;
  /** Dynamic resolution scale used in auto mode to hold the 60fps target. */
  private renderScale = 1;
  private appliedRenderScale = -1;
  private bootPrewarmDone = false;
  private readonly landmarkCache = new Map<
    number,
    {
      group: THREE.Group;
      glow: THREE.MeshStandardMaterial[];
      sway: SwayItem[];
      wet: WetMaterialEntry[];
    }
  >();
  private readonly prewarmInFlight = new Set<number>();
  private lastSwitchAt = -10;
  private isUserOrbiting = false;
  private timeLapsePlaying = false;
  private baseAperture = 0.78;
  private rackFocusBlend = 0;
  private switchDir: 1 | -1 = 1;
  private switchSettle = 0;
  private cardParallaxTarget = 0;
  private cardParallaxCurrent = 0;
  private baseTargetX = 0;
  private baseTargetY = 1.5;
  /** Per-landmark hero framing, recomputed only on switch/reset/resize/theme change. */
  private readonly heroFitCenter = new THREE.Vector3();
  private readonly heroFitDirection = new THREE.Vector3();
  private hasHeroFit = false;
  private readonly lodCamProxy = new THREE.PerspectiveCamera();
  private readonly lastLodCamPos = new THREE.Vector3(Infinity, Infinity, Infinity);
  private lastLodQuality = -1;
  private readonly lastShadowKeyPos = new THREE.Vector3(Infinity, Infinity, Infinity);
  private readonly tmpCasterSize = new THREE.Vector3();
  private readonly fitSizeTmp = new THREE.Vector3();
  private readonly fitCenterTmp = new THREE.Vector3();

  private tiltEnabled = false;
  private tiltOffsetX = 0;
  private tiltOffsetY = 0;
  private camGoal: THREE.Vector3 | null = null;
  private camStart = new THREE.Vector3();
  private camTargetPos = new THREE.Vector3();
  private camGoalT = 1;
  private camGoalOrbital = false;
  private camStartAzimuth = 0;
  private camTargetAzimuth = 0;
  private camGoalHorizDist = 0;
  private camGoalHeightOffset = 0;
  private targetStart = new THREE.Vector3();
  private targetEnd = new THREE.Vector3();
  private targetGoalActive = false;
  private hasCustomFocus = false;
  private readonly factFocusDir = new THREE.Vector3();
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.35);
  private readonly cursorWorld = new THREE.Vector3();
  private cursorStrengthTarget = 0;
  private directionActive = false;
  private directionStrength = 0;
  private directionTargetYaw = 0;
  private directionCurrentYaw = 0;
  private lastInteractAt = 0;
  private lastRenderAt = 0;
  private tapDown = { x: 0, y: 0, t: 0 };
  private lastPlaceTap = { sliceIndex: -1, t: 0 };
  private lastGlobeTap = 0;
  private lastPlaceSliceIndex = -1;
  private lastHoverCheck = 0;
  private lastHeroHoverCheck = 0;
  private pinchDist = 0;
  private pinDropMode = false;
  private cutawayActive = false;
  private cutawayAmount = 0;
  private cutawayEntries: Array<{ obj: THREE.Object3D; baseY: number; liftY: number }> = [];
  private activePinCursor = -1;
  private readonly prevFrameCamPos = new THREE.Vector3();
  private readonly dropLocalTmp = new THREE.Vector3();
  private readonly dropWorldTmp = new THREE.Vector3();
  private readonly dropNormalTmp = new THREE.Vector3();
  private readonly dropBoxTmp = new THREE.Box3();
  private readonly dropCenterTmp = new THREE.Vector3();
  private readonly dropSizeTmp = new THREE.Vector3();

  private callbacks: EngineCallbacks;

  constructor(container: HTMLElement, callbacks: EngineCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    installDissolveShader();
    installGI();
    // Handle for browser evals and perf measurements.
    (window as { citylitEngine?: CitylitEngine }).citylitEngine = this;

    this.isSoftwareGl = CitylitEngine.detectSoftwareGl();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    // three's shader diagnostics call getProgramInfoLog on first link, which
    // synchronously stalls the frame that first draws a landmark. Keep them in
    // development, drop them in production (all shaders are exercised in dev).
    if (import.meta.env.PROD) this.renderer.debug.checkShaderErrors = false;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.isSoftwareGl ? 1 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    if (!this.isSoftwareGl) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.shadowMap.autoUpdate = false;
    }
    // Anisotropy and procedural normal maps are set up before any landmark
    // texture is generated; software GL keeps the cheaper height-map path.
    configureTextureQuality(this.renderer.capabilities.getMaxAnisotropy(), !this.isSoftwareGl);

    const canvas = this.renderer.domElement;
    canvas.className = 'block fixed inset-0 w-full h-full touch-none';
    this.container.appendChild(canvas);

    this.scene = new THREE.Scene();
    this.scene.background = SKY_COLOR.clone();
    this.scene.fog = new THREE.FogExp2(SKY_COLOR.clone(), 0.01);

    this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.2, 200);
    this.camera.position.set(11.5, 6.2, 13);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.computeResponsiveFraming();
    this.controls.target.set(this.baseTargetX, this.baseTargetY, 0);
    this.controls.minDistance = 6;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.autoRotate = !this.isSoftwareGl;
    this.controls.autoRotateSpeed = 0.3;

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.roomEnvTex = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.envTex = this.roomEnvTex;
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 0.6;

    new HDRLoader().load(
      '/assets/env/sky.hdr',
      (hdrTex) => {
        if (this.disposed) {
          hdrTex.dispose();
          return;
        }
        // Physical sky HDRIs contain extreme >60k-nit sun spikes that clip diffuse PBR albedo under PMREM.
        // Compress luminance > 2.0 with a smooth log knee so specular reflections stay crisp while diffuse fill stays natural.
        attachEquirect(hdrTex);
        const raw = hdrTex.image?.data as unknown as Uint16Array | Float32Array | undefined;
        if (raw) {
          const isFloat32 = raw instanceof Float32Array;
          for (let i = 0; i < raw.length; i += 4) {
            const r = isFloat32 ? raw[i] : THREE.DataUtils.fromHalfFloat(raw[i]);
            const g = isFloat32 ? raw[i + 1] : THREE.DataUtils.fromHalfFloat(raw[i + 1]);
            const b = isFloat32 ? raw[i + 2] : THREE.DataUtils.fromHalfFloat(raw[i + 2]);
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            if (lum > 2.0) {
              const s = (2.0 + Math.log1p(lum - 2.0) * 0.8) / lum;
              if (isFloat32) {
                raw[i] = r * s;
                raw[i + 1] = g * s;
                raw[i + 2] = b * s;
              } else {
                raw[i] = THREE.DataUtils.toHalfFloat(r * s);
                raw[i + 1] = THREE.DataUtils.toHalfFloat(g * s);
                raw[i + 2] = THREE.DataUtils.toHalfFloat(b * s);
              }
            }
          }
          hdrTex.needsUpdate = true;
        }
        const prevEnv = this.envTex;
        const pmremOut = this.pmrem.fromEquirectangular(hdrTex);
        hdrTex.dispose();
        this.envTex = pmremOut.texture;
        this.usingSkyHdr = true;
        if (!this.isStudio()) this.scene.environment = this.envTex;
        if (prevEnv && prevEnv !== this.envTex && prevEnv !== this.roomEnvTex) {
          prevEnv.dispose();
        }
      },
      undefined,
      () => {
        // Keep RoomEnvironment fallback when offline or unavailable
      }
    );

    this.hemiLight = new THREE.HemisphereLight('#d9e7ff', '#3a2d20', 0.7);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight('#fff5dd', 3.1);
    this.keyLight.position.set(12, 18, 10);
    if (!this.isSoftwareGl) {
      this.keyLight.castShadow = true;
      configureDioramaShadow(this.keyLight);
    }
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight('#7298c8', 0.95);
    this.fillLight.position.set(-12, 8, -10);
    this.scene.add(this.fillLight);

    this.rimLight = createRimLight();
    this.scene.add(this.rimLight);
    this.scene.add(this.rimLight.target);

    this.bounceLight = createBounceLight();
    this.scene.add(this.bounceLight);
    this.scene.add(this.bounceLight.target);

    this.nightApronLight = new THREE.PointLight('#ffb86b', 0, 16, 1.5);
    this.nightApronLight.position.set(1.2, 3.1, 1.6);
    this.nightApronLight.castShadow = false;
    this.scene.add(this.nightApronLight);

    // Post-processing pipeline (depth-aware DoF + N8AO + Bloom + Tilt-Shift + SMAA + Output)
    const composerTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      type: THREE.HalfFloatType,
      samples: 0,
      depthTexture: new THREE.DepthTexture(window.innerWidth, window.innerHeight),
    });
    this.composer = new EffectComposer(this.renderer, composerTarget);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(window.innerWidth, window.innerHeight);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.n8aoPass = new N8AOPass(this.scene, this.camera, window.innerWidth, window.innerHeight);
    this.n8aoPass.configuration.gammaCorrection = false;
    this.n8aoPass.configuration.halfRes = true;
    this.n8aoPass.configuration.aoRadius = 0.58;
    this.n8aoPass.configuration.distanceFalloff = 1.05;
    this.n8aoPass.configuration.intensity = 2.4;
    this.n8aoPass.configuration.color.set('#000000');
    this.n8aoPass.setQualityMode('Performance');
    // Depth-aware AO is the backstop for every landmark interior; hardware
    // gets the much sharper pass. Software GL stays cheap for the main view.
    if (!this.isSoftwareGl) this.n8aoPass.setQualityMode('High');

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(
        Math.max(1, Math.floor(window.innerWidth * 0.5)),
        Math.max(1, Math.floor(window.innerHeight * 0.5))
      ),
      0.18,
      0.62,
      0.9
    );
    const baseBloomSetSize = this.bloomPass.setSize.bind(this.bloomPass);
    this.bloomPass.setSize = (width: number, height: number) => {
      baseBloomSetSize(Math.max(1, Math.floor(width * 0.5)), Math.max(1, Math.floor(height * 0.5)));
    };
    this.miniaturePass = createMiniaturePass(this.miniatureTuning);
    this.smaaPass = new SMAAPass();

    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.n8aoPass);
    this.composer.addPass(this.bloomPass);
    // Tone mapping, grading and depth-of-field live in the miniature pass, so
    // SMAA goes last: its edge detection expects final sRGB pixels, not the
    // linear HDR buffer that the earlier passes operate on.
    this.composer.addPass(this.miniaturePass);
    this.composer.addPass(this.smaaPass);
    this.ditherPass = createDitherPass();
    this.composer.addPass(this.ditherPass);

    // Plinth & glowing ring
    this.plinthGroup = new THREE.Group();
    this.scene.add(this.plinthGroup);

    // Square plinth — the house style is a cut slab, not a circular stand.
    this.plinthTopMat = new THREE.MeshStandardMaterial({ color: '#1a1c24', roughness: 0.88 });
    const plinthTop = new THREE.Mesh(new THREE.BoxGeometry(17.4, 0.5, 17.4), this.plinthTopMat);
    plinthTop.position.y = -0.25;
    plinthTop.receiveShadow = true;
    this.plinthGroup.add(plinthTop);

    this.plinthBaseMat = new THREE.MeshStandardMaterial({ color: '#111218', roughness: 0.9 });
    const plinthBase = new THREE.Mesh(new THREE.BoxGeometry(18.6, 0.2, 18.6), this.plinthBaseMat);
    plinthBase.position.y = -0.6;
    this.plinthGroup.add(plinthBase);

    this.ringMat = new THREE.MeshStandardMaterial({
      color: '#e8b04a',
      emissive: '#e8b04a',
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });
    this.ringMat.userData.i = 0.6;
    // Square emissive rim: a thin flat frame instead of the old torus ring.
    const rimShape = new THREE.Shape();
    rimShape.moveTo(-8.52, -8.52);
    rimShape.lineTo(8.52, -8.52);
    rimShape.lineTo(8.52, 8.52);
    rimShape.lineTo(-8.52, 8.52);
    rimShape.closePath();
    const rimHole = new THREE.Path();
    rimHole.moveTo(-8.46, -8.46);
    rimHole.lineTo(-8.46, 8.46);
    rimHole.lineTo(8.46, 8.46);
    rimHole.lineTo(8.46, -8.46);
    rimHole.closePath();
    rimShape.holes.push(rimHole);
    const plinthRing = new THREE.Mesh(
      new THREE.ShapeGeometry(rimShape).rotateX(-Math.PI / 2),
      this.ringMat
    );
    plinthRing.position.y = 0.01;
    this.plinthGroup.add(plinthRing);

    this.studioShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9),
      new THREE.MeshBasicMaterial({
        map: getSoftTexture(),
        color: '#94a0ad',
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      })
    );
    this.studioShadow.rotation.x = -Math.PI / 2;
    this.studioShadow.visible = false;
    this.studioShadow.renderOrder = -1;
    this.studioShadow.userData.cannotReceiveAO = true;
    this.scene.add(this.studioShadow);

    this.heroRoot = new THREE.Group();
    this.scene.add(this.heroRoot);

    this.markerGroup = new THREE.Group();
    this.scene.add(this.markerGroup);

    // Next-landmark geographic direction indicator (GPU-driven soft particle stream + ground chevron)
    const DIR_COUNT = 36;
    this.directionGroup = new THREE.Group();
    this.directionGroup.visible = false;
    this.scene.add(this.directionGroup);

    const dirSeedData = new Float32Array(DIR_COUNT * 3);
    for (let i = 0; i < DIR_COUNT; i++) {
      dirSeedData[i * 3] = i / DIR_COUNT;
      dirSeedData[i * 3 + 1] = i;
      dirSeedData[i * 3 + 2] = Math.sin(i * 2.31);
    }
    this.directionGeo = new THREE.BufferGeometry();
    this.directionGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(DIR_COUNT * 3), 3)
    );
    this.directionGeo.setAttribute('aSeed', new THREE.BufferAttribute(dirSeedData, 3));
    this.directionPointsMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uMap: { value: getSoftTexture() },
        uAnimTime: { value: 0 },
        uOpacity: { value: 0 },
        uDayWarmth: { value: 1 },
        uPointScale: { value: 180 },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aSeed;
        uniform float uAnimTime;
        uniform float uPointScale;
        varying float vGlow;
        void main() {
          float phase = aSeed.x;
          float u = fract(phase + uAnimTime);
          float fade = sin(u * 3.14159265);
          float dist = 4.2 + u * 6.4;
          float arcY = 0.22 + sin(u * 3.14159265) * 1.18 + sin(phase * 18.0 + uAnimTime * 3.46) * 0.06;
          float spreadZ = sin(aSeed.y * 2.31 + uAnimTime * 1.73) * (0.28 - u * 0.14);
          vGlow = fade * (0.62 + 0.38 * sin(phase * 12.0 - uAnimTime * 6.15));
          vec4 mvPosition = modelViewMatrix * vec4(dist, arcY, spreadZ, 1.0);
          gl_PointSize = clamp((0.44 * uPointScale) / max(1.0, -mvPosition.z), 4.0, 26.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform float uOpacity;
        uniform float uDayWarmth;
        varying float vGlow;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          if (tex.a < 0.02) discard;
          vec3 col = vec3(1.0, 0.78, 0.36) * (vGlow * uDayWarmth);
          gl_FragColor = vec4(col, tex.a * uOpacity);
        }
      `,
    });
    this.directionPointsMat.userData.noDissolve = true;
    const directionPoints = new THREE.Points(this.directionGeo, this.directionPointsMat);
    directionPoints.frustumCulled = false;
    directionPoints.userData.noDissolve = true;
    directionPoints.userData.cannotReceiveAO = true;
    directionPoints.userData.noShadow = true;
    directionPoints.renderOrder = 3;
    this.directionGroup.add(directionPoints);

    const chevShape = new THREE.Shape();
    chevShape.moveTo(0.45, 0);
    chevShape.lineTo(-0.22, 0.34);
    chevShape.lineTo(-0.08, 0);
    chevShape.lineTo(-0.22, -0.34);
    chevShape.closePath();
    this.directionChevronMat = new THREE.MeshBasicMaterial({
      color: '#f5c56b',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.directionChevron = new THREE.Mesh(
      new THREE.ShapeGeometry(chevShape).rotateX(-Math.PI / 2),
      this.directionChevronMat
    );
    this.directionChevron.position.set(7.7, 0.04, 0);
    this.directionChevron.userData.noDissolve = true;
    this.directionChevron.userData.cannotReceiveAO = true;
    this.directionChevron.userData.noShadow = true;
    this.directionChevron.renderOrder = 3;
    this.directionGroup.add(this.directionChevron);

    this.directionPulseMat = new THREE.MeshBasicMaterial({
      color: '#e8b04a',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.directionPulse = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.36, 24).rotateX(-Math.PI / 2),
      this.directionPulseMat
    );
    this.directionPulse.position.set(7.7, 0.036, 0);
    this.directionPulse.userData.noDissolve = true;
    this.directionPulse.userData.cannotReceiveAO = true;
    this.directionPulse.userData.noShadow = true;
    this.directionPulse.renderOrder = 3;
    this.directionGroup.add(this.directionPulse);

    // Dissolve dust particles (100% GPU shader animation)
    const DN = 160;
    const dustData = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) {
      dustData[i * 3] = i;
      dustData[i * 3 + 1] = 1 + (i % 7) * 0.9;
      dustData[i * 3 + 2] = ((i % 9) - 4) * 0.16;
    }
    this.dustGeo = new THREE.BufferGeometry()
      .setAttribute('position', new THREE.BufferAttribute(new Float32Array(DN * 3), 3))
      .setAttribute('aDust', new THREE.BufferAttribute(dustData, 3));
    this.dustMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uMap: { value: getSoftTexture() },
        uColor: { value: SKY_COLOR.clone() },
        uOpacity: { value: 0 },
        uElapsed: { value: 0 },
        uCutY: { value: 100 },
        uPointScale: { value: 180 },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aDust;
        uniform float uElapsed;
        uniform float uCutY;
        uniform float uPointScale;
        void main() {
          float i = aDust.x;
          float r = aDust.y;
          vec3 wp = vec3(
            cos(i * 2.1 + uElapsed * 3.0) * r,
            uCutY + aDust.z,
            sin(i * 1.7 + uElapsed * 2.0) * r
          );
          vec4 mvPosition = modelViewMatrix * vec4(wp, 1.0);
          gl_PointSize = clamp((0.28 * uPointScale) / max(1.0, -mvPosition.z), 3.0, 20.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform vec3 uColor;
        uniform float uOpacity;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          if (tex.a < 0.02) discard;
          gl_FragColor = vec4(uColor, tex.a * uOpacity);
        }
      `,
    });
    this.dustMat.userData.noDissolve = true;
    this.dustPoints = new THREE.Points(this.dustGeo, this.dustMat);
    this.dustPoints.frustumCulled = false;
    this.dustPoints.visible = false;
    this.dustPoints.userData.noShadow = true;
    this.dustPoints.userData.cannotReceiveAO = true;
    this.scene.add(this.dustPoints);

    // Weather, Wind Particles, Horizon Scenery & Globe sub-controllers
    this.weather = createWeatherScene(this.scene);
    this.windParticles = createWindParticles(this.scene);
    this.horizon = createHorizonScenery(this.scene);
    this.atmosphere = createAtmosphereScene(this.scene);
    this.globe = createGlobeScene(
      canvas,
      window.innerWidth / window.innerHeight,
      this.isSoftwareGl,
      this.isSoftwareGl ? 2 : 0
    );
    this.scene.add(this.globe.group);
    this.places = createPlacesScene(
      canvas,
      window.innerWidth / window.innerHeight,
      this.isSoftwareGl
    );
    this.scene.add(this.places.group);

    this.setQualityIndex(this.isSoftwareGl ? 2 : 0);
    this.bindEvents(canvas);
    this.lastTick = performance.now();
    this.scheduleNextFrame();
  }

  private static detectSoftwareGl(): boolean {
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2');
      let software = false;
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const rendererStr = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
        software = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(String(rendererStr));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      return software;
    } catch {
      return false;
    }
  }

  private createMarkerTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(32, 32, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(232,176,74,.25)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(32, 32, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#e8b04a';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private createUserPinTexture(category: NoteCategory): THREE.CanvasTexture {
    const palette: Record<NoteCategory, { halo: string; fill: string; ink: string }> = {
      memory: {
        halo: 'rgba(92, 214, 169, 0.25)',
        fill: '#38c793',
        ink: '#0e1f18',
      },
      photo: {
        halo: 'rgba(232, 176, 74, 0.26)',
        fill: '#e8b04a',
        ink: '#1f1606',
      },
      history: {
        halo: 'rgba(255, 122, 138, 0.26)',
        fill: '#ff7a8a',
        ink: '#240b10',
      },
    };
    const colors = palette[category];
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(32, 30, 23, 0, Math.PI * 2);
      ctx.fillStyle = colors.halo;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(32, 27, 14, Math.PI * 0.85, Math.PI * 0.15, false);
      ctx.quadraticCurveTo(42, 41, 32, 50);
      ctx.quadraticCurveTo(22, 41, 19.3, 33.4);
      ctx.closePath();
      ctx.fillStyle = colors.fill;
      ctx.fill();
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = '#f6f3eb';
      ctx.stroke();

      ctx.strokeStyle = colors.ink;
      ctx.fillStyle = colors.ink;
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (category === 'photo') {
        // Miniature viewfinder camera glyph
        ctx.strokeRect(24.5, 23, 15, 10.5);
        ctx.beginPath();
        ctx.arc(32, 28.2, 2.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(28.5, 23);
        ctx.lineTo(30, 20.5);
        ctx.lineTo(34, 20.5);
        ctx.lineTo(35.5, 23);
        ctx.stroke();
      } else if (category === 'history') {
        // Miniature hourglass / heritage monument glyph
        ctx.beginPath();
        ctx.moveTo(26.5, 21.5);
        ctx.lineTo(37.5, 21.5);
        ctx.lineTo(26.5, 33.5);
        ctx.lineTo(37.5, 33.5);
        ctx.closePath();
        ctx.stroke();
      } else {
        // Note lines glyph
        ctx.beginPath();
        ctx.moveTo(26, 23.5);
        ctx.lineTo(38, 23.5);
        ctx.moveTo(26, 28);
        ctx.lineTo(38, 28);
        ctx.moveTo(26, 32.5);
        ctx.lineTo(34, 32.5);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private markerTexture: THREE.CanvasTexture | null = null;
  private userPinTextures: Partial<Record<NoteCategory, THREE.CanvasTexture>> = {};
  private readonly userNotesByIndex = new Map<number, LandmarkNote[]>();
  private readonly userPinPopTimers = new Map<string, number>();

  private getUserPinTexture(category: NoteCategory = 'memory'): THREE.CanvasTexture {
    let tex = this.userPinTextures[category];
    if (!tex) {
      tex = this.createUserPinTexture(category);
      this.userPinTextures[category] = tex;
    }
    return tex;
  }

  computeDefaultNotePosition(
    landmarkIndex: number,
    existingCount: number
  ): [number, number, number] {
    const existingNotes = this.userNotesByIndex.get(landmarkIndex) ?? [];
    const factDots = LANDMARKS[landmarkIndex]?.dots ?? [];
    let cx = 0;
    let cz = 0;
    let baseMinY = 0.2;
    let heightSpan = 3.0;
    let radiusX = 2.4;
    let radiusZ = 2.4;

    if (landmarkIndex === this.activeIndex && this.currentGroup) {
      const box = this.computeDioramaBounds(this.currentGroup);
      if (!box.isEmpty()) {
        const size = box.getSize(this.fitSizeTmp);
        const center = box.getCenter(this.fitCenterTmp);
        cx = center.x;
        cz = center.z;
        baseMinY = box.min.y;
        heightSpan = Math.max(1.2, size.y);
        radiusX = THREE.MathUtils.clamp(size.x * 0.34, 1.35, 4.4);
        radiusZ = THREE.MathUtils.clamp(size.z * 0.34, 1.35, 4.4);
      }
    }

    const baseAngle = existingCount * 2.39996 + 0.65;
    for (let attempt = 0; attempt < 8; attempt++) {
      const angle = baseAngle + attempt * 0.42;
      const radialBoost = 1 + (attempt > 0 ? 0.12 * attempt : 0);
      const px = Number((cx + Math.cos(angle) * radiusX * radialBoost).toFixed(2));
      const pz = Number((cz + Math.sin(angle) * radiusZ * radialBoost).toFixed(2));
      const py = Number(
        THREE.MathUtils.clamp(
          baseMinY + heightSpan * 0.54 + ((existingCount + attempt) % 2) * 0.55,
          1.45,
          5.2
        ).toFixed(2)
      );

      const collidesFact = factDots.some(
        ([fx, fy, fz]) => Math.hypot(px - fx, py - fy, pz - fz) < 1.05
      );
      const collidesNote = existingNotes.some(
        (n) => Math.hypot(px - n.position[0], py - n.position[1], pz - n.position[2]) < 1.05
      );
      if (!collidesFact && !collidesNote) {
        return [px, py, pz];
      }
    }

    return [
      Number((cx + Math.cos(baseAngle) * radiusX).toFixed(2)),
      Number(THREE.MathUtils.clamp(baseMinY + heightSpan * 0.62, 1.6, 5.2).toFixed(2)),
      Number((cz + Math.sin(baseAngle) * radiusZ).toFixed(2)),
    ];
  }

  setUserNotes(
    landmarkIndex: number,
    notes: readonly LandmarkNote[],
    highlightNewId?: string
  ): void {
    this.userNotesByIndex.set(landmarkIndex, [...notes]);
    if (highlightNewId) {
      this.userPinPopTimers.set(highlightNewId, 1);
    }
    if (landmarkIndex === this.activeIndex) {
      this.rebuildMarkers(landmarkIndex);
    }
  }

  focusUserNote(noteId: string): void {
    const targetSprite = this.markerSprites.find((s) => s.userData.noteId === noteId);
    if (!targetSprite) return;
    this.activePinCursor = this.markerSprites.indexOf(targetSprite);
    this.userPinPopTimers.set(noteId, 0.85);
    this.focusOnFactPoint(targetSprite.position);
  }

  setPinDropMode(active: boolean): void {
    this.pinDropMode = active;
    this.lastInteractAt = this.elapsed;
    if (!this.globe.isOpen && !this.places.isOpen) {
      this.renderer.domElement.style.cursor = active ? 'crosshair' : 'default';
    }
  }

  setCutawayMode(active: boolean): void {
    if (this.cutawayActive === active) return;
    this.cutawayActive = active;
    this.lastInteractAt = this.elapsed;
    if (this.motionScale === 0) {
      this.cutawayAmount = active ? 1 : 0;
      for (const entry of this.cutawayEntries) {
        entry.obj.position.y = entry.baseY + entry.liftY * this.cutawayAmount;
      }
      if (!this.isSoftwareGl) {
        this.renderer.shadowMap.needsUpdate = true;
      }
    }
  }

  stepInteractivePin(
    dir: 1 | -1
  ): { kind: 'fact' | 'note'; text?: string; noteId?: string } | null {
    if (this.markerSprites.length === 0 || this.globe.isOpen || this.places.isOpen) {
      return null;
    }
    const len = this.markerSprites.length;
    const nextCursor =
      this.activePinCursor < 0 ? (dir > 0 ? 0 : len - 1) : (this.activePinCursor + dir + len) % len;
    this.activePinCursor = nextCursor;
    const sp = this.markerSprites[nextCursor];
    if (!sp) return null;
    this.focusOnFactPoint(sp.position);
    ambientAudio.playSfx('ping');
    ambientAudio.vibrate(10);
    if (sp.userData.pinKind === 'note') {
      const noteId = sp.userData.noteId as string | undefined;
      if (noteId) {
        this.userPinPopTimers.set(noteId, 0.85);
        return { kind: 'note', noteId };
      }
    }
    const text = sp.userData.factText as string | undefined;
    return { kind: 'fact', text };
  }

  private rebuildMarkers(index: number): void {
    this.markerSprites.forEach((s) => {
      this.markerGroup.remove(s);
      s.material.dispose();
    });
    this.markerSprites = [];
    this.activePinCursor = -1;
    if (!this.markerTexture) {
      this.markerTexture = this.createMarkerTexture();
    }
    const dots = LANDMARKS[index].dots;
    dots.forEach(([x, y, z, text]) => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.markerTexture!,
          depthTest: false,
          depthWrite: false,
          transparent: true,
        })
      );
      sprite.position.set(x, y, z);
      sprite.scale.setScalar(0.6);
      sprite.userData.pinKind = 'fact';
      sprite.userData.factText = text;
      sprite.userData.cannotReceiveAO = true;
      sprite.renderOrder = 2;
      this.markerGroup.add(sprite);
      this.markerSprites.push(sprite);
    });

    const userNotes = this.userNotesByIndex.get(index) ?? [];
    userNotes.forEach((note) => {
      const category = note.category ?? 'memory';
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.getUserPinTexture(category),
          depthTest: false,
          depthWrite: false,
          transparent: true,
        })
      );
      sprite.position.set(note.position[0], note.position[1], note.position[2]);
      sprite.scale.setScalar(0.68);
      sprite.userData.pinKind = 'note';
      sprite.userData.noteId = note.id;
      sprite.userData.noteText = note.text;
      sprite.userData.baseY = note.position[1];
      sprite.userData.cannotReceiveAO = true;
      sprite.renderOrder = 3;
      this.markerGroup.add(sprite);
      this.markerSprites.push(sprite);
    });
  }

  private buildLandmarkGroup(index: number): THREE.Group {
    const meta = LANDMARKS[index];
    const builder = LANDMARK_BUILDERS[meta.k];
    const group = builder ? builder() : new THREE.Group();
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh && !obj.userData.noShadow) {
        const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        const transparent = Boolean(mat && mat.transparent && mat.opacity < 0.85);
        let tinyStatic = false;
        if (!transparent && !(obj instanceof THREE.InstancedMesh) && obj.geometry) {
          if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
          const bb = obj.geometry.boundingBox;
          if (bb) {
            bb.getSize(this.tmpCasterSize);
            if (this.tmpCasterSize.length() < 0.09) tinyStatic = true;
          }
        }
        obj.castShadow = !this.isSoftwareGl && !transparent && !tinyStatic;
        obj.receiveShadow = !this.isSoftwareGl;
      }
    });
    return group;
  }

  /**
   * Build and compile a single upcoming/previous landmark while idle and hold up
   * to 4 entries in an LRU pool so switches cost neither a rebuild nor a shader link.
   */
  private prewarmLandmarkIndex(targetIndex: number): void {
    if (
      this.disposed ||
      this.isSoftwareGl ||
      this.globe.isOpen ||
      this.places.isOpen ||
      targetIndex === this.activeIndex ||
      this.landmarkCache.has(targetIndex) ||
      this.prewarmInFlight.has(targetIndex)
    ) {
      return;
    }

    const savedGlow = glowMaterials.slice();
    const savedSway = swayItems.slice();
    const savedWet = wetMaterials.slice();
    const group = this.buildLandmarkGroup(targetIndex);
    const entry = {
      group,
      glow: glowMaterials.slice(savedGlow.length),
      sway: swayItems.slice(savedSway.length),
      wet: wetMaterials.slice(savedWet.length),
    };
    glowMaterials.length = 0;
    for (const m of savedGlow) glowMaterials.push(m);
    swayItems.length = 0;
    for (const s of savedSway) swayItems.push(s);
    wetMaterials.length = 0;
    for (const w of savedWet) wetMaterials.push(w);

    while (this.landmarkCache.size >= 4) {
      const oldestKey = this.landmarkCache.keys().next().value;
      if (oldestKey === undefined) break;
      const evicted = this.landmarkCache.get(oldestKey);
      this.landmarkCache.delete(oldestKey);
      if (evicted) this.disposeTransientResources(evicted.group);
    }
    this.landmarkCache.set(targetIndex, entry);

    if (!this.bootPrewarmDone) {
      this.bootPrewarmDone = true;
      try {
        this.renderer.compile(group, this.camera, this.scene);
        const rt = new THREE.WebGLRenderTarget(1, 1);
        const prevTarget = this.renderer.getRenderTarget();
        const prevHero = this.heroRoot.visible;
        this.heroRoot.visible = false;
        this.scene.add(group);
        try {
          this.renderer.setRenderTarget(rt);
          this.renderer.render(this.scene, this.camera);
        } finally {
          this.renderer.setRenderTarget(prevTarget);
          this.scene.remove(group);
          this.heroRoot.visible = prevHero;
          rt.dispose();
        }
      } catch {
        // Fall back to first-use compilation if the driver rejects the warm-up.
      }
      return;
    }

    if (typeof this.renderer.compileAsync === 'function') {
      this.prewarmInFlight.add(targetIndex);
      void this.renderer
        .compileAsync(group, this.camera, this.scene)
        .catch(() => {})
        .finally(() => {
          this.prewarmInFlight.delete(targetIndex);
        });
    }
  }

  private prewarmNextLandmark(): void {
    const next = (this.activeIndex + 1) % LANDMARKS.length;
    if (!this.landmarkCache.has(next)) {
      this.prewarmLandmarkIndex(next);
      return;
    }
    const prev = (this.activeIndex - 1 + LANDMARKS.length) % LANDMARKS.length;
    if (!this.landmarkCache.has(prev)) {
      this.prewarmLandmarkIndex(prev);
    }
  }

  private disposeTransientResources(root: THREE.Object3D): void {
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line) {
        const geo = obj.geometry;
        if (geo && !geo.userData?.sharedResource) {
          geo.dispose();
        }
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (let i = 0; i < mats.length; i++) {
          const mat = mats[i];
          if (mat && !mat.userData?.sharedResource) {
            mat.dispose();
          }
        }
      }
    });
  }

  private updateLods(cam: THREE.Camera, force = false): void {
    if (!this.currentGroup || this.activeLods.length === 0) return;
    if (
      !force &&
      this.qualityIndex === this.lastLodQuality &&
      cam.position.distanceToSquared(this.lastLodCamPos) < 0.0025
    ) {
      return;
    }
    this.lastLodCamPos.copy(cam.position);
    this.lastLodQuality = this.qualityIndex;
    const lodBias = this.qualityIndex === 2 ? 1.45 : this.qualityIndex === 1 ? 1.18 : 1.0;
    if (lodBias === 1) {
      for (let i = 0; i < this.activeLods.length; i++) {
        this.activeLods[i].update(cam);
      }
      return;
    }
    this.lodCamProxy.copy(cam as THREE.PerspectiveCamera);
    this.lodCamProxy.position.copy(cam.position).multiplyScalar(lodBias);
    this.lodCamProxy.updateMatrixWorld(true);
    for (let i = 0; i < this.activeLods.length; i++) {
      this.activeLods[i].update(this.lodCamProxy);
    }
  }

  private forceLodLevel0(root: THREE.Object3D): void {
    root.traverse((obj) => {
      if (obj instanceof THREE.LOD) {
        for (let i = 0; i < obj.levels.length; i++) {
          obj.levels[i].object.visible = i === 0;
        }
      }
    });
  }

  private resetCutawayOffsets(): void {
    for (let i = 0; i < this.cutawayEntries.length; i++) {
      const entry = this.cutawayEntries[i];
      entry.obj.position.y = entry.baseY;
    }
    this.cutawayEntries = [];
    this.cutawayAmount = 0;
  }

  private computeCutawayEntries(group: THREE.Group): void {
    this.cutawayEntries = [];
    this.cutawayAmount = 0;
    const heroBox = this.computeDioramaBounds(group);
    if (heroBox.isEmpty()) return;
    heroBox.getSize(this.dropSizeTmp);
    const minY = heroBox.min.y;
    const sizeY = Math.max(0.8, this.dropSizeTmp.y);
    const liftedSet = new Set<THREE.Object3D>();

    const visit = (node: THREE.Object3D) => {
      if (node !== group) {
        if (
          node.userData.noShadow ||
          node.userData.cannotReceiveAO ||
          node.userData.noDissolve ||
          !node.visible
        ) {
          return;
        }
        // Lift self-contained elevated sub-assemblies or standalone upper meshes
        this.dropBoxTmp.setFromObject(node);
        if (!this.dropBoxTmp.isEmpty()) {
          this.dropBoxTmp.getCenter(this.dropCenterTmp);
          this.dropBoxTmp.getSize(this.dropSizeTmp);
          const isWideBase =
            this.dropSizeTmp.x > 10.5 && this.dropSizeTmp.z > 10.5 && this.dropSizeTmp.y < 1.2;
          const relY = (this.dropCenterTmp.y - minY) / sizeY;
          if (!isWideBase && relY > 0.42 && this.dropSizeTmp.y < sizeY * 0.72) {
            liftedSet.add(node);
            const liftY = THREE.MathUtils.clamp((relY - 0.34) * sizeY * 0.48, 0.4, 3.0);
            this.cutawayEntries.push({
              obj: node,
              baseY: node.position.y,
              liftY,
            });
            return;
          }
        }
      }
      for (let i = 0; i < node.children.length; i++) {
        visit(node.children[i]);
      }
    };
    visit(group);
  }

  showLandmarkImmediate(index: number): void {
    this.activeIndex = index;
    this.lastSwitchAt = this.elapsed;
    this.resetCutawayOffsets();
    ambientAudio.setSpatialFocusBoost(0);
    if (this.currentGroup) {
      const old = this.currentGroup;
      this.heroRoot.remove(old);
      this.disposeTransientResources(old);
    }
    if (this.outgoingGroup) {
      const out = this.outgoingGroup;
      this.heroRoot.remove(out);
      this.disposeTransientResources(out);
      this.outgoingGroup = null;
    }
    resetSceneDynamicLists(this.ringMat);
    const cached = this.landmarkCache.get(index);
    if (cached) {
      this.landmarkCache.delete(index);
      this.currentGroup = cached.group;
      for (const m of cached.glow) glowMaterials.push(m);
      for (const s of cached.sway) swayItems.push(s);
      for (const w of cached.wet) wetMaterials.push(w);
    } else {
      this.currentGroup = this.buildLandmarkGroup(index);
    }
    const lods: THREE.LOD[] = [];
    this.currentGroup.traverse((obj) => {
      if (obj instanceof THREE.LOD) {
        lods.push(obj);
      }
    });
    this.activeLods = lods;
    this.hasAnimatedShadowScene = Boolean(this.currentGroup.userData.hasAnimatedShadowMeshes);
    this.hoveredMarkerIndex = -1;
    this.hoveredHero = false;
    this.lastLodCamPos.set(Infinity, Infinity, Infinity);
    this.lastShadowKeyPos.set(Infinity, Infinity, Infinity);
    this.lastGlowLit = -1;
    setContactShadowFade(this.currentGroup, 1);
    ambientAudio.setSiteProfile(
      (this.currentGroup.userData.audioProfile as AmbientSiteProfile | undefined) ?? null
    );
    this.atmosphere.setSite({
      key: LANDMARKS[index].k,
      biome: LANDMARKS[index].biome,
    });
    this.windParticles.setBiome(LANDMARKS[index].biome, LANDMARKS[index].k);
    this.horizon.setBiome(LANDMARKS[index].biome);
    // Re-tint the soft bounce fill to the newly loaded site's biome.
    setBounceLightBiome(
      this.bounceLight,
      (this.currentGroup.userData.biome as string | undefined) ?? LANDMARKS[index].biome
    );
    this.heroRoot.add(this.currentGroup);
    this.heroRoot.rotation.y = 0;
    this.heroRoot.scale.setScalar(1);
    this.computeCutawayEntries(this.currentGroup);
    if (this.cutawayActive) {
      this.cutawayAmount = this.motionScale === 0 ? 1 : 0;
      for (const entry of this.cutawayEntries) {
        entry.obj.position.y = entry.baseY + entry.liftY * this.cutawayAmount;
      }
    }
    this.switchSettle = 0;
    this.rebuildMarkers(index);
    this.dissolvePhase = 0;
    this.camGoal = null;
    this.targetGoalActive = false;
    this.hasCustomFocus = false;
    this.rackFocusBlend = 0;
    this.cursorStrengthTarget = 0;
    this.lastInteractAt = this.elapsed;
    WU.dy.value = 100;
    this.dustPoints.visible = false;
    // Reframes for the active theme (Studio keeps its fixed isometric shot).
    this.frameCurrentLandmark();
    if (!this.isSoftwareGl && !this.isStudio()) {
      const box = this.computeDioramaBounds(this.currentGroup);
      fitDioramaShadowBounds(this.keyLight, box);
    }
    this.updateLods(this.camera, true);
    if (!this.isSoftwareGl) {
      this.renderer.shadowMap.needsUpdate = true;
    }
  }

  transitionToLandmark(index: number): void {
    if (!this.currentGroup) {
      this.showLandmarkImmediate(index);
      return;
    }
    const prevIdx = this.activeIndex;
    const count = LANDMARKS.length;
    let dir: 1 | -1 = index >= prevIdx ? 1 : -1;
    if (prevIdx === count - 1 && index === 0) dir = 1;
    else if (prevIdx === 0 && index === count - 1) dir = -1;
    this.switchDir = dir;

    this.activeIndex = index;
    if (this.outgoingGroup) {
      const out = this.outgoingGroup;
      this.heroRoot.remove(out);
      this.disposeTransientResources(out);
      this.outgoingGroup = null;
    }
    if (this.motionScale === 0) {
      this.showLandmarkImmediate(index);
      return;
    }
    this.pendingIndex = index;
    this.dissolvePhase = 1;
    this.dissolveT = 0;
    this.lastSwitchAt = this.elapsed;
    const lm = LANDMARKS[index];
    ambientAudio.playSfx('whoosh');
    ambientAudio.vibrateForLandmark(lm.biome, lm.c);
  }

  applyQuality(setting: QualitySetting): void {
    this.qualitySetting = setting;
    this.renderScale = 1;
    const idx: QualityIndex =
      setting === 'low'
        ? 2
        : setting === 'balanced'
          ? 1
          : setting === 'high'
            ? 0
            : this.isSoftwareGl
              ? 2
              : 0;
    this.lastInteractAt = this.elapsed;
    this.setQualityIndex(idx);
  }

  private setShadowMapSize(size: number): void {
    if (this.keyLight.shadow.mapSize.x !== size) {
      this.keyLight.shadow.mapSize.set(size, size);
      this.keyLight.shadow.map?.dispose();
      this.keyLight.shadow.map = null;
    }
  }

  /** Exposure lift for Dark so shaded albedo still reads as a lit miniature. */
  private themeExposure(): number {
    const base = this.cinematic && !this.isSoftwareGl ? 1.16 : 1.08;
    return base * (this.theme === 'dark' ? 1.06 : 1);
  }

  /** AO is relaxed by theme; Studio keeps its original catalogue-grade value. */
  private n8aoThemeIntensity(): number {
    const base = this.cinematic && !this.isSoftwareGl ? 2.2 : 1.85;
    if (this.theme === 'dark') return base * 0.7;
    if (this.theme === 'daylight') return base * 0.85;
    return base;
  }

  /**
   * Adaptive auto exposure: measures the average luminance of the final beauty
   * buffer and nudges `toneMappingExposure` toward a mid-gray target. The
   * composer target is HalfFloatType, so pixels must be decoded as half floats
   * (reading them as bytes yields zeros and silently disables adaptation).
   * Four full-width rows sample both the bright sky and the darker miniature.
   */
  private updateAutoExposure(dt: number): void {
    if (this.isSoftwareGl || this.qualityIndex >= 2 || !this.composer) return;
    const rt = this.composer.readBuffer;
    const W = Math.floor(rt.width);
    const H = Math.floor(rt.height);
    if (W < 1 || H < 1) return;
    if (!this.exposureBuf || this.exposureBuf.length < W * 4) {
      this.exposureBuf = new Uint16Array(W * 4);
    }
    const buf = this.exposureBuf;
    // A single mid-height row crosses both the brighter sky and the darker
    // miniature. One readback per frame keeps the sync stall minimal.
    this.renderer.readRenderTargetPixels(rt, 0, Math.floor(H * 0.5), W, 1, buf);
    let sum = 0;
    let n = 0;
    for (let i = 0; i < W; i++) {
      const r = THREE.DataUtils.fromHalfFloat(buf[i * 4]);
      const g = THREE.DataUtils.fromHalfFloat(buf[i * 4 + 1]);
      const b = THREE.DataUtils.fromHalfFloat(buf[i * 4 + 2]);
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        n++;
      }
    }
    const avg = n ? sum / n : 0;
    if (!(avg > 0.02) || !Number.isFinite(avg)) return;
    const k = 1 - Math.exp(-Math.max(dt, 0) * 0.9);
    const desired = this.autoExposureValue * (0.58 / avg);
    this.autoExposureValue += (desired - this.autoExposureValue) * k;
    this.autoExposureValue = Math.min(4.0, Math.max(0.3, this.autoExposureValue));
    this.renderer.toneMappingExposure = this.autoExposureValue;
    this.miniaturePass.setExposure(this.autoExposureValue);
  }

  /** Apply the per-theme miniature grade (DoF band, vignette, AO and exposure). */
  private applyPostGrade(): void {
    if (this.theme === 'studio') {
      // Preserved verbatim from the original Studio preset.
      this.baseAperture = 0.7;
      this.miniaturePass.applyTuning({
        blur: 0.7,
        vignette: 0.03,
        aperture: 0.7,
        focusRange: 0.34,
        focusY: 0.5,
      });
    } else if (this.theme === 'daylight') {
      // Clean, bright tabletop: light blur and a shallow vignette.
      this.baseAperture = 0.78;
      this.miniaturePass.applyTuning({
        blur: 1.05,
        vignette: 0.1,
        aperture: 0.78,
        focusRange: 0.3,
        focusY: 0.5,
      });
    } else {
      // Dark: a wider focus band and much lighter vignette keep shaded detail
      // legible instead of crushing the diorama into a silhouette.
      this.baseAperture = 0.82;
      this.miniaturePass.applyTuning({
        blur: 1.2,
        vignette: 0.08,
        aperture: 0.82,
        focusRange: 0.28,
        focusY: 0.5,
      });
    }
    this.n8aoPass.configuration.intensity = this.n8aoThemeIntensity();
    this.renderer.toneMappingExposure = this.themeExposure();
    this.miniaturePass.setExposure(this.renderer.toneMappingExposure);
  }

  private updateDynamicAoState(): void {
    if (this.isSoftwareGl || this.qualityIndex !== 0) return;
    if (this.cinematic) {
      this.n8aoPass.enabled = true;
      this.renderPass.enabled = false;
      return;
    }
    const suspendAo =
      (this.isUserOrbiting || this.timeLapsePlaying) &&
      this.qualitySetting === 'auto' &&
      (window.devicePixelRatio || 1) > 1.5;
    this.n8aoPass.enabled = !suspendAo;
    this.renderPass.enabled = suspendAo;
  }

  setTimeLapsePlaying(active: boolean): void {
    if (this.timeLapsePlaying === active) return;
    this.timeLapsePlaying = active;
    this.updateDynamicAoState();
  }

  setCardDragParallax(deltaX: number): void {
    if (this.motionScale === 0) {
      this.cardParallaxTarget = 0;
      return;
    }
    this.cardParallaxTarget = THREE.MathUtils.clamp(deltaX / 240, -1, 1) * 0.11;
  }

  refreshFraming(): void {
    if (this.globe.isOpen || this.places.isOpen || this.isStudio()) return;
    this.computeResponsiveFraming();
    if (!this.hasCustomFocus && this.currentGroup) {
      const box = this.computeDioramaBounds(this.currentGroup);
      if (!box.isEmpty()) {
        box.getCenter(this.fitCenterTmp);
        const targetY = THREE.MathUtils.clamp(
          this.fitCenterTmp.y + (this.baseTargetY - 1.5),
          0.6,
          2.8
        );
        this.heroFitCenter.set(
          this.fitCenterTmp.x + this.baseTargetX,
          targetY,
          this.fitCenterTmp.z
        );
        this.hasHeroFit = true;
      }
    }
  }

  private setQualityIndex(idx: QualityIndex): void {
    this.qualityIndex = idx;
    this.globe.setQuality(idx);
    this.appliedRenderScale = -1;
    this.applyRenderScale();

    const highFx = !this.isSoftwareGl && idx === 0;
    const midFx = !this.isSoftwareGl && idx === 1;
    const postFx = highFx || midFx;
    const suspendAoForMotion =
      (this.isUserOrbiting || this.timeLapsePlaying) &&
      this.qualitySetting === 'auto' &&
      (window.devicePixelRatio || 1) > 1.5;
    this.n8aoPass.enabled = highFx && !suspendAoForMotion;
    this.renderPass.enabled = midFx || (highFx && suspendAoForMotion);
    this.bloomPass.enabled = postFx && this.studioWeight < 0.99;
    this.miniaturePass.enabled = postFx;
    this.smaaPass.enabled = postFx;

    const shadowsOn = !this.isSoftwareGl && idx < 2;
    this.renderer.shadowMap.enabled = shadowsOn;
    if (shadowsOn) {
      this.setShadowMapSize(1024);
      this.renderer.shadowMap.needsUpdate = true;
    }

    if (this.cinematic && !this.isSoftwareGl) {
      // Best-effort WebGL stand-in for a native path tracer: bigger shadow
      // maps, higher-quality AO, slightly warmer exposure. A native ThreeRT
      // host overrides this through setCinematic() and traces every light.
      this.setShadowMapSize(2048);
      this.renderer.shadowMap.needsUpdate = true;
      this.renderer.toneMappingExposure = this.themeExposure();
      this.n8aoPass.configuration.halfRes = false;
      this.n8aoPass.configuration.aoRadius = 0.72;
      this.n8aoPass.configuration.intensity = this.n8aoThemeIntensity();
      this.n8aoPass.configuration.distanceFalloff = 1.25;
      this.n8aoPass.setQualityMode('High');
      this.n8aoPass.enabled = idx < 2;
    } else {
      this.renderer.toneMappingExposure = this.themeExposure();
      this.n8aoPass.configuration.halfRes = true;
      this.n8aoPass.configuration.aoRadius = 0.58;
      this.n8aoPass.configuration.intensity = this.n8aoThemeIntensity();
      this.n8aoPass.configuration.distanceFalloff = 1.05;
      this.n8aoPass.setQualityMode('Performance');
    }
  }

  setCinematic(enabled: boolean): void {
    if (this.cinematic === enabled) return;
    this.cinematic = enabled;
    this.setQualityIndex(this.qualityIndex);
  }

  /** Apply the current quality tier's pixel ratio scaled by the 60fps target. */
  private applyRenderScale(): void {
    if (this.isSoftwareGl) return;
    const base = [Math.min(devicePixelRatio || 1, 2), Math.min(devicePixelRatio || 1, 1.4), 1][
      this.qualityIndex
    ];
    const pr = Math.max(0.6, base * this.renderScale);
    if (Math.abs(this.appliedRenderScale - pr) < 0.001) return;
    this.appliedRenderScale = pr;
    this.renderer.setPixelRatio(pr);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  private isStudio(): boolean {
    return this.theme === 'studio';
  }

  private updatePlinthVisibility(): void {
    const hidden = this.globe.isOpen || this.places.isOpen;
    this.plinthGroup.visible = !hidden && !this.isStudio();
    this.studioShadow.visible = !hidden && this.isStudio();
  }

  setTheme(theme: ThemeSetting, immediate = false): void {
    const wasStudio = this.isStudio();
    const themeChanged = this.theme !== theme;
    this.theme = theme;
    this.lastInteractAt = this.elapsed;
    this.weather.setTheme(theme, immediate);
    this.updatePlinthVisibility();
    this.applyPostGrade();

    if (theme === 'studio') {
      this.scene.environment = this.roomEnvTex;
      this.targetBloomThreshold = 1.15;
      if (immediate) {
        this.studioWeight = 1;
        this.bloomPass.threshold = this.targetBloomThreshold;
        (this.scene.background as THREE.Color).set('#f7f7f4');
      }
      // A narrow FOV from far away reads as orthographic without changing any camera paths.
      this.camera.fov = 14;
      this.camera.updateProjectionMatrix();
      this.controls.autoRotate = false;
      if (!wasStudio && !immediate) this.frameCurrentLandmark();
      return;
    }

    if (wasStudio) {
      this.scene.environment = this.envTex;
      this.camera.fov = 42;
      this.camera.updateProjectionMatrix();
      this.controls.minDistance = 6;
      this.controls.maxDistance = 30;
      if (!immediate) this.resetCamera(window.innerWidth <= window.innerHeight);
    } else if (themeChanged && !immediate) {
      // Dark <-> Daylight: refit once, never on the per-frame path.
      this.frameCurrentLandmark();
    }

    if (theme === 'daylight') {
      this.targetPlinthTop.set('#b8ad99');
      this.targetPlinthBase.set('#968b76');
      this.targetRingCol.set('#b8842f');
      this.targetRingEmissive = 0.14;
      this.targetBloomThreshold = 1.0;
    } else {
      this.targetPlinthTop.set('#1a1c24');
      this.targetPlinthBase.set('#111218');
      this.targetRingCol.set('#e8b04a');
      this.targetRingEmissive = 0.35;
      this.targetBloomThreshold = 0.9;
    }

    if (immediate) {
      this.studioWeight = 0;
      this.plinthTopMat.color.copy(this.targetPlinthTop);
      this.plinthBaseMat.color.copy(this.targetPlinthBase);
      this.ringMat.color.copy(this.targetRingCol);
      this.ringMat.emissive.copy(this.targetRingCol);
      this.ringMat.emissiveIntensity = this.targetRingEmissive;
      this.bloomPass.threshold = this.targetBloomThreshold;
    }
  }

  setMotionPreferences(reduced: boolean): void {
    this.motionScale = reduced ? 0 : 1;
    this.autoRotateSpeed = reduced || this.isSoftwareGl ? 0 : 0.3;
    this.controls.autoRotate =
      !reduced &&
      !this.isSoftwareGl &&
      !this.globe.isOpen &&
      !this.places.isOpen &&
      !this.isStudio();
    this.controls.autoRotateSpeed = this.autoRotateSpeed;
  }

  setTiltEnabled(enabled: boolean): void {
    this.tiltEnabled = enabled;
    if (!enabled) {
      this.tiltOffsetX = 0;
      this.tiltOffsetY = 0;
    }
  }

  async requestTiltPermission(): Promise<boolean> {
    const devOri = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (devOri && typeof devOri.requestPermission === 'function') {
      try {
        const res = await devOri.requestPermission();
        return res === 'granted';
      } catch {
        return false;
      }
    }
    return true;
  }

  setWeather(condition: WeatherConditionKey, night: boolean, timeOfDay?: number): void {
    this.lastInteractAt = this.elapsed;
    this.weather.applyCondition(condition, night, timeOfDay);
  }

  /** Apply a real observation: cloud, rain, fog, wind and storm flow into the scene. */
  setLiveWeather(sample: LiveWeatherSample, timeOfDay: number): void {
    this.lastInteractAt = this.elapsed;
    this.weather.applyLiveSample(sample, timeOfDay);
  }

  setSeasonMonth(month: number, immediate = false): void {
    this.lastInteractAt = this.elapsed;
    this.weather.setSeasonMonth(month, immediate);
    ambientAudio.setSeasonMonth(month, immediate);
  }

  setSunAltitudeFromSlider(val: number): void {
    this.lastInteractAt = this.elapsed;
    this.weather.target.timeOfDay = val;
    this.weather.target.night = val < 6 || val >= 19 ? 1 : 0;
  }

  setSunAltitudeImmediate(val: number): void {
    this.lastInteractAt = this.elapsed;
    const isNight = val < 6 || val >= 19 ? 1 : 0;
    this.weather.target.timeOfDay = val;
    this.weather.target.night = isNight;
    this.weather.current.timeOfDay = val;
    this.weather.current.night = isNight;
    this.weather.update(12, this.elapsed, {
      qualityIndex: this.qualityIndex,
      motionScale: Math.max(0.01, this.motionScale),
      keyLight: this.keyLight,
      fillLight: this.fillLight,
      hemiLight: this.hemiLight,
      scene: this.scene,
      renderer: this.renderer,
    });
  }

  toggleRainRainbow(): void {
    this.lastInteractAt = this.elapsed;
    if (this.weather.target.rain > 0) {
      this.weather.target.rain = 0;
      this.weather.target.cover = 0.25;
      this.weather.triggerRainbow(12);
    }
  }

  openGlobe(visited: Set<number>): void {
    this.cursorStrengthTarget = 0;
    WU.cursorStrength.value = 0;
    this.lastInteractAt = this.elapsed;
    if (this.places.isOpen) {
      this.places.close();
      this.weather.rainLines.position.set(0, 0, 0);
      this.weather.rainLines.visible = this.weather.current.rain > 0.03;
      this.weather.stormCurtain.visible = true;
      this.weather.stormCurtain.scale.setScalar(1);
      this.atmosphere.root.position.set(0, 0, 0);
    }
    this.heroRoot.visible = false;
    this.heroRoot.rotation.y = 0;
    this.heroRoot.scale.setScalar(1);
    this.plinthGroup.visible = false;
    this.markerGroup.visible = false;
    this.dustPoints.visible = false;
    this.weather.setHidden(true);
    this.windParticles.setHidden(true);
    this.horizon.setHidden(true);
    this.atmosphere.setHidden(true);
    ambientAudio.setSpatialActive(false);
    this.controls.enabled = false;
    this.controls.autoRotate = false;
    this.renderer.domElement.style.cursor = 'grab';
    this.globe.open(visited);
    ambientAudio.playSfx('open');
  }

  closeGlobe(): void {
    this.globe.close();
    this.heroRoot.visible = true;
    this.updatePlinthVisibility();
    this.markerGroup.visible = true;
    this.weather.setHidden(false);
    this.windParticles.setHidden(false);
    this.horizon.setHidden(false);
    this.atmosphere.setHidden(false);
    ambientAudio.setSpatialActive(true);
    this.controls.enabled = true;
    this.controls.autoRotate = this.motionScale > 0 && !this.isSoftwareGl && !this.isStudio();
    this.renderer.domElement.style.cursor = 'default';
    if (!this.isSoftwareGl) {
      this.renderer.shadowMap.needsUpdate = true;
    }
  }

  openPlaces(
    visited: Set<number>,
    province = 'All',
    activeLandmarkIndex?: number
  ): PlacesSelectionInfo {
    this.cursorStrengthTarget = 0;
    WU.cursorStrength.value = 0;
    this.lastInteractAt = this.elapsed;
    if (this.globe.isOpen) {
      this.globe.close();
    }
    this.heroRoot.visible = false;
    this.heroRoot.rotation.y = 0;
    this.heroRoot.scale.setScalar(1);
    this.plinthGroup.visible = false;
    this.markerGroup.visible = false;
    this.dustPoints.visible = false;
    this.weather.setHidden(false);
    this.weather.groundShadow.visible = false;
    this.weather.clouds.visible = false;
    this.weather.rainLines.visible = false;
    this.weather.stormCurtain.visible = false;
    this.windParticles.setHidden(true);
    this.horizon.setHidden(true);
    this.atmosphere.setHidden(true);
    ambientAudio.setSpatialActive(true);
    this.controls.enabled = false;
    this.controls.autoRotate = false;
    this.places.open(visited, province, activeLandmarkIndex ?? this.activeIndex);
    const info = this.places.getSelectedInfo();
    this.lastPlaceSliceIndex = info.sliceIndex;
    const lm = LANDMARKS[info.landmarkIndex];
    ambientAudio.setSiteProfile(
      (this.currentGroup?.userData.audioProfile as AmbientSiteProfile | undefined) ?? null
    );
    if (lm) this.atmosphere.setSite({ key: lm.k, biome: lm.biome });
    ambientAudio.playSfx('open');
    if (!this.isSoftwareGl) {
      this.renderer.shadowMap.needsUpdate = true;
    }
    return info;
  }

  /** Show an on-demand OSM coordinate slice in the Places stage. */
  openOsmPlace(data: OsmPlaceData): PlacesSelectionInfo {
    this.openPlaces(new Set(), 'All');
    const info = this.places.addOsmSlice(data);
    this.lastPlaceSliceIndex = info.sliceIndex;
    return info;
  }

  closePlaces(): void {
    this.places.close();
    this.weather.rainLines.position.set(0, 0, 0);
    this.weather.rainLines.visible = this.weather.current.rain > 0.03;
    this.weather.stormCurtain.position.set(0, 14, 0);
    this.weather.stormCurtain.scale.setScalar(1);
    this.weather.stormCurtain.visible = true;
    this.weather.clouds.visible = true;
    this.weather.groundShadow.visible = true;
    this.atmosphere.root.position.set(0, 0, 0);
    this.heroRoot.visible = true;
    this.updatePlinthVisibility();
    this.markerGroup.visible = true;
    this.weather.setHidden(false);
    this.windParticles.setHidden(false);
    this.horizon.setHidden(false);
    this.atmosphere.setHidden(false);
    const lm = LANDMARKS[this.activeIndex];
    this.atmosphere.setSite({ key: lm.k, biome: lm.biome });
    ambientAudio.setSiteProfile(
      (this.currentGroup?.userData.audioProfile as AmbientSiteProfile | undefined) ?? null
    );
    ambientAudio.setSpatialActive(true);
    this.controls.enabled = true;
    this.controls.autoRotate = this.motionScale > 0 && !this.isSoftwareGl && !this.isStudio();
    this.renderer.domElement.style.cursor = 'default';
    if (!this.isSoftwareGl) {
      this.renderer.shadowMap.needsUpdate = true;
    }
  }

  focusPlaceSiteAudio(landmarkIndex: number): void {
    const lm = LANDMARKS[landmarkIndex];
    if (!lm) return;
    this.atmosphere.setSite({ key: lm.k, biome: lm.biome });
    ambientAudio.vibrateForLandmark(lm.biome, lm.c);
  }

  flyCameraPreset(pos: [number, number, number]): void {
    this.lastInteractAt = this.elapsed;
    this.camGoalOrbital = false;
    this.camStart.copy(this.camera.position);
    this.camTargetPos.set(pos[0], pos[1], pos[2]);
    this.camGoal = this.camTargetPos;
    this.camGoalT = 0;
    this.targetGoalActive = false;
    this.hasCustomFocus = false;
  }

  applyCameraPreset(preset: CameraPreset): void {
    if (this.globe.isOpen || this.places.isOpen) return;
    this.lastInteractAt = this.elapsed;
    if (preset === 'default') {
      this.resetToDefaultOrientation();
      return;
    }
    if (this.isStudio()) {
      this.frameStudioLandmark();
      return;
    }
    const anchor = this.hasHeroFit
      ? this.heroFitCenter
      : this.fitCenterTmp.set(this.baseTargetX, this.baseTargetY, 0);
    this.camGoalOrbital = false;
    this.targetStart.copy(this.controls.target);
    this.targetEnd.copy(anchor);
    if (preset === 'aerial') {
      this.camTargetPos.set(anchor.x + 0.6, anchor.y + 15.6, anchor.z + 4.4);
      this.hasCustomFocus = false;
    } else if (preset === 'low') {
      this.camTargetPos.set(anchor.x + 10.6, Math.max(1.35, anchor.y + 0.4), anchor.z + 9.2);
      this.hasCustomFocus = false;
    } else {
      // 'detail' macro close-up
      this.camTargetPos.set(anchor.x + 5.8, anchor.y + 2.4, anchor.z + 6.4);
      this.hasCustomFocus = true;
    }
    this.camStart.copy(this.camera.position);
    this.camGoal = this.camTargetPos;
    this.camGoalT = 0;
    this.targetGoalActive = true;
    ambientAudio.setSpatialFocusBoost(preset === 'detail' ? 0.8 : 0);
  }

  getCompassState(): CompassState {
    if (this.globe.isOpen) {
      const m = this.globe.camera.matrixWorld.elements;
      const fx = -m[8];
      const fy = -m[9];
      const fz = -m[10];
      const rx = m[0];
      const ry = m[1];
      const rz = m[2];
      const ux = m[4];
      const uy = m[5];
      const uz = m[6];
      const alongF = fy;
      const nx = -fx * alongF;
      const ny = 1 - fy * alongF;
      const nz = -fz * alongF;
      let needleDeg = 0;
      if (nx * nx + ny * ny + nz * nz > 1e-6) {
        needleDeg =
          (Math.atan2(nx * rx + ny * ry + nz * rz, nx * ux + ny * uy + nz * uz) * 180) / Math.PI;
      }
      const bearingDeg = ((-needleDeg % 360) + 360) % 360;
      return {
        bearingDeg,
        needleDeg,
        tiltDeg: Math.round(
          Math.abs(Math.asin(THREE.MathUtils.clamp(-fy, -1, 1)) * (180 / Math.PI))
        ),
        mode: 'globe',
        nextBearingDeg: null,
      };
    }

    const cam = this.places.isOpen ? this.places.camera : this.camera;
    const target = this.places.isOpen ? this.places.controls.target : this.controls.target;
    compassDir.copy(target).sub(cam.position);
    const len = compassDir.length();
    const tiltDeg =
      len > 1e-5
        ? Math.round(
            Math.max(
              0,
              Math.asin(THREE.MathUtils.clamp(-compassDir.y / len, -1, 1)) * (180 / Math.PI)
            )
          )
        : 0;
    const bearingDeg = ((Math.atan2(compassDir.x, -compassDir.z) * 180) / Math.PI + 360) % 360;
    const needleDeg = -bearingDeg;

    let nextBearingDeg: number | null = null;
    if (!this.places.isOpen) {
      const from = LANDMARKS[this.activeIndex];
      const to = LANDMARKS[(this.activeIndex + 1) % LANDMARKS.length];
      if (from && to) {
        const avgLatRad = ((from.coords[0] + to.coords[0]) * 0.5 * Math.PI) / 180;
        const dNorth = to.coords[0] - from.coords[0];
        const dEast = (to.coords[1] - from.coords[1]) * Math.cos(avgLatRad);
        nextBearingDeg = ((Math.atan2(dEast, dNorth) * 180) / Math.PI + 360) % 360;
      }
    }

    return {
      bearingDeg,
      needleDeg,
      tiltDeg,
      mode: this.places.isOpen ? 'places' : 'diorama',
      nextBearingDeg,
    };
  }

  snapCompassHeading(headingDeg: number): void {
    this.lastInteractAt = this.elapsed;
    if (this.globe.isOpen) {
      this.globe.resetView();
      return;
    }
    const targetRad = THREE.MathUtils.degToRad(headingDeg);
    if (this.places.isOpen) {
      const cam = this.places.camera;
      const target = this.places.controls.target;
      compassOffset.copy(cam.position).sub(target);
      const horiz = Math.max(0.5, Math.hypot(compassOffset.x, compassOffset.z));
      cam.position.set(
        target.x - Math.sin(targetRad) * horiz,
        cam.position.y,
        target.z + Math.cos(targetRad) * horiz
      );
      this.places.controls.update();
      return;
    }

    compassOffset.copy(this.camera.position).sub(this.controls.target);
    const horiz = Math.max(0.5, Math.hypot(compassOffset.x, compassOffset.z));
    const currentHeadingRad = Math.atan2(-compassOffset.x, compassOffset.z);
    const delta = Math.atan2(
      Math.sin(targetRad - currentHeadingRad),
      Math.cos(targetRad - currentHeadingRad)
    );
    this.camStartAzimuth = currentHeadingRad;
    this.camTargetAzimuth = currentHeadingRad + delta;
    this.camGoalHorizDist = horiz;
    this.camGoalHeightOffset = compassOffset.y;
    this.camGoalOrbital = true;
    this.camStart.copy(this.camera.position);
    this.camTargetPos.set(
      this.controls.target.x - Math.sin(targetRad) * horiz,
      this.controls.target.y + compassOffset.y,
      this.controls.target.z + Math.cos(targetRad) * horiz
    );
    this.camGoal = this.camTargetPos;
    this.camGoalT = 0;
    this.targetGoalActive = false;
  }

  rotateCameraAzimuth(deltaRad: number): void {
    this.lastInteractAt = this.elapsed;
    this.camGoal = null;
    this.camGoalOrbital = false;
    this.targetGoalActive = false;

    const cam = this.globe.isOpen
      ? this.globe.camera
      : this.places.isOpen
        ? this.places.camera
        : this.camera;
    const ctrl = this.globe.isOpen
      ? this.globe.controls
      : this.places.isOpen
        ? this.places.controls
        : this.controls;

    compassOffset.copy(cam.position).sub(ctrl.target);
    const cos = Math.cos(deltaRad);
    const sin = Math.sin(deltaRad);
    const nextX = compassOffset.x * cos - compassOffset.z * sin;
    const nextZ = compassOffset.x * sin + compassOffset.z * cos;
    cam.position.set(ctrl.target.x + nextX, ctrl.target.y + compassOffset.y, ctrl.target.z + nextZ);
    ctrl.update();
  }

  /**
   * Toggle the 3D directional trail pointing along the geographic bearing
   * from `fromIndex` toward the next landmark in the curated tour order.
   */
  setDirectionGuide(active: boolean, fromIndex: number): void {
    const nextIdx = (fromIndex + 1) % LANDMARKS.length;
    const from = LANDMARKS[fromIndex];
    const to = LANDMARKS[nextIdx];
    if (from && to) {
      const [lat1, lon1] = from.coords;
      const [lat2, lon2] = to.coords;
      const avgLatRad = ((lat1 + lat2) * 0.5 * Math.PI) / 180;
      const dNorth = lat2 - lat1;
      const dEast = (lon2 - lon1) * Math.cos(avgLatRad);
      let dx = dEast;
      let dz = -dNorth;
      const len = Math.hypot(dx, dz);
      if (len > 1e-6) {
        dx /= len;
        dz /= len;
      } else {
        dx = 1;
        dz = 0;
      }
      const nextYaw = Math.atan2(-dz, dx);
      if (!this.directionActive && active) {
        this.directionCurrentYaw = nextYaw;
      }
      this.directionTargetYaw = nextYaw;
    }
    if (this.directionActive !== active) {
      this.directionActive = active;
      this.lastInteractAt = this.elapsed;
    }
  }

  /** Smoothly glide both camera and orbit target toward an inspected fact pin. */
  private focusOnFactPoint(pt: THREE.Vector3): void {
    if (this.isStudio() || this.globe.isOpen || this.places.isOpen) return;
    this.lastInteractAt = this.elapsed;
    this.camGoalOrbital = false;
    this.targetStart.copy(this.controls.target);
    const anchor = this.hasHeroFit
      ? this.heroFitCenter
      : this.factFocusDir.set(this.baseTargetX, this.baseTargetY, 0);
    this.targetEnd.copy(anchor).lerp(pt, 0.46);
    const dir = this.factFocusDir.copy(this.camera.position).sub(this.controls.target);
    const curDist = Math.max(6.2, dir.length());
    dir.normalize();
    const zoomDist = THREE.MathUtils.clamp(curDist * 0.84, 7.2, 16.5);
    this.camStart.copy(this.camera.position);
    this.camTargetPos.copy(this.targetEnd).addScaledVector(dir, zoomDist);
    this.camGoal = this.camTargetPos;
    this.camGoalT = 0;
    this.targetGoalActive = true;
    this.hasCustomFocus = true;
    ambientAudio.setSpatialFocusBoost(0.95);
  }

  private computeResponsiveFraming(): void {
    const w = window.innerWidth;
    const h = Math.max(1, window.innerHeight);
    const aspect = w / h;
    const rawCardH = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--cl-card-h') || '0'
    );
    const cardRatio = rawCardH > 0 ? THREE.MathUtils.clamp(rawCardH / h, 0.14, 0.44) : 0.25;
    if (aspect < 0.85) {
      // Portrait mobile: lift diorama cleanly above the bottom card based on live card height.
      this.baseTargetX = 0;
      this.baseTargetY = 0.72 + (0.3 - Math.min(0.3, cardRatio)) * 0.8;
    } else if (h < 520 && aspect > 1.35) {
      // Short landscape mobile: shift diorama right of the compact bottom-left card.
      this.baseTargetX = -1.08;
      this.baseTargetY = 1.38;
    } else {
      this.baseTargetX = 0;
      this.baseTargetY = 1.5;
    }
  }

  /** Smoothly animate camera and orbit target back to the default landmark orientation. */
  resetToDefaultOrientation(): void {
    this.lastInteractAt = this.elapsed;
    ambientAudio.setSpatialFocusBoost(0);
    if (this.globe.isOpen) {
      this.globe.resetView();
      return;
    }
    if (this.places.isOpen) {
      this.places.resetOverview();
      return;
    }
    const group = this.currentGroup;
    if (!group) return;
    if (this.isStudio()) {
      this.frameStudioLandmark();
      return;
    }

    this.computeResponsiveFraming();
    const box = this.computeDioramaBounds(group);
    if (box.isEmpty()) return;
    if (!this.isSoftwareGl) fitDioramaShadowBounds(this.keyLight, box);

    const size = box.getSize(this.fitSizeTmp);
    const center = box.getCenter(this.fitCenterTmp);
    const radius = size.length() * 0.5;
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
    const fit = Math.max(radius / Math.tan(vFov / 2), radius / Math.tan(hFov / 2));
    const compactScreen = window.innerHeight < 680 || this.camera.aspect < 0.72;
    const distance = THREE.MathUtils.clamp(
      fit * (compactScreen ? 1.18 : 1.11),
      this.controls.minDistance + 0.2,
      this.controls.maxDistance - 0.2
    );

    const isPortrait = window.innerHeight > window.innerWidth;
    const defaultPosX = isPortrait ? 13.4 : 11.5;
    const defaultPosY = isPortrait ? 6.4 : 6.2;
    const defaultPosZ = isPortrait ? 14.8 : 13;

    this.heroFitDirection
      .set(defaultPosX - this.baseTargetX, defaultPosY - this.baseTargetY, defaultPosZ)
      .normalize();

    const targetY = THREE.MathUtils.clamp(center.y + (this.baseTargetY - 1.5), 0.6, 2.8);
    this.heroFitCenter.set(center.x + this.baseTargetX, targetY, center.z);
    this.hasHeroFit = true;

    this.camGoalOrbital = false;
    this.targetStart.copy(this.controls.target);
    this.targetEnd.copy(this.heroFitCenter);
    this.camStart.copy(this.camera.position);
    this.camTargetPos.copy(this.heroFitCenter).addScaledVector(this.heroFitDirection, distance);
    this.camGoal = this.camTargetPos;
    this.camGoalT = 0;
    this.targetGoalActive = true;
    this.hasCustomFocus = false;
    this.miniaturePass.setFocus(distance);
  }

  resetCamera(isPortrait: boolean): void {
    this.lastInteractAt = this.elapsed;
    this.computeResponsiveFraming();
    // Re-establish the default view direction; the fitter derives distance and
    // aim from the landmark instead of reusing the old fixed camera distance.
    this.controls.target.set(this.baseTargetX, this.baseTargetY, 0);
    this.camera.position.set(
      isPortrait ? 13.4 : 11.5,
      isPortrait ? 6.4 : 6.2,
      isPortrait ? 14.8 : 13
    );
    this.fitHeroCamera();
  }

  /** Reframe the active landmark for the current theme/shot, never per frame. */
  frameCurrentLandmark(): void {
    if (this.globe.isOpen || this.places.isOpen) return;
    this.lastInteractAt = this.elapsed;
    if (this.isStudio()) {
      this.frameStudioLandmark();
    } else {
      this.fitHeroCamera();
    }
  }

  /** Original fixed isometric, near-orthographic Studio shot (unchanged). */
  private frameStudioLandmark(): void {
    const group = this.currentGroup;
    if (!group || this.globe.isOpen || this.places.isOpen) return;
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) * 0.5;
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
    const distance = Math.max(radius / Math.tan(hFov / 2), radius / Math.tan(vFov / 2)) * 0.72;

    this.controls.target.set(center.x, center.y * 0.55, center.z);
    const azimuth = Math.PI / 4;
    const elevation = THREE.MathUtils.degToRad(33);
    this.camera.position.set(
      this.controls.target.x + distance * Math.cos(elevation) * Math.sin(azimuth),
      this.controls.target.y + distance * Math.sin(elevation),
      this.controls.target.z + distance * Math.cos(elevation) * Math.cos(azimuth)
    );
    this.camera.near = Math.max(0.1, distance - radius * 2);
    this.camera.far = distance + radius * 4;
    this.camera.updateProjectionMatrix();
    this.controls.minDistance = Math.min(6, distance * 0.2);
    this.controls.maxDistance = Math.max(30, distance * 1.6);
    this.camGoal = null;
    this.targetGoalActive = false;
    this.hasCustomFocus = false;
    this.controls.autoRotate = false;
    this.controls.update();

    this.studioShadow.position.set(center.x, box.min.y - 0.03, center.z);
    const span = Math.max(size.x, size.z) * 1.35;
    this.studioShadow.scale.set(span / 9, span / 9, 1);
  }

  /**
   * Solid geometry only: floating FX clouds, birds, sprites and invisible
   * helpers would otherwise inflate the box and make every site look tiny.
   */
  private computeDioramaBounds(group: THREE.Group): THREE.Box3 {
    const box = new THREE.Box3();
    const objBox = new THREE.Box3();
    group.updateWorldMatrix(true, true);
    group.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || !obj.visible) return;
      if (obj.userData.noShadow || obj.userData.cannotReceiveAO || obj.userData.noDissolve) return;
      let node: THREE.Object3D | null = obj;
      while (node) {
        if (!node.visible) return;
        node = node.parent;
      }
      objBox.setFromObject(obj);
      if (!objBox.isEmpty()) box.union(objBox);
    });
    if (box.isEmpty()) box.setFromObject(group);
    return box;
  }

  /**
   * Fit the active diorama into the live FOV/aspect with safe viewport margin, along
   * the camera's current view direction so the user's orbit is preserved.
   */
  private fitHeroCamera(): void {
    const group = this.currentGroup;
    if (!group || this.globe.isOpen || this.places.isOpen || this.isStudio()) return;
    this.computeResponsiveFraming();
    const box = this.computeDioramaBounds(group);
    if (box.isEmpty()) return;
    if (!this.isSoftwareGl) fitDioramaShadowBounds(this.keyLight, box);

    const size = box.getSize(this.fitSizeTmp);
    const center = box.getCenter(this.fitCenterTmp);
    const radius = size.length() * 0.5;
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
    const fit = Math.max(radius / Math.tan(vFov / 2), radius / Math.tan(hFov / 2));
    const compactScreen = window.innerHeight < 680 || this.camera.aspect < 0.72;
    const distance = THREE.MathUtils.clamp(
      fit * (compactScreen ? 1.18 : 1.11),
      this.controls.minDistance + 0.2,
      this.controls.maxDistance - 0.2
    );

    this.heroFitDirection.copy(this.camera.position).sub(this.controls.target);
    if (this.heroFitDirection.lengthSq() < 1e-6) this.heroFitDirection.set(11.5, 4.7, 13);
    this.heroFitDirection.normalize();

    // Clamp the aim height so an unusually tall/short model doesn't tilt the shot.
    const targetY = THREE.MathUtils.clamp(center.y + (this.baseTargetY - 1.5), 0.6, 2.8);
    this.heroFitCenter.set(center.x + this.baseTargetX, targetY, center.z);
    this.hasHeroFit = true;

    this.controls.target.copy(this.heroFitCenter);
    this.camera.position.copy(this.heroFitCenter).addScaledVector(this.heroFitDirection, distance);
    this.miniaturePass.setFocus(this.camera.position.distanceTo(this.heroFitCenter));
    this.camGoal = null;
    this.targetGoalActive = false;
    this.hasCustomFocus = false;
    this.controls.update();
  }

  /**
   * Non-blocking progressive thumbnail generator rendering into a small offscreen
   * render target across idle slices so initial boot never freezes the UI.
   */
  generateThumbnailsAsync(
    onBatch: (batch: Record<number, string>) => void,
    onDone?: () => void
  ): () => void {
    const W = 210;
    const H = 140;
    const thumbCam = new THREE.PerspectiveCamera(36, W / H, 0.5, 60);
    thumbCam.position.set(10.5, 5.8, 11.8);
    thumbCam.lookAt(0, 1.4, 0);

    const rt = new THREE.WebGLRenderTarget(W, H, {
      type: THREE.UnsignedByteType,
      colorSpace: THREE.SRGBColorSpace,
    });
    const pixels = new Uint8Array(W * H * 4);
    const scratchCanvas = document.createElement('canvas');
    scratchCanvas.width = W;
    scratchCanvas.height = H;
    const scratchCtx = scratchCanvas.getContext('2d');
    const imgData = scratchCtx ? scratchCtx.createImageData(W, H) : null;

    let cancelled = false;
    let cursor = 0;
    let handle = 0;
    let usingIdle = false;

    const cleanup = () => {
      if (cancelled) return;
      cancelled = true;
      if (handle) {
        if (usingIdle && typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(handle);
        } else {
          window.clearTimeout(handle);
        }
      }
      rt.dispose();
    };

    const schedule = (fn: () => void) => {
      if (cancelled || this.disposed) return;
      if (typeof window.requestIdleCallback === 'function') {
        usingIdle = true;
        handle = window.requestIdleCallback(fn, { timeout: 120 });
      } else {
        usingIdle = false;
        handle = window.setTimeout(fn, 24);
      }
    };

    const step = () => {
      if (cancelled || this.disposed) {
        cleanup();
        return;
      }
      if (this.contextLost || this.dissolvePhase > 0) {
        schedule(step);
        return;
      }

      const prevBg = (this.scene.background as THREE.Color).clone();
      const prevFog = this.scene.fog;
      const prevShowPlinth = this.plinthGroup.visible;
      const prevShowMarkers = this.markerGroup.visible;
      const prevShowHero = this.heroRoot.visible;
      const prevWeatherVisible = this.weather.root.visible;
      const prevWindVisible = this.windParticles.points.visible;
      const prevHorizonVisible = this.horizon.root.visible;
      const prevAtmosphereVisible = this.atmosphere.root.visible;
      const prevGlobeVisible = this.globe.group.visible;
      const prevPlacesVisible = this.places.group.visible;
      const prevDissolveY = WU.dy.value;

      const savedGroup = this.currentGroup;
      if (savedGroup) this.heroRoot.remove(savedGroup);

      this.scene.fog = null;
      this.weather.setHidden(true);
      this.windParticles.setHidden(true);
      this.horizon.setHidden(true);
      this.atmosphere.setHidden(true);
      this.plinthGroup.visible = true;
      this.markerGroup.visible = false;
      this.heroRoot.visible = true;
      this.globe.group.visible = false;
      this.places.group.visible = false;
      WU.dy.value = 100;
      (this.scene.background as THREE.Color).set(
        this.theme === 'studio' ? '#f7f7f4' : this.theme === 'daylight' ? '#a8d8ec' : '#141721'
      );

      const batch: Record<number, string> = {};
      const batchEnd = Math.min(LANDMARKS.length, cursor + 2);
      const prevTarget = this.renderer.getRenderTarget();

      try {
        this.renderer.setRenderTarget(rt);
        for (; cursor < batchEnd; cursor++) {
          const grp = this.buildLandmarkGroup(cursor);
          this.forceLodLevel0(grp);
          this.heroRoot.add(grp);
          this.renderer.render(this.scene, thumbCam);
          this.renderer.readRenderTargetPixels(rt, 0, 0, W, H, pixels);
          if (scratchCtx && imgData) {
            const dst = imgData.data;
            for (let row = 0; row < H; row++) {
              const srcOff = (H - 1 - row) * W * 4;
              const dstOff = row * W * 4;
              dst.set(pixels.subarray(srcOff, srcOff + W * 4), dstOff);
            }
            scratchCtx.putImageData(imgData, 0, 0);
            batch[cursor] = scratchCanvas.toDataURL('image/webp', 0.72);
          }
          this.heroRoot.remove(grp);
          this.disposeTransientResources(grp);
        }
      } finally {
        this.renderer.setRenderTarget(prevTarget);
        if (savedGroup) this.heroRoot.add(savedGroup);
        this.scene.fog = prevFog;
        (this.scene.background as THREE.Color).copy(prevBg);
        this.plinthGroup.visible = prevShowPlinth;
        this.markerGroup.visible = prevShowMarkers;
        this.heroRoot.visible = prevShowHero;
        this.weather.setHidden(!prevWeatherVisible);
        this.windParticles.setHidden(!prevWindVisible);
        this.horizon.setHidden(!prevHorizonVisible);
        this.atmosphere.setHidden(!prevAtmosphereVisible);
        this.globe.group.visible = prevGlobeVisible;
        this.places.group.visible = prevPlacesVisible;
        WU.dy.value = prevDissolveY;
      }

      if (Object.keys(batch).length > 0) {
        onBatch(batch);
      }

      if (cursor < LANDMARKS.length) {
        schedule(step);
      } else {
        cleanup();
        onDone?.();
      }
    };

    schedule(step);
    return cleanup;
  }

  generateThumbnails(): Record<number, string> {
    const out: Record<number, string> = {};
    const thumbCam = new THREE.PerspectiveCamera(36, 1.5, 0.5, 60);
    thumbCam.position.set(10.5, 5.8, 11.8);
    thumbCam.lookAt(0, 1.4, 0);

    const prevBg = (this.scene.background as THREE.Color).clone();
    const prevFog = this.scene.fog;
    const prevQualityIndex = this.qualityIndex;
    const prevShowPlinth = this.plinthGroup.visible;
    const prevShowMarkers = this.markerGroup.visible;
    const prevShowHero = this.heroRoot.visible;
    const prevWeatherVisible = this.weather.root.visible;
    const prevWindVisible = this.windParticles.points.visible;
    const prevHorizonVisible = this.horizon.root.visible;
    const prevAtmosphereVisible = this.atmosphere.root.visible;

    this.scene.fog = null;
    this.weather.setHidden(true);
    this.windParticles.setHidden(true);
    this.horizon.setHidden(true);
    this.atmosphere.setHidden(true);
    this.plinthGroup.visible = true;
    this.markerGroup.visible = false;
    this.heroRoot.visible = true;
    (this.scene.background as THREE.Color).set(
      this.theme === 'studio' ? '#f7f7f4' : this.theme === 'daylight' ? '#a8d8ec' : '#141721'
    );

    if (!this.isSoftwareGl && prevQualityIndex !== 0) {
      this.setQualityIndex(0);
    }
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(210, 140, false);
    if (!this.isSoftwareGl) {
      this.composer.setPixelRatio(1);
      this.composer.setSize(210, 140);
      this.renderPass.camera = thumbCam;
      this.n8aoPass.camera = thumbCam;
      this.syncMiniatureDepth(thumbCam, new THREE.Vector3(0, 1.4, 0));
    }

    const savedGroup = this.currentGroup;
    if (savedGroup) this.heroRoot.remove(savedGroup);

    LANDMARKS.forEach((_, idx) => {
      const grp = this.buildLandmarkGroup(idx);
      this.forceLodLevel0(grp);
      this.heroRoot.add(grp);
      if (this.isSoftwareGl) {
        this.renderer.render(this.scene, thumbCam);
      } else {
        this.renderer.shadowMap.needsUpdate = true;
        this.composer.render();
      }
      out[idx] = this.renderer.domElement.toDataURL('image/webp', 0.72);
      this.heroRoot.remove(grp);
      this.disposeTransientResources(grp);
    });

    if (savedGroup) this.heroRoot.add(savedGroup);

    this.renderPass.camera = this.camera;
    this.n8aoPass.camera = this.camera;
    this.setQualityIndex(prevQualityIndex);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.scene.fog = prevFog;
    (this.scene.background as THREE.Color).copy(prevBg);
    this.plinthGroup.visible = prevShowPlinth;
    this.markerGroup.visible = prevShowMarkers;
    this.heroRoot.visible = prevShowHero;
    this.weather.setHidden(!prevWeatherVisible);
    this.windParticles.setHidden(!prevWindVisible);
    this.horizon.setHidden(!prevHorizonVisible);
    this.atmosphere.setHidden(!prevAtmosphereVisible);
    this.showLandmarkImmediate(this.activeIndex);
    return out;
  }

  captureGalleryShots(index: number): MediaItem[] {
    const lm = LANDMARKS[index];
    const shots: Array<{ pos: [number, number, number]; label: string }> = [
      { pos: [11.5, 6.2, 13], label: '3D view' },
      { pos: [-12, 8.5, 8], label: '3D oblique' },
      { pos: [0, 15, 3], label: '3D aerial' },
      { pos: [12, 2.2, -5], label: '3D low angle' },
    ];
    const savedPos = this.camera.position.clone();
    const savedTarget = this.controls.target.clone();
    const savedMarkers = this.markerGroup.visible;
    const savedDir = this.directionGroup.visible;
    const prevQualityIndex = this.qualityIndex;
    this.markerGroup.visible = false;
    this.directionGroup.visible = false;
    if (!this.isSoftwareGl) {
      if (prevQualityIndex !== 0) this.setQualityIndex(0);
      this.setShadowMapSize(4096);
    }

    const results: MediaItem[] = shots.map((sh) => {
      this.camera.position.set(sh.pos[0], sh.pos[1], sh.pos[2]);
      this.camera.lookAt(0, 1.5, 0);
      if (!this.isSoftwareGl) this.renderer.shadowMap.needsUpdate = true;
      this.renderCurrentPass();
      const url = this.renderer.domElement.toDataURL('image/jpeg', 0.86);
      return {
        v: false,
        src: url,
        full: url,
        cap: lm.f,
        t: lm.f,
        cr: `${lm.k} · ${sh.label}`,
        lic: 'Interactive 3D render',
        rend: true,
      };
    });

    if (!this.isSoftwareGl) {
      this.setShadowMapSize(prevQualityIndex === 0 ? 2048 : 1024);
    }
    if (prevQualityIndex !== this.qualityIndex) {
      this.setQualityIndex(prevQualityIndex);
    }
    this.markerGroup.visible = savedMarkers;
    this.directionGroup.visible = savedDir;
    this.camera.position.copy(savedPos);
    this.controls.target.copy(savedTarget);
    return results;
  }

  capturePostcard(index: number, weatherText: string, opts?: { noteText?: string }): string {
    const lm = LANDMARKS[index];
    const wasMarkersVisible = this.markerGroup.visible;
    const wasDirVisible = this.directionGroup.visible;
    const prevQualityIndex = this.qualityIndex;
    this.markerGroup.visible = false;
    this.directionGroup.visible = false;
    if (!this.isSoftwareGl) {
      if (prevQualityIndex !== 0) this.setQualityIndex(0);
      this.setShadowMapSize(4096);
      this.renderer.shadowMap.needsUpdate = true;
    }
    this.renderCurrentPass();
    if (!this.isSoftwareGl) {
      this.setShadowMapSize(prevQualityIndex === 0 ? 2048 : 1024);
    }
    if (prevQualityIndex !== this.qualityIndex) {
      this.setQualityIndex(prevQualityIndex);
    }
    this.markerGroup.visible = wasMarkersVisible;
    this.directionGroup.visible = wasDirVisible;

    const srcCanvas = this.renderer.domElement;
    const out = document.createElement('canvas');
    out.width = 1080;
    out.height = 1350;
    const ctx = out.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = this.theme === 'daylight' ? '#a8d8ec' : '#0e0f13';
    ctx.fillRect(0, 0, 1080, 1350);

    const aspect = srcCanvas.width / srcCanvas.height;
    const targetW = 1080;
    const targetH = targetW / aspect;
    const drawY = (1350 - targetH) / 2;
    ctx.drawImage(srcCanvas, 0, drawY, targetW, targetH);

    const grad = ctx.createLinearGradient(0, 820, 0, 1350);
    grad.addColorStop(0, 'rgba(14,15,19,0)');
    grad.addColorStop(0.58, 'rgba(14,15,19,0.82)');
    grad.addColorStop(1, 'rgba(14,15,19,0.97)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 820, 1080, 530);

    ctx.fillStyle = this.theme === 'daylight' ? '#1c2330' : '#e8b04a';
    ctx.font = 'italic 600 28px Georgia, serif';
    ctx.fillText('cıtylit', 68, 86);

    const noteClean = opts?.noteText?.trim();
    const baseShiftY = noteClean ? -48 : 0;

    ctx.fillStyle = '#e8b04a';
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText(lm.c.toUpperCase(), 68, 1140 + baseShiftY);

    ctx.fillStyle = '#f3efe6';
    ctx.font = 'italic 400 72px Georgia, serif';
    ctx.fillText(lm.k, 68, 1222 + baseShiftY);

    ctx.fillStyle = '#a9a69e';
    ctx.font = '500 24px system-ui, sans-serif';
    ctx.fillText(weatherText, 68, 1278 + baseShiftY);

    if (noteClean) {
      ctx.fillStyle = '#7de3bc';
      ctx.font = 'italic 400 26px Georgia, serif';
      const clipped = noteClean.length > 84 ? `${noteClean.slice(0, 81)}…` : noteClean;
      ctx.fillText(`“${clipped}”`, 68, 1296);
    }

    return out.toDataURL('image/png');
  }

  private syncMiniatureDepth(camera: THREE.PerspectiveCamera, target: THREE.Vector3): void {
    const dist = camera.position.distanceTo(target);
    if (this.places.isOpen || this.isStudio()) {
      this.miniaturePass.setFocus(dist);
    } else {
      const baseRange = THREE.MathUtils.clamp(dist * 0.24, 0.8, 3.4);
      const macroRange = THREE.MathUtils.clamp(dist * 0.14, 0.55, 1.8);
      const depthRange = THREE.MathUtils.lerp(baseRange, macroRange, this.rackFocusBlend);
      const aperture = this.baseAperture + this.rackFocusBlend * 0.28;
      this.miniaturePass.setFocus(dist, depthRange, aperture);
    }
    this.miniaturePass.setExposure(this.renderer.toneMappingExposure);
    const depth = this.n8aoPass.enabled
      ? this.n8aoPass.beautyRenderTarget.depthTexture
      : this.composer.readBuffer.depthTexture;
    this.miniaturePass.setDepth(depth ?? null, camera.near, camera.far);
  }

  private renderCurrentPass(): void {
    const useComposer = !this.isSoftwareGl && this.qualityIndex < 2;

    if (this.globe.isOpen) {
      this.renderer.render(this.globe.group, this.globe.camera);
    } else if (this.places.isOpen) {
      this.renderPass.camera = this.places.camera;
      this.n8aoPass.camera = this.places.camera;
      if (useComposer) {
        this.syncMiniatureDepth(this.places.camera, this.places.controls.target);
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.places.camera);
      }
    } else {
      this.renderPass.camera = this.camera;
      this.n8aoPass.camera = this.camera;
      if (useComposer) {
        this.syncMiniatureDepth(this.camera, this.controls.target);
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  private bindEvents(canvas: HTMLCanvasElement): void {
    const onResize = () => {
      this.lastInteractAt = this.elapsed;
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.globe.setAspect(w / h);
      this.places.setAspect(w / h);
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
      this.computeResponsiveFraming();
      this.frameCurrentLandmark();
    };

    const onControlStart = () => {
      this.isUserOrbiting = true;
      this.hoveredHero = false;
      this.lastInteractAt = this.elapsed;
      this.updateDynamicAoState();
    };

    const onControlEnd = () => {
      this.isUserOrbiting = false;
      this.lastInteractAt = this.elapsed;
      this.updateDynamicAoState();
    };

    this.controls.addEventListener('start', onControlStart);
    this.controls.addEventListener('end', onControlEnd);

    const raycaster = new THREE.Raycaster();
    const projPos = new THREE.Vector3();
    const onPointerDown = (e: PointerEvent) => {
      this.camGoal = null;
      this.targetGoalActive = false;
      this.lastInteractAt = this.elapsed;
      this.globe.cancelFly();
      this.tapDown = { x: e.clientX, y: e.clientY, t: performance.now() };
      this.callbacks.onFirstInteract?.();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const now = performance.now();
      if (now - this.lastHoverCheck < 24) return;
      this.lastHoverCheck = now;
      this.lastInteractAt = this.elapsed;
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;

      if (this.globe.isOpen) {
        this.cursorStrengthTarget = 0;
        this.hoveredHero = false;
        const hoveredPin = this.globe.hoverPin(ndcX, ndcY, 14);
        canvas.style.cursor = hoveredPin !== null ? 'pointer' : 'grab';
        this.callbacks.onGlobePinHover?.(hoveredPin, e.clientX, e.clientY);
        return;
      }

      if (this.places.isOpen) {
        this.cursorStrengthTarget = 0;
        this.hoveredHero = false;
        const hovered = this.places.hoverAt(ndcX, ndcY);
        canvas.style.cursor = hovered !== null ? 'pointer' : 'grab';
        return;
      }

      if (this.isUserOrbiting || this.dissolvePhase > 0 || !this.currentGroup) {
        this.hoveredMarkerIndex = -1;
        this.hoveredHero = false;
        this.cursorStrengthTarget = 0;
        canvas.style.cursor = this.isUserOrbiting ? 'grabbing' : 'default';
        return;
      }

      this.hoverNdc.set(ndcX, ndcY);
      this.hoverRaycaster.setFromCamera(this.hoverNdc, this.camera);

      // Gently part grass blades & foliage where the cursor sweeps across the diorama.
      if (this.hoverRaycaster.ray.intersectPlane(this.groundPlane, this.cursorWorld)) {
        const distSq =
          this.cursorWorld.x * this.cursorWorld.x + this.cursorWorld.z * this.cursorWorld.z;
        if (distSq < 56) {
          WU.cursor.value.copy(this.cursorWorld);
          this.cursorStrengthTarget = 1;
        } else {
          this.cursorStrengthTarget = 0;
        }
      } else {
        this.cursorStrengthTarget = 0;
      }

      // Check fact-pin sprites (raycast + tight screen-space proximity)
      let markerIdx = -1;
      if (this.markerSprites.length > 0) {
        this.hoverHits.length = 0;
        this.hoverRaycaster.intersectObjects(this.markerSprites, false, this.hoverHits);
        if (this.hoverHits.length > 0) {
          markerIdx = this.markerSprites.indexOf(this.hoverHits[0].object as THREE.Sprite);
        } else {
          let bestDist = 16;
          for (let i = 0; i < this.markerSprites.length; i++) {
            const sp = this.markerSprites[i];
            projPos.copy(sp.position).project(this.camera);
            if (projPos.z > 1) continue;
            const sx = (projPos.x * 0.5 + 0.5) * window.innerWidth;
            const sy = (-projPos.y * 0.5 + 0.5) * window.innerHeight;
            const dist = Math.hypot(sx - e.clientX, sy - e.clientY);
            if (dist < bestDist) {
              bestDist = dist;
              markerIdx = i;
            }
          }
        }
      }
      this.hoveredMarkerIndex = markerIdx;
      if (markerIdx >= 0) {
        this.hoveredHero = false;
      } else if (now - this.lastHeroHoverCheck >= 48) {
        this.lastHeroHoverCheck = now;
        this.hoverHits.length = 0;
        this.hoverRaycaster.intersectObject(this.currentGroup, true, this.hoverHits);
        this.hoveredHero = this.hoverHits.length > 0;
      }
      canvas.style.cursor = this.pinDropMode ? 'crosshair' : markerIdx >= 0 ? 'pointer' : 'default';
    };

    const onPointerLeave = () => {
      this.hoveredMarkerIndex = -1;
      this.hoveredHero = false;
      this.cursorStrengthTarget = 0;
      this.globe.clearHover();
      this.callbacks.onGlobePinHover?.(null);
      if (!this.globe.isOpen && !this.places.isOpen) {
        canvas.style.cursor = this.pinDropMode ? 'crosshair' : 'default';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - this.tapDown.x;
      const dy = e.clientY - this.tapDown.y;
      const dt = performance.now() - this.tapDown.t;
      if (dt < 280 && Math.hypot(dx, dy) < 9) {
        const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
        const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
        if (this.globe.isOpen) {
          const picked = this.globe.pickPin(ndcX, ndcY, e.pointerType === 'touch' ? 28 : 14);
          if (picked !== null) {
            ambientAudio.vibrate(10);
            this.callbacks.onSelectLandmarkFromGlobe?.(picked);
          } else {
            // Double-tap empty globe space resets to the overview.
            const now = performance.now();
            if (now - this.lastGlobeTap < 420) {
              this.globe.resetView();
              this.callbacks.onGlobeReset?.();
              this.lastGlobeTap = 0;
            } else {
              this.lastGlobeTap = now;
            }
          }
          return;
        }
        if (this.places.isOpen) {
          const picked = this.places.pickAt(ndcX, ndcY);
          if (picked) {
            const now = performance.now();
            const isDoubleTap =
              this.lastPlaceTap.sliceIndex === picked.sliceIndex && now - this.lastPlaceTap.t < 480;
            this.lastPlaceTap = { sliceIndex: picked.sliceIndex, t: now };
            if (isDoubleTap) {
              if (picked.landmarkIndex < 0) return;
              ambientAudio.vibrate(12);
              this.callbacks.onOpenLandmarkFromPlaces?.(picked.landmarkIndex);
            } else {
              ambientAudio.playSfx('ping');
              ambientAudio.vibrate(10);
              if (picked.landmarkIndex >= 0) this.focusPlaceSiteAudio(picked.landmarkIndex);
              this.callbacks.onSelectPlaceSlice?.(picked);
            }
          }
          return;
        }
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);

        if (this.pinDropMode && this.currentGroup) {
          this.hoverHits.length = 0;
          raycaster.intersectObject(this.currentGroup, true, this.hoverHits);
          const surfaceHit = this.hoverHits.find((h) => {
            const o = h.object;
            return (
              o instanceof THREE.Mesh &&
              o.visible &&
              !o.userData.noShadow &&
              !o.userData.cannotReceiveAO &&
              !o.userData.noDissolve
            );
          });
          if (surfaceHit) {
            this.dropWorldTmp.copy(surfaceHit.point);
            if (surfaceHit.face) {
              this.dropNormalTmp
                .copy(surfaceHit.face.normal)
                .transformDirection(surfaceHit.object.matrixWorld);
              this.dropWorldTmp.addScaledVector(this.dropNormalTmp, 0.24);
            }
            this.dropWorldTmp.y += 0.16;
            this.heroRoot.worldToLocal(this.dropLocalTmp.copy(this.dropWorldTmp));
            this.pinDropMode = false;
            canvas.style.cursor = 'default';
            ambientAudio.playSfx('ping');
            ambientAudio.vibrate(12);
            this.callbacks.onPinDropPosition?.([
              Number(this.dropLocalTmp.x.toFixed(2)),
              Number(this.dropLocalTmp.y.toFixed(2)),
              Number(this.dropLocalTmp.z.toFixed(2)),
            ]);
          } else {
            this.callbacks.onPinDropPosition?.(null);
          }
          return;
        }

        const hits = raycaster.intersectObjects(this.markerSprites, false);
        let hitSprite: THREE.Sprite | undefined = hits.length
          ? (hits[0].object as THREE.Sprite)
          : undefined;
        // Touch-friendly screen-space radius fallback so fingers never miss small pins.
        if (!hitSprite && this.markerSprites.length > 0) {
          const hitRadius = e.pointerType === 'touch' ? 28 : 16;
          let bestDist = hitRadius;
          for (let i = 0; i < this.markerSprites.length; i++) {
            const sp = this.markerSprites[i];
            projPos.copy(sp.position).project(this.camera);
            if (projPos.z > 1) continue;
            const sx = (projPos.x * 0.5 + 0.5) * window.innerWidth;
            const sy = (-projPos.y * 0.5 + 0.5) * window.innerHeight;
            const dist = Math.hypot(sx - e.clientX, sy - e.clientY);
            if (dist < bestDist) {
              bestDist = dist;
              hitSprite = sp;
            }
          }
        }
        if (hitSprite) {
          this.activePinCursor = this.markerSprites.indexOf(hitSprite);
        }
        const pinKind = hitSprite?.userData.pinKind as 'fact' | 'note' | undefined;
        if (pinKind === 'note' && hitSprite) {
          const noteId = hitSprite.userData.noteId as string | undefined;
          if (noteId) {
            ambientAudio.playSfx('ping');
            ambientAudio.vibrate(10);
            this.userPinPopTimers.set(noteId, 0.85);
            this.focusOnFactPoint(hitSprite.position);
            this.callbacks.onUserNotePin?.(noteId);
          }
        } else {
          const text = hitSprite?.userData.factText as string | undefined;
          if (text && hitSprite) {
            ambientAudio.playSfx('ping');
            ambientAudio.vibrate(10);
            this.focusOnFactPoint(hitSprite.position);
            this.callbacks.onFactDot?.(text);
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      this.lastInteractAt = this.elapsed;
      if (!this.globe.isOpen) return;
      e.preventDefault();
      this.globe.zoomBy(1 + Math.sign(e.deltaY) * 0.12);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (this.globe.isOpen && e.touches.length === 2) {
        this.pinchDist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (this.globe.isOpen && e.touches.length === 2 && this.pinchDist > 0) {
        const d = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        this.globe.zoomBy(this.pinchDist / d);
        this.pinchDist = d;
      }
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (!this.tiltEnabled || e.beta == null || e.gamma == null) return;
      this.tiltOffsetX = Math.max(-1, Math.min(1, e.gamma / 35)) * 0.55;
      this.tiltOffsetY = Math.max(-1, Math.min(1, (e.beta - 45) / 35)) * 0.35;
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      this.contextLost = true;
    };

    const onContextRestored = () => {
      this.contextLost = false;
      this.lastTick = performance.now();
      this.scheduleNextFrame();
    };

    window.addEventListener('resize', onResize);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('deviceorientation', onOrientation);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    this.unbindListeners = () => {
      this.controls.removeEventListener('start', onControlStart);
      this.controls.removeEventListener('end', onControlEnd);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('deviceorientation', onOrientation);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
    };
  }

  private unbindListeners: () => void = () => {};

  setPaused(paused: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
      window.clearTimeout(this.afterDrawTimer);
    } else if (!this.disposed && !this.contextLost) {
      this.lastTick = performance.now();
      this.scheduleNextFrame();
    }
  }

  /** Pre-compile common custom shader variants to avoid landmark switch stutters. */
  prewarmShaders(): void {
    if (this.warmupDone || this.disposed || this.isSoftwareGl) return;
    this.warmupDone = true;

    const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const warmupGroup = new THREE.Group();
    warmupGroup.position.set(0, -50, 0);
    const treeWarmMat = windy(
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.02 }),
      'wind_tree_vc',
      {
        heightScale: 1.75,
        swayScale: 1.05,
        flutterScale: 1.15,
        trunkBase: 0.26,
        wakeScale: 0.16,
        foliageSss: true,
      }
    );
    const grassWarmMat = grassWindy(
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        vertexColors: true,
        roughness: 0.84,
        metalness: 0.02,
      })
    );
    const mats = [
      MWater('#1a7598', 0.1, 0.25),
      MCascade('#d9f4ff', 0.88),
      G('#ffe1a0', 0.85),
      Mc('#4f9146'),
      treeWarmMat,
      grassWarmMat,
    ];
    for (let i = 0; i < mats.length; i++) {
      warmupGroup.add(new THREE.Mesh(geo, mats[i]));
    }
    this.scene.add(warmupGroup);

    const finish = () => {
      this.scene.remove(warmupGroup);
      geo.dispose();
      treeWarmMat.dispose();
      grassWarmMat.dispose();
    };
    // The materials from builders/primitives are cached and shared, so they are
    // deliberately not disposed here. compileAsync uses
    // KHR_parallel_shader_compile where available, keeping shader compilation
    // off the boot's critical path; fall back to the synchronous path on
    // drivers that don't expose it.
    if (typeof this.renderer.compileAsync === 'function') {
      void this.renderer.compileAsync(warmupGroup, this.camera, this.scene).then(finish, () => {
        try {
          this.renderer.compile(warmupGroup, this.camera, this.scene);
        } catch {
          // Ignore warmup failures on constrained drivers
        }
        finish();
      });
    } else {
      try {
        this.renderer.compile(warmupGroup, this.camera, this.scene);
      } catch {
        // Ignore warmup failures on constrained drivers
      }
      finish();
    }
  }

  private scheduleNextFrame(): void {
    if (this.disposed || this.paused) return;
    this.rafId = requestAnimationFrame(this.frame);
  }

  private afterDraw(cb: () => void): void {
    if (!this.isSoftwareGl) {
      cb();
      return;
    }
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl.fenceSync) {
      this.afterDrawTimer = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!sync) {
      this.afterDrawTimer = window.setTimeout(cb, 80);
      return;
    }
    gl.flush();
    const start = performance.now();
    const poll = () => {
      if (this.disposed) {
        gl.deleteSync(sync);
        return;
      }
      const status = gl.clientWaitSync(sync, 0, 0);
      if (
        status === gl.ALREADY_SIGNALED ||
        status === gl.CONDITION_SATISFIED ||
        status === gl.WAIT_FAILED ||
        performance.now() - start > 100
      ) {
        gl.deleteSync(sync);
        cb();
      } else {
        this.afterDrawTimer = window.setTimeout(poll, 8);
      }
    };
    this.afterDrawTimer = window.setTimeout(poll, 4);
  }

  private readonly frame = (now: number): void => {
    if (this.disposed || this.contextLost || this.paused) return;

    const dt = Math.max(0, Math.min(0.05, (now - this.lastTick) / 1000));
    this.lastTick = Math.max(this.lastTick, now);
    this.elapsed += dt;
    // Accumulate scaled time instead of multiplying wall time by the scale, so toggling
    // reduced motion eases into the new rate rather than jumping the shader phase.
    this.shaderTime += dt * this.motionScale;
    WU.t.value = this.shaderTime;
    this.cursorStrengthTarget = Math.max(0, this.cursorStrengthTarget - dt * 1.4);
    WU.cursorStrength.value +=
      (this.cursorStrengthTarget - WU.cursorStrength.value) * Math.min(1, dt * 8);

    // Auto quality monitor: drop a tier when clearly off target, then fine-tune
    // resolution so the 60fps budget is met without losing shadows or post FX.
    if (this.qualitySetting === 'auto' && !this.isSoftwareGl) {
      this.autoScaleTimer += dt;
      this.autoScaleAcc += dt;
      this.autoScaleSamples++;
      if (this.autoScaleTimer >= 1 && this.autoScaleSamples >= 8) {
        const avgMs = (this.autoScaleAcc / this.autoScaleSamples) * 1000;
        if (avgMs > 22 && this.qualityIndex === 0) {
          this.setQualityIndex(1);
        } else if (avgMs > 18.5 && this.renderScale > 0.75) {
          this.renderScale = Math.max(0.75, this.renderScale - 0.1);
          this.applyRenderScale();
        } else if (avgMs < 13.5 && this.renderScale < 1) {
          this.renderScale = Math.min(1, this.renderScale + 0.05);
          this.applyRenderScale();
        }
        this.autoScaleTimer = 0;
        this.autoScaleAcc = 0;
        this.autoScaleSamples = 0;
      }
    }

    if (this.globe.isOpen) {
      this.globe.update(dt, this.elapsed, this.motionScale, this.keyLight);
      this.renderer.render(this.globe.group, this.globe.camera);
    } else if (this.places.isOpen) {
      this.weather.update(dt, this.elapsed, {
        qualityIndex: this.qualityIndex,
        motionScale: this.motionScale,
        keyLight: this.keyLight,
        fillLight: this.fillLight,
        hemiLight: this.hemiLight,
        scene: this.scene,
        renderer: this.renderer,
        onThunder: () => {
          ambientAudio.playSfx('thunder');
          this.callbacks.onThunder?.();
        },
      });
      updateRimLight(
        this.rimLight,
        this.weather.current.night,
        WU.sun.value,
        WU.sunHor.value,
        dt,
        this.motionScale,
        0
      );
      this.weather.clouds.visible = false;
      this.weather.groundShadow.visible = false;
      this.weather.rainLines.visible = false;
      this.weather.stormCurtain.visible = false;
      const placesEnvLerp = this.motionScale === 0 ? 1 : 1 - Math.exp(-dt * 2.8);
      if (this.isStudio()) {
        this.scene.environmentIntensity += (0.55 - this.scene.environmentIntensity) * placesEnvLerp;
      } else {
        const envCeiling = this.usingSkyHdr ? 0.22 : 0.48;
        const envFloor = this.usingSkyHdr ? 0.07 : 0.16;
        const targetPlacesEnv =
          envFloor +
          (envCeiling - envFloor) *
            (1 - this.weather.current.night) *
            (1 - this.weather.current.cover * 0.35);
        this.scene.environmentIntensity +=
          (targetPlacesEnv - this.scene.environmentIntensity) * placesEnvLerp;
      }
      updateWetSurfaces(
        Math.max(this.weather.current.rain, this.places.getWeatherMode() === 'rain' ? 0.85 : 0)
      );

      this.places.update(
        dt,
        this.elapsed,
        this.motionScale,
        this.keyLight,
        this.scene.fog,
        this.weather.current,
        this.renderer.getPixelRatio()
      );

      const sel = this.places.getSelectedInfo();
      const sliceChanged = sel.sliceIndex !== this.lastPlaceSliceIndex;
      if (sliceChanged) {
        this.lastPlaceSliceIndex = sel.sliceIndex;
      }
      // Explorer slices have no landmark index; keep the ambient bed of the
      // current diorama so the Places stage never crashes on a missing entry.
      const lm = LANDMARKS[sel.landmarkIndex] ?? LANDMARKS[this.activeIndex] ?? LANDMARKS[0];
      this.places.camera.updateMatrixWorld();
      audioRight.setFromMatrixColumn(this.places.camera.matrixWorld, 0).normalize();
      audioForward.setFromMatrixColumn(this.places.camera.matrixWorld, 2).normalize().negate();
      ambientAudio.setCameraYaw(
        Math.atan2(
          this.places.camera.position.x - this.places.controls.target.x,
          this.places.camera.position.z - this.places.controls.target.z
        )
      );
      ambientAudio.updateSpatialListener({
        position: [
          this.places.camera.position.x,
          this.places.camera.position.y,
          this.places.camera.position.z,
        ],
        right: [audioRight.x, audioRight.y, audioRight.z],
        forward: [audioForward.x, audioForward.y, audioForward.z],
      });
      ambientAudio.update(
        dt,
        this.elapsed,
        lm.ambient,
        lm.biome,
        this.weather.current.wind,
        this.weather.current.rain,
        this.weather.current.night,
        this.weather.current.storm,
        this.weather.current.fog,
        this.weather.current.timeOfDay
      );

      if (
        !this.isSoftwareGl &&
        this.qualityIndex < 2 &&
        (sliceChanged || (this.shadowFrameCounter++ & 1) === 0)
      ) {
        this.renderer.shadowMap.needsUpdate = true;
      }
      this.renderCurrentPass();
    } else {
      // Camera fly preset, compass heading sweep & fact-pin focus interpolation
      if (this.camGoal) {
        this.camGoalT = Math.min(1, this.camGoalT + dt * 1.4);
        const s = this.camGoalT * this.camGoalT * (3 - 2 * this.camGoalT);
        if (this.camGoalOrbital) {
          const az = THREE.MathUtils.lerp(this.camStartAzimuth, this.camTargetAzimuth, s);
          this.camera.position.set(
            this.controls.target.x - Math.sin(az) * this.camGoalHorizDist,
            this.controls.target.y + this.camGoalHeightOffset,
            this.controls.target.z + Math.cos(az) * this.camGoalHorizDist
          );
        } else {
          this.camera.position.lerpVectors(this.camStart, this.camTargetPos, s);
        }
        if (this.targetGoalActive) {
          this.controls.target.lerpVectors(this.targetStart, this.targetEnd, s);
        }
        if (this.camGoalT >= 1) {
          this.camGoal = null;
          this.camGoalOrbital = false;
          this.targetGoalActive = false;
        }
      }

      // Dust-dissolve landmark switch + choreographed orbital settle (GPU uniforms)
      if (this.dissolvePhase === 1) {
        this.dissolveT += dt * 2.2;
        const cutY = Math.max(-0.5, 9 * (1 - this.dissolveT));
        WU.dy.value = cutY;
        setContactShadowFade(this.currentGroup, Math.max(0, 1 - Math.min(1, this.dissolveT)));
        this.dustPoints.visible = true;
        this.dustMat.uniforms.uColor.value.copy(this.scene.background as THREE.Color);
        this.dustMat.uniforms.uOpacity.value =
          Math.sin(Math.min(1, this.dissolveT) * Math.PI) * 0.9;
        this.dustMat.uniforms.uElapsed.value = this.elapsed;
        this.dustMat.uniforms.uCutY.value = cutY;
        this.dustMat.uniforms.uPointScale.value = Math.min(
          260,
          Math.max(100, window.innerHeight * 0.22)
        );
        if (this.dissolveT >= 1) {
          if (this.pendingIndex !== null) {
            this.showLandmarkImmediate(this.pendingIndex);
            this.pendingIndex = null;
            this.dissolvePhase = 2;
            this.dissolveT = 0;
            this.switchSettle = 1;
            WU.dy.value = -0.5;
            setContactShadowFade(this.currentGroup, 0);
          }
        }
      } else if (this.dissolvePhase === 2) {
        this.dissolveT += dt * 2.1;
        const progress = Math.min(1, this.dissolveT);
        const cutY = -0.5 + 9.5 * progress;
        WU.dy.value = cutY;
        setContactShadowFade(this.currentGroup, progress);
        this.dustPoints.visible = true;
        this.dustMat.uniforms.uColor.value.copy(this.scene.background as THREE.Color);
        this.dustMat.uniforms.uOpacity.value = Math.sin(progress * Math.PI) * 0.85;
        this.dustMat.uniforms.uElapsed.value = this.elapsed;
        this.dustMat.uniforms.uCutY.value = cutY;
        this.dustMat.uniforms.uPointScale.value = Math.min(
          260,
          Math.max(100, window.innerHeight * 0.22)
        );
        if (this.dissolveT >= 1) {
          this.dissolvePhase = 0;
          WU.dy.value = 100;
          setContactShadowFade(this.currentGroup, 1);
          this.dustPoints.visible = false;
        }
      }

      // Smooth choreographed switch settle + card drag swipe parallax
      const paraLerp = this.motionScale === 0 ? 1 : Math.min(1, dt * 10);
      this.cardParallaxCurrent += (this.cardParallaxTarget - this.cardParallaxCurrent) * paraLerp;
      if (this.switchSettle > 0.001) {
        this.switchSettle = Math.max(0, this.switchSettle - dt * 2.1);
      }
      const settleEase = this.motionScale > 0 ? this.switchSettle * this.switchSettle : 0;
      this.heroRoot.rotation.y = this.cardParallaxCurrent + this.switchDir * 0.06 * settleEase;
      this.heroRoot.scale.setScalar(1 - 0.025 * settleEase);

      // Warm upcoming & previous landmarks in the LRU pool between transitions
      if (this.dissolvePhase === 0 && this.elapsed - this.lastSwitchAt > 2.5) {
        this.prewarmNextLandmark();
      }

      // Landmark tick + sway + glowing windows
      const tickFn = this.currentGroup?.userData.tick as
        | ((t: number, dt: number) => void)
        | undefined;
      if (tickFn) {
        tickFn(this.elapsed * this.motionScale, dt * this.motionScale);
      }
      for (const sw of swayItems) {
        sw.o.rotation.z =
          Math.sin(this.elapsed * sw.sp * this.motionScale + sw.ph) *
          sw.a *
          (0.6 + this.weather.current.wind * 0.35);
      }
      const litStrength = WU.lit.value;
      if (Math.abs(litStrength - this.lastGlowLit) >= 0.002) {
        this.lastGlowLit = litStrength;
        for (const gm of glowMaterials) {
          const baseI = (gm.userData.i as number | undefined) ?? 1;
          gm.emissiveIntensity = baseI * (0.15 + litStrength * 1.45);
        }
      }

      // Fact pin & private User Pin sprite pulse + float + pop-in + hover boost
      this.markerSprites.forEach((sp, i) => {
        const isUserNote = sp.userData.pinKind === 'note';
        if (isUserNote) {
          const baseY = (sp.userData.baseY as number | undefined) ?? sp.position.y;
          sp.position.y = baseY + Math.sin(this.elapsed * 2.1 * this.motionScale + i * 1.3) * 0.05;
          let popMul = 1;
          const noteId = sp.userData.noteId as string | undefined;
          if (noteId) {
            const pop = this.userPinPopTimers.get(noteId);
            if (pop !== undefined) {
              const nextPop = Math.max(0, pop - dt * 2.2);
              if (nextPop <= 0) this.userPinPopTimers.delete(noteId);
              else this.userPinPopTimers.set(noteId, nextPop);
              popMul = 1 + Math.sin(nextPop * Math.PI) * 0.42;
            }
          }
          const base = 0.66 + 0.065 * Math.sin(this.elapsed * 2.6 * this.motionScale + i);
          sp.scale.setScalar((i === this.hoveredMarkerIndex ? base * 1.28 : base) * popMul);
        } else {
          const base = 0.56 + 0.08 * Math.sin(this.elapsed * 3 * this.motionScale + i);
          sp.scale.setScalar(i === this.hoveredMarkerIndex ? base * 1.24 : base);
        }
      });

      // Next-landmark soft directional trail & ground pulse (GPU vertex animation)
      const dirGoal = this.directionActive && !this.globe.isOpen && !this.places.isOpen ? 1 : 0;
      const dirRate = this.motionScale === 0 ? Math.min(1, dt * 10) : Math.min(1, dt * 5.5);
      this.directionStrength += (dirGoal - this.directionStrength) * dirRate;
      if (this.directionStrength > 0.005) {
        this.directionGroup.visible = true;
        const yawDiff = Math.atan2(
          Math.sin(this.directionTargetYaw - this.directionCurrentYaw),
          Math.cos(this.directionTargetYaw - this.directionCurrentYaw)
        );
        this.directionCurrentYaw += yawDiff * Math.min(1, dt * 7);
        this.directionGroup.rotation.y = this.directionCurrentYaw;

        const dayWarmth = this.theme === 'daylight' || this.isStudio() ? 0.88 : 1.0;
        this.directionPointsMat.uniforms.uAnimTime.value =
          this.elapsed * (this.motionScale > 0 ? 0.52 : 0);
        this.directionPointsMat.uniforms.uDayWarmth.value = dayWarmth;
        this.directionPointsMat.uniforms.uOpacity.value = 0.92 * this.directionStrength;
        this.directionPointsMat.uniforms.uPointScale.value = Math.min(
          260,
          Math.max(100, window.innerHeight * 0.22)
        );

        const pulsePhase = this.motionScale > 0 ? (this.elapsed * 0.72) % 1 : 0.35;
        this.directionChevronMat.opacity =
          (0.68 + 0.22 * Math.sin(this.elapsed * 2.6 * this.motionScale)) * this.directionStrength;
        this.directionChevron.scale.setScalar(
          1 + 0.06 * Math.sin(this.elapsed * 2.6 * this.motionScale)
        );
        this.directionPulse.scale.setScalar(0.85 + pulsePhase * 1.65);
        this.directionPulseMat.opacity = (1 - pulsePhase) * 0.55 * this.directionStrength;
      } else {
        this.directionGroup.visible = false;
      }

      // Architectural cutaway / exploded layer lift (damped smoothly)
      const cutawayGoal = this.cutawayActive && this.dissolvePhase === 0 ? 1 : 0;
      const cutawayPrev = this.cutawayAmount;
      if (Math.abs(cutawayGoal - this.cutawayAmount) > 0.0005 && this.cutawayEntries.length > 0) {
        this.cutawayAmount =
          this.motionScale === 0
            ? cutawayGoal
            : THREE.MathUtils.damp(this.cutawayAmount, cutawayGoal, 7, dt);
        for (let i = 0; i < this.cutawayEntries.length; i++) {
          const entry = this.cutawayEntries[i];
          entry.obj.position.y = entry.baseY + entry.liftY * this.cutawayAmount;
        }
        if (!this.isSoftwareGl && Math.abs(this.cutawayAmount - cutawayPrev) > 0.01) {
          this.renderer.shadowMap.needsUpdate = true;
        }
      }

      // Weather simulation
      this.weather.update(dt, this.elapsed, {
        qualityIndex: this.qualityIndex,
        motionScale: this.motionScale,
        keyLight: this.keyLight,
        fillLight: this.fillLight,
        hemiLight: this.hemiLight,
        scene: this.scene,
        renderer: this.renderer,
        onThunder: () => {
          ambientAudio.playSfx('thunder');
          this.callbacks.onThunder?.();
        },
      });
      const hoverLerp = this.motionScale === 0 ? 1 : Math.min(1, dt * 7);
      this.hoverRimBoost += ((this.hoveredHero ? 1 : 0) - this.hoverRimBoost) * hoverLerp;
      this.rackFocusBlend +=
        ((this.hasCustomFocus ? 1 : 0) - this.rackFocusBlend) * Math.min(1, dt * 5);
      updateRimLight(
        this.rimLight,
        this.weather.current.night,
        WU.sun.value,
        WU.sunHor.value,
        dt,
        this.motionScale,
        this.hoverRimBoost * 0.32
      );

      // Night warm architectural ground spill on the plinth (no shadow caster overhead)
      const targetApron =
        !this.isStudio() && this.weather.current.night > 0.25
          ? THREE.MathUtils.smoothstep(this.weather.current.night, 0.25, 0.85) *
            (1.65 + litStrength * 1.15)
          : 0;
      this.nightApronLight.intensity +=
        (targetApron - this.nightApronLight.intensity) *
        (this.motionScale === 0 ? 1 : Math.min(1, dt * 3));

      const themeLerp = this.motionScale === 0 ? 1 : 1 - Math.exp(-dt * 4.5);
      const envLerp = this.motionScale === 0 ? 1 : 1 - Math.exp(-dt * 2.8);
      this.studioWeight += ((this.isStudio() ? 1 : 0) - this.studioWeight) * themeLerp;
      if (!this.isSoftwareGl && this.qualityIndex < 2) {
        this.bloomPass.enabled = this.studioWeight < 0.99;
      }
      this.plinthTopMat.color.lerp(this.targetPlinthTop, themeLerp);
      this.plinthBaseMat.color.lerp(this.targetPlinthBase, themeLerp);
      this.ringMat.color.lerp(this.targetRingCol, themeLerp);
      this.ringMat.emissive.lerp(this.targetRingCol, themeLerp);
      this.ringMat.emissiveIntensity +=
        (this.targetRingEmissive + this.hoverRimBoost * 0.18 - this.ringMat.emissiveIntensity) *
        themeLerp;
      this.bloomPass.threshold +=
        (this.targetBloomThreshold - this.bloomPass.threshold) * themeLerp;

      const envCeiling = this.usingSkyHdr ? 0.34 : 0.6;
      const envFloor = this.usingSkyHdr ? 0.12 : 0.26;
      const skyEnvIntensity =
        envFloor +
        (envCeiling - envFloor) *
          (1 - this.weather.current.night) *
          (1 - this.weather.current.cover * 0.35);
      const targetEnvIntensity = skyEnvIntensity + (0.55 - skyEnvIntensity) * this.studioWeight;
      this.scene.environmentIntensity +=
        (targetEnvIntensity - this.scene.environmentIntensity) * envLerp;
      updateWetSurfaces(this.weather.current.rain);

      // Localized atmosphere shell: ridge fog, heat shimmer, sea and spray mist
      const fog = this.scene.fog;
      const fogColor =
        fog instanceof THREE.FogExp2 ? fog.color : (this.scene.background as THREE.Color);
      this.atmosphere.update(dt, this.elapsed, {
        qualityIndex: this.qualityIndex,
        motionScale: this.motionScale,
        night: this.weather.current.night,
        rain: this.weather.current.rain,
        fog: this.weather.current.fog,
        cover: this.weather.current.cover,
        wind: this.weather.current.wind,
        fogColor,
      });

      // Wind-driven leaves & grass wisps + distant biome horizon relief
      this.windParticles.update(dt, this.elapsed, {
        qualityIndex: this.qualityIndex,
        motionScale: this.motionScale,
        wind: this.weather.current.wind,
        rain: this.weather.current.rain,
        fog: this.weather.current.fog,
        storm: this.weather.current.storm,
        cover: this.weather.current.cover,
        night: this.weather.current.night,
        season: WU.season.value,
        windDir: WU.windDir.value,
      });
      if (this.studioWeight >= 0.96) {
        this.windParticles.points.visible = false;
      }
      this.horizon.update(dt, this.motionScale, {
        fogColor,
        skyColor: this.weather.skyTopColor,
        sunGlow: this.weather.sunGlowColor,
        hor: WU.sunHor.value,
        night: this.weather.current.night,
        rain: this.weather.current.rain,
        studioWeight: this.studioWeight,
      });

      // Gentle gyro tilt offset + responsive viewport framing. When inspecting a fact pin,
      // preserve the custom focus center until reset/reframe.
      if (!this.isStudio() && !this.targetGoalActive) {
        if (this.hasCustomFocus) {
          this.controls.target.set(
            this.targetEnd.x + this.tiltOffsetX,
            this.targetEnd.y + this.tiltOffsetY,
            this.targetEnd.z
          );
        } else if (this.hasHeroFit) {
          this.controls.target.set(
            this.heroFitCenter.x + this.tiltOffsetX,
            this.heroFitCenter.y + this.tiltOffsetY,
            this.heroFitCenter.z
          );
        } else {
          this.controls.target.set(
            this.baseTargetX + this.tiltOffsetX,
            this.baseTargetY + this.tiltOffsetY,
            0
          );
        }
      }
      this.controls.update();
      this.updateLods(this.camera);

      // Update ambient audio synthesizer and position the listener in the diorama
      const lm = LANDMARKS[this.activeIndex];
      this.camera.updateMatrixWorld();
      audioRight.setFromMatrixColumn(this.camera.matrixWorld, 0).normalize();
      audioForward.setFromMatrixColumn(this.camera.matrixWorld, 2).normalize().negate();
      ambientAudio.setCameraYaw(
        Math.atan2(
          this.camera.position.x - this.controls.target.x,
          this.camera.position.z - this.controls.target.z
        )
      );
      ambientAudio.updateSpatialListener({
        position: [this.camera.position.x, this.camera.position.y, this.camera.position.z],
        right: [audioRight.x, audioRight.y, audioRight.z],
        forward: [audioForward.x, audioForward.y, audioForward.z],
      });
      ambientAudio.update(
        dt,
        this.elapsed,
        lm.ambient,
        lm.biome,
        this.weather.current.wind,
        this.weather.current.rain,
        this.weather.current.night,
        this.weather.current.storm,
        this.weather.current.fog,
        this.weather.current.timeOfDay
      );

      // Adaptive idle frame pacing: when reduced-motion is active or camera/controls
      // are completely settled with no active transitions, throttle redraws cleanly.
      const camDeltaSq = this.camera.position.distanceToSquared(this.prevFrameCamPos);
      this.prevFrameCamPos.copy(this.camera.position);
      const isReducedStaticIdle =
        this.motionScale === 0 &&
        !this.isUserOrbiting &&
        this.dissolvePhase === 0 &&
        !this.camGoal &&
        !this.timeLapsePlaying &&
        camDeltaSq < 1e-6 &&
        WU.cursorStrength.value < 0.01 &&
        this.elapsed - this.lastInteractAt > 1.5;

      const isBatterySoftIdle =
        this.isSoftwareGl &&
        !this.isUserOrbiting &&
        this.dissolvePhase === 0 &&
        !this.camGoal &&
        !this.timeLapsePlaying &&
        camDeltaSq < 1e-6 &&
        this.elapsed - this.lastInteractAt > 2.0;

      const throttleMs = isReducedStaticIdle ? 66 : isBatterySoftIdle ? 50 : 0;

      if (throttleMs === 0 || now - this.lastRenderAt >= throttleMs) {
        const shadowStride = this.isUserOrbiting ? 3 : 2;
        const keyMoved = this.keyLight.position.distanceToSquared(this.lastShadowKeyPos) > 0.002;
        const animateShadows =
          this.hasAnimatedShadowScene &&
          this.motionScale > 0 &&
          this.shadowFrameCounter++ % shadowStride === 0;
        if (
          !this.isSoftwareGl &&
          this.qualityIndex < 2 &&
          (this.dissolvePhase > 0 || keyMoved || animateShadows)
        ) {
          this.renderer.shadowMap.needsUpdate = true;
          this.lastShadowKeyPos.copy(this.keyLight.position);
        }
        this.renderCurrentPass();
        this.lastRenderAt = now;
        this.updateAutoExposure(dt);
      }
    }

    if (this.globe.isOpen || this.places.isOpen) {
      this.lastRenderAt = now;
      this.updateAutoExposure(dt);
    }
    this.afterDraw(() => this.scheduleNextFrame());
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    window.clearTimeout(this.afterDrawTimer);
    this.unbindListeners();
    if (this.currentGroup) this.disposeTransientResources(this.currentGroup);
    if (this.outgoingGroup) this.disposeTransientResources(this.outgoingGroup);
    for (const cached of this.landmarkCache.values()) {
      this.disposeTransientResources(cached.group);
    }
    this.landmarkCache.clear();
    this.markerSprites.forEach((s) => {
      this.markerGroup.remove(s);
      s.material.dispose();
    });
    this.markerSprites = [];
    this.markerTexture?.dispose();
    this.markerTexture = null;
    for (const tex of Object.values(this.userPinTextures)) {
      tex?.dispose();
    }
    this.userPinTextures = {};
    this.directionGeo.dispose();
    this.directionPointsMat.dispose();
    this.directionChevron.geometry.dispose();
    this.directionChevronMat.dispose();
    this.directionPulse.geometry.dispose();
    this.directionPulseMat.dispose();
    this.dustGeo.dispose();
    this.dustMat.dispose();
    this.controls.dispose();
    this.globe.dispose();
    this.places.dispose();
    this.windParticles.dispose();
    this.horizon.dispose();
    this.atmosphere.dispose();
    this.pmrem.dispose();
    this.envTex.dispose();
    if (this.roomEnvTex !== this.envTex) this.roomEnvTex.dispose();
    this.n8aoPass.dispose();
    this.bloomPass.dispose();
    this.miniaturePass.dispose();
    this.smaaPass.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
