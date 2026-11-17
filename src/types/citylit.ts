export type QualitySetting = 'auto' | 'high' | 'balanced' | 'low';
export type QualityIndex = 0 | 1 | 2;
export type MotionSetting = 'auto' | 'reduce';

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

export interface WeatherDisplayState {
  condition: WeatherConditionKey;
  temp: number;
  night: boolean;
  label: string;
  timeText: string;
  city: string;
  source: string;
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
