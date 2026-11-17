import {
  ArrowSquareOut,
  Buildings,
  ClockCounterClockwise,
  Compass,
  Images,
  Info,
  MapPin,
  X,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { LANDMARK_DETAILS } from '../data/landmarkDetails';
import { LANDMARKS } from '../data/landmarks';
import { loadWikipediaSummary, type WikiSummary } from '../services/mediaService';

interface InfoDrawerProps {
  open: boolean;
  index: number;
  thumbnail?: string;
  bestMonths: string;
  onClose: () => void;
  onOpenGallery: () => void;
}

export function InfoDrawer({
  open,
  index,
  thumbnail,
  bestMonths,
  onClose,
  onOpenGallery,
}: InfoDrawerProps) {
  if (!open) return null;
  return (
    <InfoDrawerPanel
      key={index}
      index={index}
      thumbnail={thumbnail}
      bestMonths={bestMonths}
      onClose={onClose}
      onOpenGallery={onOpenGallery}
    />
  );
}

function formatCoords([lat, lon]: readonly [number, number]): string {
  const latStr = `${Math.abs(lat).toFixed(2)}°${lat < 0 ? 'S' : 'N'}`;
  const lonStr = `${Math.abs(lon).toFixed(2)}°${lon < 0 ? 'W' : 'E'}`;
  return `${latStr}, ${lonStr}`;
}

function InfoDrawerPanel({
  index,
  thumbnail,
  bestMonths,
  onClose,
  onOpenGallery,
}: Omit<InfoDrawerProps, 'open'>) {
  const [wikiSummary, setWikiSummary] = useState<WikiSummary | null>(null);
  const [wikiLoading, setWikiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadWikipediaSummary(index)
      .then((res) => {
        if (cancelled) return;
        setWikiSummary(res);
        setWikiLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setWikiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [index]);

  const lm = LANDMARKS[index];
  const detail = LANDMARK_DETAILS[lm.k];

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/55 transition-opacity"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${lm.k} historical and architectural info`}
        className="fixed inset-y-0 right-0 z-[45] w-full sm:max-w-[460px] bg-[#121319] border-l border-white/15 flex flex-col shadow-2xl pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="px-5 pt-4 pb-3.5 border-b border-white/12 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <small className="block text-[#e8b04a] tracking-[0.14em] uppercase text-[11px]">
              {lm.c} · Info
            </small>
            <h2 className="font-serif-display italic font-normal text-[28px] leading-[1.1] text-[#f3efe6] mt-0.5 mb-0">
              {lm.k}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#a9a69e]">
              <span className="inline-flex items-center gap-1 tabular-nums">
                <MapPin size={13} className="text-[#e8b04a]" />
                {formatCoords(lm.coords)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Compass size={13} className="text-[#e8b04a]" />
                Best {bestMonths}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close info drawer"
            className="w-9 h-9 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer shrink-0"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5 overscroll-contain">
          {thumbnail && (
            <div className="space-y-2.5">
              <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#181a24] border border-white/10">
                <img
                  src={thumbnail}
                  alt={`${lm.k} 3D elevation preview`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onOpenGallery}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-[12px] text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Images size={14} />
                  <span>Open Photos</span>
                </button>
                {wikiSummary?.pageUrl && (
                  <a
                    href={wikiSummary.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12px] text-[#e8b04a] hover:underline whitespace-nowrap"
                  >
                    <span>Wikipedia</span>
                    <ArrowSquareOut size={13} />
                  </a>
                )}
              </div>
            </div>
          )}

          {!thumbnail && (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onOpenGallery}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-[12px] text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Images size={14} />
                <span>Open Photos</span>
              </button>
              {wikiSummary?.pageUrl && (
                <a
                  href={wikiSummary.pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] text-[#e8b04a] hover:underline whitespace-nowrap"
                >
                  <span>Wikipedia</span>
                  <ArrowSquareOut size={13} />
                </a>
              )}
            </div>
          )}

          <p className="text-[14px] leading-relaxed text-[#f3efe6]/90 m-0">{lm.f}</p>

          {detail && (
            <>
              <section className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase text-[#e8b04a]">
                  <Buildings size={14} />
                  <span>Architecture & Form</span>
                </div>

                <dl className="m-0 border-y border-white/10 divide-y divide-white/10 text-[13px]">
                  <div className="py-2 flex justify-between gap-4">
                    <dt className="text-[#a9a69e] shrink-0">Style / Form</dt>
                    <dd className="m-0 text-right text-[#f3efe6]">{detail.styleOrType}</dd>
                  </div>
                  <div className="py-2 flex justify-between gap-4">
                    <dt className="text-[#a9a69e] shrink-0">Origin / Architect</dt>
                    <dd className="m-0 text-right text-[#f3efe6]">{detail.architectOrOrigin}</dd>
                  </div>
                  <div className="py-2 flex justify-between gap-4">
                    <dt className="text-[#a9a69e] shrink-0">Scale</dt>
                    <dd className="m-0 text-right text-[#f3efe6] tabular-nums">{detail.scale}</dd>
                  </div>
                </dl>

                <p className="text-[13.5px] leading-relaxed text-[#a9a69e] m-0">
                  {detail.architecture}
                </p>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase text-[#e8b04a]">
                  <ClockCounterClockwise size={14} />
                  <span>Historical Context</span>
                </div>
                <div className="text-[12.5px] text-[#f3efe6]/80 font-medium">{detail.era}</div>
                <p className="text-[13.5px] leading-relaxed text-[#a9a69e] m-0">{detail.history}</p>
              </section>
            </>
          )}

          {(wikiLoading || wikiSummary) && (
            <section className="space-y-2 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] tracking-[0.14em] uppercase text-[#a9a69e]">
                  Encyclopedia Note
                </span>
                {wikiSummary?.pageUrl && (
                  <a
                    href={wikiSummary.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11.5px] text-[#e8b04a] hover:underline"
                  >
                    <span>Read more</span>
                    <ArrowSquareOut size={12} />
                  </a>
                )}
              </div>
              {wikiLoading ? (
                <div className="h-14 rounded-lg shimmer-bg border border-white/10" />
              ) : (
                wikiSummary && (
                  <p className="text-[13px] leading-relaxed text-[#a9a69e] m-0">
                    {wikiSummary.extract}
                  </p>
                )
              )}
            </section>
          )}

          {lm.dots.length > 0 && (
            <section className="space-y-2 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase text-[#e8b04a]">
                <Info size={14} />
                <span>3D Pin Field Notes</span>
              </div>
              <ul className="m-0 p-0 list-none divide-y divide-white/10">
                {lm.dots.map((dot, idx) => (
                  <li key={`${lm.k}-dot-${idx}`} className="py-2 text-[13px] text-[#f3efe6]/85">
                    {dot[3]}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </aside>
    </>
  );
}
