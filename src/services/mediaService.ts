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

// Commons descriptions are user-written and the API does not translate them:
// an uploader who wrote in Swedish gets Swedish back. Wikipedia's own media-list
// captions are English, so only fall back to a description that is tagged English
// or reads as English. Rejecting on positive evidence of another language keeps
// bare proper nouns ("Table Mountain, Cape Town") — false rejections are worse.
const ENGLISH_TAG = /^(?:English|Eng)\s*:\s*/i;
const FOREIGN_TAG =
  /^(?:Afrikaans|Deutsch|German|Svenska|Swedish|Fran[cç]ais|French|Espa[nñ]ol|Spanish|Nederlands|Dutch|Portugu[eê]s|Portuguese|Italiano|Italian|Русский|Russian|Polski|Polish|日本語|Japanese|中文|Chinese)\s*:\s*/i;

// Function words that are frequent in other languages and effectively never
// appear in English prose. Deliberately leaves out words like "in" or "die" that
// double as English or common South African proper nouns (Diepsloot).
const FOREIGN_WORDS =
  /\b(?:och|från|vid|på|med|som|eller|mit|und|von|vor|über|aus|bei|eine|einer|eines|für|zur|zum|der|das|dem|des|ist|sind|nicht|avec|dans|pour|sous|depuis|hacia|para|della|delle|degli|nella|sulla|sul|gli|het|een|bij|niet|vista|veduta|panoramica|les|del|los|las|una|con|por|sur|du|et|le|la|el|en)\b/;

// Words that are a clear tell of a non-English caption wherever they appear.
const FOREIGN_TELLS =
  /\b(?:vue|foto|fotografie|aufnahme|blick|aussicht|uitzicht|gezicht|görünüm|kasteel|hoofdingang|binnenzijde|sujet|quelle|leuchtturm|kapstaden|sydafrika|südafrika|faro)\b/i;

const ENGLISH_WORDS =
  /\b(of|the|and|with|from|in|on|at|by|for|near|above|below|over|under|between|behind|across|along|during|this|that|is|an|to|after|before|seen|view|views|taken|looking|entrance|inside|outside)\b/i;

const ACCENTED = /[À-ÖØ-öø-ÿ]/;
// Cyrillic, Hebrew, Arabic, Devanagari, kana, Han, Hangul.
const NON_LATIN =
  /[\p{Script=Cyrillic}\p{Script=Hebrew}\p{Script=Arabic}\p{Script=Devanagari}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{Script=Hangul}]/u;

function cleanCaption(value: string | undefined): string {
  const text = stripHtml(value);
  if (!text) return '';
  if (ENGLISH_TAG.test(text)) return text.replace(ENGLISH_TAG, '').trim();
  if (FOREIGN_TAG.test(text) || NON_LATIN.test(text) || FOREIGN_TELLS.test(text)) return '';
  const words = text.split(/[^A-Za-z\u00c0-\u024f']+/).filter(Boolean);
  const foreign = text.match(new RegExp(FOREIGN_WORDS.source, 'gi'))?.length ?? 0;
  // One foreign-looking word in a long sentence is usually a surname or a place
  // name ("Simon van der Stel"); a caption where they are a large fraction of the
  // words is written in that language.
  if (foreign >= 2 && foreign / words.length >= 0.12) return '';
  // Accented prose with no English function word and no long compound word
  // (Afrikaans and German run place names together) is not English.
  if (ACCENTED.test(text) && !ENGLISH_WORDS.test(text) && !words.some((w) => w.length > 12))
    return '';
  return text;
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
    const raw = localStorage.getItem('cl-m4-' + k);
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
    'https://commons.wikimedia.org/w/api.php?format=json&origin=*&action=query&prop=imageinfo&iiprop=url|mime|size|extmetadata&iiurlwidth=1280&iiextmetadatafilter=Artist|LicenseShortName|ImageDescription&iiextmetadatalanguage=en';
  const BAD = /\.svg|flag|map|locator|icon|logo|coat_of|signature|\.pdf|\.tif|\.gif|diagram/i;

  const pickMediaTitles = async (title: string): Promise<{ title: string; cap: string }[]> => {
    const m = await fetchJson<{
      items: Array<{ type: string; title?: string; caption?: string | { text?: string } }>;
    }>(
      'https://en.wikipedia.org/api/rest_v1/page/media-list/' +
        encodeURIComponent(title.replace(/ /g, '_'))
    );
    return m.items
      .filter((x) => (x.type === 'image' || x.type === 'video') && x.title && !BAD.test(x.title))
      .map((x) => ({
        title: x.title!.replace(/_/g, ' '),
        cap: (typeof x.caption === 'string' ? x.caption : x.caption?.text) ?? '',
      }));
  };

  let media: { title: string; cap: string }[] = [];
  try {
    media = await pickMediaTitles(landmark.wikiTitle || k);
  } catch {
    try {
      const q = await fetchJson<[string, string[]]>(
        'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&limit=1&search=' +
          encodeURIComponent(k + ' South Africa')
      );
      if (q[1]?.[0]) {
        media = await pickMediaTitles(q[1][0]);
      }
    } catch {
      // Ignore search fallback failures
    }
  }

  const titles = media.map((m) => m.title);
  const articleCaptions = new Map(media.map((m) => [m.title, m.cap]));

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
    // Prefer the English Wikipedia caption, then the English Commons description.
    // Commons falls back to the uploader's original language when no translation exists.
    const cap =
      (articleCaptions.get(pg.title) ?? '').trim().slice(0, 140) ||
      cleanCaption(meta.ImageDescription?.value).slice(0, 140) ||
      k;
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
    localStorage.setItem('cl-m4-' + k, JSON.stringify({ t: Date.now(), v: sliced }));
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
