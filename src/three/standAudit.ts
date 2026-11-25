import * as THREE from 'three';
import { standPolygonOverflow, type StandPolygon } from '../lib/standFootprint.ts';

/** One piece of content that reaches outside the stand's footprint. */
export interface StandOverflow {
  /** Human-readable label of the offending mesh. */
  readonly label: string;
  /** How far past the stand boundary the geometry reaches, in world units. */
  readonly overflow: number;
  /** World X of the worst offending vertex. */
  readonly x: number;
  /** World Z of the worst offending vertex. */
  readonly z: number;
}

/** Result of a containment audit for one landmark. */
export interface StandAudit {
  /** True when no content reaches past the stand's footprint. */
  readonly ok: boolean;
  /** The largest overhang found, in world units (0 when nothing overhangs). */
  readonly worst: number;
  /** The worst offenders, biggest first. */
  readonly offenders: readonly StandOverflow[];
  /** How many content meshes were checked. */
  readonly checked: number;
}

export interface StandAuditOptions {
  /** Upper bound on vertices sampled per mesh. */
  readonly maxVertexSamples?: number;
  /** Upper bound on offenders reported. */
  readonly maxOffenders?: number;
  /** Overhangs smaller than this are treated as floating-point noise. */
  readonly epsilon?: number;
}

/** Overflow below this is floating-point noise, not a real overhang. */
const DEFAULT_EPSILON = 1e-3;

function labelFor(obj: THREE.Object3D, root: THREE.Object3D): string {
  let top = obj;
  while (top.parent && top.parent !== root) top = top.parent;
  const mat = (obj as THREE.Mesh).material;
  const matName = Array.isArray(mat)
    ? (mat[0]?.type ?? 'material')
    : ((mat as THREE.Material | undefined)?.type ?? 'material');
  const name = top.name || obj.name || top.type;
  return `${name} (${matName})`;
}

/** True when the mesh (or an ancestor) belongs to the stand itself. */
function isStandGeometry(obj: THREE.Object3D): boolean {
  let node: THREE.Object3D | null = obj;
  while (node) {
    if (node.userData.standGeometry) return true;
    node = node.parent;
  }
  return false;
}

/**
 * Checks a landmark's **content** against the stand's real footprint.
 *
 * The stand is the container, so the stand's own geometry is skipped, and the
 * check follows the stand's silhouette rather than a square bounding box — a
 * chamfered pilot plinth would otherwise report false positives in its
 * cut-away corners while missing real spills along a curved edge.
 *
 * Vertices are sampled (stride-limited) rather than exhaustively measured so
 * the audit stays cheap enough to run over every landmark in a dev sweep.
 */
export function auditStandContainment(
  group: THREE.Object3D,
  polygon: StandPolygon,
  options: StandAuditOptions = {}
): StandAudit {
  const maxSamples = Math.max(4, options.maxVertexSamples ?? 512);
  const maxOffenders = Math.max(1, options.maxOffenders ?? 8);
  const epsilon = options.epsilon ?? DEFAULT_EPSILON;

  const offenders: StandOverflow[] = [];
  let worst = 0;
  let checked = 0;

  group.updateWorldMatrix(true, true);
  const v = new THREE.Vector3();

  group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    // Helper geometry (contact shadows, FX sprites, hidden detail) is not
    // part of the diorama's silhouette.
    if (obj.userData.cannotReceiveAO || obj.userData.noDissolve) return;
    if (isStandGeometry(obj)) return;
    const pos = obj.geometry?.attributes?.position;
    if (!pos || pos.count === 0) return;
    checked++;

    const count = pos.count;
    const stride = Math.max(1, Math.ceil(count / maxSamples));
    let meshWorst = 0;
    let meshX = 0;
    let meshZ = 0;
    for (let i = 0; i < count; i += stride) {
      v.fromBufferAttribute(pos, i).applyMatrix4(obj.matrixWorld);
      const over = standPolygonOverflow(v.x, v.z, polygon);
      if (over > meshWorst) {
        meshWorst = over;
        meshX = v.x;
        meshZ = v.z;
      }
    }
    if (meshWorst > epsilon) {
      if (meshWorst > worst) worst = meshWorst;
      offenders.push({ label: labelFor(obj, group), overflow: meshWorst, x: meshX, z: meshZ });
    }
  });

  offenders.sort((a, b) => b.overflow - a.overflow);
  return {
    ok: offenders.length === 0,
    worst,
    offenders: offenders.slice(0, maxOffenders),
    checked,
  };
}
