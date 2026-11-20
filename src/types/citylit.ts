export type QualitySetting = 'auto' | 'high' | 'balanced' | 'low';
export type QualityIndex = 0 | 1 | 2;
export type MotionSetting = 'auto' | 'reduce';
export type ThemeSetting = 'dark' | 'daylight' | 'studio';

export interface AmbientMixerSettings {
  wind: number;
  birds: number;
  traffic: number;
}

export interface CitylitSettings {
  quality: QualitySetting;
  volume: number;
  mixer: AmbientMixerSettings;
  haptics: boolean;
  motion: MotionSetting;
  tilt: boolean;
  theme: ThemeSetting;
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

export interface LandmarkMeta {
  k: string;
  c: string;
  f: string;
  wikiTitle: string;
  ambient: AmbientKind;
  biome: LandmarkBiome;
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
