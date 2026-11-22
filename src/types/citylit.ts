export type QualitySetting = 'auto' | 'high' | 'balanced' | 'low';
export type QualityIndex = 0 | 1 | 2;
export type MotionSetting = 'auto' | 'reduce';
export type ThemeSetting = 'dark' | 'daylight' | 'studio';

export interface AmbientMixerSettings {
  wind: number;
  birds: number;
  traffic: number;
}

export interface AmbientMixerPreset {
  id: string;
  name: string;
  mixer: AmbientMixerSettings;
  builtIn?: boolean;
}

export interface CitylitSettings {
  quality: QualitySetting;
  volume: number;
  mixer: AmbientMixerSettings;
  haptics: boolean;
  /** Short semantic sounds for interface interactions (distinct from ambience). */
  uiSounds: boolean;
  motion: MotionSetting;
  tilt: boolean;
  theme: ThemeSetting;
  /**
   * High-fidelity lighting preset. In a native ThreeRT host this switches to
   * path tracing; in the browser it applies a best-effort WebGL approximation.
   */
  cinematic: boolean;
}

export type WeatherConditionKey = 'sun' | 'partly' | 'cloud' | 'rain' | 'storm' | 'fog' | 'wind';

export interface WeatherConditionSpec {
  sky: string;
  cover: number;
  rain: number;
  fog: number;
  wind: number;
  storm: number;
  label: string;
}

/** A continuous, real-world observation used to drive the 3D weather scene. */
export interface LiveWeatherSample {
  /** WMO weather code reported by the provider. */
  code: number;
  temp: number;
  feelsLike: number;
  /** Relative humidity, 0–100. */
  humidity: number;
  /** Cloud cover, 0–100. */
  cloudCover: number;
  /** Precipitation rate in mm/h. */
  precipitation: number;
  /** 10 m wind speed in km/h. */
  windSpeed: number;
  /** 10 m wind gust speed in km/h. */
  windGusts: number;
  /** 10 m wind direction in degrees. */
  windDirection: number;
  isDay: boolean;
  /** Local-time timestamp of the observation, as reported by the provider. */
  observedAt: string;
}

export interface WeatherDisplayState {
  condition: WeatherConditionKey;
  temp: number;
  night: boolean;
  label: string;
  timeText: string;
  city: string;
  source: string;
  /** Present only when the state came from a real observation. */
  live?: LiveWeatherSample;
}

/** Real astronomical phenomena the small sky calendar can show in the scene. */
export type SkyEventKind = 'meteor-shower' | 'solar-eclipse' | 'lunar-eclipse' | 'comet';

export interface SkyEvent {
  id: string;
  kind: SkyEventKind;
  title: string;
  detail: string;
  /** Date label of the event's peak, e.g. "12 Aug" or "12 Aug 2026". */
  when: string;
  /** "Annual" for recurring showers, otherwise the event year. */
  cadence: string;
  /** 0–1. How strong the visual should be on the selected date. */
  intensity: number;
}

/** A place-specific extreme-weather moment driven by a real observation. */
export type WeatherMomentKind = 'highveld-lightning' | 'drakensberg-snow' | 'cape-point-mist';

export interface WeatherMoment {
  kind: WeatherMomentKind;
  label: string;
  detail: string;
  /** 0–1. Strength derived from the real measurement. */
  intensity: number;
}

export type AmbientKind = 'c' | 'b' | 's' | 'f';
export type LandmarkBiome =
  | 'coastal'
  | 'waterfall'
  | 'mountain'
  | 'savannah'
  | 'urban'
  | 'desert'
  | 'wetland';

export type LandmarkDot = readonly [x: number, y: number, z: number, text: string];

/** Discrete site sounds layered over the biome bed. */
export type AmbientEvent = 'shorebird' | 'cicada' | 'frog';

/** Continuous or intermittent voices that live at a point in the diorama. */
export type SpatialSoundKind = 'waterfall' | 'surf' | 'birds' | 'insects';

export interface SpatialAudioSource {
  /** Stable id so the mixer can reuse an emitter across a site switch. */
  id: string;
  kind: SpatialSoundKind;
  /** Position in diorama space, relative to the hero group origin. */
  position: readonly [x: number, y: number, z: number];
  /** Peak gain multiplier at the listener's position. */
  gain: number;
  /** Distance (diorama units) at which the source is roughly half volume. */
  radius: number;
}

export interface AmbientSiteProfile {
  events: readonly AmbientEvent[];
  /** Stereo anchor of the site's sound field, -1 (left) .. 1 (right). */
  pan: number;
  /** Relative event density multiplier. */
  density: number;
  /** Positional emitters embedded in the diorama, mixed against the camera. */
  sources?: readonly SpatialAudioSource[];
}

export type LandmarkTag =
  | 'Historical'
  | 'Natural'
  | 'Coastal'
  | 'Architectural'
  | 'Cultural'
  | 'Wildlife'
  | 'Mountain';

export interface LandmarkMeta {
  k: string;
  c: string;
  f: string;
  wikiTitle: string;
  ambient: AmbientKind;
  biome: LandmarkBiome;
  tags: readonly LandmarkTag[];
  coords: readonly [lat: number, lon: number];
  climatology: {
    high: number;
    low: number;
    base: WeatherConditionKey;
    pm?: WeatherConditionKey;
    am?: WeatherConditionKey;
  };
  dots: readonly LandmarkDot[];
}

export interface MediaItem {
  v: boolean;
  src: string;
  full: string;
  w?: number;
  h?: number;
  cap: string;
  cr: string;
  lic: string;
  page?: string;
  rend?: boolean;
  t: string;
}

export interface ForecastSlot {
  label: string;
  condition: WeatherConditionKey;
  night: boolean;
  temp: number;
}

export type NoteCategory = 'memory' | 'photo' | 'history';

export type CameraPreset = 'default' | 'aerial' | 'low' | 'detail';

export interface LandmarkNote {
  id: string;
  text: string;
  category?: NoteCategory;
  /** Position in 3D diorama space relative to heroRoot. */
  position: readonly [x: number, y: number, z: number];
  createdAt: number;
}

export interface SavedCustomPlace {
  id: string;
  lat: number;
  lon: number;
  label: string;
  detail: string;
  savedAt: number;
}

export interface HeritageRoute {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  stopIndices: readonly number[];
}

export interface CompassState {
  /** Camera azimuth heading in degrees [0, 360), where 0 = True North (-Z in diorama). */
  bearingDeg: number;
  /** Screen-space needle rotation angle in degrees pointing toward North. */
  needleDeg: number;
  /** Camera pitch tilt angle in degrees (0 = horizon, 90 = zenith). */
  tiltDeg: number;
  /** Active 3D viewport stage. */
  mode: 'diorama' | 'places' | 'globe';
  /** Geographic bearing in degrees [0, 360) toward the next landmark, or null. */
  nextBearingDeg: number | null;
}
