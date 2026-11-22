import type { LandmarkMeta, LandmarkTag } from '../types/citylit.ts';

// "night at Kruger" should pick Kruger and roll the clock to night.
const TIME_PHRASES: readonly { re: RegExp; hour: number; label: string }[] = [
  { re: /\b(?:night|midnight|after dark)\b/i, hour: 22, label: 'Night' },
  { re: /\b(?:sunrise|dawn|daybreak)\b/i, hour: 6, label: 'Sunrise' },
  { re: /\b(?:sunset|dusk|golden hour)\b/i, hour: 18.2, label: 'Sunset' },
  { re: /\b(?:noon|midday|mid-day)\b/i, hour: 12, label: 'Noon' },
  { re: /\bmorning\b/i, hour: 9, label: 'Morning' },
  { re: /\bafternoon\b/i, hour: 15, label: 'Afternoon' },
];

const SEARCH_FILLER = /\b(?:at|in|on|the|a|an|of|to|near|around|by|for|visit|see|view|show|me)\b/gi;

export interface ParsedSearch {
  place: string;
  tokens: string[];
  hour?: number;
  label?: string;
}

export function parseSearch(raw: string): ParsedSearch {
  let text = ` ${raw} `;
  let hour: number | undefined;
  let label: string | undefined;
  for (const phrase of TIME_PHRASES) {
    if (hour === undefined && phrase.re.test(text)) {
      hour = phrase.hour;
      label = phrase.label;
      text = text.replace(phrase.re, ' ');
    }
  }
  const words = text.replace(SEARCH_FILLER, ' ').replace(/\s+/g, ' ').trim();
  const tokens = words
    .split(' ')
    .filter(Boolean)
    .map((word) => word.toLowerCase());
  return { place: words, tokens, hour, label };
}

export interface LandmarkFilterOptions {
  province: string;
  tag: LandmarkTag | 'All';
  favorites: ReadonlySet<number>;
  tokens: readonly string[];
}

export interface IndexedLandmark {
  lm: LandmarkMeta;
  i: number;
}

function matchesBaseCriteria(
  lm: LandmarkMeta,
  index: number,
  province: string,
  favorites: ReadonlySet<number>,
  tokens: readonly string[]
): boolean {
  if (province === 'Saved' && !favorites.has(index)) return false;
  if (province !== 'All' && province !== 'Saved' && !lm.c.endsWith(province)) return false;
  if (tokens.length) {
    const hay = `${lm.k} ${lm.c} ${lm.tags.join(' ')}`.toLowerCase();
    if (!tokens.every((token) => hay.includes(token))) return false;
  }
  return true;
}

export function filterLandmarks(
  landmarks: readonly LandmarkMeta[],
  options: LandmarkFilterOptions
): IndexedLandmark[] {
  const { province, tag, favorites, tokens } = options;
  const results: IndexedLandmark[] = [];
  for (let i = 0; i < landmarks.length; i += 1) {
    const lm = landmarks[i];
    if (!matchesBaseCriteria(lm, i, province, favorites, tokens)) continue;
    if (tag !== 'All' && !lm.tags.includes(tag)) continue;
    results.push({ lm, i });
  }
  return results;
}

export function countLandmarksByTag(
  landmarks: readonly LandmarkMeta[],
  tags: readonly LandmarkTag[],
  options: Omit<LandmarkFilterOptions, 'tag'>
): Record<LandmarkTag, number> {
  const counts = Object.fromEntries(tags.map((t) => [t, 0])) as Record<LandmarkTag, number>;
  const { province, favorites, tokens } = options;
  for (let i = 0; i < landmarks.length; i += 1) {
    const lm = landmarks[i];
    if (!matchesBaseCriteria(lm, i, province, favorites, tokens)) continue;
    for (const tag of lm.tags) {
      if (tag in counts) {
        counts[tag] += 1;
      }
    }
  }
  return counts;
}
