import type { HeritageRoute } from '../types/citylit';
import { LANDMARKS } from './landmarks';

export const HERITAGE_ROUTES: readonly HeritageRoute[] = [
  {
    id: 'cape-peninsula',
    name: 'Cape Peninsula & Coast',
    subtitle: 'Tabletop sandstone, historic quarters, penguin coves & oceanic capes',
    color: '#38c793',
    stopIndices: [0, 7, 12, 26, 27, 18, 6, 34, 35, 19],
  },
  {
    id: 'highveld-heritage',
    name: 'Highveld Heritage & Skyline',
    subtitle: 'Monumental baker sandstone, ancient fossils, bridges & urban icons',
    color: '#e8b04a',
    stopIndices: [1, 5, 40, 30, 3, 17, 8, 20],
  },
  {
    id: 'peaks-canyons',
    name: 'Drakensberg, Canyons & Bush',
    subtitle: 'High escarpment passes, canyon falls & lowveld wildlife',
    color: '#5ec8ff',
    stopIndices: [15, 13, 37, 28, 9, 21, 16, 36],
  },
  {
    id: 'arid-skies',
    name: 'Karoo Craters & Dark Skies',
    subtitle: 'Diamond craters, Orange River gorges, red dunes & Southern observatories',
    color: '#ff7a8a',
    stopIndices: [4, 29, 23, 22, 32, 38],
  },
];

export function haversineKm(a: readonly [number, number], b: readonly [number, number]): number {
  const rad = Math.PI / 180;
  const lat1 = a[0] * rad;
  const lat2 = b[0] * rad;
  const dLat = lat2 - lat1;
  const dLon = (b[1] - a[1]) * rad;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function routeDistanceKm(stopIndices: readonly number[]): number {
  let total = 0;
  for (let i = 1; i < stopIndices.length; i++) {
    const prev = LANDMARKS[stopIndices[i - 1]];
    const cur = LANDMARKS[stopIndices[i]];
    if (prev && cur) {
      total += haversineKm(prev.coords, cur.coords);
    }
  }
  return Math.round(total);
}
