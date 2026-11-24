import { LANDMARK_DETAILS } from '../data/landmarkDetails';
import { LANDMARKS } from '../data/landmarks';
import { condenseHistoryText } from '../lib/historyText';
import { loadWikipediaSummary } from './mediaService';

/**
 * A short, history-focused blurb for the InfoDrawer's History tab. The
 * Wikipedia extract is condensed to its most significant sentences; the
 * curated per-landmark history is the offline fallback.
 */
export interface HistorySummary {
  text: string;
  source: 'wikipedia' | 'static';
  pageUrl?: string;
}

export async function loadHistorySummary(index: number): Promise<HistorySummary> {
  const landmark = LANDMARKS[index];
  const curated = LANDMARK_DETAILS[landmark?.k]?.history ?? '';

  try {
    // Shares the in-memory + localStorage cache with the rest of the drawer,
    // so switching to History never makes a second network request.
    const wiki = await loadWikipediaSummary(index);
    if (wiki?.extract) {
      const condensed = condenseHistoryText(wiki.extract);
      if (condensed) {
        return { text: condensed, source: 'wikipedia', pageUrl: wiki.pageUrl };
      }
    }
  } catch {
    // Fall through to the curated static context.
  }

  return { text: curated, source: 'static' };
}
