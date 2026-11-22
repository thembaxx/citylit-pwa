import type { LiveWeatherSample, WeatherMoment, WeatherMomentKind } from '../types/citylit';

/**
 * Real observations only become a "moment" at the place where that kind of
 * extreme weather belongs: storms over the Highveld, snow on the Drakensberg
 * and mist at Cape Point. Everything else keeps the ordinary live weather.
 */
const WEATHER_MOMENT_SITES: Readonly<Record<string, WeatherMomentKind>> = {
  'Union Buildings': 'highveld-lightning',
  'Voortrekker Monument': 'highveld-lightning',
  'Nelson Mandela Bridge': 'highveld-lightning',
  'FNB Stadium (Soccer City)': 'highveld-lightning',
  'Ponte City': 'highveld-lightning',
  'Orlando Towers': 'highveld-lightning',
  'Drakensberg Amphitheatre': 'drakensberg-snow',
  'Cape Point Lighthouse': 'cape-point-mist',
};

const isSnowCode = (code: number): boolean =>
  (code >= 71 && code <= 77) || code === 85 || code === 86;

/** Resolve an extreme-weather moment for a landmark from a real observation. */
export function getWeatherMoment(
  landmarkKey: string,
  sample: LiveWeatherSample
): WeatherMoment | null {
  const kind = WEATHER_MOMENT_SITES[landmarkKey];
  if (!kind) return null;

  if (kind === 'highveld-lightning') {
    if (sample.code >= 95) {
      const hail = sample.code === 96 || sample.code === 99;
      return {
        kind,
        label: 'Highveld lightning',
        detail: hail
          ? 'Thunderstorm with hail rolling over the Highveld'
          : 'Thunderstorm cell over the Highveld',
        intensity: 1,
      };
    }
    if (sample.code >= 80 && sample.precipitation > 0.4) {
      return {
        kind,
        label: 'Highveld downpour',
        detail: 'Heavy convective rain building over the Highveld',
        intensity: Math.min(0.75, 0.35 + sample.precipitation / 12),
      };
    }
    return null;
  }

  if (kind === 'drakensberg-snow') {
    const freezing = sample.temp <= 1 || sample.feelsLike <= -1;
    if (!isSnowCode(sample.code) && !freezing) return null;
    const intensity = isSnowCode(sample.code)
      ? 1
      : Math.min(0.85, 0.35 + (1 - sample.temp) / 4);
    return {
      kind,
      label: 'Drakensberg snow',
      detail: isSnowCode(sample.code)
        ? 'Snow falling on the Amphitheatre cliffs'
        : `Freezing at ${Math.round(sample.temp)}°C on the Drakensberg`,
      intensity,
    };
  }

  // cape-point-mist
  if (sample.code === 45 || sample.code === 48) {
    return {
      kind,
      label: 'Cape Point mist',
      detail: 'Fog bank rolling in off the Atlantic at Cape Point',
      intensity: 1,
    };
  }
  if (sample.humidity >= 88 && sample.windSpeed <= 18) {
    return {
      kind,
      label: 'Cape Point mist',
      detail: `Moist south-westerly air, ${Math.round(sample.humidity)}% humidity`,
      intensity: Math.min(0.8, (sample.humidity - 88) / 12 + 0.25),
    };
  }
  return null;
}
