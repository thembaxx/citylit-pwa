import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { N8AOPass } from 'n8ao';
import { ambientAudio } from '../audio/ambientAudio';
import { LANDMARKS } from '../data/landmarks';
import type {
  AmbientSiteProfile,
  LiveWeatherSample,
  MediaItem,
  QualityIndex,
  QualitySetting,
  ThemeSetting,
  WeatherConditionKey,
} from '../types/citylit';
import { LANDMARK_BUILDERS } from './builders/landmarksB';
import {
  glowMaterials,
  resetSceneDynamicLists,
  setContactShadowFade,
  swayItems,
  updateWetSurfaces,
} from './builders/primitives';
import { createGlobeScene, type GlobeController } from './globeScene';
import { createPlacesScene, type PlacesController, type PlacesSelectionInfo } from './placesScene';
import { createMiniaturePass, type MiniaturePass, type MiniatureTuning } from './postfx';
import { getSoftTexture, installDissolveShader, WU } from './shaders';
import { configureDioramaShadow, createRimLight, updateRimLight } from './lightingRig';
import { createAtmosphereScene, type AtmosphereSceneController } from './siteAtmosphere';
import { createWeatherScene, type WeatherSceneController } from './weatherScene';

export interface EngineCallbacks {
  onSelectLandmarkFromGlobe?: (index: number) => void;
  onSelectPlaceSlice?: (info: PlacesSelectionInfo) => void;
  onOpenLandmarkFromPlaces?: (index: number) => void;
  onFactDot?: (text: string) => void;
  onFirstInteract?: () => void;
  onThunder?: () => void;
  onSwipeLandmark?: (dir: 1 | -1) => void;
}

const audioRight = new THREE.Vector3();
const audioForward = new THREE.Vector3();

export class CitylitEngine {
  readonly container: HTMLElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly isSoftwareGl: boolean;
  readonly weather: WeatherSceneController;
  readonly globe: GlobeController;
  readonly places: PlacesController;
  readonly atmosphere: AtmosphereSceneController;

  readonly miniatureTuning: MiniatureTuning = {
    focusY: 0.49,
    focusRange: 0.2,
    blur: 1.7,
    vignette: 0.2,
    aperture: 1.0,
  };

  private readonly pmrem: THREE.PMREMGenerator;
  private envTex: THREE.Texture;
  private readonly composer: EffectComposer;
  private readonly renderPass: RenderPass;
  private readonly n8aoPass: N8AOPass;
  private readonly bloomPass: UnrealBloomPass;
  private readonly miniaturePass: MiniaturePass;
  private readonly smaaPass: SMAAPass;
  private readonly outputPass: OutputPass;

  private readonly keyLight: THREE.DirectionalLight;
  private readonly fillLight: THREE.DirectionalLight;
  private readonly rimLight: THREE.DirectionalLight;
  private readonly hemiLight: THREE.HemisphereLight;
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
  private readonly dustPoints: THREE.Points;
  private readonly dustPositions: Float32Array;
  private readonly dustGeo: THREE.BufferGeometry;

  private currentGroup: THREE.Group | null = null;
  private outgoingGroup: THREE.Group | null = null;
  private markerSprites: THREE.Sprite[] = [];
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
  private afterDrawTimer = 0;

  private qualitySetting: QualitySetting = 'auto';
  private qualityIndex: QualityIndex = 0;
  private theme: ThemeSetting = 'dark';
  private motionScale = 1;
  private autoRotateSpeed = 0.3;
  private contextLost = false;
  private usingSkyHdr = false;
  private shadowFrameCounter = 0;
  private autoScaleTimer = 0;
  private autoScaleSamples = 0;
  private autoScaleAcc = 0;

  private tiltEnabled = false;
  private tiltOffsetX = 0;
  private tiltOffsetY = 0;
  private camGoal: THREE.Vector3 | null = null;
  private camStart = new THREE.Vector3();
  private camTargetPos = new THREE.Vector3();
  private camGoalT = 1;
  private tapDown = { x: 0, y: 0, t: 0 };
  private lastPlaceTap = { sliceIndex: -1, t: 0 };
  private lastPlaceSliceIndex = -1;
  private lastHoverCheck = 0;
  private pinchDist = 0;

  private callbacks: EngineCallbacks;

  constructor(container: HTMLElement, callbacks: EngineCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    installDissolveShader();

    this.isSoftwareGl = CitylitEngine.detectSoftwareGl();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.isSoftwareGl ? 1 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    if (!this.isSoftwareGl) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.shadowMap.autoUpdate = false;
    }

    const canvas = this.renderer.domElement;
    canvas.className = 'block fixed inset-0 w-full h-full touch-none';
    this.container.appendChild(canvas);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0e0f13');
    this.scene.fog = new THREE.FogExp2('#0e0f13', 0.01);

    this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.2, 200);
    this.camera.position.set(11.5, 6.2, 13);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.target.set(0, 1.5, 0);
    this.controls.minDistance = 6;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI * 0.485;
    this.controls.autoRotate = !this.isSoftwareGl;
    this.controls.autoRotateSpeed = 0.3;

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.roomEnvTex = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.envTex = this.roomEnvTex;
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 0.48;

    new HDRLoader().load(
      '/assets/env/sky.hdr',
      (hdrTex) => {
        if (this.disposed) {
          hdrTex.dispose();
          return;
        }
        // Physical sky HDRIs contain extreme >60k-nit sun spikes that clip diffuse PBR albedo under PMREM.
        // Compress luminance > 2.0 with a smooth log knee so specular reflections stay crisp while diffuse fill stays natural.
        const raw = hdrTex.image?.data as Uint16Array | Float32Array | undefined;
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

    this.hemiLight = new THREE.HemisphereLight('#d9e7ff', '#2a2016', 0.38);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight('#fff5dd', 2.8);
    this.keyLight.position.set(12, 18, 10);
    if (!this.isSoftwareGl) {
      this.keyLight.castShadow = true;
      configureDioramaShadow(this.keyLight);
    }
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight('#4a72b0', 0.58);
    this.fillLight.position.set(-12, 8, -10);
    this.scene.add(this.fillLight);

    this.rimLight = createRimLight();
    this.scene.add(this.rimLight);
    this.scene.add(this.rimLight.target);

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

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.26,
      0.5,
      0.9
    );
    this.miniaturePass = createMiniaturePass(this.miniatureTuning);
    this.smaaPass = new SMAAPass();
    this.outputPass = new OutputPass();

    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.n8aoPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.miniaturePass);
    this.composer.addPass(this.smaaPass);
    this.composer.addPass(this.outputPass);

    // Plinth & glowing ring
    this.plinthGroup = new THREE.Group();
    this.scene.add(this.plinthGroup);

    this.plinthTopMat = new THREE.MeshStandardMaterial({ color: '#1a1c24', roughness: 0.88 });
    const plinthTop = new THREE.Mesh(
      new THREE.CylinderGeometry(8.5, 9, 0.5, 72),
      this.plinthTopMat
    );
    plinthTop.position.y = -0.25;
    plinthTop.receiveShadow = true;
    this.plinthGroup.add(plinthTop);

    this.plinthBaseMat = new THREE.MeshStandardMaterial({ color: '#111218', roughness: 0.9 });
    const plinthBase = new THREE.Mesh(
      new THREE.CylinderGeometry(9.2, 9.6, 0.2, 72),
      this.plinthBaseMat
    );
    plinthBase.position.y = -0.6;
    this.plinthGroup.add(plinthBase);

    this.ringMat = new THREE.MeshStandardMaterial({
      color: '#e8b04a',
      emissive: '#e8b04a',
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });
    this.ringMat.userData.i = 0.6;
    const plinthRing = new THREE.Mesh(
      new THREE.TorusGeometry(8.52, 0.035, 8, 96).rotateX(Math.PI / 2),
      this.ringMat
    );
    plinthRing.position.y = 0.01;
    this.plinthGroup.add(plinthRing);

    this.studioShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9),
      new THREE.MeshBasicMaterial({
        map: getSoftTexture(),
        color: '#828c99',
        transparent: true,
        opacity: 0.34,
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

    // Dissolve dust particles
    const DN = 160;
    this.dustPositions = new Float32Array(DN * 3);
    this.dustGeo = new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.BufferAttribute(this.dustPositions, 3)
    );
    this.dustPoints = new THREE.Points(
      this.dustGeo,
      new THREE.PointsMaterial({
        color: '#ffd280',
        size: 0.28,
        map: getSoftTexture(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.dustPoints.frustumCulled = false;
    this.scene.add(this.dustPoints);

    // Weather & Globe sub-controllers
    this.weather = createWeatherScene(this.scene);
    this.atmosphere = createAtmosphereScene(this.scene);
    this.globe = createGlobeScene(
      canvas,
      window.innerWidth / window.innerHeight,
      this.isSoftwareGl
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
    return new THREE.CanvasTexture(c);
  }

  private markerTexture: THREE.CanvasTexture | null = null;

  private rebuildMarkers(index: number): void {
    this.markerSprites.forEach((s) => this.markerGroup.remove(s));
    this.markerSprites = [];
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
      sprite.userData.factText = text;
      sprite.userData.cannotReceiveAO = true;
      sprite.renderOrder = 2;
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
        obj.castShadow = !this.isSoftwareGl;
        obj.receiveShadow = !this.isSoftwareGl;
      }
    });
    return group;
  }

  showLandmarkImmediate(index: number): void {
    this.activeIndex = index;
    if (this.currentGroup) {
      this.heroRoot.remove(this.currentGroup);
    }
    if (this.outgoingGroup) {
      this.heroRoot.remove(this.outgoingGroup);
      this.outgoingGroup = null;
    }
    resetSceneDynamicLists(this.ringMat);
    this.currentGroup = this.buildLandmarkGroup(index);
    setContactShadowFade(this.currentGroup, 1);
    ambientAudio.setSiteProfile(
      (this.currentGroup.userData.audioProfile as AmbientSiteProfile | undefined) ?? null
    );
    this.atmosphere.setSite({
      key: LANDMARKS[index].k,
      biome: LANDMARKS[index].biome,
    });
    this.heroRoot.add(this.currentGroup);
    this.rebuildMarkers(index);
    this.dissolvePhase = 0;
    WU.dy.value = 100;
    this.dustPoints.visible = false;
    if (this.isStudio()) this.frameCurrentLandmark();
    if (!this.isSoftwareGl) {
      this.renderer.shadowMap.needsUpdate = true;
    }
  }

  transitionToLandmark(index: number): void {
    if (!this.currentGroup) {
      this.showLandmarkImmediate(index);
      return;
    }
    this.activeIndex = index;
    if (this.outgoingGroup) {
      this.heroRoot.remove(this.outgoingGroup);
      this.outgoingGroup = null;
    }
    if (this.motionScale === 0) {
      this.showLandmarkImmediate(index);
      return;
    }
    this.pendingIndex = index;
    this.dissolvePhase = 1;
    this.dissolveT = 0;
    ambientAudio.playSfx('whoosh');
    ambientAudio.vibrate(15);
  }

  applyQuality(setting: QualitySetting): void {
    this.qualitySetting = setting;
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
    this.setQualityIndex(idx);
  }

  private setQualityIndex(idx: QualityIndex): void {
    this.qualityIndex = idx;
    const rawPr = [Math.min(devicePixelRatio || 1, 2), Math.min(devicePixelRatio || 1, 1.4), 1][
      idx
    ];
    const pr = this.isSoftwareGl ? 1 : rawPr;
    this.renderer.setPixelRatio(pr);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(window.innerWidth, window.innerHeight);

    const highFx = !this.isSoftwareGl && idx === 0;
    const midFx = !this.isSoftwareGl && idx === 1;
    const postFx = highFx || midFx;
    this.n8aoPass.enabled = highFx;
    this.renderPass.enabled = midFx;
    this.bloomPass.enabled = postFx;
    this.miniaturePass.enabled = postFx;
    this.smaaPass.enabled = postFx;

    const shadowsOn = !this.isSoftwareGl && idx < 2;
    this.renderer.shadowMap.enabled = shadowsOn;
    if (shadowsOn) {
      const targetSize = idx === 0 ? 4096 : 2048;
      if (this.keyLight.shadow.mapSize.x !== targetSize) {
        this.keyLight.shadow.mapSize.set(targetSize, targetSize);
        this.keyLight.shadow.map?.dispose();
        this.keyLight.shadow.map = null;
      }
      this.renderer.shadowMap.needsUpdate = true;
    }
  }

  private isStudio(): boolean {
    return this.theme === 'studio';
  }

  private updatePlinthVisibility(): void {
    const hidden = this.globe.isOpen || this.places.isOpen;
    this.plinthGroup.visible = !hidden && !this.isStudio();
    this.studioShadow.visible = !hidden && this.isStudio();
  }

  setTheme(theme: ThemeSetting): void {
    const wasStudio = this.isStudio();
    this.theme = theme;
    this.weather.setTheme(theme);
    this.updatePlinthVisibility();

    if (theme === 'studio') {
      this.scene.background = new THREE.Color('#f7f7f4');
      this.scene.environment = this.roomEnvTex;
      this.bloomPass.threshold = 1.15;
      this.miniaturePass.applyTuning({
        blur: 0.7,
        vignette: 0.03,
        aperture: 0.7,
        focusRange: 0.34,
        focusY: 0.5,
      });
      // A narrow FOV from far away reads as orthographic without changing any camera paths.
      this.camera.fov = 14;
      this.camera.updateProjectionMatrix();
      this.controls.autoRotate = false;
      if (!wasStudio) this.frameCurrentLandmark();
      return;
    }

    if (wasStudio) {
      this.scene.environment = this.envTex;
      this.camera.fov = 42;
      this.camera.updateProjectionMatrix();
      this.controls.minDistance = 6;
      this.controls.maxDistance = 30;
      this.miniaturePass.applyTuning({
        blur: 1.7,
        vignette: 0.2,
        aperture: 1.0,
        focusRange: 0.2,
        focusY: 0.49,
      });
      this.resetCamera(window.innerWidth <= window.innerHeight);
    }

    if (theme === 'daylight') {
      this.plinthTopMat.color.set('#b8ad99');
      this.plinthBaseMat.color.set('#968b76');
      this.ringMat.color.set('#b8842f');
      this.ringMat.emissive.set('#b8842f');
      this.ringMat.emissiveIntensity = 0.14;
      this.bloomPass.threshold = 1.0;
    } else {
      this.plinthTopMat.color.set('#1a1c24');
      this.plinthBaseMat.color.set('#111218');
      this.ringMat.color.set('#e8b04a');
      this.ringMat.emissive.set('#e8b04a');
      this.ringMat.emissiveIntensity = 0.35;
      this.bloomPass.threshold = 0.9;
    }
  }

  setMotionPreferences(reduced: boolean): void {
    this.motionScale = reduced ? 0 : 1;
    this.autoRotateSpeed = reduced || this.isSoftwareGl ? 0 : 0.3;
    this.controls.autoRotate =
      !reduced && !this.isSoftwareGl && !this.globe.isOpen && !this.places.isOpen && !this.isStudio();
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
    this.weather.applyCondition(condition, night, timeOfDay);
  }

  /** Apply a real observation: cloud, rain, fog, wind and storm flow into the scene. */
  setLiveWeather(sample: LiveWeatherSample, timeOfDay: number): void {
    this.weather.applyLiveSample(sample, timeOfDay);
  }

  setSeasonMonth(month: number, immediate = false): void {
    this.weather.setSeasonMonth(month, immediate);
    ambientAudio.setSeasonMonth(month, immediate);
  }

  setSunAltitudeFromSlider(val: number): void {
    this.weather.target.timeOfDay = val;
    this.weather.target.night = val < 6 || val >= 19 ? 1 : 0;
  }

  toggleRainRainbow(): void {
    if (this.weather.target.rain > 0) {
      this.weather.target.rain = 0;
      this.weather.target.cover = 0.25;
      this.weather.triggerRainbow(12);
    }
  }

  openGlobe(visited: Set<number>): void {
    if (this.places.isOpen) {
      this.places.close();
      this.weather.rainLines.position.set(0, 0, 0);
      this.weather.rainLines.visible = this.weather.current.rain > 0.03;
      this.weather.stormCurtain.visible = true;
      this.weather.stormCurtain.scale.setScalar(1);
      this.atmosphere.root.position.set(0, 0, 0);
    }
    this.heroRoot.visible = false;
    this.plinthGroup.visible = false;
    this.markerGroup.visible = false;
    this.dustPoints.visible = false;
    this.weather.setHidden(true);
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
    if (this.globe.isOpen) {
      this.globe.close();
    }
    this.heroRoot.visible = false;
    this.plinthGroup.visible = false;
    this.markerGroup.visible = false;
    this.dustPoints.visible = false;
    this.weather.setHidden(false);
    this.weather.groundShadow.visible = false;
    this.weather.clouds.visible = false;
    this.weather.rainLines.visible = false;
    this.weather.stormCurtain.visible = false;
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
    this.atmosphere.setSite({ key: lm.k, biome: lm.biome });
    ambientAudio.playSfx('open');
    if (!this.isSoftwareGl) {
      this.renderer.shadowMap.needsUpdate = true;
    }
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
  }

  flyCameraPreset(pos: [number, number, number]): void {
    this.camStart.copy(this.camera.position);
    this.camTargetPos.set(pos[0], pos[1], pos[2]);
    this.camGoal = this.camTargetPos;
    this.camGoalT = 0;
  }

  resetCamera(isPortrait: boolean): void {
    this.camera.position.set(isPortrait ? 13 : 11.5, 6.2, isPortrait ? 14.5 : 13);
    this.controls.target.set(0, 1.5, 0);
  }

  /** Fit the current diorama into a fixed isometric, near-orthographic hero shot. */
  frameCurrentLandmark(): void {
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
    this.controls.autoRotate = false;
    this.controls.update();

    this.studioShadow.position.set(center.x, box.min.y - 0.03, center.z);
    const span = Math.max(size.x, size.z) * 1.35;
    this.studioShadow.scale.set(span / 9, span / 9, 1);
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
    const prevAtmosphereVisible = this.atmosphere.root.visible;

    this.scene.fog = null;
    this.weather.setHidden(true);
    this.atmosphere.setHidden(true);
    this.plinthGroup.visible = true;
    this.markerGroup.visible = false;
    this.heroRoot.visible = true;
    (this.scene.background as THREE.Color).set(this.theme === 'daylight' ? '#a8d8ec' : '#141721');

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
      this.heroRoot.add(grp);
      if (this.isSoftwareGl) {
        this.renderer.render(this.scene, thumbCam);
      } else {
        this.renderer.shadowMap.needsUpdate = true;
        this.composer.render();
      }
      out[idx] = this.renderer.domElement.toDataURL('image/webp', 0.72);
      this.heroRoot.remove(grp);
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
    const prevQualityIndex = this.qualityIndex;
    this.markerGroup.visible = false;
    if (!this.isSoftwareGl && prevQualityIndex !== 0) {
      this.setQualityIndex(0);
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

    if (prevQualityIndex !== this.qualityIndex) {
      this.setQualityIndex(prevQualityIndex);
    }
    this.markerGroup.visible = savedMarkers;
    this.camera.position.copy(savedPos);
    this.controls.target.copy(savedTarget);
    return results;
  }

  capturePostcard(index: number, weatherText: string): string {
    const lm = LANDMARKS[index];
    const wasMarkersVisible = this.markerGroup.visible;
    const prevQualityIndex = this.qualityIndex;
    this.markerGroup.visible = false;
    if (!this.isSoftwareGl && prevQualityIndex !== 0) {
      this.setQualityIndex(0);
    }
    if (!this.isSoftwareGl) this.renderer.shadowMap.needsUpdate = true;
    this.renderCurrentPass();
    if (prevQualityIndex !== this.qualityIndex) {
      this.setQualityIndex(prevQualityIndex);
    }
    this.markerGroup.visible = wasMarkersVisible;

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
    grad.addColorStop(0.6, 'rgba(14,15,19,0.78)');
    grad.addColorStop(1, 'rgba(14,15,19,0.96)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 820, 1080, 530);

    ctx.fillStyle = this.theme === 'daylight' ? '#1c2330' : '#e8b04a';
    ctx.font = 'italic 600 28px Georgia, serif';
    ctx.fillText('cıtylit', 68, 86);

    ctx.fillStyle = '#e8b04a';
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText(lm.c.toUpperCase(), 68, 1140);

    ctx.fillStyle = '#f3efe6';
    ctx.font = 'italic 400 72px Georgia, serif';
    ctx.fillText(lm.k, 68, 1222);

    ctx.fillStyle = '#a9a69e';
    ctx.font = '500 24px system-ui, sans-serif';
    ctx.fillText(weatherText, 68, 1278);

    return out.toDataURL('image/png');
  }

  private syncMiniatureDepth(
    camera: THREE.PerspectiveCamera,
    target: THREE.Vector3
  ): void {
    this.miniaturePass.setFocus(camera.position.distanceTo(target));
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
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.globe.setAspect(w / h);
      this.places.setAspect(w / h);
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
      if (this.isStudio()) this.frameCurrentLandmark();
    };

    const raycaster = new THREE.Raycaster();
    const onPointerDown = (e: PointerEvent) => {
      this.camGoal = null;
      this.tapDown = { x: e.clientX, y: e.clientY, t: performance.now() };
      this.callbacks.onFirstInteract?.();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.places.isOpen) return;
      const now = performance.now();
      if (now - this.lastHoverCheck < 45) return;
      this.lastHoverCheck = now;
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
      const hovered = this.places.hoverAt(ndcX, ndcY);
      canvas.style.cursor = hovered !== null ? 'pointer' : 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - this.tapDown.x;
      const dy = e.clientY - this.tapDown.y;
      const dt = performance.now() - this.tapDown.t;
      if (dt < 280 && Math.hypot(dx, dy) < 9) {
        const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
        const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
        if (this.globe.isOpen) {
          const picked = this.globe.pickPin(ndcX, ndcY);
          if (picked !== null) {
            ambientAudio.vibrate(10);
            this.callbacks.onSelectLandmarkFromGlobe?.(picked);
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
              ambientAudio.vibrate(12);
              this.callbacks.onOpenLandmarkFromPlaces?.(picked.landmarkIndex);
            } else {
              ambientAudio.playSfx('ping');
              ambientAudio.vibrate(10);
              this.focusPlaceSiteAudio(picked.landmarkIndex);
              this.callbacks.onSelectPlaceSlice?.(picked);
            }
          }
          return;
        }
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
        const hits = raycaster.intersectObjects(this.markerSprites, false);
        if (hits.length) {
          const text = hits[0].object.userData.factText as string | undefined;
          if (text) {
            ambientAudio.playSfx('ping');
            ambientAudio.vibrate(10);
            this.callbacks.onFactDot?.(text);
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!this.globe.isOpen) return;
      e.preventDefault();
      this.globe.zoomBy(1 + Math.sign(e.deltaY) * 0.08);
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
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('deviceorientation', onOrientation);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    this.unbindListeners = () => {
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
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

  private scheduleNextFrame(): void {
    if (this.disposed) return;
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
    if (this.disposed || this.contextLost) return;

    const dt = Math.max(0, Math.min(0.05, (now - this.lastTick) / 1000));
    this.lastTick = Math.max(this.lastTick, now);
    this.elapsed += dt;
    // Accumulate scaled time instead of multiplying wall time by the scale, so toggling
    // reduced motion eases into the new rate rather than jumping the shader phase.
    this.shaderTime += dt * this.motionScale;
    WU.t.value = this.shaderTime;

    // Auto quality monitor when qualitySetting === 'auto'
    if (this.qualitySetting === 'auto' && !this.isSoftwareGl) {
      this.autoScaleTimer += dt;
      this.autoScaleAcc += dt;
      this.autoScaleSamples++;
      if (this.autoScaleTimer > 2 && this.autoScaleSamples > 10) {
        const avgDt = this.autoScaleAcc / this.autoScaleSamples;
        if (avgDt > 0.04 && this.qualityIndex < 2) {
          this.setQualityIndex((this.qualityIndex + 1) as QualityIndex);
        }
        this.autoScaleTimer = 0;
        this.autoScaleAcc = 0;
        this.autoScaleSamples = 0;
      }
    }

    if (this.globe.isOpen) {
      this.globe.update(dt, this.elapsed, this.motionScale);
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
      updateRimLight(this.rimLight, this.weather.current.night, WU.sun.value);
      this.weather.clouds.visible = false;
      this.weather.groundShadow.visible = false;
      this.weather.rainLines.visible = false;
      this.weather.stormCurtain.visible = false;
      if (this.isStudio()) {
        this.scene.environmentIntensity = 0.55;
      } else {
        const envCeiling = this.usingSkyHdr ? 0.22 : 0.48;
        const envFloor = this.usingSkyHdr ? 0.07 : 0.16;
        this.scene.environmentIntensity =
          envFloor +
          (envCeiling - envFloor) *
            (1 - this.weather.current.night) *
            (1 - this.weather.current.cover * 0.35);
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
      const lm = LANDMARKS[sel.landmarkIndex];
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
      // Camera fly preset interpolation
      if (this.camGoal) {
        this.camGoalT = Math.min(1, this.camGoalT + dt * 1.4);
        const s = this.camGoalT * this.camGoalT * (3 - 2 * this.camGoalT);
        this.camera.position.lerpVectors(this.camStart, this.camTargetPos, s);
        if (this.camGoalT >= 1) this.camGoal = null;
      }

      // Dust-dissolve landmark switch
      if (this.dissolvePhase === 1) {
        this.dissolveT += dt * 2.2;
        const cutY = Math.max(-0.5, 9 * (1 - this.dissolveT));
        WU.dy.value = cutY;
        setContactShadowFade(this.currentGroup, Math.max(0, 1 - Math.min(1, this.dissolveT)));
        this.dustPoints.visible = true;
        const dm = this.dustPoints.material as THREE.PointsMaterial;
        dm.opacity = Math.sin(Math.min(1, this.dissolveT) * Math.PI) * 0.9;
        for (let i = 0; i < 160; i++) {
          this.dustPositions[i * 3] = Math.cos(i * 2.1 + this.elapsed * 3) * (1 + (i % 7) * 0.9);
          this.dustPositions[i * 3 + 1] = cutY + ((i % 9) - 4) * 0.16;
          this.dustPositions[i * 3 + 2] =
            Math.sin(i * 1.7 + this.elapsed * 2) * (1 + (i % 7) * 0.9);
        }
        this.dustGeo.attributes.position.needsUpdate = true;
        if (this.dissolveT >= 1) {
          if (this.pendingIndex !== null) {
            this.showLandmarkImmediate(this.pendingIndex);
            this.pendingIndex = null;
            this.dissolvePhase = 2;
            this.dissolveT = 0;
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
        const dm = this.dustPoints.material as THREE.PointsMaterial;
        dm.opacity = Math.sin(progress * Math.PI) * 0.85;
        for (let i = 0; i < 160; i++) {
          this.dustPositions[i * 3] = Math.cos(i * 2.1 + this.elapsed * 3) * (1 + (i % 7) * 0.9);
          this.dustPositions[i * 3 + 1] = cutY + ((i % 9) - 4) * 0.16;
          this.dustPositions[i * 3 + 2] =
            Math.sin(i * 1.7 + this.elapsed * 2) * (1 + (i % 7) * 0.9);
        }
        this.dustGeo.attributes.position.needsUpdate = true;
        if (this.dissolveT >= 1) {
          this.dissolvePhase = 0;
          WU.dy.value = 100;
          setContactShadowFade(this.currentGroup, 1);
          this.dustPoints.visible = false;
        }
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
      for (const gm of glowMaterials) {
        const baseI = (gm.userData.i as number | undefined) ?? 1;
        gm.emissiveIntensity = baseI * (0.15 + litStrength * 1.45);
      }

      // Marker sprite pulse
      this.markerSprites.forEach((sp, i) => {
        const s = 0.56 + 0.08 * Math.sin(this.elapsed * 3 * this.motionScale + i);
        sp.scale.setScalar(s);
      });

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
      updateRimLight(this.rimLight, this.weather.current.night, WU.sun.value);
      if (this.isStudio()) {
        this.scene.environmentIntensity = 0.55;
      } else {
        const envCeiling = this.usingSkyHdr ? 0.22 : 0.48;
        const envFloor = this.usingSkyHdr ? 0.07 : 0.16;
        this.scene.environmentIntensity =
          envFloor +
          (envCeiling - envFloor) *
            (1 - this.weather.current.night) *
            (1 - this.weather.current.cover * 0.35);
      }
      updateWetSurfaces(this.weather.current.rain);

      // Localized atmosphere shell: ridge fog, heat shimmer, sea and spray mist
      const fog = this.scene.fog;
      this.atmosphere.update(dt, this.elapsed, {
        qualityIndex: this.qualityIndex,
        motionScale: this.motionScale,
        night: this.weather.current.night,
        rain: this.weather.current.rain,
        fog: this.weather.current.fog,
        cover: this.weather.current.cover,
        wind: this.weather.current.wind,
        fogColor: fog instanceof THREE.FogExp2 ? fog.color : (this.scene.background as THREE.Color),
      });

      // Gentle gyro tilt offset
      this.controls.target.set(this.tiltOffsetX, 1.5 + this.tiltOffsetY, 0);
      this.controls.update();

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

      if (!this.isSoftwareGl && this.qualityIndex < 2 && (this.shadowFrameCounter++ & 1) === 0) {
        this.renderer.shadowMap.needsUpdate = true;
      }
      this.renderCurrentPass();
    }

    this.afterDraw(() => this.scheduleNextFrame());
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    window.clearTimeout(this.afterDrawTimer);
    this.unbindListeners();
    this.controls.dispose();
    this.globe.dispose();
    this.places.dispose();
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
