import { LANDMARKS } from '../data/landmarks';
import type { MediaItem } from '../types/citylit';

const MEDIA_CACHE = new Map<number, MediaItem[]>();

function stripHtml(html: string | undefined): string {
  return (html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

interface CommonsImageInfo {
  url?: string;
  thumburl?: string;
  mime?: string;
  width?: number;
  height?: number;
  thumbwidth?: number;
  thumbheight?: number;
  descriptionurl?: string;
  extmetadata?: {
    ImageDescription?: { value?: string };
    Artist?: { value?: string };
    LicenseShortName?: { value?: string };
  };
}

interface CommonsPage {
  title: string;
  index?: number;
  imageinfo?: CommonsImageInfo[];
}

export async function loadLandmarkMedia(index: number): Promise<MediaItem[]> {
  const cachedMem = MEDIA_CACHE.get(index);
  if (cachedMem) return cachedMem;

  const landmark = LANDMARKS[index];
  const k = landmark.k;

  try {
    const raw = localStorage.getItem('cl-m3-' + k);
    if (raw) {
      const parsed = JSON.parse(raw) as { t: number; v: MediaItem[] };
      if (Date.now() - parsed.t < 6048e5 && parsed.v.length) {
        const normalized = parsed.v.map((item) => ({ ...item, t: item.t || item.cap || k }));
        MEDIA_CACHE.set(index, normalized);
        return normalized;
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }

  const CM =
    'https://commons.wikimedia.org/w/api.php?format=json&origin=*&action=query&prop=imageinfo&iiprop=url|mime|size|extmetadata&iiurlwidth=1280&iiextmetadatafilter=Artist|LicenseShortName|ImageDescription';
  const BAD = /\.svg|flag|map|locator|icon|logo|coat_of|signature|\.pdf|\.tif|\.gif|diagram/i;

  const pickMediaTitles = async (title: string): Promise<string[]> => {
    const m = await fetchJson<{ items: Array<{ type: string; title?: string }> }>(
      'https://en.wikipedia.org/api/rest_v1/page/media-list/' +
        encodeURIComponent(title.replace(/ /g, '_'))
    );
    return m.items
      .filter((x) => (x.type === 'image' || x.type === 'video') && x.title && !BAD.test(x.title))
      .map((x) => x.title!.replace(/_/g, ' '));
  };

  let titles: string[] = [];
  try {
    titles = await pickMediaTitles(landmark.wikiTitle || k);
  } catch {
    try {
      const q = await fetchJson<[string, string[]]>(
        'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&limit=1&search=' +
          encodeURIComponent(k + ' South Africa')
      );
      if (q[1]?.[0]) {
        titles = await pickMediaTitles(q[1][0]);
      }
    } catch {
      // Ignore search fallback failures
    }
  }

  const out: MediaItem[] = [];
  const seen = new Set<string>();

  const addPage = (pg: CommonsPage) => {
    const ii = pg.imageinfo?.[0];
    if (!ii || seen.has(pg.title)) return;
    const mime = ii.mime ?? '';
    const isVideo = /^video|ogg/.test(mime);
    if (!isVideo && !/^image\/(jpeg|png|webp)/.test(mime)) return;
    if (!isVideo && ii.width && ii.width < 700) return;
    seen.add(pg.title);
    const meta = ii.extmetadata ?? {};
    const cap = stripHtml(meta.ImageDescription?.value).slice(0, 140) || k;
    out.push({
      v: isVideo,
      src: ii.thumburl ?? ii.url ?? '',
      full: ii.url ?? '',
      w: ii.thumbwidth ?? ii.width,
      h: ii.thumbheight ?? ii.height,
      cap,
      t: cap,
      cr: stripHtml(meta.Artist?.value).slice(0, 60),
      lic: stripHtml(meta.LicenseShortName?.value),
      page: ii.descriptionurl,
    });
  };

  try {
    if (titles.length) {
      const d = await fetchJson<{ query?: { pages?: Record<string, CommonsPage> } }>(
        CM + '&titles=' + encodeURIComponent(titles.slice(0, 20).join('|'))
      );
      const pages = Object.values(d.query?.pages ?? {});
      const byTitle = new Map<string, CommonsPage>(pages.map((p) => [p.title, p]));
      titles.forEach((t) => {
        const p = byTitle.get(t);
        if (p) addPage(p);
      });
    }
  } catch {
    // Ignore Wikimedia Commons titles lookup failure
  }

  if (out.length < 8) {
    try {
      const d = await fetchJson<{ query?: { pages?: Record<string, CommonsPage> } }>(
        CM +
          '&generator=search&gsrnamespace=6&gsrlimit=30&gsrsearch=' +
          encodeURIComponent(k + ' South Africa')
      );
      Object.values(d.query?.pages ?? {})
        .sort((x, y) => (x.index ?? 0) - (y.index ?? 0))
        .forEach(addPage);
    } catch {
      // Ignore Wikimedia search failure
    }
  }

  const sliced = out.slice(0, 10);
  if (!sliced.length) throw new Error('No media found');
  try {
    localStorage.setItem('cl-m3-' + k, JSON.stringify({ t: Date.now(), v: sliced }));
  } catch {
    // Ignore storage quota errors
  }
  MEDIA_CACHE.set(index, sliced);
  return sliced;
}

export interface WikiSummary {
  extract: string;
  pageUrl: string;
}

const SUMMARY_CACHE = new Map<number, WikiSummary>();

export async function loadWikipediaSummary(index: number): Promise<WikiSummary | null> {
  const mem = SUMMARY_CACHE.get(index);
  if (mem) return mem;

  const landmark = LANDMARKS[index];
  const title = landmark.wikiTitle || landmark.k;
  const cacheKey = `cl-ws-${landmark.k}`;

  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw) as { t: number; v: WikiSummary };
      if (Date.now() - parsed.t < 6048e5 && parsed.v?.extract) {
        SUMMARY_CACHE.set(index, parsed.v);
        return parsed.v;
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }

  try {
    const res = await fetch(
      'https://en.wikipedia.org/api/rest_v1/page/summary/' +
        encodeURIComponent(title.replace(/ /g, '_')),
      { signal: AbortSignal.timeout(3500) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
    };
    if (!data.extract) return null;
    const summary: WikiSummary = {
      extract: data.extract,
      pageUrl:
        data.content_urls?.desktop?.page ??
        `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    };
    SUMMARY_CACHE.set(index, summary);
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), v: summary }));
    } catch {
      // Ignore storage quota errors
    }
    return summary;
  } catch {
    return null;
  }
}
