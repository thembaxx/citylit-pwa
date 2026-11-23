/**
 * Shared render-pacing policy for the three camera stages (hero diorama,
 * Places cutaway and Globe). Keeping the decision pure makes the idle caps
 * testable without a renderer and stops each stage from growing its own
 * slightly different throttle.
 */

/** Milliseconds between redraws for each idle class (15 / 20 / 30 fps). */
export const IDLE_REDUCED_MS = 66;
export const IDLE_SOFTWARE_MS = 50;
export const IDLE_QUIET_MS = 33;

/** Default settle time before a static stage is allowed to drop to 30 fps. */
export const DEFAULT_QUIET_SECONDS = 2;

export interface FramePacingInput {
  /** Ceiling from the user's frame-rate cap setting; 0 means uncapped. */
  fpsCapMs: number;
  /** Reduced-motion static idle (strictest of the reduced-motion caps). */
  reducedStaticIdle: boolean;
  /** Software-GL idle. */
  batterySoftIdle: boolean;
  /** Ordinary hardware-GL settled idle. */
  quietIdle: boolean;
}

/**
 * Resolve the interval between two redraws. The user's cap is a ceiling: the
 * stricter idle pacing always wins, so a capped scene may render slower than
 * the chosen rate but never faster.
 */
export function frameThrottleMs(input: FramePacingInput): number {
  const idleMs = input.reducedStaticIdle
    ? IDLE_REDUCED_MS
    : input.batterySoftIdle
      ? IDLE_SOFTWARE_MS
      : input.quietIdle
        ? IDLE_QUIET_MS
        : 0;
  return Math.max(input.fpsCapMs, idleMs);
}

export interface StageQuietInput {
  /** Camera, tween or interaction currently in flight. */
  active: boolean;
  /** Seconds since the last meaningful interaction. */
  idleSeconds: number;
  /** Settle time; the hero's reduced-motion path uses a shorter one. */
  thresholdSeconds?: number;
}

/** A stage is quiet only once motion has stopped and input has gone away. */
export function stageQuiet(input: StageQuietInput): boolean {
  const threshold = input.thresholdSeconds ?? DEFAULT_QUIET_SECONDS;
  return !input.active && input.idleSeconds >= threshold;
}
