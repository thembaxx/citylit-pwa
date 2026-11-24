/**
 * Central instance/triangle budget for the creature and detail layer.
 *
 * One registry per landmark. Fields ask for a reservation before they build,
 * and the manager grants a fraction of the request when the tier is nearly
 * full. That keeps the governor's frame-time promise while still showing the
 * most important species at reduced density instead of dropping them.
 * Pure module: no three.js, unit-testable.
 */

export type CreatureTier = 0 | 1 | 2;

export interface TierCaps {
  /** Maximum animated instances. */
  instances: number;
  /** Maximum additional triangles for the whole creature layer. */
  triangles: number;
}

/**
 * Caps from the brief (section 2). Software GL gets zero: the layer does not
 * build at all, and the manager refuses every reservation.
 */
export const CREATURE_TIER_CAPS: Readonly<Record<CreatureTier, TierCaps>> = {
  0: { instances: 1500, triangles: 150_000 },
  1: { instances: 600, triangles: 60_000 },
  2: { instances: 150, triangles: 15_000 },
};

export const CREATURE_TIER_LABELS: Readonly<Record<CreatureTier, string>> = {
  0: 'High',
  1: 'Balanced',
  2: 'Low',
};

export type CreaturePriority = 'hero' | 'mid' | 'ambient';

const PRIORITY_WEIGHT: Readonly<Record<CreaturePriority, number>> = {
  hero: 1,
  mid: 0.75,
  ambient: 0.45,
};

export interface CreatureReservation {
  group: string;
  priority: CreaturePriority;
  granted: number;
  instances: number;
  triangles: number;
}

export interface CreatureBudgetStats {
  tier: CreatureTier;
  instances: number;
  triangles: number;
  capInstances: number;
  capTriangles: number;
  /** 0..1, the larger of the two usage fractions. */
  utilisation: number;
  groups: number;
}

export function tierFromQualityIndex(qualityIndex: number, software: boolean): CreatureTier {
  if (software) return 2;
  if (qualityIndex <= 0) return 0;
  if (qualityIndex === 1) return 1;
  return 2;
}

/** Instances a tier wants for a species whose High density is `density`. */
export function tierDensity(density: number, tier: CreatureTier): number {
  const safe = Number.isFinite(density) && density > 0 ? density : 0;
  if (tier === 0) return Math.round(safe);
  if (tier === 1) return Math.round(safe * 0.4);
  return Math.round(safe * 0.15);
}

export class CreatureBudget {
  private tier: CreatureTier;
  private readonly software: boolean;
  private usedInstances = 0;
  private usedTriangles = 0;
  private readonly reservations: CreatureReservation[] = [];

  constructor(tier: CreatureTier, software = false) {
    this.tier = software ? 2 : tier;
    this.software = software;
  }

  get currentTier(): CreatureTier {
    return this.tier;
  }

  caps(): TierCaps {
    return this.software ? { instances: 0, triangles: 0 } : CREATURE_TIER_CAPS[this.tier];
  }

  /** Changing tier does not retroactively evict; fields ask for a refresh. */
  setTier(tier: CreatureTier): void {
    this.tier = this.software ? 2 : tier;
  }

  /**
   * Request `instances` individuals at `trianglesEach` triangles. Returns the
   * granted count (0..instances), trimmed to the remaining budget and by the
   * species priority when capacity is scarce.
   */
  reserve(
    group: string,
    priority: CreaturePriority,
    instances: number,
    trianglesEach: number
  ): number {
    const caps = this.caps();
    const remainingInstances = Math.max(0, caps.instances - this.usedInstances);
    const remainingTriangles = Math.max(0, caps.triangles - this.usedTriangles);
    if (remainingInstances < 1 || remainingTriangles < 1) return 0;
    const perInstance = Math.max(1, Math.ceil(trianglesEach));
    const wanted = Math.max(0, Math.floor(instances));
    if (wanted === 0) return 0;
    const byInstances = Math.floor(remainingInstances * PRIORITY_WEIGHT[priority]);
    const byTriangles = Math.floor(remainingTriangles / perInstance);
    const granted = Math.max(0, Math.min(wanted, byInstances, byTriangles));
    if (granted > 0) {
      this.usedInstances += granted;
      this.usedTriangles += granted * perInstance;
      this.reservations.push({
        group,
        priority,
        granted,
        instances: wanted,
        triangles: granted * perInstance,
      });
    }
    return granted;
  }

  stats(): CreatureBudgetStats {
    const caps = this.caps();
    const utilisation = Math.max(
      caps.instances > 0 ? this.usedInstances / caps.instances : 0,
      caps.triangles > 0 ? this.usedTriangles / caps.triangles : 0
    );
    return {
      tier: this.tier,
      instances: this.usedInstances,
      triangles: this.usedTriangles,
      capInstances: caps.instances,
      capTriangles: caps.triangles,
      utilisation: Math.min(1, utilisation),
      groups: this.reservations.length,
    };
  }

  /** True when the next species of this cost would still fit without trimming. */
  fits(instances: number, trianglesEach: number): boolean {
    const caps = this.caps();
    return (
      this.usedInstances + instances <= caps.instances &&
      this.usedTriangles + instances * trianglesEach <= caps.triangles
    );
  }

  reset(): void {
    this.usedInstances = 0;
    this.usedTriangles = 0;
    this.reservations.length = 0;
  }
}
