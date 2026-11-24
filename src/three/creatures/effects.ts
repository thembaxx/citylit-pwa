/**
 * Shared instanced splash, water-ripple and ground-dust particle pool.
 *
 * Pre-allocates fixed typed arrays per landmark layer (zero per-frame heap
 * allocations) and draws in at most two InstancedMesh calls:
 *   1. Flat expanding rings (`ripple`) on water surfaces
 *   2. Soft low-poly puffs/droplets (`splash`, `dust`) with gravity/drag
 */
import * as THREE from 'three';
import type { CreatureTier } from './budget';

export interface CreatureEffectsStats {
  activeRipples: number;
  activeParticles: number;
  drawCalls: number;
  triangles: number;
}

const POOL_CAPS: Readonly<Record<CreatureTier, { ripples: number; particles: number }>> = {
  0: { ripples: 48, particles: 144 },
  1: { ripples: 24, particles: 64 },
  2: { ripples: 8, particles: 20 },
};

const DEFAULT_RIPPLE_COLOR = new THREE.Color('#dceff5');
const DEFAULT_SPLASH_COLOR = new THREE.Color('#e8f6fa');
const DEFAULT_DUST_COLOR = new THREE.Color('#c7ad82');

export class CreatureEffectsPool {
  readonly group = new THREE.Group();

  private rippleCap: number;
  private particleCap: number;

  private readonly rippleMesh: THREE.InstancedMesh;
  private readonly particleMesh: THREE.InstancedMesh;
  private readonly rippleMat: THREE.MeshBasicMaterial;
  private readonly particleMat: THREE.MeshBasicMaterial;

  // Ring pool state
  private readonly rx: Float32Array;
  private readonly ry: Float32Array;
  private readonly rz: Float32Array;
  private readonly rAge: Float32Array;
  private readonly rLife: Float32Array;
  private readonly rMaxRadius: Float32Array;
  private rippleCursor = 0;

  // Ballistic droplet / dust puff pool state
  private readonly px: Float32Array;
  private readonly py: Float32Array;
  private readonly pz: Float32Array;
  private readonly vx: Float32Array;
  private readonly vy: Float32Array;
  private readonly vz: Float32Array;
  private readonly pAge: Float32Array;
  private readonly pLife: Float32Array;
  private readonly pSize: Float32Array;
  private readonly pGravity: Float32Array;
  private readonly pDrag: Float32Array;
  private particleCursor = 0;

  private readonly pos = new THREE.Vector3();
  private readonly quat = new THREE.Quaternion();
  private readonly scale = new THREE.Vector3();
  private readonly matrix = new THREE.Matrix4();
  private readonly tmpColor = new THREE.Color();

  private activeRipples = 0;
  private activeParticles = 0;
  private dirtyRipples = true;
  private dirtyParticles = true;
  private seedCounter = 1;

  constructor(tier: CreatureTier) {
    this.group.name = 'creature-effects-pool';
    const caps = POOL_CAPS[tier];
    this.rippleCap = caps.ripples;
    this.particleCap = caps.particles;

    // 1. Expanding water ripple rings
    const ringGeo = new THREE.RingGeometry(0.72, 1.0, 20).rotateX(-Math.PI / 2);
    this.rippleMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.rippleMesh = new THREE.InstancedMesh(ringGeo, this.rippleMat, this.rippleCap);
    this.rippleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.rippleMesh.frustumCulled = false;
    this.rippleMesh.renderOrder = 2;
    this.rippleMesh.userData.noShadow = true;
    this.rippleMesh.userData.cannotReceiveAO = true;

    // 2. Water droplets & dust puffs
    const puffGeo = new THREE.IcosahedronGeometry(0.5, 0);
    this.particleMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.particleMesh = new THREE.InstancedMesh(puffGeo, this.particleMat, this.particleCap);
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleMesh.frustumCulled = false;
    this.particleMesh.renderOrder = 2;
    this.particleMesh.userData.noShadow = true;
    this.particleMesh.userData.cannotReceiveAO = true;

    this.rx = new Float32Array(this.rippleCap);
    this.ry = new Float32Array(this.rippleCap);
    this.rz = new Float32Array(this.rippleCap);
    this.rAge = new Float32Array(this.rippleCap);
    this.rLife = new Float32Array(this.rippleCap);
    this.rMaxRadius = new Float32Array(this.rippleCap);

    this.px = new Float32Array(this.particleCap);
    this.py = new Float32Array(this.particleCap);
    this.pz = new Float32Array(this.particleCap);
    this.vx = new Float32Array(this.particleCap);
    this.vy = new Float32Array(this.particleCap);
    this.vz = new Float32Array(this.particleCap);
    this.pAge = new Float32Array(this.particleCap);
    this.pLife = new Float32Array(this.particleCap);
    this.pSize = new Float32Array(this.particleCap);
    this.pGravity = new Float32Array(this.particleCap);
    this.pDrag = new Float32Array(this.particleCap);

    for (let i = 0; i < this.rippleCap; i++) {
      this.rippleMesh.setColorAt(i, DEFAULT_RIPPLE_COLOR);
      this.hideInstance(this.rippleMesh, i);
    }
    if (this.rippleMesh.instanceColor) this.rippleMesh.instanceColor.needsUpdate = true;
    this.rippleMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.particleCap; i++) {
      this.particleMesh.setColorAt(i, DEFAULT_SPLASH_COLOR);
      this.hideInstance(this.particleMesh, i);
    }
    if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;
    this.particleMesh.instanceMatrix.needsUpdate = true;

    this.rippleMesh.visible = false;
    this.particleMesh.visible = false;
    this.group.add(this.rippleMesh, this.particleMesh);
  }

  private hideInstance(mesh: THREE.InstancedMesh, index: number): void {
    this.pos.set(0, -50, 0);
    this.quat.set(0, 0, 0, 1);
    this.scale.set(0.0001, 0.0001, 0.0001);
    this.matrix.compose(this.pos, this.quat, this.scale);
    mesh.setMatrixAt(index, this.matrix);
  }

  private nextRand(): number {
    this.seedCounter = (this.seedCounter * 1664525 + 1013904223) >>> 0;
    return this.seedCounter / 4294967296;
  }

  spawnRipple(
    x: number,
    y: number,
    z: number,
    maxRadius = 0.36,
    duration = 1.4,
    color: THREE.Color = DEFAULT_RIPPLE_COLOR
  ): void {
    if (this.rippleCap === 0) return;
    const i = this.rippleCursor;
    this.rippleCursor = (this.rippleCursor + 1) % this.rippleCap;
    this.rx[i] = x;
    this.ry[i] = y;
    this.rz[i] = z;
    this.rAge[i] = 0;
    this.rLife[i] = Math.max(0.25, duration);
    this.rMaxRadius[i] = Math.max(0.05, maxRadius);
    this.rippleMesh.setColorAt(i, color);
    if (this.rippleMesh.instanceColor) this.rippleMesh.instanceColor.needsUpdate = true;
    this.dirtyRipples = true;
  }

  spawnSplash(
    x: number,
    y: number,
    z: number,
    count = 6,
    speed = 0.55,
    baseSize = 0.055,
    color: THREE.Color = DEFAULT_SPLASH_COLOR
  ): void {
    if (this.particleCap === 0) return;
    const n = Math.min(count, this.particleCap);
    for (let k = 0; k < n; k++) {
      const i = this.particleCursor;
      this.particleCursor = (this.particleCursor + 1) % this.particleCap;
      const angle = (k / Math.max(1, n)) * Math.PI * 2 + this.nextRand() * 0.7;
      const horiz = speed * (0.25 + this.nextRand() * 0.55);
      this.px[i] = x + Math.cos(angle) * 0.03;
      this.py[i] = y + 0.02;
      this.pz[i] = z + Math.sin(angle) * 0.03;
      this.vx[i] = Math.cos(angle) * horiz;
      this.vy[i] = speed * (0.65 + this.nextRand() * 0.65);
      this.vz[i] = Math.sin(angle) * horiz;
      this.pAge[i] = 0;
      this.pLife[i] = 0.45 + this.nextRand() * 0.35;
      this.pSize[i] = baseSize * (0.7 + this.nextRand() * 0.6);
      this.pGravity[i] = 1.65;
      this.pDrag[i] = 0.4;
      this.particleMesh.setColorAt(i, color);
    }
    if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;
    this.dirtyParticles = true;
  }

  spawnDust(
    x: number,
    y: number,
    z: number,
    count = 4,
    speed = 0.22,
    baseSize = 0.08,
    color: THREE.Color = DEFAULT_DUST_COLOR
  ): void {
    if (this.particleCap === 0) return;
    const n = Math.min(count, this.particleCap);
    for (let k = 0; k < n; k++) {
      const i = this.particleCursor;
      this.particleCursor = (this.particleCursor + 1) % this.particleCap;
      const angle = this.nextRand() * Math.PI * 2;
      const horiz = speed * (0.3 + this.nextRand() * 0.7);
      this.px[i] = x + Math.cos(angle) * 0.04;
      this.py[i] = y + 0.03;
      this.pz[i] = z + Math.sin(angle) * 0.04;
      this.vx[i] = Math.cos(angle) * horiz;
      this.vy[i] = speed * (0.35 + this.nextRand() * 0.45);
      this.vz[i] = Math.sin(angle) * horiz;
      this.pAge[i] = 0;
      this.pLife[i] = 0.7 + this.nextRand() * 0.45;
      this.pSize[i] = baseSize * (0.75 + this.nextRand() * 0.65);
      this.pGravity[i] = -0.06; // slight thermal lift
      this.pDrag[i] = 2.2;
      this.tmpColor.copy(color).offsetHSL(0, 0, (this.nextRand() - 0.5) * 0.06);
      this.particleMesh.setColorAt(i, this.tmpColor);
    }
    if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;
    this.dirtyParticles = true;
  }

  update(dt: number): void {
    if (dt <= 0) return;

    let ripplesAlive = 0;
    let rippleUpdated = false;
    for (let i = 0; i < this.rippleCap; i++) {
      const life = this.rLife[i];
      if (life <= 0) continue;
      this.rAge[i] += dt;
      const u = this.rAge[i] / life;
      if (u >= 1) {
        this.rLife[i] = 0;
        this.hideInstance(this.rippleMesh, i);
        rippleUpdated = true;
        continue;
      }
      ripplesAlive++;
      rippleUpdated = true;
      const ease = 1 - (1 - u) * (1 - u);
      const radius = this.rMaxRadius[i] * (0.18 + 0.82 * ease);
      const thickness = Math.max(0.001, 1 - u);
      this.pos.set(this.rx[i], this.ry[i], this.rz[i]);
      this.quat.set(0, 0, 0, 1);
      this.scale.set(radius, thickness, radius);
      this.matrix.compose(this.pos, this.quat, this.scale);
      this.rippleMesh.setMatrixAt(i, this.matrix);
    }
    this.activeRipples = ripplesAlive;
    this.rippleMesh.visible = ripplesAlive > 0;
    if (rippleUpdated || this.dirtyRipples) {
      this.rippleMesh.instanceMatrix.needsUpdate = true;
      this.dirtyRipples = false;
    }

    let particlesAlive = 0;
    let particleUpdated = false;
    for (let i = 0; i < this.particleCap; i++) {
      const life = this.pLife[i];
      if (life <= 0) continue;
      this.pAge[i] += dt;
      const u = this.pAge[i] / life;
      if (u >= 1) {
        this.pLife[i] = 0;
        this.hideInstance(this.particleMesh, i);
        particleUpdated = true;
        continue;
      }
      particlesAlive++;
      particleUpdated = true;
      const damp = Math.exp(-this.pDrag[i] * dt);
      this.vx[i] *= damp;
      this.vz[i] *= damp;
      this.vy[i] -= this.pGravity[i] * dt;
      this.px[i] += this.vx[i] * dt;
      this.py[i] += this.vy[i] * dt;
      this.pz[i] += this.vz[i] * dt;

      // Bell envelope: swell in fast, taper cleanly to zero so there is no pop.
      const envelope = Math.sin(Math.min(1, u) * Math.PI);
      const s = Math.max(0.0005, this.pSize[i] * (0.45 + 0.85 * envelope));
      this.pos.set(this.px[i], this.py[i], this.pz[i]);
      this.quat.set(0, 0, 0, 1);
      this.scale.set(s, s, s);
      this.matrix.compose(this.pos, this.quat, this.scale);
      this.particleMesh.setMatrixAt(i, this.matrix);
    }
    this.activeParticles = particlesAlive;
    this.particleMesh.visible = particlesAlive > 0;
    if (particleUpdated || this.dirtyParticles) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
      this.dirtyParticles = false;
    }
  }

  stats(): CreatureEffectsStats {
    const drawCalls =
      (this.rippleMesh.visible ? 1 : 0) + (this.particleMesh.visible ? 1 : 0);
    const triangles =
      (this.rippleMesh.visible ? this.activeRipples * 40 : 0) +
      (this.particleMesh.visible ? this.activeParticles * 20 : 0);
    return {
      activeRipples: this.activeRipples,
      activeParticles: this.activeParticles,
      drawCalls,
      triangles,
    };
  }

  dispose(): void {
    this.rippleMesh.geometry.dispose();
    this.rippleMat.dispose();
    this.rippleMesh.dispose();
    this.particleMesh.geometry.dispose();
    this.particleMat.dispose();
    this.particleMesh.dispose();
    this.group.clear();
  }
}
