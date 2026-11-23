import { LANDMARK_DETAILS } from '../data/landmarkDetails.ts';
import { LANDMARKS } from '../data/landmarks.ts';
import type { LandmarkTag } from '../types/citylit';

/**
 * The editorial grammar shared by the landmark diorama and the Places / OSM
 * stages. Each place ships with a title, a narrative, up to three
 * category-tagged highlights (each with a camera focus point) and source
 * links. Keeping it in one resolver means a change to the grammar applies to
 * every stage instead of being hand-maintained per model.
 */
export type PlaceHighlightCategory = 'landmark' | 'history' | 'scale';

export interface PlaceHighlight {
  id: string;
  /** Short category label shown on the marker chip. */
  label: string;
  /** The field note itself. */
  text: string;
  category: PlaceHighlightCategory;
  /** Illustrative position on the place slice — never a surveyed coordinate. */
  focus: readonly [number, number, number];
}

export interface PlaceSource {
  label: string;
  url: string;
}

export interface PlaceEditorial {
  title: string;
  category: string;
  narrative: string;
  tags: readonly LandmarkTag[];
  highlights: readonly PlaceHighlight[];
  sources: readonly PlaceSource[];
  /** Marker positions are editorial, not survey-accurate. */
  positionsAreIllustrative: true;
}

export interface ExplorerEditorialInput {
  label: string;
  detail: string;
  stats: { buildings: number; roads: number; water: number; green: number; elevation: number };
  coords: { lat: number; lon: number };
}

/**
 * Marker positions in slice space. Exported so the Places scene can place its
 * tap proxies from exactly the same table the card uses for its chips.
 */
export const HIGHLIGHT_FOCUS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.62, 0.98, 0.42],
  [0.18, 1.18, -0.46],
  [0.7, 0.86, 0.28],
];

const CATEGORY_LABEL: Record<PlaceHighlightCategory, string> = {
  landmark: 'Field note',
  history: 'Context',
  scale: 'Scale',
};

export const HIGHLIGHT_COLORS: Record<PlaceHighlightCategory, string> = {
  landmark: '#e8b04a',
  history: '#5cd6a9',
  scale: '#a9b9ff',
};

function firstSentence(text: string): string {
  const end = text.search(/[.!?](?:\s|$)/);
  return end < 0 ? text : text.slice(0, end + 1);
}

function wikipediaUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

function toHighlights(
  draft: ReadonlyArray<{
    id: string;
    text: string;
    category: PlaceHighlightCategory;
    label?: string;
  }>
): readonly PlaceHighlight[] {
  return draft.slice(0, HIGHLIGHT_FOCUS.length).map((item, index) => ({
    id: item.id,
    label: item.label ?? CATEGORY_LABEL[item.category],
    text: item.text,
    category: item.category,
    focus: HIGHLIGHT_FOCUS[index],
  }));
}

/** Resolve the editorial payload for a curated landmark index. */
export function resolvePlaceEditorial(landmarkIndex: number): PlaceEditorial | null {
  const lm = LANDMARKS[landmarkIndex];
  if (!lm) return null;
  const detail = LANDMARK_DETAILS[lm.k];

  const draft: Array<{
    id: string;
    text: string;
    category: PlaceHighlightCategory;
  }> = lm.dots.map((dot, index) => ({
    id: `dot-${index}`,
    text: dot[3],
    category: 'landmark',
  }));
  if (detail && draft.length < HIGHLIGHT_FOCUS.length) {
    draft.push({ id: 'context', text: firstSentence(detail.history), category: 'history' });
  }
  if (detail && draft.length < HIGHLIGHT_FOCUS.length) {
    draft.push({ id: 'scale', text: detail.scale, category: 'scale' });
  }

  return {
    title: lm.k,
    category: lm.c,
    narrative: detail?.history ?? lm.f,
    tags: lm.tags,
    highlights: toHighlights(draft),
    sources: [
      { label: 'Wikipedia', url: wikipediaUrl(lm.wikiTitle || lm.k) },
      {
        label: 'OpenStreetMap',
        url: `https://www.openstreetmap.org/?mlat=${lm.coords[0]}&mlon=${lm.coords[1]}#map=13/${lm.coords[0]}/${lm.coords[1]}`,
      },
    ],
    positionsAreIllustrative: true,
  };
}

/** Resolve the same grammar for an on-demand OSM coordinate slice. */
export function resolveExplorerEditorial(input: ExplorerEditorialInput): PlaceEditorial {
  const { label, detail, stats, coords } = input;
  return {
    title: label,
    category: 'Coordinate explorer',
    narrative: detail,
    tags: [],
    highlights: toHighlights([
      {
        id: 'footprint',
        label: 'Footprint',
        category: 'landmark',
        text: `${stats.buildings.toLocaleString()} buildings mapped from real OpenStreetMap footprints.`,
      },
      {
        id: 'streets',
        label: 'Streets',
        category: 'history',
        text: `${stats.roads} mapped roads and paths form the street network of this slice.`,
      },
      {
        id: 'relief',
        label: 'Relief',
        category: 'scale',
        text: `${Math.round(stats.elevation)} m elevation, with open-meteo relief over the surrounding area.`,
      },
    ]),
    sources: [
      {
        label: 'OpenStreetMap',
        url: `https://www.openstreetmap.org/#map=17/${coords.lat}/${coords.lon}`,
      },
    ],
    positionsAreIllustrative: true,
  };
}
