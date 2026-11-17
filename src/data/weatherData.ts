import type { ForecastSlot, WeatherConditionKey, WeatherConditionSpec } from '../types/citylit';
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

export interface LiveWeatherResult {
  k: WeatherConditionKey;
  temp: number;
  night: boolean;
}

export async function fetchLiveWeather(index: number): Promise<LiveWeatherResult> {
  const [lat, lon] = LANDMARKS[index].coords;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,is_day&timezone=Africa%2FJohannesburg`;
  const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = (await res.json()) as {
    current: {
      temperature_2m: number;
      weather_code: number;
      wind_speed_10m: number;
      is_day: number;
    };
  };
  const c = data.current;
  const code = c.weather_code;
  let k: WeatherConditionKey =
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
  if ((k === 'sun' || k === 'partly') && c.wind_speed_10m > 30) {
    k = 'wind';
  }
  return {
    k,
    temp: Math.round(c.temperature_2m),
    night: !c.is_day,
  };
}
