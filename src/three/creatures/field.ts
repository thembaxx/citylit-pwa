/**
 * One instanced creature field per species: exactly one body draw call, one
 * bead-eye draw call and one blob-shadow draw call.
 *
 * Body motion (spine wave, wing flap, leg swing, blink) runs in the vertex
 * shader. The CPU only advances each agent's position/heading/state at 10-20 Hz
 * and rewrites the instance matrices for that tick.
 */
import * as THREE from 'three';
import { createRng, easeOutBack, scatterRing, type SeededRng } from './seeded';
import { getSpeciesBuild, type SpeciesBuild } from './species';
import { createCreatureMaterial, getBlobShadowMaterial, updateCreatureUniforms } from './material';
import type { CreatureZone, SpeciesId } from './habitat';
import type { CreatureTier } from './budget';

export interface CreatureFieldOptions {
  species: SpeciesId;
  count: number;
  seed: string | number;
  innerRadius: number;
  outerRadius: number;
  zone: CreatureZone;
  groundY: number;
  scaleRange: readonly [number, number];
  keepOutAngle?: number;
  keepOutHalf?: number;
  minSeparation?: number;
  tier: CreatureTier;
  /** Extra per-instance tint multiplier, usually from season. */
  tint?: THREE.Color;
}

export interface CreatureFieldStats {
  instances: number;
  triangles: number;
  drawCalls: number;
}

const TAU = Math.PI * 2;

/** Shortest signed angle from a to b. */
function angleDelta(a: number, b: number): number {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

const M_PERCH: readonly SpeciesId[] = ['gull', 'vulture'];

export class CreatureField {
  readonly group = new THREE.Group();
  readonly species: SpeciesId;
  readonly count: number;
  readonly triangles: number;

  private readonly build: SpeciesBuild;
  private readonly mesh: THREE.InstancedMesh;
  private readonly eyes: THREE.InstancedMesh | null;
  private readonly shadow: THREE.InstancedMesh;
  private readonly bodyMaterial: THREE.MeshStandardMaterial;
  private readonly eyeMaterial: THREE.MeshStandardMaterial | null;

  private readonly ax: Float32Array;
  private readonly az: Float32Array;
  private readonly ay: Float32Array;
  private readonly heading: Float32Array;
  private readonly speed: Float32Array;
  private readonly targetSpeed: Float32Array;
  private readonly targetY: Float32Array;
  private readonly scale: Float32Array;
  private readonly timer: Float32Array;
  private readonly state: Float32Array;
  private readonly wander: Float32Array;
  private readonly delay: Float32Array;

  /** (phase, speed, seed, state) packed into one vec4 attribute. */
  private readonly instanceAttr: THREE.InstancedBufferAttribute;

  private readonly rng: SeededRng;
  private readonly pos = new THREE.Vector3();
  private readonly quat = new THREE.Quaternion();
  private readonly euler = new THREE.Euler();
  private readonly scaleVec = new THREE.Vector3();
  private readonly matrix = new THREE.Matrix4();
  private readonly shadowMatrix = new THREE.Matrix4();
  private readonly shadowScale = new THREE.Vector3();
  private readonly shadowQuat = new THREE.Quaternion();
  private readonly zone: CreatureZone;
  private readonly inner: number;
  private readonly outer: number;
  private readonly groundY: number;
  private tier: CreatureTier;
  /** Lab-only: force one animation state instead of the seeded state machine. */
  private stateOverride: number | null = null;
  private age = 0;
  private acc = 0;
  private needsWrite = true;
  private visible = true;

  constructor(options: CreatureFieldOptions) {
    this.species = options.species;
    this.count = Math.max(1, Math.floor(options.count));
    this.zone = options.zone;
    this.inner = Math.max(0.2, options.innerRadius);
    this.outer = Math.max(this.inner + 0.1, options.outerRadius);
    this.groundY = options.groundY;
    this.tier = options.tier;
    this.build = getSpeciesBuild(options.species);
    this.rng = createRng(options.seed);
    this.triangles = Math.round(this.build.triangles * this.count);

    const count = this.count;
    this.ax = new Float32Array(count);
    this.az = new Float32Array(count);
    this.ay = new Float32Array(count);
    this.heading = new Float32Array(count);
    this.speed = new Float32Array(count);
    this.targetSpeed = new Float32Array(count);
    this.targetY = new Float32Array(count);
    this.scale = new Float32Array(count);
    this.timer = new Float32Array(count);
    this.state = new Float32Array(count);
    this.wander = new Float32Array(count);
    this.delay = new Float32Array(count);

    const placements = scatterRing(this.rng, {
      count,
      innerRadius: this.inner,
      outerRadius: this.outer,
      keepOutAngle: options.keepOutAngle,
      keepOutHalf: options.keepOutHalf,
      minSeparation: options.minSeparation ?? Math.max(0.18, (this.outer - this.inner) / count),
      maxAttempts: 48,
    });

    const instances = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      const spot = placements[i];
      this.ax[i] = spot.x;
      this.az[i] = spot.z;
      this.heading[i] = spot.angle + Math.PI / 2 + this.rng.jitter(0.6);
      this.scale[i] = this.rng.range(options.scaleRange[0], options.scaleRange[1]);
      this.wander[i] = this.rng.range(0, TAU);
      this.delay[i] = this.rng.range(0, 0.9);
      instances[i * 4] = this.rng.next();
      instances[i * 4 + 2] = this.rng.next();
      this.state[i] = 0;
      if (this.zone === 'air') {
        const altitude = this.airAltitude(this.species);
        this.ay[i] = this.groundY + altitude;
        this.targetY[i] = this.ay[i];
        this.speed[i] = this.rng.range(0.16, 0.34);
      } else {
        this.ay[i] = this.groundY;
        this.targetY[i] = this.groundY;
        this.speed[i] = this.zone === 'water' ? this.rng.range(0.05, 0.14) : 0;
      }
      this.targetSpeed[i] = this.speed[i];
      this.timer[i] = this.rng.range(1.5, 6);
      instances[i * 4 + 1] = this.rng.range(0.85, 1.25);
      instances[i * 4 + 3] = this.zone === 'ground' ? 0.55 : 0;
    }

    this.instanceAttr = new THREE.InstancedBufferAttribute(instances, 4);

    const bodyGeo = this.build.body.clone();
    bodyGeo.setAttribute('aInstance', this.instanceAttr);

    this.bodyMaterial = createCreatureMaterial(
      this.animationFor(this.species),
      {
        roughness: this.build.roughness,
        metalness: this.build.metalness,
        rim: this.build.wet ? 0.85 : 0.5,
      }
    );
    this.mesh = new THREE.InstancedMesh(bodyGeo, this.bodyMaterial, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    this.mesh.userData.noShadow = true;
    this.mesh.userData.cannotReceiveAO = true;
    this.group.add(this.mesh);

    if (this.build.eyes) {
      const eyeGeo = this.build.eyes.clone();
      eyeGeo.setAttribute('aInstance', this.instanceAttr);
      this.eyeMaterial = createCreatureMaterial(this.animationFor(this.species), {
        eyes: true,
        roughness: 0.06,
        metalness: 0,
        rim: 0.4,
      });
      this.eyes = new THREE.InstancedMesh(eyeGeo, this.eyeMaterial, count);
      this.eyes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.eyes.frustumCulled = false;
      this.eyes.userData.noShadow = true;
      this.eyes.userData.cannotReceiveAO = true;
      this.group.add(this.eyes);
    } else {
      this.eyes = null;
      this.eyeMaterial = null;
    }

    // One shared blob-shadow material; one instanced mesh per species.
    const shadowGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    this.shadow = new THREE.InstancedMesh(shadowGeo, getBlobShadowMaterial(), count);
    this.shadow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.shadow.frustumCulled = false;
    this.shadow.renderOrder = 1;
    this.group.add(this.shadow);

    // Subtle per-individual tint keeps a herd from looking cloned.
    const tint = new THREE.Color();
    const instanceTint = options.tint ?? new THREE.Color(1, 1, 1);
    for (let i = 0; i < count; i++) {
      const j = this.rng.jitter(0.07);
      tint.setRGB(
        Math.min(1.15, instanceTint.r * (1 + j)),
        Math.min(1.15, instanceTint.g * (1 + j * 0.8)),
        Math.min(1.15, instanceTint.b * (1 - j * 0.5))
      );
      this.mesh.setColorAt(i, tint);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

    // Write the full-size resting pose immediately. A scale-from-zero entrance
    // would leave creatures invisible if the engine is idle-paced and does not
    // tick for a while (or at all before the first capture).
    this.age = 1.2;
    this.writeMatrices(1);
  }

  private animationFor(species: SpeciesId): 'spine' | 'parts' | 'flap' {
    if (species === 'fish' || species === 'dolphin' || species === 'whale') return 'spine';
    if (species === 'penguin' || species === 'gemsbok' || species === 'meerkat') return 'parts';
    return 'flap';
  }

  private airAltitude(species: SpeciesId): number {
    if (species === 'butterfly') return 0.35;
    if (species === 'bat') return 1.1;
    if (species === 'vulture') return 1.7;
    return 1.25;
  }

  private cullDistance(): number {
    // The hero camera orbits at ~28 units in the app's default framing, so the
    // bands must cover that or every field disappears on first load.
    if (this.tier === 0) return 60;
    if (this.tier === 1) return 48;
    return 36;
  }

  setTier(tier: CreatureTier): void {
    this.tier = tier;
  }

  /**
   * Lab hook: pin the animation state (0 active, 0.55 glide/graze, 1 rest).
   * `null` returns to the seeded state machine.
   */
  setStateOverride(value: number | null): void {
    this.stateOverride = value;
    if (value === null) return;
    const clamped = Math.max(0, Math.min(1, value));
    for (let i = 0; i < this.count; i++) {
      this.state[i] = clamped;
      this.instanceAttr.array[i * 4 + 3] = clamped;
    }
    this.instanceAttr.needsUpdate = true;
  }

  setWireframe(enabled: boolean): void {
    this.bodyMaterial.wireframe = enabled;
    if (this.eyeMaterial) this.eyeMaterial.wireframe = enabled;
  }

  setTint(color: THREE.Color): void {
    if (!this.mesh.instanceColor) return;
    for (let i = 0; i < this.count; i++) this.mesh.setColorAt(i, color);
    this.mesh.instanceColor.needsUpdate = true;
  }

  /** Advance a few fixed steps for a deterministic capture. */
  advanceForCapture(seconds: number, step = 1 / 30): void {
    let remaining = Math.max(0, seconds);
    while (remaining > 0) {
      const dt = Math.min(step, remaining);
      this.age += dt;
      this.tick(dt);
      remaining -= dt;
    }
    this.writeMatrices(1);
  }

  private pickState(i: number): void {
    const rng = this.rng;
    if (this.zone === 'water') {
      this.state[i] = 0;
      this.targetSpeed[i] = rng.range(0.05, 0.16);
      this.timer[i] = rng.range(4, 9);
      return;
    }
    if (this.zone === 'air') {
      const canPerch = M_PERCH.includes(this.species) && rng.chance(0.3);
      if (canPerch) {
        this.state[i] = 1;
        this.targetSpeed[i] = 0.02;
        this.targetY[i] = this.groundY + this.scale[i] * 0.06;
        this.timer[i] = rng.range(3, 7);
      } else if (rng.chance(0.35)) {
        this.state[i] = 0.55;
        this.targetSpeed[i] = rng.range(0.1, 0.2);
        this.targetY[i] = this.groundY + this.airAltitude(this.species) * rng.range(0.85, 1.15);
        this.timer[i] = rng.range(2, 5);
      } else {
        this.state[i] = 0;
        this.targetSpeed[i] = rng.range(0.18, 0.4);
        this.targetY[i] = this.groundY + this.airAltitude(this.species) * rng.range(0.9, 1.25);
        this.timer[i] = rng.range(2.5, 6);
      }
      return;
    }
    // Ground: graze (slow head-down) vs walk vs rest.
    const roll = rng.next();
    if (roll < 0.4) {
      this.state[i] = 0.55;
      this.targetSpeed[i] = 0.005;
      this.timer[i] = rng.range(3, 8);
    } else if (roll < 0.85) {
      this.state[i] = 0;
      this.targetSpeed[i] = rng.range(0.05, 0.12);
      this.timer[i] = rng.range(2.5, 6);
    } else {
      this.state[i] = 1;
      this.targetSpeed[i] = 0;
      this.timer[i] = rng.range(2, 5);
    }
  }

  private tick(dt: number): void {
    const steer = 1.8;
    for (let i = 0; i < this.count; i++) {
      this.timer[i] -= dt;
      if (this.timer[i] <= 0 && this.stateOverride === null) this.pickState(i);

      // Wander: a slow per-agent sine gives heading drift without a noise call.
      this.wander[i] += dt * (0.25 + (i % 5) * 0.03);
      const drift = Math.sin(this.wander[i] * 1.7 + i * 2.1) * 0.55;
      this.heading[i] += drift * dt;

      // Ring constraints: steer back inside rather than clamping (avoids walls).
      const r = Math.hypot(this.ax[i], this.az[i]);
      if (r > this.outer * 0.97 || r < this.inner * 1.02) {
        const outward = Math.atan2(this.ax[i], this.az[i]);
        const desired = r > this.outer * 0.97 ? outward + Math.PI : outward;
        this.heading[i] += angleDelta(this.heading[i], desired) * Math.min(1, dt * steer);
      }

      this.speed[i] += (this.targetSpeed[i] - this.speed[i]) * Math.min(1, dt * 1.6);
      this.ax[i] += Math.sin(this.heading[i]) * this.speed[i] * dt;
      this.az[i] += Math.cos(this.heading[i]) * this.speed[i] * dt;

      if (this.zone === 'air') {
        this.ay[i] += (this.targetY[i] - this.ay[i]) * Math.min(1, dt * 1.1);
      }

      const nextState = this.state[i];
      // State changes only touch the attribute array, not the matrix.
      if (this.instanceAttr.array[i * 4 + 3] !== nextState) {
        this.instanceAttr.array[i * 4 + 3] = nextState;
        this.instanceAttr.needsUpdate = true;
      }
    }
    this.needsWrite = true;
  }

  private writeMatrices(entrance: number): void {
    const pos = this.pos;
    const quat = this.quat;
    const euler = this.euler;
    const scale = this.scaleVec;
    const matrix = this.matrix;
    const shadowMatrix = this.shadowMatrix;
    const shadowScale = this.shadowScale;
    const shadowQuat = this.shadowQuat;

    for (let i = 0; i < this.count; i++) {
      const delay = this.delay[i];
      const intro =
        entrance >= 1 ? 1 : easeOutBack(Math.max(0, Math.min(1, (this.age - delay) / 0.8)));
      const s = this.scale[i] * intro;
      pos.set(this.ax[i], this.ay[i], this.az[i]);
      euler.set(0, this.heading[i], Math.sin(this.wander[i]) * 0.05);
      quat.setFromEuler(euler);
      scale.set(s, s, s);
      matrix.compose(pos, quat, scale);
      this.mesh.setMatrixAt(i, matrix);
      if (this.eyes) this.eyes.setMatrixAt(i, matrix);

      const lift = Math.max(0, this.ay[i] - this.groundY);
      const shadowSize =
        s * (this.build.length > 1 ? 1.5 : 2.2) * Math.min(1.9, 1 + lift * 0.35) * intro;
      pos.set(this.ax[i], this.groundY + 0.004, this.az[i]);
      shadowQuat.set(0, 0, 0, 1);
      shadowScale.set(Math.max(0.001, shadowSize), 1, Math.max(0.001, shadowSize));
      shadowMatrix.compose(pos, shadowQuat, shadowScale);
      this.shadow.setMatrixAt(i, shadowMatrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.eyes) this.eyes.instanceMatrix.needsUpdate = true;
    this.shadow.instanceMatrix.needsUpdate = true;
    this.needsWrite = false;
  }

  /** `dt` is already motion-scaled by the engine. */
  update(dt: number, elapsed: number, cameraDistance: number): void {
    this.age += dt;
    // Low tier still shows a reduced count; only the software-GL path (handled
    // by the layer, which never builds fields) runs none of this.
    const visible = cameraDistance <= this.cullDistance();
    if (visible !== this.visible) {
      this.visible = visible;
      this.group.visible = visible;
    }
    if (!visible) return;
    updateCreatureUniforms(elapsed, dt > 0 ? 1 : 0, 0.6);

    // 20 Hz near, 10 Hz far: body motion stays on the GPU, so a coarse agent
    // tick is invisible at these speeds.
    const interval = cameraDistance > 16 ? 0.1 : 0.05;
    this.acc += dt;
    if (this.acc >= interval) {
      // Clamp catch-up: a tab resume must not teleport anyone by a huge step.
      const steps = Math.min(3, Math.floor(this.acc / interval));
      for (let s = 0; s < steps; s++) this.tick(interval);
      this.acc -= steps * interval;
    }
    const entrance = Math.min(1, this.age / 1.2);
    if (this.needsWrite || entrance < 1) this.writeMatrices(entrance);
  }

  stats(): CreatureFieldStats {
    return {
      instances: this.count,
      triangles: this.triangles,
      drawCalls: this.eyes ? 3 : 2,
    };
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.bodyMaterial.dispose();
    if (this.eyes) {
      this.eyes.geometry.dispose();
      this.eyeMaterial?.dispose();
    }
    this.shadow.geometry.dispose();
    this.group.clear();
    this.shadow.dispose();
  }
}
