import type { ResolvedTheme, ThemeSetting } from '../types/citylit';

/** Local wall-clock hour at which Auto theme switches to Daylight (inclusive). */
export const DAYLIGHT_START_HOUR = 6;
/** Local wall-clock hour at which Auto theme switches to Dark (inclusive). */
export const DAYLIGHT_END_HOUR = 19;

/**
 * Resolve the dynamic 'auto' backdrop ('daylight' or 'dark') from local clock time.
 * Uses local 06:00–19:00 as Daylight and 19:00–06:00 as Dark.
 */
export function resolveAutoTheme(now: Date = new Date()): 'daylight' | 'dark' {
  const hour = now.getHours() + now.getMinutes() / 60;
  return hour >= DAYLIGHT_START_HOUR && hour < DAYLIGHT_END_HOUR ? 'daylight' : 'dark';
}

/**
 * Resolve any ThemeSetting ('auto' | 'dark' | 'daylight' | 'studio') into a
 * concrete visual backdrop ('dark' | 'daylight' | 'studio').
 */
export function resolveTheme(
  theme: ThemeSetting | undefined,
  now: Date = new Date()
): ResolvedTheme {
  if (theme === 'dark' || theme === 'daylight' || theme === 'studio') {
    return theme;
  }
  return resolveAutoTheme(now);
}

/**
 * Milliseconds until the next local 06:00 or 19:00 theme transition boundary,
 * plus a tiny margin so `new Date()` at fire time is guaranteed past the boundary.
 */
export function msUntilNextThemeBoundary(now: Date = new Date()): number {
  const next = new Date(now.getTime());
  next.setSeconds(0, 50);
  const hour = now.getHours() + now.getMinutes() / 60;
  if (hour < DAYLIGHT_START_HOUR) {
    next.setHours(DAYLIGHT_START_HOUR, 0, 0, 50);
  } else if (hour < DAYLIGHT_END_HOUR) {
    next.setHours(DAYLIGHT_END_HOUR, 0, 0, 50);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(DAYLIGHT_START_HOUR, 0, 0, 50);
  }
  return Math.max(1000, next.getTime() - now.getTime());
}
