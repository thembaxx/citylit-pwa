import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  MoonStars,
  Sun,
  Wind,
} from '@phosphor-icons/react';
import type { WeatherConditionKey } from '../types/citylit';

/**
 * The display conditions WeatherIcon can render. Extends the core
 * `WeatherConditionKey` with a `snow` state — the 3D places scene can be forced
 * into snowfall even though snow is not a base climatology condition.
 */
export type WeatherIconCondition = WeatherConditionKey | 'snow';

interface WeatherIconProps {
  condition: WeatherIconCondition;
  night?: boolean;
  size?: number;
  className?: string;
  /**
   * Small in-card variant: lighter stroke weight plus a very subtle, slow
   * idle motion (drift / fall / pulse) that scales with the condition so a
   * diorama info card quietly mirrors its current sky state.
   */
  animated?: boolean;
}

const ANIMATED_BY_CONDITION: Record<WeatherIconCondition, string> = {
  sun: 'wfx-sun',
  partly: 'wfx-sun',
  cloud: 'wfx-drift',
  rain: 'wfx-rain',
  storm: 'wfx-rain',
  fog: 'wfx-fog',
  wind: 'wfx-wind',
  snow: 'wfx-snow',
};

export function WeatherIcon({
  condition,
  night = false,
  size = 24,
  className = '',
  animated = false,
}: WeatherIconProps) {
  const animClass = animated ? ` wfx-idle ${ANIMATED_BY_CONDITION[condition]}` : '';
  const props = {
    size,
    weight: (animated ? 'light' : 'duotone') as 'light' | 'duotone',
    className,
  };
  switch (condition) {
    case 'sun':
      return night ? (
        <MoonStars {...props} className={`text-sky-200 ${className}${animClass}`} />
      ) : (
        <Sun {...props} className={`text-amber-300 ${className}${animClass}`} />
      );
    case 'partly':
      return night ? (
        <CloudMoon {...props} className={`text-slate-200 ${className}${animClass}`} />
      ) : (
        <CloudSun {...props} className={`text-amber-200 ${className}${animClass}`} />
      );
    case 'cloud':
      return <Cloud {...props} className={`text-slate-300 ${className}${animClass}`} />;
    case 'rain':
      return <CloudRain {...props} className={`text-sky-300 ${className}${animClass}`} />;
    case 'storm':
      return <CloudLightning {...props} className={`text-indigo-300 ${className}${animClass}`} />;
    case 'fog':
      return <CloudFog {...props} className={`text-zinc-300 ${className}${animClass}`} />;
    case 'wind':
      return <Wind {...props} className={`text-cyan-200 ${className}${animClass}`} />;
    case 'snow':
      return <CloudSnow {...props} className={`text-sky-200 ${className}${animClass}`} />;
  }
}
