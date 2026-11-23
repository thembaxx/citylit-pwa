import * as THREE from 'three';
import { computeBirdSpawnIntervalSec } from '../lib/foliageWind';

export type BirdState =
  | 'inactive'
  | 'entering'
  | 'circling'
  | 'landing'
  | 'perched'
  | 'takeoff'
  | 'departing';

interface BirdPalette {
  body: string;
  breast: string;
  wing: string;
  beak: string;
}

interface SharedBirdPaletteMats {
  body: THREE.MeshStandardMaterial;
  breast: THREE.MeshStandardMaterial;
  wing: THREE.MeshStandardMaterial;
  beak: THREE.MeshStandardMaterial;
}

interface BirdAgent {
  active: boolean;
  state: BirdState;
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  tail: THREE.Mesh;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  breastMesh: THREE.Mesh;
  headMesh: THREE.Mesh;
  beakMesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  orbitAngle: number;
  orbitDir: 1 | -1;
  orbitRadius: number;
  orbitHeight: number;
  orbitSpeed: number;
  baseScale: number;
  wingPhase: number;
  stateElapsed: number;
  stateDuration: number;
  cyclesCompleted: number;
  maxCycles: number;
  perchIndex: number;
  perchPos: THREE.Vector3;
  approachStartPos: THREE.Vector3;
  approachStartYaw: number;
  perchYaw: number;
  headLookSeed: number;
}

const BIRD_POOL_SIZE = 5;
const RAYCAST_SPIRAL_COUNT = 24;
const MAX_PERCHES = 10;
const MIN_PERCH_SPACING_SQ = 0.9 * 0.9;

const BIOME_PALETTES: Record<string, BirdPalette> = {
  coastal: { body: '#d8e2ec', breast: '#f4f7fa', wing: '#65788a', beak: '#e2a428' },
  wetland: { body: '#e2e8ee', breast: '#f6f8fb', wing: '#586c7d', beak: '#d99526' },
  savannah: { body: '#7c6a38', breast: '#e4b744', wing: '#5d4f28', beak: '#2d2721' },
  desert: { body: '#9a7e56', breast: '#d8be8e', wing: '#6e583b', beak: '#322b23' },
  urban: { body: '#667586', breast: '#cdd6df', wing: '#4a5766', beak: '#2d3138' },
  waterfall: { body: '#3b424d', breast: '#b8683b', wing: '#2a3038', beak: '#cda04f' },
  mountain: { body: '#414650', breast: '#aa5d38', wing: '#2e333c', beak: '#cca04d' },
};

function paletteKeyForBiome(biome?: string): string {
  if (biome && biome in BIOME_PALETTES) return biome;
  return 'mountain';
}

function tagBirdPart(obj: THREE.Object3D): void {
  obj.castShadow = false;
  obj.receiveShadow = false;
  obj.userData.noShadow = true;
  obj.userData.cannotReceiveAO = true;
  obj.userData.noDissolve = true;
}

/**
 * Collect valid solid upward-facing perch anchors (rooftops, cliffs, ledges,
 * tree crowns) from a landmark diorama via one-time downward raycasts.
 */
export function collectBirdPerchPoints(group: THREE.Object3D | null): THREE.Vector3[] {
  if (!group) return [];
  const cached = group.userData.birdPerchPoints as THREE.Vector3[] | undefined;
  if (cached) return cached;

  group.updateMatrixWorld(true);

  const candidates: THREE.Object3D[] = [];
  group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.visible) return;
    if (
      obj.userData.noShadow ||
      obj.userData.cannotReceiveAO ||
      obj.userData.isWaterSurface ||
      obj.userData.tracksCoastalTide ||
      obj.userData.isVehicle ||
      obj.userData.isStreetLamp
    ) {
      return;
    }
    const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    if (mat && mat.transparent && mat.opacity < 0.85) return;
    candidates.push(obj);
  });

  if (candidates.length === 0) {
    group.userData.birdPerchPoints = [];
    return [];
  }

  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0);
  const worldNormal = new THREE.Vector3();
  const normalMat = new THREE.Matrix3();
  const hits: THREE.Vector3[] = [];
  const goldenAngle = 2.399963229728653;

  for (let i = 0; i < RAYCAST_SPIRAL_COUNT && hits.length < MAX_PERCHES; i++) {
    const t = (i + 0.5) / RAYCAST_SPIRAL_COUNT;
    const r = 0.75 + Math.sqrt(t) * 4.05;
    const ang = i * goldenAngle + 0.4;
    origin.set(Math.cos(ang) * r, 14, Math.sin(ang) * r);
    raycaster.set(origin, down);
    raycaster.far = 14.5;

    const intersections = raycaster.intersectObjects(candidates, false);
    if (intersections.length === 0) continue;

    const hit = intersections[0];
    if (hit.point.y < 0.42 || hit.point.y > 7.8) continue;

    if (hit.face) {
      normalMat.getNormalMatrix(hit.object.matrixWorld);
      worldNormal.copy(hit.face.normal).applyMatrix3(normalMat).normalize();
      if (worldNormal.y < 0.72) continue;
    }

    let tooClose = false;
    for (let j = 0; j < hits.length; j++) {
      if (hits[j].distanceToSquared(hit.point) < MIN_PERCH_SPACING_SQ) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) {
      hits.push(hit.point.clone());
    }
  }

  // Sort high-to-mid perches first so silhouettes read well against sky/landmark stone.
  hits.sort((a, b) => b.y - a.y);
  group.userData.birdPerchPoints = hits;
  return hits;
}

export class DaylightBirdsController {
  readonly flockGroup: THREE.Group;

  private readonly bodyGeo: THREE.BufferGeometry;
  private readonly breastGeo: THREE.BufferGeometry;
  private readonly headGeo: THREE.BufferGeometry;
  private readonly beakGeo: THREE.BufferGeometry;
  private readonly tailGeo: THREE.BufferGeometry;
  private readonly wingGeo: THREE.BufferGeometry;
  private readonly paletteMats = new Map<string, SharedBirdPaletteMats>();
  private readonly birds: BirdAgent[] = [];

  private perchPoints: THREE.Vector3[] = [];
  private currentBiome = 'mountain';
  private spawnTimer = 1.4;
  private rngState = 1337;
  private externallyHidden = false;
  private disposed = false;

  // Scratch math vectors/eulers (zero per-frame allocations)
  private readonly tmpTarget = new THREE.Vector3();
  private readonly tmpDir = new THREE.Vector3();
  private readonly tmpPrev = new THREE.Vector3();

  constructor(parent: THREE.Object3D) {
    this.flockGroup = new THREE.Group();
    this.flockGroup.name = 'daylight-birds-flock';
    this.flockGroup.userData.noShadow = true;
    this.flockGroup.userData.cannotReceiveAO = true;
    parent.add(this.flockGroup);

    // 6-part stylized bird geometry (+Z forward, +Y up, ±X wingspan)
    this.bodyGeo = new THREE.CapsuleGeometry(0.032, 0.09, 4, 8).rotateX(Math.PI / 2);
    this.bodyGeo.userData.sharedResource = true;

    this.breastGeo = new THREE.SphereGeometry(0.034, 7, 6);
    this.breastGeo.scale(0.92, 0.88, 1.18);
    this.breastGeo.userData.sharedResource = true;

    this.headGeo = new THREE.SphereGeometry(0.025, 7, 6);
    this.headGeo.userData.sharedResource = true;

    this.beakGeo = new THREE.ConeGeometry(0.0095, 0.036, 5).rotateX(Math.PI / 2);
    this.beakGeo.userData.sharedResource = true;

    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.lineTo(-0.024, -0.068);
    tailShape.lineTo(0.024, -0.068);
    tailShape.closePath();
    this.tailGeo = new THREE.ShapeGeometry(tailShape).rotateX(Math.PI / 2);
    this.tailGeo.userData.sharedResource = true;

    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0.03);
    wingShape.lineTo(0.095, 0.038);
    wingShape.lineTo(0.215, -0.015);
    wingShape.lineTo(0.135, -0.048);
    wingShape.lineTo(0, -0.04);
    wingShape.closePath();
    this.wingGeo = new THREE.ShapeGeometry(wingShape).rotateX(Math.PI / 2);
    this.wingGeo.userData.sharedResource = true;

    const initMats = this.getPaletteMats(this.currentBiome);
    for (let i = 0; i < BIRD_POOL_SIZE; i++) {
      const root = new THREE.Group();
      root.visible = false;
      tagBirdPart(root);

      const bodyGroup = new THREE.Group();
      tagBirdPart(bodyGroup);
      root.add(bodyGroup);

      const bodyMesh = new THREE.Mesh(this.bodyGeo, initMats.body);
      tagBirdPart(bodyMesh);
      bodyGroup.add(bodyMesh);

      const breastMesh = new THREE.Mesh(this.breastGeo, initMats.breast);
      breastMesh.position.set(0, -0.008, 0.028);
      tagBirdPart(breastMesh);
      bodyGroup.add(breastMesh);

      const headGroup = new THREE.Group();
      headGroup.position.set(0, 0.032, 0.068);
      tagBirdPart(headGroup);
      bodyGroup.add(headGroup);

      const headMesh = new THREE.Mesh(this.headGeo, initMats.body);
      tagBirdPart(headMesh);
      headGroup.add(headMesh);

      const beakMesh = new THREE.Mesh(this.beakGeo, initMats.beak);
      beakMesh.position.set(0, -0.002, 0.032);
      tagBirdPart(beakMesh);
      headGroup.add(beakMesh);

      const tail = new THREE.Mesh(this.tailGeo, initMats.wing);
      tail.position.set(0, 0.004, -0.062);
      tagBirdPart(tail);
      bodyGroup.add(tail);

      const rightWing = new THREE.Mesh(this.wingGeo, initMats.wing);
      rightWing.position.set(0.02, 0.012, 0.016);
      tagBirdPart(rightWing);
      bodyGroup.add(rightWing);

      const leftWing = new THREE.Mesh(this.wingGeo, initMats.wing);
      leftWing.position.set(-0.02, 0.012, 0.016);
      leftWing.scale.x = -1;
      tagBirdPart(leftWing);
      bodyGroup.add(leftWing);

      this.flockGroup.add(root);
      this.birds.push({
        active: false,
        state: 'inactive',
        root,
        bodyGroup,
        headGroup,
        tail,
        leftWing,
        rightWing,
        bodyMesh,
        breastMesh,
        headMesh,
        beakMesh,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(0, 0, 1),
        orbitAngle: 0,
        orbitDir: 1,
        orbitRadius: 3.6,
        orbitHeight: 4.2,
        orbitSpeed: 0.42,
        baseScale: 1,
        wingPhase: i * 1.37,
        stateElapsed: 0,
        stateDuration: 6,
        cyclesCompleted: 0,
        maxCycles: 2,
        perchIndex: -1,
        perchPos: new THREE.Vector3(),
        approachStartPos: new THREE.Vector3(),
        approachStartYaw: 0,
        perchYaw: 0,
        headLookSeed: i * 2.17 + 0.5,
      });
    }
  }

  private nextRand(): number {
    this.rngState = (this.rngState * 1664525 + 1013904223) >>> 0;
    return this.rngState / 4294967296;
  }

  private getPaletteMats(biome?: string): SharedBirdPaletteMats {
    const key = paletteKeyForBiome(biome);
    const existing = this.paletteMats.get(key);
    if (existing) return existing;

    const pal = BIOME_PALETTES[key] ?? BIOME_PALETTES.mountain;
    const make = (color: string, side: THREE.Side = THREE.FrontSide) => {
      const m = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.72,
        metalness: 0.04,
        side,
      });
      m.userData.sharedResource = true;
      return m;
    };
    const bundle: SharedBirdPaletteMats = {
      body: make(pal.body),
      breast: make(pal.breast),
      wing: make(pal.wing, THREE.DoubleSide),
      beak: make(pal.beak),
    };
    this.paletteMats.set(key, bundle);
    return bundle;
  }

  setHidden(hidden: boolean): void {
    this.externallyHidden = hidden;
    if (hidden) {
      this.flockGroup.visible = false;
    }
  }

  setSite(biome: string | undefined, perches: THREE.Vector3[], immediate = false): void {
    this.currentBiome = paletteKeyForBiome(biome);
    this.perchPoints = perches;
    const mats = this.getPaletteMats(this.currentBiome);

    for (let i = 0; i < this.birds.length; i++) {
      const b = this.birds[i];
      b.bodyMesh.material = mats.body;
      b.headMesh.material = mats.body;
      b.breastMesh.material = mats.breast;
      b.tail.material = mats.wing;
      b.leftWing.material = mats.wing;
      b.rightWing.material = mats.wing;
      b.beakMesh.material = mats.beak;

      // Clear old perch targets cleanly when swapping sites
      if (immediate) {
        this.deactivateBird(b);
      } else if (b.active && (b.state === 'perched' || b.state === 'landing')) {
        b.state = 'takeoff';
        b.stateElapsed = 0;
        b.stateDuration = 1.0;
        b.perchIndex = -1;
      }
    }
    if (immediate) {
      this.spawnTimer = 1.1;
    }
  }

  private deactivateBird(b: BirdAgent): void {
    b.active = false;
    b.state = 'inactive';
    b.perchIndex = -1;
    b.root.visible = false;
  }

  private countActiveBirds(): number {
    let n = 0;
    for (let i = 0; i < this.birds.length; i++) {
      if (this.birds[i].active) n++;
    }
    return n;
  }

  private pickFreePerch(): number {
    if (this.perchPoints.length === 0) return -1;
    const maxChoices = Math.min(this.perchPoints.length, MAX_PERCHES);
    const offset = Math.floor(this.nextRand() * maxChoices);
    for (let step = 0; step < maxChoices; step++) {
      const idx = (offset + step) % maxChoices;
      let taken = false;
      for (let i = 0; i < this.birds.length; i++) {
        const other = this.birds[i];
        if (other.active && other.perchIndex === idx) {
          taken = true;
          break;
        }
      }
      if (!taken) return idx;
    }
    return -1;
  }

  spawnBird(startAlreadyCircling = false): boolean {
    if (this.disposed) return false;
    let slot: BirdAgent | null = null;
    for (let i = 0; i < this.birds.length; i++) {
      if (!this.birds[i].active) {
        slot = this.birds[i];
        break;
      }
    }
    if (!slot) return false;

    const orbitRadius = 2.4 + this.nextRand() * 2.5;
    const orbitHeight = 3.1 + this.nextRand() * 2.2;
    const orbitAngle = this.nextRand() * Math.PI * 2;
    const orbitDir: 1 | -1 = this.nextRand() > 0.45 ? 1 : -1;

    slot.active = true;
    slot.orbitDir = orbitDir;
    slot.orbitRadius = orbitRadius;
    slot.orbitHeight = orbitHeight;
    slot.orbitAngle = orbitAngle;
    slot.orbitSpeed = 0.34 + this.nextRand() * 0.2;
    slot.baseScale = 0.84 + this.nextRand() * 0.28;
    slot.wingPhase = this.nextRand() * Math.PI * 2;
    slot.cyclesCompleted = 0;
    slot.maxCycles = this.perchPoints.length > 0 ? 2 : 1;
    slot.perchIndex = -1;
    slot.stateElapsed = 0;

    if (startAlreadyCircling) {
      slot.state = 'circling';
      slot.stateDuration = 4.5 + this.nextRand() * 5.0;
      slot.pos.set(
        Math.cos(orbitAngle) * orbitRadius,
        orbitHeight,
        Math.sin(orbitAngle) * orbitRadius
      );
    } else {
      slot.state = 'entering';
      slot.stateDuration = 2.6 + this.nextRand() * 0.9;
      const enterR = 9.2 + this.nextRand() * 1.4;
      const enterAngle = orbitAngle - orbitDir * 0.85;
      slot.pos.set(
        Math.cos(enterAngle) * enterR,
        orbitHeight + 1.1 + this.nextRand() * 0.9,
        Math.sin(enterAngle) * enterR
      );
    }

    const tx = -Math.sin(orbitAngle) * orbitDir;
    const tz = Math.cos(orbitAngle) * orbitDir;
    slot.vel.set(tx, 0, tz).normalize().multiplyScalar(1.8);
    const initYaw = Math.atan2(slot.vel.x, slot.vel.z);
    slot.bodyGroup.rotation.set(0, initYaw, -0.2 * orbitDir);
    slot.headGroup.rotation.set(0, 0, 0);
    slot.tail.rotation.x = 0.06;
    slot.rightWing.rotation.set(0, 0, 0.14);
    slot.leftWing.rotation.set(0, 0, -0.14);

    slot.root.position.copy(slot.pos);
    slot.root.scale.setScalar(startAlreadyCircling ? slot.baseScale : 0.05);
    slot.root.visible = !this.externallyHidden;
    return true;
  }

  update(
    dt: number,
    animTime: number,
    daylightActive: boolean,
    windSpeed: number,
    windDir: THREE.Vector2,
    motionScale: number,
    immediate = false
  ): void {
    if (this.disposed) return;

    if (immediate) {
      if (daylightActive && !this.externallyHidden) {
        if (this.countActiveBirds() === 0) {
          this.spawnBird(true);
        }
        this.flockGroup.visible = true;
      } else {
        for (let i = 0; i < this.birds.length; i++) {
          this.deactivateBird(this.birds[i]);
        }
        this.flockGroup.visible = false;
      }
      return;
    }

    const effectiveDt = dt * motionScale;
    const safeWind = Math.max(0, Math.min(4, Number.isFinite(windSpeed) ? windSpeed : 1));
    const windDriftX = windDir.x * safeWind * 0.14;
    const windDriftZ = windDir.y * safeWind * 0.14;

    // Periodic daylight spawning
    if (daylightActive && !this.externallyHidden) {
      if (motionScale > 0) {
        this.spawnTimer -= effectiveDt;
        const activeCount = this.countActiveBirds();
        if (this.spawnTimer <= 0) {
          if (activeCount < BIRD_POOL_SIZE) {
            this.spawnBird(false);
          }
          this.spawnTimer = computeBirdSpawnIntervalSec(safeWind, this.countActiveBirds());
        }
      }
    } else {
      // Gently clear out all birds at dusk/night, Studio mode, or storms
      this.spawnTimer = 1.4;
      for (let i = 0; i < this.birds.length; i++) {
        const b = this.birds[i];
        if (!b.active) continue;
        if (b.state === 'perched' || b.state === 'landing') {
          b.state = 'takeoff';
          b.stateElapsed = 0;
          b.stateDuration = 0.7;
          b.cyclesCompleted = b.maxCycles + 1;
          b.perchIndex = -1;
        } else if (b.state === 'entering' || b.state === 'circling') {
          b.state = 'departing';
          b.stateElapsed = 0;
          b.stateDuration = 2.6;
        }
      }
    }

    let anyVisible = false;
    for (let i = 0; i < this.birds.length; i++) {
      const b = this.birds[i];
      if (!b.active) continue;

      if (effectiveDt > 0) {
        this.stepBird(b, effectiveDt, animTime, daylightActive, safeWind, windDriftX, windDriftZ);
      }

      if (b.active && !this.externallyHidden) {
        b.root.visible = true;
        anyVisible = true;
      } else {
        b.root.visible = false;
      }
    }

    this.flockGroup.visible = anyVisible && !this.externallyHidden;
  }

  private stepBird(
    b: BirdAgent,
    dt: number,
    animTime: number,
    daylightActive: boolean,
    windSpeed: number,
    windDriftX: number,
    windDriftZ: number
  ): void {
    b.stateElapsed += dt;
    this.tmpPrev.copy(b.pos);

    let flapIntensity = 0.55;
    let flapSpeed = 10.5;
    let wingFold = 0; // 0 = spread/flapping, 1 = neatly tucked
    let bankRoll = 0;

    if (b.state === 'entering') {
      const p = Math.min(1, b.stateElapsed / b.stateDuration);
      const ease = p * p * (3 - 2 * p);
      b.orbitAngle += b.orbitDir * b.orbitSpeed * dt;
      const targetX = Math.cos(b.orbitAngle) * b.orbitRadius + windDriftX;
      const targetZ = Math.sin(b.orbitAngle) * b.orbitRadius + windDriftZ;
      const targetY = b.orbitHeight + Math.sin(animTime * 0.9 + b.wingPhase) * 0.22;
      this.tmpTarget.set(targetX, targetY, targetZ);

      const moveRate = Math.min(1, dt * (2.4 + ease * 2.2));
      b.pos.lerp(this.tmpTarget, moveRate);

      const scaleFade = THREE.MathUtils.smoothstep(p, 0, 0.38);
      b.root.scale.setScalar(b.baseScale * Math.max(0.05, scaleFade));
      flapIntensity = 0.72;
      bankRoll = -0.18 * b.orbitDir;

      if (p >= 1) {
        b.state = 'circling';
        b.stateElapsed = 0;
        b.stateDuration = 5.5 + this.nextRand() * 6.5;
        b.root.scale.setScalar(b.baseScale);
      }
    } else if (b.state === 'circling') {
      b.orbitAngle += b.orbitDir * b.orbitSpeed * (1 + windSpeed * 0.06) * dt;
      const radialWobble = Math.sin(animTime * 0.55 + b.wingPhase) * 0.35;
      const r = b.orbitRadius + radialWobble;
      const thermalClimb =
        Math.sin(animTime * 0.72 + b.wingPhase * 1.4) * 0.34 +
        Math.cos(animTime * 0.35 + b.wingPhase) * 0.14;
      this.tmpTarget.set(
        Math.cos(b.orbitAngle) * r + windDriftX,
        b.orbitHeight + thermalClimb,
        Math.sin(b.orbitAngle) * r + windDriftZ
      );
      b.pos.lerp(this.tmpTarget, Math.min(1, dt * 3.6));

      // Mix active flap-bursts with peaceful thermal glides
      const burstWave = Math.sin(animTime * 0.92 + b.wingPhase * 2.1);
      flapIntensity = 0.14 + THREE.MathUtils.smoothstep(burstWave, -0.15, 0.45) * 0.68;
      flapSpeed = 9.2 + windSpeed * 0.6;
      bankRoll = -0.26 * b.orbitDir;

      if (b.stateElapsed >= b.stateDuration) {
        const shouldLand =
          daylightActive &&
          b.cyclesCompleted < b.maxCycles &&
          this.perchPoints.length > 0 &&
          this.nextRand() < 0.72;
        if (shouldLand) {
          const perchIdx = this.pickFreePerch();
          if (perchIdx >= 0) {
            b.state = 'landing';
            b.stateElapsed = 0;
            b.stateDuration = 2.4;
            b.perchIndex = perchIdx;
            b.perchPos.copy(this.perchPoints[perchIdx]);
            b.approachStartPos.copy(b.pos);
            b.approachStartYaw = Math.atan2(b.vel.x, b.vel.z);
            b.perchYaw = Math.atan2(b.perchPos.x - b.pos.x, b.perchPos.z - b.pos.z);
            if (!Number.isFinite(b.perchYaw)) b.perchYaw = b.approachStartYaw;
          } else {
            b.state = 'departing';
            b.stateElapsed = 0;
            b.stateDuration = 2.8;
          }
        } else {
          b.state = 'departing';
          b.stateElapsed = 0;
          b.stateDuration = 2.8;
        }
      }
    } else if (b.state === 'landing') {
      const p = Math.min(1, b.stateElapsed / b.stateDuration);
      const easeOut = 1 - Math.pow(1 - p, 2.4);
      // Graceful curved descent with slight swoop arc above terrain before touchdown
      const swoopArc = Math.sin(p * Math.PI) * 0.42 * (1 - p * 0.6);
      b.pos.lerpVectors(b.approachStartPos, b.perchPos, easeOut);
      b.pos.y += swoopArc + 0.032 * easeOut;

      // Rapid braking wing flare during the final 35% of approach
      const flare = THREE.MathUtils.smoothstep(p, 0.55, 0.92);
      flapIntensity = 0.42 + flare * 0.52 * (1 - THREE.MathUtils.smoothstep(p, 0.9, 1));
      flapSpeed = 12.5;
      wingFold = THREE.MathUtils.smoothstep(p, 0.88, 1);
      b.tail.rotation.x = 0.14 + flare * 0.28;

      if (p >= 1) {
        b.state = 'perched';
        b.stateElapsed = 0;
        b.stateDuration = 4.2 + this.nextRand() * 5.2;
        b.pos.copy(b.perchPos);
        b.pos.y += 0.032;
      }
    } else if (b.state === 'perched') {
      b.pos.copy(b.perchPos);
      b.pos.y += 0.032;
      flapIntensity = 0;
      wingFold = 1;

      // Gentle alert posture, breathing bob, and curious head turns
      const bob = Math.sin(animTime * 3.1 + b.headLookSeed) * 0.004;
      b.pos.y += bob;

      const lookCycle = Math.sin(animTime * 1.45 + b.headLookSeed);
      const quickTurn = Math.sin(animTime * 3.8 + b.headLookSeed * 2.1);
      b.headGroup.rotation.y = lookCycle * 0.48 + quickTurn * 0.12;
      b.headGroup.rotation.x = -0.06 + Math.sin(animTime * 2.3 + b.headLookSeed) * 0.14;
      b.bodyGroup.rotation.set(-0.22, b.perchYaw, 0);
      b.tail.rotation.x = -0.15;

      if (b.stateElapsed >= b.stateDuration) {
        b.state = 'takeoff';
        b.stateElapsed = 0;
        b.stateDuration = 1.15;
        b.cyclesCompleted++;
        b.perchIndex = -1;
        b.orbitAngle = Math.atan2(b.pos.z, b.pos.x);
      }
    } else if (b.state === 'takeoff') {
      const p = Math.min(1, b.stateElapsed / b.stateDuration);
      b.orbitAngle += b.orbitDir * b.orbitSpeed * 0.9 * dt;
      const climbOutX = Math.cos(b.orbitAngle) * Math.max(1.8, b.orbitRadius * 0.8);
      const climbOutZ = Math.sin(b.orbitAngle) * Math.max(1.8, b.orbitRadius * 0.8);
      this.tmpTarget.set(climbOutX, Math.max(b.perchPos.y + 1.6, b.orbitHeight * 0.9), climbOutZ);
      b.pos.lerp(this.tmpTarget, Math.min(1, dt * 2.8));

      wingFold = 1 - THREE.MathUtils.smoothstep(p, 0, 0.28);
      flapIntensity = 0.95;
      flapSpeed = 13.5;

      if (p >= 1) {
        if (!daylightActive || b.cyclesCompleted >= b.maxCycles) {
          b.state = 'departing';
          b.stateElapsed = 0;
          b.stateDuration = 2.6;
        } else {
          b.state = 'circling';
          b.stateElapsed = 0;
          b.stateDuration = 5.0 + this.nextRand() * 5.0;
        }
      }
    } else if (b.state === 'departing') {
      const p = Math.min(1, b.stateElapsed / b.stateDuration);
      b.orbitAngle += b.orbitDir * b.orbitSpeed * 0.72 * dt;
      const outR = b.orbitRadius + p * 7.8;
      this.tmpTarget.set(
        Math.cos(b.orbitAngle) * outR + windDriftX * (1 + p * 2),
        b.orbitHeight + 1.5 + p * 2.2,
        Math.sin(b.orbitAngle) * outR + windDriftZ * (1 + p * 2)
      );
      b.pos.lerp(this.tmpTarget, Math.min(1, dt * 2.5));

      const scaleOut = 1 - THREE.MathUtils.smoothstep(p, 0.58, 1);
      b.root.scale.setScalar(b.baseScale * Math.max(0.01, scaleOut));
      flapIntensity = 0.64;
      bankRoll = -0.12 * b.orbitDir;

      if (p >= 1) {
        this.deactivateBird(b);
        return;
      }
    }

    b.root.position.copy(b.pos);

    if (b.state !== 'perched') {
      // Smooth velocity & heading alignment (+Z forward, +Y up)
      this.tmpDir.subVectors(b.pos, this.tmpPrev);
      if (dt > 0.0001 && this.tmpDir.lengthSq() > 1e-7) {
        this.tmpDir.divideScalar(dt);
        b.vel.lerp(this.tmpDir, Math.min(1, dt * 8));
      }
      const speed = b.vel.length();
      if (speed > 0.02) {
        const yaw = Math.atan2(b.vel.x, b.vel.z);
        const pitch = -Math.asin(THREE.MathUtils.clamp(b.vel.y / speed, -0.78, 0.78));
        b.bodyGroup.rotation.set(pitch, yaw, bankRoll);
      }
      b.headGroup.rotation.set(0, 0, 0);
      if (b.state !== 'landing') {
        b.tail.rotation.x = 0.06;
      }
    }

    // Articulate left & right wings (flap spread vs tucked perched fold)
    const flapWave = Math.sin(animTime * flapSpeed + b.wingPhase);
    const activeFlapZ = flapWave * 0.62 * flapIntensity + (1 - flapIntensity) * 0.08;
    const targetRz = THREE.MathUtils.lerp(activeFlapZ, -1.04, wingFold);
    const targetRy = THREE.MathUtils.lerp(0, 0.62, wingFold);

    b.rightWing.rotation.z = targetRz;
    b.rightWing.rotation.y = targetRy;
    b.leftWing.rotation.z = -targetRz;
    b.leftWing.rotation.y = -targetRy;
  }

  dispose(): void {
    this.disposed = true;
    this.flockGroup.parent?.remove(this.flockGroup);
    this.bodyGeo.dispose();
    this.breastGeo.dispose();
    this.headGeo.dispose();
    this.beakGeo.dispose();
    this.tailGeo.dispose();
    this.wingGeo.dispose();
    for (const bundle of this.paletteMats.values()) {
      bundle.body.dispose();
      bundle.breast.dispose();
      bundle.wing.dispose();
      bundle.beak.dispose();
    }
    this.paletteMats.clear();
  }
}
