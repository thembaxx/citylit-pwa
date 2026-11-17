import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  MoonStars,
  Sun,
  Wind,
} from '@phosphor-icons/react';
import type { WeatherConditionKey } from '../types/citylit';

interface WeatherIconProps {
  condition: WeatherConditionKey;
  night?: boolean;
  size?: number;
  className?: string;
}

export function WeatherIcon({
  condition,
  night = false,
  size = 24,
  className = '',
}: WeatherIconProps) {
  const props = { size, weight: 'duotone' as const, className };
  switch (condition) {
    case 'sun':
      return night ? (
        <MoonStars {...props} className={`text-sky-200 ${className}`} />
      ) : (
        <Sun {...props} className={`text-amber-300 ${className}`} />
      );
    case 'partly':
      return night ? (
        <CloudMoon {...props} className={`text-slate-200 ${className}`} />
      ) : (
        <CloudSun {...props} className={`text-amber-200 ${className}`} />
      );
    case 'cloud':
      return <Cloud {...props} className={`text-slate-300 ${className}`} />;
    case 'rain':
      return <CloudRain {...props} className={`text-sky-300 ${className}`} />;
    case 'storm':
      return <CloudLightning {...props} className={`text-indigo-300 ${className}`} />;
    case 'fog':
      return <CloudFog {...props} className={`text-zinc-300 ${className}`} />;
    case 'wind':
      return <Wind {...props} className={`text-cyan-200 ${className}`} />;
  }
}
