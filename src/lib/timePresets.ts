/**
 * One time-of-day vocabulary for every 3D stage. The hero stage, Places and
 * Globe share a single renderer/sun, so a preset must resolve to the same hour
 * whichever overlay renders the button.
 */
export type TimePresetKey = 'dawn' | 'noon' | 'dusk' | 'night';

export interface TimePreset {
  readonly key: TimePresetKey;
  readonly label: string;
  readonly hour: number;
}

export const TIME_PRESETS: ReadonlyArray<TimePreset> = [
  { key: 'dawn', label: 'Dawn', hour: 6.3 },
  { key: 'noon', label: 'Noon', hour: 13 },
  { key: 'dusk', label: 'Dusk', hour: 17.8 },
  { key: 'night', label: 'Night', hour: 22 },
];

/** The renderer switches its IBL regime at these hours (see CitylitEngine.frame). */
export const GOLDEN_HOUR_START = 16.5;
export const GOLDEN_HOUR_END = 19.5;
