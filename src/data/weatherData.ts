import type {
  ForecastSlot,
  LiveWeatherSample,
  WeatherConditionKey,
  WeatherConditionSpec,
} from '../types/citylit';
import { LANDMARKS } from './landmarks';

export const WEATHER_CONDITIONS: Record<WeatherConditionKey, WeatherConditionSpec> = {
  sun: { sky: '#3b6490', cover: 0.05, rain: 0, fog: 0, wind: 1, storm: 0, label: 'Sunny' },
  partly: {
    sky: '#46617f',
    cover: 0.45,
    rain: 0,
    fog: 0,
    wind: 1.2,
    storm: 0,
    label: 'Partly cloudy',
  },
  cloud: { sky: '#4d5560', cover: 0.9, rain: 0, fog: 0.2, wind: 1.4, storm: 0, label: 'Overcast' },
  rain: { sky: '#363d49', cover: 1, rain: 0.7, fog: 0.25, wind: 1.8, storm: 0, label: 'Showers' },
  storm: {
    sky: '#232733',
    cover: 1,
    rain: 1,
    fog: 0.3,
    wind: 3,
    storm: 1,
    label: 'Thunderstorms',
  },
  fog: { sky: '#6a7078', cover: 0.8, rain: 0, fog: 1, wind: 0.6, storm: 0, label: 'Mist' },
  wind: { sky: '#44688a', cover: 0.25, rain: 0, fog: 0, wind: 3.5, storm: 0, label: 'Windy' },
};

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function getSeasonName(month: number): 'Summer' | 'Autumn' | 'Winter' | 'Spring' {
  if (month === 12 || month <= 2) return 'Summer';
  if (month <= 5) return 'Autumn';
  if (month <= 8) return 'Winter';
  return 'Spring';
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function getSASTParts(): { h: number; m: number } {
  const parts = new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '12') % 24;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return { h: hour, m: minute };
}

function getClimateRegime(index: number): 'W' | 'Y' | 'D' | 'S' {
  const [lat, lon] = LANDMARKS[index].coords;
  if (lat < -31.5 && lon < 21.8) return 'W';
  if (lat < -33 && lon < 27) return 'Y';
  if (lon < 21 && lat > -32) return 'D';
  return 'S';
}

export function getMonthCondition(
  index: number,
  month: number,
  hour: number
): { k: WeatherConditionKey; temp: number } {
  const lm = LANDMARKS[index];
  const [lat, lon] = lm.coords;
  const { high, low } = lm.climatology;
  const r = getClimateRegime(index);
  const shift = (high - low) * 0.45 * (Math.cos(((month - 1) * Math.PI) / 6) - 0.5);
  const H = high + shift;
  const Lw = low + shift;

  let base: WeatherConditionKey = lm.climatology.base;
  let pmc: WeatherConditionKey | undefined = lm.climatology.pm;
  let amc: WeatherConditionKey | undefined = lm.climatology.am;

  if (r === 'S') {
    if (month >= 5 && month <= 9) {
      base = 'sun';
      pmc = undefined;
      amc = lat > -31 && lon > 27 && H < 26 ? 'fog' : undefined;
    } else if (month === 4 || month === 10) {
      base = 'partly';
      pmc = 'rain';
    }
  } else if (r === 'W') {
    if (month >= 5 && month <= 9) {
      base = 'rain';
      pmc = 'rain';
      amc = undefined;
    } else if (month === 4 || month === 10) {
      base = 'partly';
      pmc = undefined;
    }
  } else if (r === 'Y') {
    base = month >= 6 && month <= 8 ? 'cloud' : 'partly';
    pmc = month === 3 || (month >= 9 && month <= 11) ? 'rain' : undefined;
  } else {
    base = 'sun';
    pmc = undefined;
    amc = undefined;
  }

  const k = amc && hour < 9 ? amc : pmc && hour >= 14 && hour < 20 ? pmc : base;
  const penalty =
    ({ rain: 2, storm: 3, cloud: 1, fog: 1 } as Partial<Record<WeatherConditionKey, number>>)[k] ??
    0;
  const temp = Math.round(
    (H + Lw) / 2 + ((H - Lw) / 2) * Math.sin(((hour - 9) * Math.PI) / 12) - penalty
  );
  return { k, temp };
}

export function getBestMonths(index: number): string {
  const scores: Array<[number, number]> = [];
  for (let m = 1; m <= 12; m++) {
    let score = 0;
    for (const t of [12, 16]) {
      const q = getMonthCondition(index, m, t);
      const penalty =
        (
          { rain: 6, storm: 8, fog: 3, cloud: 2, wind: 2 } as Partial<
            Record<WeatherConditionKey, number>
          >
        )[q.k] ?? 0;
      score -= Math.abs(q.temp - 23) + penalty;
    }
    scores.push([score, m]);
  }
  return scores
    .sort((a, b) => b[0] - a[0])
    .slice(0, 3)
    .map((x) => x[1])
    .sort((a, b) => a - b)
    .map((m) => MONTHS[m - 1])
    .join(' · ');
}

export function getForecastSlots(index: number, month: number): ForecastSlot[] {
  const { h, m } = getSASTParts();
  const nowHour = h + m / 60;
  return [0, 3, 6, 9, 12].map((delta) => {
    const tt = (nowHour + delta) % 24;
    const q = getMonthCondition(index, month, tt);
    const night = tt < 6 || tt >= 19;
    return {
      label: delta ? `${pad2(Math.floor(tt))}:00` : 'Now',
      condition: q.k,
      night,
      temp: q.temp,
    };
  });
}

// ---------------------------------------------------------------------------
// Live observations → continuous 3D weather parameters
// ---------------------------------------------------------------------------

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** Map a WMO weather code to the closest display condition. */
export function conditionFromCode(
  code: number,
  windSpeed = 0,
  precipitation = 0
): WeatherConditionKey {
  let key: WeatherConditionKey =
    code >= 95
      ? 'storm'
      : code >= 80
        ? 'rain'
        : code >= 71
          ? 'cloud'
          : code >= 51
            ? 'rain'
            : code >= 45
              ? 'fog'
              : code === 3
                ? 'cloud'
                : code > 0
                  ? 'partly'
                  : 'sun';
  if (precipitation > 0.1 && key === 'cloud') key = 'rain';
  if ((key === 'sun' || key === 'partly' || key === 'cloud') && windSpeed > 30) key = 'wind';
  return key;
}

/** A label that can be more specific than the coarse display condition. */
export function liveConditionLabel(
  sample: LiveWeatherSample,
  condition: WeatherConditionKey
): string {
  if (sample.code >= 95) return 'Thunderstorms';
  if (sample.code >= 71 && sample.code <= 77) return 'Snow';
  if (sample.code >= 85 && sample.code <= 86) return 'Snow showers';
  if (sample.code >= 45 && sample.code <= 48) return 'Mist';
  return WEATHER_CONDITIONS[condition].label;
}

export interface LiveWeatherVisual {
  /** Cloud amount, 0–1. Drives cloud opacity and sky overcast tint. */
  cover: number;
  /** Rain amount, 0–1. Drives the rain-particle count and opacity. */
  rain: number;
  /** Fog amount, 0–1. Drives scene fog density and local fog/mist layers. */
  fog: number;
  /** Wind multiplier, ~0.5 (calm) to ~3.5 (strong). Drives clouds, sway and audio. */
  wind: number;
  /** Storm amount, 0–1. Drives the storm curtain and lightning. */
  storm: number;
}

/**
 * Translate real measurements into the 0–1 parameters the Three.js weather
 * scene already interpolates. Keeping this continuous is what lets a light
 * drizzle look different from a downpour, or 40% cloud differ from 90%.
 */
export function liveWeatherVisual(sample: LiveWeatherSample): LiveWeatherVisual {
  const cloud = clamp01(sample.cloudCover / 100);
  const wet = clamp01(sample.precipitation / 6);
  const humid = clamp01((sample.humidity - 78) / 20);
  const windFast = clamp01(sample.windSpeed / 30);
  const gust = clamp01((sample.windGusts - sample.windSpeed) / 25);
  const storm = sample.code >= 95 ? 1 : 0;

  const rain = Math.max(wet, storm * 0.95);
  const cover = Math.max(cloud, rain * 0.9, storm);
  // Moist air makes mist, but rain washes it out and wind disperses it.
  const fog =
    sample.code === 45 || sample.code === 48
      ? 1
      : clamp01(humid * (0.35 + cloud * 0.45) * (1 - rain * 0.6) * (1 - windFast * 0.45));
  const wind = 0.55 + windFast * 2.6 + gust * 0.45 + storm * 0.6;

  return { cover, rain, fog, wind, storm };
}

interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  is_day: number[];
}

function buildLiveForecast(hourly: HourlyWeather | undefined, observedAt: string): ForecastSlot[] {
  if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) return [];
  const hourPrefix = observedAt.slice(0, 13);
  let start = hourly.time.findIndex((t) => t.slice(0, 13) >= hourPrefix);
  if (start < 0) start = 0;

  return [0, 3, 6, 9, 12].map((delta, i) => {
    const at = Math.min(start + delta, hourly.time.length - 1);
    const time = hourly.time[at] ?? '';
    return {
      label: i === 0 ? 'Now' : `${time.slice(11, 13)}:00`,
      condition: conditionFromCode(hourly.weather_code[at] ?? 0),
      night: hourly.is_day[at] === 0,
      temp: Math.round(hourly.temperature_2m[at] ?? 0),
    };
  });
}

export interface LiveWeatherResult {
  sample: LiveWeatherSample;
  condition: WeatherConditionKey;
  label: string;
  temp: number;
  night: boolean;
  forecast: ForecastSlot[];
}

/** Fetch the current observation (and a short hourly forecast) for a landmark. */
export async function fetchLiveWeather(index: number): Promise<LiveWeatherResult> {
  const [lat, lon] = LANDMARKS[index].coords;
  const current =
    'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m';
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=${current}&hourly=temperature_2m,weather_code,is_day&forecast_days=2` +
    `&timezone=Africa%2FJohannesburg`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error('Weather fetch failed');

  const data = (await res.json()) as {
    current: {
      time: string;
      temperature_2m: number;
      relative_humidity_2m: number;
      apparent_temperature: number;
      is_day: number;
      precipitation: number;
      weather_code: number;
      cloud_cover: number;
      wind_speed_10m: number;
      wind_direction_10m: number;
      wind_gusts_10m: number;
    };
    hourly?: HourlyWeather;
  };
  const c = data.current;
  const sample: LiveWeatherSample = {
    code: c.weather_code,
    temp: c.temperature_2m,
    feelsLike: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    cloudCover: c.cloud_cover,
    precipitation: c.precipitation,
    windSpeed: c.wind_speed_10m,
    windGusts: c.wind_gusts_10m,
    windDirection: c.wind_direction_10m,
    isDay: Boolean(c.is_day),
    observedAt: c.time,
  };
  const condition = conditionFromCode(sample.code, sample.windSpeed, sample.precipitation);
  return {
    sample,
    condition,
    label: liveConditionLabel(sample, condition),
    temp: Math.round(sample.temp),
    night: !sample.isDay,
    forecast: buildLiveForecast(data.hourly, sample.observedAt),
  };
}
