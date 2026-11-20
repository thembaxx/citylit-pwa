import { GEO_AFRICA, GEO_ENCLAVES, GEO_NEIGHBORS, GEO_PROVINCES } from './globeGeo';

/** Simplified Natural Earth country outlines (public domain), one ring per country. */
export const AFRICA_POLYS: readonly (readonly number[])[] = GEO_AFRICA;

export const NEIGHBOR_POLYS: readonly (readonly number[])[] = GEO_NEIGHBORS;

export const ENCLAVE_POLYS: readonly (readonly number[])[] = GEO_ENCLAVES;

export interface ProvinceGlobeEntry {
  name: string;
  poly: readonly number[];
  lon: number;
  lat: number;
  color: string;
}

/** Label anchors and palette stay hand-tuned; the outlines come from Natural Earth. */
const PROVINCE_STYLE: readonly (readonly [string, number, number, string])[] = [
  ['Western Cape', 20.7, -32.9, '#c9833a'],
  ['Northern Cape', 21.6, -29.4, '#b8732f'],
  ['North West', 25.2, -26.4, '#a8683c'],
  ['Free State', 26.3, -28.8, '#c4703a'],
  ['Gauteng', 27.9, -26.6, '#d8b25a'],
  ['Limpopo', 29, -23.8, '#bf7d3d'],
  ['Mpumalanga', 30.6, -25.3, '#cf8f4a'],
  ['KwaZulu-Natal', 30.9, -29.2, '#e0a94e'],
  ['Eastern Cape', 26.3, -32.4, '#d19a45'],
];

export const GLOBE_PROVINCES: readonly ProvinceGlobeEntry[] = PROVINCE_STYLE.map(
  ([name, lon, lat, color]) => ({
    name,
    poly: GEO_PROVINCES[name],
    lon,
    lat,
    color,
  })
);

export const GLOBE_NEIGHBOR_LABELS: readonly (readonly [string, number, number])[] = [
  ['Namibia', 17, -21.5],
  ['Botswana', 23.2, -21.5],
  ['Zimbabwe', 29.8, -19.2],
  ['Mozambique', 34.1, -17.2],
  ['Angola', 17.5, -13],
  ['Zambia', 26.5, -14],
  ['Eswatini', 31.6, -26.6],
  ['Lesotho', 28.1, -29.9],
  ['Atlantic Ocean', 15.2, -36.4],
  ['Indian Ocean', 34.6, -36.4],
];
