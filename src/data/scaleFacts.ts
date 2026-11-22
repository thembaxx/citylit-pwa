/**
 * Which dimension a real-world landmark number describes. A bridge can be
 * compared by its arch span or its deck height; a dam by wall height or crest
 * length; a crater or quarry by depth. Keeping the measure explicit prevents a
 * diameter from being presented as a height.
 */
export type ScaleMeasure = 'height' | 'span' | 'length' | 'depth'

/** One seeded, real-world dimension for a landmark diorama. */
export interface ScaleFact {
  /** The real-world magnitude in metres, or null when the sources give none. */
  magnitudeM: number | null
  /** What the magnitude actually measures. */
  measure: ScaleMeasure
  /** Short human label, e.g. 'summit height' or 'north pylon'. */
  label: string
  /**
   * A dot's y coordinate that clearly sits at the top of the modelled group.
   * Omitted when the engine should measure the group itself.
   */
  modelUnits?: number
}

/**
 * Real-world scale facts keyed by landmark key. Numbers are taken only from
 * the `scale` strings in `landmarkDetails.ts` and the facts in `landmarks.ts`.
 */
export const SCALE_FACTS: Readonly<Record<string, ScaleFact>> = {
  'Table Mountain': {
    magnitudeM: 1086,
    measure: 'height',
    label: 'summit height',
    modelUnits: 3,
  },
  'Union Buildings': {
    magnitudeM: 285,
    measure: 'length',
    label: 'total frontage',
  },
  'Moses Mabhida Stadium': {
    magnitudeM: 106,
    measure: 'height',
    label: 'arch height',
    modelUnits: 7.3,
  },
  'Nelson Mandela Bridge': {
    magnitudeM: 42,
    measure: 'height',
    label: 'north pylon',
    modelUnits: 8.3,
  },
  'The Big Hole': {
    magnitudeM: 215,
    measure: 'depth',
    label: 'visible excavation depth',
  },
  'Voortrekker Monument': {
    magnitudeM: 40,
    measure: 'height',
    label: 'granite monolith height',
  },
  'Cape Point Lighthouse': {
    magnitudeM: 238,
    measure: 'height',
    label: 'upper headland above the sea',
  },
  'Bo-Kaap': {
    magnitudeM: null,
    measure: 'height',
    label: 'hillside quarter (no fixed height)',
  },
  'FNB Stadium (Soccer City)': {
    magnitudeM: null,
    measure: 'height',
    label: 'bowl height (not given; 94,736 seats)',
  },
  'Three Rondavels': {
    magnitudeM: 800,
    measure: 'depth',
    label: 'canyon depth',
  },
  Baobab: {
    magnitudeM: 25,
    measure: 'height',
    label: 'tree height',
  },
  'Hole in the Wall': {
    magnitudeM: 15,
    measure: 'height',
    label: 'arch height',
  },
  'Castle of Good Hope': {
    magnitudeM: 160,
    measure: 'length',
    label: 'width across the bastions',
  },
  'Drakensberg Amphitheatre': {
    magnitudeM: 1200,
    measure: 'height',
    label: 'sheer escarpment face',
  },
  'Palace of the Lost City': {
    magnitudeM: 63,
    measure: 'height',
    label: 'King’s Tower height',
  },
  'Golden Gate Highlands': {
    magnitudeM: 200,
    measure: 'height',
    label: 'buttress rise above the valley',
  },
  'Kruger National Park': {
    magnitudeM: null,
    measure: 'length',
    label: 'park extent (no fixed height)',
  },
  'Ponte City': {
    magnitudeM: 173,
    measure: 'height',
    label: 'tower height',
  },
  'Boulders Beach': {
    magnitudeM: 8,
    measure: 'height',
    label: 'granite dome height',
  },
  'Cape Agulhas Lighthouse': {
    magnitudeM: 27,
    measure: 'height',
    label: 'tower height',
  },
  'Orlando Towers': {
    magnitudeM: 100,
    measure: 'height',
    label: 'cooling shell height',
  },
  'Bourke’s Luck Potholes': {
    magnitudeM: 6,
    measure: 'depth',
    label: 'pothole depth',
  },
  'Augrabies Falls': {
    magnitudeM: 56,
    measure: 'height',
    label: 'main drop height',
  },
  'SALT Telescope': {
    magnitudeM: 11.1,
    measure: 'length',
    label: 'primary mirror long axis',
  },
  'Bloukrans Bridge': {
    magnitudeM: 272,
    measure: 'span',
    label: 'main arch span',
  },
  'Pilanesberg Crater': {
    magnitudeM: 24000,
    measure: 'span',
    label: 'circular crater diameter',
  },
  'Robben Island': {
    magnitudeM: null,
    measure: 'length',
    label: 'island extent (no fixed height)',
  },
  'Chapman’s Peak Drive': {
    magnitudeM: 9000,
    measure: 'length',
    label: 'route length',
  },
  Isandlwana: {
    magnitudeM: 180,
    measure: 'height',
    label: 'hill rise above the plain',
  },
  'Gariep Dam': {
    magnitudeM: 88,
    measure: 'height',
    label: 'dam wall height',
  },
  'Cradle of Humankind': {
    magnitudeM: null,
    measure: 'height',
    label: 'fossil landscape (no linear height given)',
  },
  'Mapungubwe Hill': {
    magnitudeM: 30,
    measure: 'height',
    label: 'mesa rise above the plain',
  },
  'Kgalagadi Red Dunes': {
    magnitudeM: null,
    measure: 'height',
    label: 'transfrontier park area (no dune height given)',
  },
  'Storms River Mouth': {
    magnitudeM: 77,
    measure: 'span',
    label: 'suspension bridge span',
  },
  'Groot Constantia': {
    magnitudeM: null,
    measure: 'height',
    label: 'manor height (not given)',
  },
  'Hermanus Whale Watching': {
    magnitudeM: null,
    measure: 'height',
    label: 'cliff-top boardwalk (no fixed height)',
  },
  'iSimangaliso Wetland Park': {
    magnitudeM: null,
    measure: 'length',
    label: 'wetland extent (no fixed height)',
  },
  'Sani Pass': {
    magnitudeM: 2876,
    measure: 'height',
    label: 'summit elevation',
  },
  Richtersveld: {
    magnitudeM: null,
    measure: 'height',
    label: 'cultural reserve area (no ridge height given)',
  },
  'Vredefort Dome': {
    magnitudeM: 300000,
    measure: 'span',
    label: 'original crater diameter',
  },
  'Hartbeespoort Dam': {
    magnitudeM: 59,
    measure: 'height',
    label: 'dam wall height',
  },
  'Knysna Heads': {
    magnitudeM: 100,
    measure: 'height',
    label: 'headland cliff height',
  },
  'Donkin Reserve': {
    magnitudeM: 10,
    measure: 'height',
    label: 'limestone pyramid height',
  },
}

/** Reference heights used to turn a magnitude into a familiar comparison. */
export const REFERENCE_HEIGHTS: Readonly<Record<'person' | 'springbok' | 'eiffel', number>> = {
  person: 1.7,
  springbok: 0.9,
  eiffel: 330,
}

/** Read one reference height in metres. */
export function referenceHeightM(kind: 'person' | 'springbok' | 'eiffel'): number {
  return REFERENCE_HEIGHTS[kind]
}

/** Format a magnitude in metres with a deterministic en-ZA thousands separator. */
export function formatMetres(m: number | null): string {
  if (m == null || !Number.isFinite(m)) return '—'
  const rounded = Math.round(m * 10) / 10
  const [whole, fraction] = String(rounded).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${grouped}${fraction ? `.${fraction}` : ''} m`
}

/** Divide a magnitude by a reference, returning 0 for unusable values. */
export function scaleRatio(magnitudeM: number, referenceM: number): number {
  if (!Number.isFinite(magnitudeM) || !Number.isFinite(referenceM)) return 0
  if (magnitudeM <= 0 || referenceM <= 0) return 0
  return magnitudeM / referenceM
}
