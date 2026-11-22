import type { SkyEvent, SkyEventKind } from '../types/citylit';

/**
 * A deliberately small, curated calendar of *real* sky events. Annual meteor
 * showers use recurring month/day windows; eclipses and comets are dated. The
 * scene reads this through `getSkyEvent(month, day, year)` so the right event
 * appears on the right date instead of firing at random.
 */

type MonthDay = readonly [month: number, day: number];

interface SkyCalendarEntry {
  id: string;
  kind: SkyEventKind;
  title: string;
  detail: string;
  /** null = every year (meteor showers); otherwise the year of the event. */
  year: number | null;
  start: MonthDay;
  peak: MonthDay;
  end: MonthDay;
  /** Approximate zenithal hourly rate, only used in the shower description. */
  rate?: number;
}

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const SKY_CALENDAR: readonly SkyCalendarEntry[] = [
  // --- Annual meteor showers ------------------------------------------------
  {
    id: 'quadrantids',
    kind: 'meteor-shower',
    title: 'Quadrantids',
    detail: 'A sharp, six-hour peak of bright blue meteors from asteroid 2003 EH1.',
    year: null,
    start: [12, 28],
    peak: [1, 3],
    end: [1, 12],
    rate: 120,
  },
  {
    id: 'lyrids',
    kind: 'meteor-shower',
    title: 'Lyrids',
    detail: 'Dust shed by comet C/1861 G1 Thatcher, with occasional bright flares.',
    year: null,
    start: [4, 16],
    peak: [4, 22],
    end: [4, 26],
    rate: 18,
  },
  {
    id: 'eta-aquariids',
    kind: 'meteor-shower',
    title: 'Eta Aquariids',
    detail: 'Fast Halley’s Comet dust — best in the hours before dawn.',
    year: null,
    start: [4, 19],
    peak: [5, 6],
    end: [5, 28],
    rate: 50,
  },
  {
    id: 'perseids',
    kind: 'meteor-shower',
    title: 'Perseids',
    detail: 'The reliable August shower, dust from comet 109P/Swift–Tuttle.',
    year: null,
    start: [7, 17],
    peak: [8, 12],
    end: [8, 24],
    rate: 100,
  },
  {
    id: 'draconids',
    kind: 'meteor-shower',
    title: 'Draconids',
    detail: 'Slow, drifting meteors from comet 21P/Giacobini–Zinner.',
    year: null,
    start: [10, 6],
    peak: [10, 8],
    end: [10, 10],
    rate: 10,
  },
  {
    id: 'orionids',
    kind: 'meteor-shower',
    title: 'Orionids',
    detail: 'Another stream from Halley’s Comet, peaking late at night.',
    year: null,
    start: [10, 2],
    peak: [10, 21],
    end: [11, 7],
    rate: 20,
  },
  {
    id: 'leonids',
    kind: 'meteor-shower',
    title: 'Leonids',
    detail: 'Fast, brilliant meteors from comet 55P/Tempel–Tuttle.',
    year: null,
    start: [11, 6],
    peak: [11, 17],
    end: [11, 30],
    rate: 15,
  },
  {
    id: 'geminids',
    kind: 'meteor-shower',
    title: 'Geminids',
    detail: 'The year’s richest shower, debris from asteroid 3200 Phaethon.',
    year: null,
    start: [12, 4],
    peak: [12, 14],
    end: [12, 20],
    rate: 150,
  },
  {
    id: 'ursids',
    kind: 'meteor-shower',
    title: 'Ursids',
    detail: 'A quiet finale to the year from comet 8P/Tuttle.',
    year: null,
    start: [12, 17],
    peak: [12, 22],
    end: [12, 26],
    rate: 10,
  },

  // --- Dated eclipses (NASA eclipse calendar) -------------------------------
  {
    id: 'annular-solar-2026-02-17',
    kind: 'solar-eclipse',
    title: 'Annular solar eclipse',
    detail: 'A “ring of fire” crosses southern Africa and Antarctica; partial from South Africa.',
    year: 2026,
    start: [2, 17],
    peak: [2, 17],
    end: [2, 17],
  },
  {
    id: 'total-lunar-2026-03-03',
    kind: 'lunar-eclipse',
    title: 'Total lunar eclipse',
    detail: 'Earth’s shadow turns the Moon a deep copper red — a blood moon.',
    year: 2026,
    start: [3, 3],
    peak: [3, 3],
    end: [3, 3],
  },
  {
    id: 'total-solar-2026-08-12',
    kind: 'solar-eclipse',
    title: 'Total solar eclipse',
    detail: 'Totality sweeps across Greenland, Iceland and Spain; a partial eclipse elsewhere.',
    year: 2026,
    start: [8, 12],
    peak: [8, 12],
    end: [8, 12],
  },
  {
    id: 'partial-lunar-2026-08-28',
    kind: 'lunar-eclipse',
    title: 'Partial lunar eclipse',
    detail: 'The northern edge of the Moon slips into Earth’s umbra.',
    year: 2026,
    start: [8, 28],
    peak: [8, 28],
    end: [8, 28],
  },
  {
    id: 'annular-solar-2027-02-06',
    kind: 'solar-eclipse',
    title: 'Annular solar eclipse',
    detail: 'The antumbral path crosses South America and West Africa.',
    year: 2027,
    start: [2, 6],
    peak: [2, 6],
    end: [2, 6],
  },
  {
    id: 'lunar-2027-02-20',
    kind: 'lunar-eclipse',
    title: 'Lunar eclipse',
    detail: 'The Moon passes through Earth’s shadow and dims for a few hours.',
    year: 2027,
    start: [2, 20],
    peak: [2, 20],
    end: [2, 20],
  },
  {
    id: 'total-solar-2027-08-02',
    kind: 'solar-eclipse',
    title: 'Total solar eclipse',
    detail: 'Totality crosses North Africa and the Middle East — visible near southern Africa.',
    year: 2027,
    start: [8, 2],
    peak: [8, 2],
    end: [8, 2],
  },
  {
    id: 'total-solar-2028-07-22',
    kind: 'solar-eclipse',
    title: 'Total solar eclipse',
    detail: 'A long totality track crosses Australia and New Zealand.',
    year: 2028,
    start: [7, 22],
    peak: [7, 22],
    end: [7, 22],
  },

  // --- Comet apparitions ----------------------------------------------------
  {
    id: 'c2023-a3',
    kind: 'comet',
    title: 'C/2023 A3 Tsuchinshan–ATLAS',
    detail: 'The Great Comet of 2024, with a long dust tail across the southern sky.',
    year: 2024,
    start: [9, 27],
    peak: [10, 12],
    end: [11, 10],
  },
  {
    id: 'c2024-g3',
    kind: 'comet',
    title: 'C/2024 G3 ATLAS',
    detail: 'A bright sungrazer, best seen from the Southern Hemisphere after sunset.',
    year: 2025,
    start: [1, 1],
    peak: [1, 20],
    end: [2, 10],
  },
  {
    id: 'c2024-j3',
    kind: 'comet',
    title: 'C/2024 J3 ATLAS',
    detail: 'A telescopic comet brightening through the southern summer.',
    year: 2026,
    start: [12, 15],
    peak: [1, 6],
    end: [2, 20],
  },
  {
    id: '2p-encke',
    kind: 'comet',
    title: '2P/Encke',
    detail: 'The short-period comet returning on its 3.3-year orbit.',
    year: 2027,
    start: [1, 10],
    peak: [2, 6],
    end: [3, 10],
  },
];

/** Day-of-year (Jan 1 = 0) in a fixed non-leap year, so windows stay stable. */
const EPOCH_2025 = Date.UTC(2025, 0, 1) / 86_400_000;

function dayIndex(monthDay: MonthDay): number {
  return Math.floor(Date.UTC(2025, monthDay[0] - 1, monthDay[1]) / 86_400_000) - EPOCH_2025;
}

function daysInMonth(month: number, year: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatWhen(monthDay: MonthDay, year: number | null): string {
  const label = `${monthDay[1]} ${MONTH_LABELS[monthDay[0] - 1]}`;
  return year === null ? label : `${label} ${year}`;
}

function toSkyEvent(entry: SkyCalendarEntry, intensity: number, displayYear = entry.year): SkyEvent {
  return {
    id: entry.id,
    kind: entry.kind,
    title: entry.title,
    detail: entry.detail,
    when: formatWhen(entry.peak, displayYear),
    cadence: entry.year === null ? 'Annual' : String(displayYear),
    intensity,
  };
}

/** Rarer events win when, e.g., an eclipse and a shower peak on the same date. */
const EVENT_PRIORITY: Record<SkyEventKind, number> = {
  'solar-eclipse': 3,
  'lunar-eclipse': 2,
  comet: 1.5,
  'meteor-shower': 0,
};

/** Resolve the wrapped [start, peak, end] window of an entry as day indices. */
function resolveWindow(entry: SkyCalendarEntry): { start: number; peak: number; end: number } {
  let start = dayIndex(entry.start);
  let peak = dayIndex(entry.peak);
  let end = dayIndex(entry.end);
  if (peak < start) peak += 365;
  if (end < start) end += 365;
  return { start, peak, end };
}

function entryIntensity(entry: SkyCalendarEntry, month: number, day: number, year: number): number {
  const { start, peak, end } = resolveWindow(entry);
  const entryYear = entry.year;
  const wrapsNextYear = end >= 365;
  if (entryYear !== null && year !== entryYear && !(wrapsNextYear && year === entryYear + 1)) {
    return 0;
  }

  let at = dayIndex([month, day]);
  if (entryYear !== null) {
    // A December-starting comet only reaches its wrapped dates in the next year.
    if (wrapsNextYear && year === entryYear + 1) at += 365;
  } else if (at < start) {
    at += 365; // annual showers can wrap 31 Dec → 1 Jan
  }

  if (start === end) return at === peak ? 1 : 0;
  if (at < start || at > end) return 0;
  const span = at <= peak ? peak - start : end - peak;
  if (span <= 0) return at === peak ? 1 : 0;
  const progress = at <= peak ? (at - start) / span : (end - at) / span;
  // Ease in and out so a shower fades up to its peak rather than snapping on.
  return Math.max(0, Math.min(1, Math.sin(Math.max(0, progress) * Math.PI * 0.5)));
}

/**
 * The strongest event active on a date, or null on a quiet night. Month/day
 * are 1-based; out-of-range days are clamped to the month, and years without
 * a dated eclipse/comet simply fall back to annual showers.
 */
export function getSkyEvent(month: number, day: number, year: number): SkyEvent | null {
  if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) return null;
  const m = Math.max(1, Math.min(12, Math.trunc(month)));
  const d = Math.max(1, Math.min(daysInMonth(m, year), Math.trunc(day)));
  const y = Math.trunc(year);

  let best: SkyEvent | null = null;
  let bestScore = -1;
  for (const entry of SKY_CALENDAR) {
    const intensity = entryIntensity(entry, m, d, y);
    if (intensity <= 0) continue;
    const score = intensity + EVENT_PRIORITY[entry.kind];
    if (score > bestScore) {
      bestScore = score;
      best = toSkyEvent(entry, intensity, entry.year !== null && y > entry.year ? y : entry.year);
    }
  }
  return best;
}

/** Up to `count` future events with their peak dates, for the calendar UI. */
export function getUpcomingSkyEvents(
  month: number,
  day: number,
  year: number,
  count = 3
): SkyEvent[] {
  const m = Math.max(1, Math.min(12, Math.trunc(month)));
  const d = Math.max(1, Math.min(daysInMonth(m, year), Math.trunc(day)));
  const from = Date.UTC(year, m - 1, d);

  type Candidate = { time: number; event: SkyEvent };
  const candidates: Candidate[] = [];
  for (const entry of SKY_CALENDAR) {
    // Annual showers recur every year; check this year and the next two.
    const years = entry.year === null ? [year, year + 1, year + 2] : [entry.year];
    for (const y of years) {
      const peakMonth = entry.peak[0];
      // A comet window that starts in December peaks the following January.
      const peakYear =
        entry.year === null
          ? y
          : entry.peak[0] < entry.start[0]
            ? entry.year + 1
            : entry.year;
      const peakDay = Math.min(entry.peak[1], daysInMonth(peakMonth, peakYear));
      const time = Date.UTC(peakYear, peakMonth - 1, peakDay);
      if (time < from || time > from + 1_100 * 86_400_000) continue;
      candidates.push({
        time,
        event: toSkyEvent(entry, 1, peakYear),
      });
    }
  }
  candidates.sort((a, b) => a.time - b.time || a.event.id.localeCompare(b.event.id));
  return candidates.slice(0, count).map((candidate) => candidate.event);
}

/** Exposed for tests and for the calendar UI's "what's on" count. */
export const SKY_CALENDAR_SIZE = SKY_CALENDAR.length;
