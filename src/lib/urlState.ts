import type { LatLon } from '../services/osmService';

export interface GlobeUrlState {
  open: boolean;
  province: string;
}

/** `?globe=1&province=Western%20Cape` deep-links into the globe. */
export function readInitialGlobeState(validProvinces: readonly string[]): GlobeUrlState {
  if (typeof window === 'undefined') return { open: false, province: 'All' };
  const params = new URLSearchParams(window.location.search);
  if (params.get('globe') !== '1') return { open: false, province: 'All' };
  const requested = params.get('province') ?? 'All';
  return { open: true, province: validProvinces.includes(requested) ? requested : 'All' };
}

/** Keeps unrelated query params (e.g. lat/lon) and the hash intact. */
export function setUrlForGlobe(open: boolean, province: string): void {
  const params = new URLSearchParams(window.location.search);
  if (open) params.set('globe', '1');
  else params.delete('globe');
  if (open && province !== 'All') params.set('province', province);
  else params.delete('province');
  const query = params.toString();
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  );
}

/** `?lat=-33.9&lon=18.4` opens the on-demand coordinate explorer. */
export function readInitialCoordinate(): LatLon | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const latRaw = params.get('lat');
  const lonRaw = params.get('lon');
  if (!latRaw || !lonRaw) return null;
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

export function setUrlForCoordinates({ lat, lon }: LatLon): void {
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}`
  );
}

export function setUrlForLandmark(slug: string): void {
  window.history.replaceState(null, '', `${window.location.pathname}#${slug}`);
}
