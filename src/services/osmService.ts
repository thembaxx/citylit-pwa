/**
 * On-demand map data for the coordinate explorer.
 *
 * WorldCraft-style "generate where you stand": instead of shipping a baked
 * planet (or a fixed list of hand-authored landmarks), fetch a small patch of
 * real OpenStreetMap geometry plus elevation for the coordinates the user
 * asked for. Everything is converted into a local, metre-based X/Z plane so
 * the Three.js diorama builders can consume it directly.
 *
 * Network access is optional — every failure degrades to a tagged fallback
 * patch so the explorer still works offline (the PWA caches the app shell).
 */

export interface LatLon {
  lat: number;
  lon: number;
}

/** A point in the local tangent plane: X is east, Z is south, units are metres. */
export interface LocalPoint {
  x: number;
  z: number;
}

export interface OsmBuilding {
  id: number;
  outline: LocalPoint[];
  height: number;
  /** OSM building tag, e.g. "house", "church", "commercial". */
  kind: string;
}

export interface OsmRoad {
  id: number;
  path: LocalPoint[];
  kind: string;
  width: number;
}

export interface OsmArea {
  id: number;
  outline: LocalPoint[];
  kind: string;
}

export interface OsmPlaceData {
  center: LatLon;
  radiusM: number;
  /** Metres above sea level at the centre point. */
  elevationM: number;
  /** Local elevation samples (row-major 5x5 grid) in metres relative to centre. */
  relief: number[][];
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  buildings: OsmBuilding[];
  roads: OsmRoad[];
  water: OsmArea[];
  green: OsmArea[];
  /** Where the geometry came from — used for the provenance line in the UI. */
  source: 'osm' | 'fallback';
  fetchedAt: number;
}

const MEMORY_CACHE = new Map<string, OsmPlaceData>();
const GEO_CACHE = new Map<string, LatLon>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // OSM data is stable for weeks; be conservative.
const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const OVERPASS_MIRROR = 'https://overpass.kumi.systems/api/interpreter';
const ELEVATION_ENDPOINT = 'https://api.open-meteo.com/v1/elevation';
const GEOCODE_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

const DEG_LAT_M = 110_540;
const DEG_LON_M = 111_320;

/** Accept "−33.9249, 18.4241", "33.9249 S, 18.4241 E", or "-33.9249 18.4241". */
export function parseCoordinateInput(input: string): LatLon | null {
  const raw = input.trim();
  if (!raw) return null;

  const split = raw.split(/[,;\s]+/).filter(Boolean);
  if (split.length < 2) return null;

  const parsePart = (value: string): number | null => {
    const match = value
      .trim()
      .match(/^(-?\d+(?:\.\d+)?)\s*([NSEWnsew])?$/);
    if (!match) return null;
    const magnitude = Number(match[1]);
    const hemisphere = match[2]?.toUpperCase();
    if (hemisphere === 'S' || hemisphere === 'W') return -magnitude;
    return magnitude;
  };

  const lat = parsePart(split[0]);
  const lon = parsePart(split[1]);
  if (lat === null || lon === null) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

export function formatCoordinates({ lat, lon }: LatLon): string {
  const ns = lat < 0 ? 'S' : 'N';
  const ew = lon < 0 ? 'W' : 'E';
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lon).toFixed(4)}° ${ew}`;
}

/** Nominatim lookups for named places. Results are cached and rate-limited by usage, not by a timer. */
export async function geocodePlace(query: string, signal?: AbortSignal): Promise<LatLon | null> {
  const key = query.trim().toLowerCase();
  if (!key) return null;
  const cached = GEO_CACHE.get(key);
  if (cached) return cached;

  const url = new URL(GEOCODE_ENDPOINT);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', key);
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'za');
  url.searchParams.set('addressdetails', '0');

  const res = await fetchJson<Array<{ lat: string; lon: string }>>(
    url.toString(),
    withTimeout(signal, 7000)
  );
  const hit = res[0];
  if (!hit) return null;
  const found = { lat: Number(hit.lat), lon: Number(hit.lon) };
  if (!Number.isFinite(found.lat) || !Number.isFinite(found.lon)) return null;
  GEO_CACHE.set(key, found);
  return found;
}

/** Equirectangular projection around the centre — accurate enough for a 300–600 m diorama. */
export function toLocal(point: LatLon, center: LatLon): LocalPoint {
  const cosLat = Math.cos((center.lat * Math.PI) / 180);
  return {
    x: (point.lon - center.lon) * DEG_LON_M * cosLat,
    z: (point.lat - center.lat) * DEG_LAT_M,
  };
}

/** Bound every external request so an overloaded public API can't hang the UI. */
function withTimeout(signal?: AbortSignal, ms = 9000): AbortSignal {
  if (typeof AbortSignal.timeout !== 'function') return signal ?? new AbortController().signal;
  const timeout = AbortSignal.timeout(ms);
  if (signal && typeof AbortSignal.any === 'function') return AbortSignal.any([signal, timeout]);
  return timeout;
}

async function fetchJson<T>(url: string, signal?: AbortSignal, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

interface OverpassNode {
  lat: number;
  lon: number;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  geometry?: OverpassNode[];
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

function overpassQuery(center: LatLon, radiusM: number): string {
  const around = `around:${radiusM},${center.lat.toFixed(6)},${center.lon.toFixed(6)}`;
  return `[out:json][timeout:25];(
  way["building"](${around});
  relation["building"](${around});
  way["highway"](${around});
  way["natural"="water"](${around});
  way["waterway"](${around});
  way["landuse"~"^(grass|forest|meadow|park|residential)$"](${around});
  way["leisure"="park"](${around});
);out geom;`;
}

function parseElevation(area: OsmArea, center: LatLon): LatLon | null {
  if (!area.outline.length) return null;
  const centroid = area.outline.reduce(
    (acc, p) => ({ x: acc.x + p.x / area.outline.length, z: acc.z + p.z / area.outline.length }),
    { x: 0, z: 0 }
  );
  const cosLat = Math.cos((center.lat * Math.PI) / 180);
  return {
    lat: center.lat + centroid.z / DEG_LAT_M,
    lon: center.lon + centroid.x / (DEG_LON_M * cosLat),
  };
}

/** Open-Meteo elevation API — no key, shared with the existing weather service. */
async function loadElevation(points: LatLon[], signal?: AbortSignal): Promise<number[]> {
  if (!points.length) return [];
  const url = new URL(ELEVATION_ENDPOINT);
  url.searchParams.set('latitude', points.map((p) => p.lat.toFixed(5)).join(','));
  url.searchParams.set('longitude', points.map((p) => p.lon.toFixed(5)).join(','));
  const data = await fetchJson<{ elevation?: number[] }>(url.toString(), signal);
  const values = data.elevation ?? [];
  return points.map((_, i) => (Number.isFinite(values[i]) ? values[i] : 0));
}

function fallbackPatch(center: LatLon, radiusM: number): OsmPlaceData {
  const cosLat = Math.cos((center.lat * Math.PI) / 180);
  return {
    center,
    radiusM,
    elevationM: 0,
    relief: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0)),
    bounds: {
      minLat: center.lat - radiusM / DEG_LAT_M,
      maxLat: center.lat + radiusM / DEG_LAT_M,
      minLon: center.lon - radiusM / (DEG_LON_M * cosLat),
      maxLon: center.lon + radiusM / (DEG_LON_M * cosLat),
    },
    buildings: [],
    roads: [],
    water: [],
    green: [],
    source: 'fallback',
    fetchedAt: Date.now(),
  };
}

function cacheKey(center: LatLon, radiusM: number): string {
  return `${center.lat.toFixed(5)},${center.lon.toFixed(5)},${radiusM}`;
}

/**
 * Fetch a real patch of OSM geometry around a coordinate. All network errors
 * are swallowed and returned as a tagged fallback so callers can keep working.
 */
export async function loadOsmPlace(
  center: LatLon,
  radiusM = 400,
  signal?: AbortSignal
): Promise<OsmPlaceData> {
  const key = cacheKey(center, radiusM);
  const cached = MEMORY_CACHE.get(key);
  if (cached) return cached;

  try {
    const stored = localStorage.getItem('cl-osm-' + key);
    if (stored) {
      const parsed = JSON.parse(stored) as { t: number; v: OsmPlaceData };
      if (Date.now() - parsed.t < CACHE_TTL && parsed.v) {
        MEMORY_CACHE.set(key, parsed.v);
        return parsed.v;
      }
    }
  } catch {
    // localStorage may be unavailable (private mode); ignore and refetch.
  }

  let data: OsmPlaceData;
  try {
    const query = overpassQuery(center, radiusM);
    // POST keeps long queries out of URLs and avoids cached-proxy issues.
    // Public Overpass instances are frequently overloaded; fail over to a mirror.
    const requestSignal = withTimeout(signal);
    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data: query }).toString(),
    };
    let response: OverpassResponse | null = null;
    for (const endpoint of [OVERPASS_ENDPOINT, OVERPASS_MIRROR]) {
      try {
        response = await fetchJson<OverpassResponse>(endpoint, requestSignal, init);
        break;
      } catch {
        // Try the next instance before falling back to procedural geometry.
      }
    }
    if (!response) throw new Error('Overpass unavailable');

    const buildings: OsmBuilding[] = [];
    const roads: OsmRoad[] = [];
    const water: OsmArea[] = [];
    const green: OsmArea[] = [];

    for (const element of response.elements ?? []) {
      const geometry = element.geometry;
      if (!geometry?.length) continue;
      const path = geometry.map((node) => toLocal({ lat: node.lat, lon: node.lon }, center));
      const tags = element.tags ?? {};

      if (tags.building) {
        const heightTag = Number.parseFloat(tags['building:levels'] ?? '');
        const height = Number.isFinite(heightTag)
          ? Math.min(heightTag * 3, 60)
          : tags.building === 'house'
            ? 7
            : 11;
        buildings.push({ id: element.id, outline: path, height, kind: tags.building });
      } else if (tags.highway) {
        const width = tags.highway === 'primary' ? 11 : tags.highway === 'secondary' ? 8 : 5;
        roads.push({ id: element.id, path, kind: tags.highway, width });
      } else if (tags.natural === 'water' || tags.waterway || tags.water) {
        water.push({ id: element.id, outline: path, kind: tags.waterway ?? tags.water ?? 'water' });
      } else if (tags.landuse || tags.leisure === 'park') {
        green.push({ id: element.id, outline: path, kind: tags.landuse ?? tags.leisure ?? 'green' });
      }
    }

    const cosLat = Math.cos((center.lat * Math.PI) / 180);
    // Sample elevation at the centre, at the four water/green centroids and at
    // the four corners of a 5x5 relief grid (25 points, one API call).
    const samplePoints: LatLon[] = [center];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const x = ((col - 2) / 2) * radiusM;
        const z = ((row - 2) / 2) * radiusM;
        samplePoints.push({
          lat: center.lat + z / DEG_LAT_M,
          lon: center.lon + x / (DEG_LON_M * cosLat),
        });
      }
    }
    const greenSamples = green.slice(0, 4).map((area) => parseElevation(area, center));
    const allSamples = [...samplePoints, ...greenSamples.filter((p): p is LatLon => p !== null)];
    let elevations: number[] = [];
    try {
      elevations = await loadElevation(allSamples, requestSignal);
    } catch {
      // Geometry is still useful without terrain height — keep the flat patch.
    }

    data = {
      center,
      radiusM,
      elevationM: elevations[0] ?? 0,
      relief: Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 5 }, (_unused, col) => (elevations[1 + row * 5 + col] ?? 0) - (elevations[0] ?? 0))
      ),
      bounds: {
        minLat: center.lat - radiusM / DEG_LAT_M,
        maxLat: center.lat + radiusM / DEG_LAT_M,
        minLon: center.lon - radiusM / (DEG_LON_M * cosLat),
        maxLon: center.lon + radiusM / (DEG_LON_M * cosLat),
      },
      buildings,
      roads,
      water,
      green,
      source: 'osm',
      fetchedAt: Date.now(),
    };
  } catch {
    // A transient outage must not poison the cache for days — return an
    // uncached fallback so the next attempt can still fetch real geometry.
    return fallbackPatch(center, radiusM);
  }

  MEMORY_CACHE.set(key, data);
  try {
    localStorage.setItem('cl-osm-' + key, JSON.stringify({ t: Date.now(), v: data }));
  } catch {
    // Storage quota — the in-memory cache still covers this session.
  }
  return data;
}

/** Human-readable provenance for the explorer UI (also a nod to OSM attribution). */
export function describeSource(data: OsmPlaceData): string {
  if (data.source === 'fallback') return 'Offline · procedural fallback';
  const count = data.buildings.length + data.roads.length + data.water.length + data.green.length;
  return `${count} features · © OpenStreetMap contributors`;
}
