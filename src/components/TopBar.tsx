import {
  CornersIn,
  CornersOut,
  MagnifyingGlass,
  SpeakerHigh,
  SpeakerSlash,
  SunHorizon,
} from '@phosphor-icons/react';

interface TopBarProps {
  soundOn: boolean;
  todOpen: boolean;
  fullscreen: boolean;
  idleInFullscreen: boolean;
  globeOpen: boolean;
  onToggleSound: () => void;
  onToggleTod: () => void;
  onToggleFullscreen: () => void;
  onOpenSearch: () => void;
}

export function TopBar({
  soundOn,
  todOpen,
  fullscreen,
  idleInFullscreen,
  globeOpen,
  onToggleSound,
  onToggleTod,
  onToggleFullscreen,
  onOpenSearch,
}: TopBarProps) {
  if (globeOpen) return null;

  const btnBase =
    'w-10 h-10 rounded-full grid place-items-center bg-[#121319]/90 border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#e8b04a]';

  return (
    <>
      {!fullscreen && (
        <header className="fixed inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pointer-events-none">
          <div className="font-serif-display italic text-[22px] tracking-[0.01em] text-[#f3efe6] select-none">
            cıtylit
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={onToggleSound}
              aria-label="Toggle ambient sound"
              title="Ambient sound"
              className={`${btnBase} ${soundOn ? 'border-[#e8b04a] text-[#e8b04a]' : ''}`}
            >
              {soundOn ? <SpeakerHigh size={18} /> : <SpeakerSlash size={18} />}
            </button>

            <button
              type="button"
              onClick={onToggleTod}
              aria-label="Time of day"
              title="Time of day"
              className={`${btnBase} ${todOpen ? 'border-[#e8b04a] text-[#e8b04a]' : ''}`}
            >
              <SunHorizon size={18} />
            </button>

            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label="Toggle fullscreen view"
              title="Fullscreen view"
              className={btnBase}
            >
              <CornersOut size={18} />
            </button>

            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Browse all landmarks"
              title="Browse landmarks (/)"
              className="w-10 h-10 rounded-full grid place-items-center bg-[#e8b04a] border border-[#e8b04a] text-[#1a1405] hover:brightness-110 transition cursor-pointer focus-visible:outline-2 focus-visible:outline-[#e8b04a]"
            >
              <MagnifyingGlass size={18} weight="bold" />
            </button>
          </div>
        </header>
      )}

      {fullscreen && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label="Exit fullscreen"
          className={`fixed right-4 top-[calc(14px+env(safe-area-inset-top,0px))] z-20 w-10 h-10 rounded-full grid place-items-center bg-[#121319]/90 border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-opacity duration-300 cursor-pointer ${
            idleInFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-80'
          }`}
        >
          <CornersIn size={18} />
        </button>
      )}
    </>
  );
}
