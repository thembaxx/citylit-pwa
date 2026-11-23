import type { AnimalIdle, AnimalKind, AnimalSeason } from '../three/builders/animalKit'
import type { LandmarkBiome } from '../types/citylit'

/** A diorama-local animal sighting tied to one landmark site. */
export interface WildlifeSpot {
  /** Stable, unique identifier. */
  id: string
  /** Landmark key from `LANDMARKS`. */
  siteKey: string
  species: AnimalKind
  label: string
  fact: string
  /** Position relative to the hero group origin. */
  position: readonly [x: number, y: number, z: number]
  /** Herd size, 2-8. */
  count?: number
  /** Uniform animal scale, 0.3-1.2. */
  scale?: number
  idle?: AnimalIdle
  /** Allowed 1-12 months; combined with `seasons` as an AND gate. */
  months?: readonly number[]
  /** Southern-hemisphere season allow-list. */
  seasons?: readonly AnimalSeason[]
  /** Must match the landmark's own biome. */
  biome: LandmarkBiome
  /** Hide colour, only for `species: 'generic'`. */
  color?: string
}

/** Curated wildlife sightings, one per occupied diorama site. */
export const WILDLIFE: readonly WildlifeSpot[] = [
  {
    id: 'boulders-penguins',
    siteKey: 'Boulders Beach',
    species: 'penguin',
    label: 'African penguins',
    fact: 'A pair of breeding penguins settled here in 1982 and grew into a colony among the rounded granite boulders.',
    position: [-2.85, 0.2, -1.85],
    count: 6,
    scale: 1.5,
    idle: 'waddle',
    biome: 'coastal',
  },
  {
    id: 'boulders-penguins-b',
    siteKey: 'Boulders Beach',
    species: 'penguin',
    label: 'African penguins at Boulders',
    fact: 'The granite boulders shelter a breeding colony whose black-and-white bands and pink eye glands identify each bird.',
    position: [2.8, 0.2, -1.65],
    count: 5,
    scale: 1.5,
    idle: 'waddle',
    biome: 'coastal',
  },
  {
    id: 'boulders-penguins-c',
    siteKey: 'Boulders Beach',
    species: 'penguin',
    label: 'African penguins on the shore',
    fact: 'Penguins shuffle between the tide line and their granite nests, braying to partners across the colony.',
    position: [-1.15, 0.2, 2.55],
    count: 5,
    scale: 1.5,
    idle: 'waddle',
    biome: 'coastal',
  },
  {
    id: 'hermanus-whales',
    siteKey: 'Hermanus Whale Watching',
    species: 'whale',
    label: 'Southern right whales',
    fact: 'Southern right whales calve in Walker Bay from June to November and can be watched from the cliff path.',
    // Replaces the old cove whale at its tuned position, now season-gated + LOD'd.
    position: [-4.35, 0, 4.55],
    count: 2,
    scale: 0.62,
    idle: 'submerge',
    months: [6, 7, 8, 9, 10],
    biome: 'coastal',
  },
  {
    id: 'isimangaliso-flamingos',
    siteKey: 'iSimangaliso Wetland Park',
    species: 'flamingo',
    label: 'Greater flamingos',
    fact: 'Flamingos filter the shallow pans of Africa’s largest estuarine system behind St Lucia’s forested dunes.',
    position: [1.8, 0, 1.4],
    count: 5,
    scale: 0.8,
    idle: 'rock',
    months: [5, 6, 7, 8, 9],
    biome: 'wetland',
  },
  {
    id: 'harties-flamingos',
    siteKey: 'Hartbeespoort Dam',
    species: 'flamingo',
    label: 'Flamingos on the dam',
    fact: 'The shallow arm of this 1923 Magaliesberg dam attracts flamingos between May and September.',
    position: [-1.4, 0, 1.2],
    count: 4,
    scale: 0.75,
    idle: 'rock',
    months: [5, 6, 7, 8, 9],
    biome: 'waterfall',
  },
  {
    id: 'kgalagadi-gemsbok',
    siteKey: 'Kgalagadi Red Dunes',
    species: 'gemsbok',
    label: 'Gemsbok on the dunes',
    fact: 'Gemsbok go long periods without drinking because the red Kalahari dunes and dry riverbeds yield moisture from plants.',
    position: [2.5, 0, -2.6],
    count: 3,
    scale: 0.9,
    idle: 'graze',
    biome: 'desert',
  },
  {
    id: 'kruger-elephants',
    siteKey: 'Kruger National Park',
    species: 'elephant',
    label: 'Elephants at the waterhole',
    fact: 'Elephants gather at Kruger’s waterholes in the dry winter months, the best season for spotting the Big Five.',
    position: [3.4, 0, 2.8],
    count: 4,
    scale: 1,
    idle: 'graze',
    biome: 'savannah',
  },
  {
    id: 'pilanesberg-gemsbok',
    siteKey: 'Pilanesberg Crater',
    species: 'gemsbok',
    label: 'Gemsbok in the crater',
    fact: 'Big Five game were reintroduced to the crater’s concentric syenite hills during Operation Genesis in 1979.',
    position: [4.2, 0, 1.2],
    count: 4,
    scale: 0.85,
    idle: 'graze',
    biome: 'savannah',
  },
  {
    id: 'cape-point-seabirds',
    siteKey: 'Cape Point Lighthouse',
    species: 'seabird',
    label: 'Seabirds above the point',
    fact: 'The reserve’s windy fynbos headland shelters seabirds alongside baboons and ostriches above False Bay.',
    position: [-3.4, 1.6, -2.2],
    count: 4,
    scale: 0.6,
    idle: 'bob',
    seasons: ['spring'],
    biome: 'coastal',
  },
  {
    id: 'storms-forest-birds',
    siteKey: 'Storms River Mouth',
    species: 'bird',
    label: 'Forest birds of the gorge',
    fact: 'Evergreen Tsitsikamma forest funnels the tea-coloured river into the ocean along the start of the Otter Trail.',
    position: [4.2, 1.6, 0.4],
    count: 2,
    scale: 0.5,
    idle: 'bob',
    seasons: ['summer'],
    biome: 'coastal',
  },
  {
    id: 'augrabies-dassies',
    siteKey: 'Augrabies Falls',
    species: 'dassie',
    label: 'Rock dassies in the gorge',
    fact: 'Rock dassies shelter in the pink granite walls of the 18 km gorge while winter flows run low.',
    position: [2.8, 0, -3.2],
    count: 5,
    scale: 0.55,
    idle: 'graze',
    seasons: ['winter'],
    biome: 'waterfall',
  },
  {
    id: 'golden-gate-vultures',
    siteKey: 'Golden Gate Highlands',
    species: 'vulture',
    label: 'Bearded vultures',
    fact: 'Bearded vultures nest in the Clarens sandstone caves beneath buttresses that glow gold at sunset.',
    position: [-3.4, 1.8, -2.6],
    count: 2,
    scale: 0.9,
    idle: 'bob',
    biome: 'mountain',
  },
  {
    id: 'isimangaliso-hippos',
    siteKey: 'iSimangaliso Wetland Park',
    species: 'hippo',
    label: 'Hippos in Lake St Lucia',
    fact: 'The St Lucia estuary holds roughly 800 hippos, sharing the brackish water with crocodiles.',
    // Absorbs the five former builder hippos at the centre of their old pod.
    position: [0, 0, 1.6],
    count: 5,
    scale: 0.8,
    idle: 'submerge',
    biome: 'wetland',
  },
  {
    id: 'rondavels-eagles',
    siteKey: 'Three Rondavels',
    species: 'vulture',
    label: 'Verreaux’s eagles',
    fact: 'Verreaux’s eagles ride the thermals above the three quartzite summits of the Blyde River Canyon.',
    position: [3.8, 2.2, 0.6],
    count: 2,
    scale: 0.7,
    idle: 'bob',
    biome: 'mountain',
  },
  {
    id: 'bourke-swallows',
    siteKey: 'Bourke’s Luck Potholes',
    species: 'bird',
    label: 'Cliff swallows',
    fact: 'Swallows dart beneath the footbridges where the Treur and Blyde rivers grind potholes into quartzite.',
    position: [-1.4, 1.4, -0.6],
    count: 5,
    scale: 0.45,
    idle: 'bob',
    seasons: ['spring'],
    biome: 'waterfall',
  },
]
