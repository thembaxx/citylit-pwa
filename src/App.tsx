import { Sparkle } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ambientAudio } from './audio/ambientAudio';
import { GalleryModal } from './components/GalleryModal';
import { GlobeOverlay } from './components/GlobeOverlay';
import { InfoDrawer } from './components/InfoDrawer';
import { LandmarkCard } from './components/LandmarkCard';
import { PassportModal } from './components/PassportModal';
import { PostcardModal } from './components/PostcardModal';
import { SearchSheet } from './components/SearchSheet';
import { SettingsModal } from './components/SettingsModal';
import { TopBar } from './components/TopBar';
import { WeatherWidget } from './components/WeatherWidget';
import { LANDMARKS, slugifyLandmark } from './data/landmarks';
import {
  fetchLiveWeather,
  getBestMonths,
  getForecastSlots,
  getMonthCondition,
  getSASTParts,
  pad2,
} from './data/weatherData';
import { WEATHER_CONDITIONS } from './data/weatherData';
import { useOnlineStatus, usePWARegistration } from './hooks/usePWAInstall';
import { CitylitEngine } from './three/CitylitEngine';
import type { CitylitSettings, WeatherConditionKey, WeatherDisplayState } from './types/citylit';

function readInitialLandmarkIndex(): number {
  const hash = window.location.hash.slice(1).toLowerCase();
  if (!hash) return 0;
  const idx = LANDMARKS.findIndex((lm) => slugifyLandmark(lm.k) === hash);
  return idx >= 0 ? idx : 0;
}

function readStoredSet(key: string): Set<number> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(
      arr.filter((v): v is number => typeof v === 'number' && v >= 0 && v < LANDMARKS.length)
    );
  } catch {
    return new Set();
  }
}

function readSettings(): CitylitSettings {
  const defaultMixer = { wind: 80, birds: 75, traffic: 40 };
  try {
    const raw = localStorage.getItem('cl-st');
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CitylitSettings>;
      return {
        quality: parsed.quality ?? 'auto',
        volume: typeof parsed.volume === 'number' ? parsed.volume : 80,
        mixer: {
          wind: typeof parsed.mixer?.wind === 'number' ? parsed.mixer.wind : defaultMixer.wind,
          birds: typeof parsed.mixer?.birds === 'number' ? parsed.mixer.birds : defaultMixer.birds,
          traffic:
            typeof parsed.mixer?.traffic === 'number' ? parsed.mixer.traffic : defaultMixer.traffic,
        },
        haptics: parsed.haptics ?? true,
        motion: parsed.motion ?? 'auto',
        tilt: parsed.tilt ?? false,
      };
    }
  } catch {
    // Ignore invalid stored settings
  }
  return {
    quality: 'auto',
    volume: 80,
    mixer: defaultMixer,
    haptics: true,
    motion: 'auto',
    tilt: false,
  };
}

export function App() {
  usePWARegistration();
  const isOnline = useOnlineStatus();

  const canvasHostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CitylitEngine | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  const [booted, setBooted] = useState(false);
  const [index, setIndex] = useState<number>(readInitialLandmarkIndex);
  const [favorites, setFavorites] = useState<Set<number>>(() => readStoredSet('cl-f'));
  const [visited, setVisited] = useState<Set<number>>(() => readStoredSet('cl-vs'));
  const [settings, setSettings] = useState<CitylitSettings>(readSettings);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  const [soundOn, setSoundOn] = useState(false);
  const [todOpen, setTodOpen] = useState(false);
  const [timeHour, setTimeHour] = useState(() => {
    const { h, m } = getSASTParts();
    return h + m / 60;
  });
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [weatherState, setWeatherState] = useState<WeatherDisplayState>(() => {
    const lm = LANDMARKS[readInitialLandmarkIndex()];
    const { h, m } = getSASTParts();
    const q = getMonthCondition(readInitialLandmarkIndex(), new Date().getMonth() + 1, h + m / 60);
    return {
      condition: q.k,
      temp: q.temp,
      night: h < 6 || h >= 19,
      label: WEATHER_CONDITIONS[q.k].label,
      timeText: `${pad2(h)}:${pad2(m)} SAST`,
      city: lm.c.split(' · ')[0],
      source: 'Climate',
    };
  });

  const [fullscreen, setFullscreen] = useState(false);
  const [idleInFullscreen, setIdleInFullscreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [globeOpen, setGlobeOpen] = useState(false);
  const [activeProvince, setActiveProvince] = useState('All');

  const [postcardUrl, setPostcardUrl] = useState('');
  const [postcardOpen, setPostcardOpen] = useState(false);

  const [tourActive, setTourActive] = useState(false);
  const [factText, setFactText] = useState<string | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(true);
  const [cineKey, setCineKey] = useState<number | null>(null);
  const [stampBanner, setStampBanner] = useState<string | null>(null);

  const factTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const cineTimerRef = useRef<number | null>(null);
  const stampTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const reducedMotion = useMemo(() => {
    if (settings.motion === 'reduce') return true;
    return (
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, [settings.motion]);

  const showToast = useCallback((msg: string) => {
    setToastText(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastText(null), 2600);
  }, []);

  const showFact = useCallback((text: string) => {
    setFactText(text);
    if (factTimerRef.current) window.clearTimeout(factTimerRef.current);
    factTimerRef.current = window.setTimeout(() => setFactText(null), 5200);
  }, []);

  const launchConfetti = useCallback(() => {
    if (reducedMotion) return;
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = ['#e8b04a', '#7dffb0', '#ff6b81', '#5ec8ff', '#fff'];
    const particles = Array.from({ length: 60 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 140,
      y: canvas.height * 0.42,
      vx: (Math.random() - 0.5) * 10,
      vy: -Math.random() * 11 - 3,
      sz: 4 + Math.random() * 5,
      col: palette[Math.floor(Math.random() * palette.length)],
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.25,
    }));

    let frame = 0;
    const step = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.vy += 0.34;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y < canvas.height + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.sz / 2, -p.sz / 2, p.sz, p.sz * 0.6);
        ctx.restore();
      });
      frame++;
      if (alive && frame < 130) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    requestAnimationFrame(step);
  }, [reducedMotion]);

  const selectLandmark = useCallback(
    (nextIndex: number, opts: { cinematic?: boolean } = {}) => {
      const wrapped = ((nextIndex % LANDMARKS.length) + LANDMARKS.length) % LANDMARKS.length;
      setIndex(wrapped);
      setFactText(null);
      window.history.replaceState(null, '', '#' + slugifyLandmark(LANDMARKS[wrapped].k));
      engineRef.current?.transitionToLandmark(wrapped);
      if (opts.cinematic && !reducedMotion) {
        setCineKey(Date.now());
        if (cineTimerRef.current) window.clearTimeout(cineTimerRef.current);
        cineTimerRef.current = window.setTimeout(() => setCineKey(null), 2200);
      }
    },
    [reducedMotion]
  );

  // Initialize Three.js engine once
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;

    const engine = new CitylitEngine(host, {
      onFirstInteract: () => setHintVisible(false),
      onFactDot: (text) => showFact(text),
      onSelectLandmarkFromGlobe: (pickedIndex) => {
        engine.closeGlobe();
        setGlobeOpen(false);
        selectLandmark(pickedIndex, { cinematic: true });
      },
    });
    engineRef.current = engine;

    const initialIdx = readInitialLandmarkIndex();
    engine.setSeasonMonth(new Date().getMonth() + 1, true);
    engine.showLandmarkImmediate(initialIdx);

    const thumbTimer = window.setTimeout(() => {
      const generated = engine.generateThumbnails();
      setThumbnails(generated);
      setBooted(true);
    }, 60);

    const onVisibility = () => {
      ambientAudio.handleVisibilityChange(document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearTimeout(thumbTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      engine.dispose();
      engineRef.current = null;
    };
  }, [selectLandmark, showFact]);

  // Sync audio & engine settings
  useEffect(() => {
    document.body.classList.toggle('rm', reducedMotion);
    ambientAudio.setPreferences({
      volume: settings.volume / 100,
      mixer: settings.mixer,
      haptics: settings.haptics,
      reducedMotion,
    });
    engineRef.current?.applyQuality(settings.quality);
    engineRef.current?.setMotionPreferences(reducedMotion);
    engineRef.current?.setTiltEnabled(settings.tilt);
    try {
      localStorage.setItem('cl-st', JSON.stringify(settings));
    } catch {
      // Ignore storage failures
    }
  }, [settings, reducedMotion]);

  // Update weather & Three.js sky whenever index/month/timeHour changes
  useEffect(() => {
    const lm = LANDMARKS[index];
    const city = lm.c.split(' · ')[0];
    const { h, m } = getSASTParts();
    const isNow = Math.abs(timeHour - (h + m / 60)) < 0.7 && month === new Date().getMonth() + 1;
    const cond = getMonthCondition(index, month, timeHour);
    const night = timeHour < 6 || timeHour >= 19;

    const applyState = (k: WeatherConditionKey, temp: number, isNight: boolean, source: string) => {
      setWeatherState({
        condition: k,
        temp,
        night: isNight,
        label: WEATHER_CONDITIONS[k].label,
        timeText: `${pad2(Math.floor(timeHour))}:${pad2(Math.floor((timeHour % 1) * 60))} SAST`,
        city,
        source,
      });
      engineRef.current?.setWeather(k, isNight, timeHour);
    };

    engineRef.current?.setSeasonMonth(month);
    applyState(cond.k, cond.temp, night, 'Climate');

    if (isNow && isOnline) {
      let cancelled = false;
      fetchLiveWeather(index)
        .then((live) => {
          if (cancelled) return;
          applyState(live.k, live.temp, live.night, 'Live');
        })
        .catch(() => {
          // Keep climatology estimate when offline or API unreachable
        });
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [index, month, timeHour, isOnline]);

  // Keep SAST clock ticking when user isn't scrubbing custom time
  useEffect(() => {
    const timer = window.setInterval(() => {
      const { h, m } = getSASTParts();
      setWeatherState((prev) => ({
        ...prev,
        timeText: `${pad2(h)}:${pad2(m)} SAST`,
      }));
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  // Stamp Explorer Passport after lingering 3 seconds on a landmark
  useEffect(() => {
    if (visited.has(index)) return undefined;
    const timer = window.setTimeout(() => {
      setVisited((prev) => {
        if (prev.has(index)) return prev;
        const next = new Set(prev);
        next.add(index);
        try {
          localStorage.setItem('cl-vs', JSON.stringify([...next]));
        } catch {
          // Ignore storage failures
        }
        return next;
      });
      setStampBanner(LANDMARKS[index].k);
      launchConfetti();
      if (stampTimerRef.current) window.clearTimeout(stampTimerRef.current);
      stampTimerRef.current = window.setTimeout(() => setStampBanner(null), 2200);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [index, visited, launchConfetti]);

  // Auto-tour progression
  useEffect(() => {
    if (!tourActive) return undefined;
    const timer = window.setInterval(() => {
      selectLandmark(index + 1, { cinematic: true });
    }, 10000);
    return () => window.clearInterval(timer);
  }, [tourActive, index, selectLandmark]);

  // Fullscreen idle timer
  useEffect(() => {
    if (!fullscreen) return undefined;
    const bump = () => {
      setIdleInFullscreen(false);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => setIdleInFullscreen(true), 2400);
    };
    bump();
    window.addEventListener('pointermove', bump);
    window.addEventListener('pointerdown', bump);
    return () => {
      window.removeEventListener('pointermove', bump);
      window.removeEventListener('pointerdown', bump);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [fullscreen]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || galleryOpen) return;
      if (e.key === 'ArrowRight') selectLandmark(index + 1);
      else if (e.key === 'ArrowLeft') selectLandmark(index - 1);
      else if (e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape') {
        if (searchOpen) setSearchOpen(false);
        else if (infoOpen) setInfoOpen(false);
        else if (globeOpen) {
          engineRef.current?.closeGlobe();
          setGlobeOpen(false);
        } else if (passportOpen) setPassportOpen(false);
        else if (settingsOpen) setSettingsOpen(false);
        else if (postcardOpen) setPostcardOpen(false);
        else if (fullscreen) setFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    index,
    galleryOpen,
    infoOpen,
    searchOpen,
    globeOpen,
    passportOpen,
    settingsOpen,
    postcardOpen,
    fullscreen,
    selectLandmark,
  ]);

  const toggleFavorite = useCallback((targetIndex: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(targetIndex)) next.delete(targetIndex);
      else next.add(targetIndex);
      try {
        localStorage.setItem('cl-f', JSON.stringify([...next]));
      } catch {
        // Ignore storage failures
      }
      return next;
    });
    ambientAudio.vibrate(10);
  }, []);

  const shareCurrentLandmark = useCallback(async () => {
    const lm = LANDMARKS[index];
    const url = window.location.href.split('#')[0] + '#' + slugifyLandmark(lm.k);
    if (navigator.share) {
      try {
        await navigator.share({ title: `${lm.k} · Citylit`, text: lm.f, url });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    } catch {
      showToast('Ready to share');
    }
  }, [index, showToast]);

  const handleOpenPostcard = useCallback(() => {
    if (!engineRef.current) return;
    const url = engineRef.current.capturePostcard(
      index,
      `${weatherState.temp}°C · ${weatherState.label} · ${weatherState.timeText}`
    );
    setPostcardUrl(url);
    setPostcardOpen(true);
  }, [index, weatherState]);

  const handleDownloadPostcard = useCallback(() => {
    if (!postcardUrl) return;
    const a = document.createElement('a');
    a.href = postcardUrl;
    a.download = `${slugifyLandmark(LANDMARKS[index].k)}-citylit.png`;
    a.click();
    showToast('Postcard saved');
  }, [postcardUrl, index, showToast]);

  const handleSharePostcard = useCallback(async () => {
    if (!postcardUrl) return;
    try {
      const blob = await (await fetch(postcardUrl)).blob();
      const file = new File([blob], `${slugifyLandmark(LANDMARKS[index].k)}-citylit.png`, {
        type: 'image/png',
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `${LANDMARKS[index].k} · Citylit` });
        return;
      }
    } catch {
      // Fallback to download
    }
    handleDownloadPostcard();
  }, [postcardUrl, index, handleDownloadPostcard]);

  const captureFallbackShots = useCallback(
    (idx: number) => engineRef.current?.captureGalleryShots(idx) ?? [],
    []
  );

  const toggleGlobe = useCallback(() => {
    if (!engineRef.current) return;
    if (globeOpen) {
      engineRef.current.closeGlobe();
      setGlobeOpen(false);
    } else {
      setSearchOpen(false);
      setInfoOpen(false);
      setWeatherExpanded(false);
      engineRef.current.openGlobe(visited);
      setGlobeOpen(true);
    }
  }, [globeOpen, visited]);

  const forecast = useMemo(() => getForecastSlots(index, month), [index, month]);
  const bestMonths = useMemo(() => getBestMonths(index), [index]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Three.js WebGL Viewport */}
      <div ref={canvasHostRef} className="fixed inset-0" />

      {/* Vignette */}
      {!globeOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(0,0,0,0.42))]"
        />
      )}

      {/* Top Navigation */}
      <TopBar
        soundOn={soundOn}
        todOpen={todOpen}
        fullscreen={fullscreen}
        idleInFullscreen={idleInFullscreen}
        globeOpen={globeOpen}
        onToggleSound={() => setSoundOn(ambientAudio.toggle())}
        onToggleTod={() => setTodOpen((v) => !v)}
        onToggleFullscreen={() => setFullscreen((v) => !v)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Quick Time-of-Day Scrubber */}
      {todOpen && !fullscreen && !globeOpen && (
        <div className="fixed left-1/2 -translate-x-1/2 top-[calc(130px+env(safe-area-inset-top,0px))] z-20 w-[min(300px,calc(100vw-36px))] px-4 py-3 bg-[#121319]/92 border border-white/15 rounded-2xl shadow-xl">
          <input
            type="range"
            min={0}
            max={24}
            step={0.1}
            value={timeHour}
            onChange={(e) => {
              const val = Number(e.target.value);
              setTimeHour(val);
              engineRef.current?.setSunAltitudeFromSlider(val);
            }}
            aria-label="Time of day hour"
            className="w-full accent-[#e8b04a] cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-[#a9a69e] mt-1">
            <span>Midnight</span>
            <span>Dawn</span>
            <span>Noon</span>
            <span>Dusk</span>
            <span>Night</span>
          </div>
        </div>
      )}

      {/* Weather & Globe Button */}
      <WeatherWidget
        weather={weatherState}
        expanded={weatherExpanded}
        month={month}
        bestMonths={bestMonths}
        forecast={forecast}
        activeTimeHour={timeHour}
        visible={!fullscreen}
        globeOpen={globeOpen}
        onToggleExpand={() => setWeatherExpanded((v) => !v)}
        onSelectTimePreset={(h) => {
          setTimeHour(h);
          engineRef.current?.setSunAltitudeFromSlider(h);
        }}
        onChangeMonth={(m) => setMonth(m)}
        onTriggerRainbow={() => engineRef.current?.toggleRainRainbow()}
        onToggleGlobe={toggleGlobe}
      />

      {/* Bottom Landmark Card */}
      <LandmarkCard
        index={index}
        isFavorite={favorites.has(index)}
        tourActive={tourActive}
        visible={!fullscreen && !globeOpen}
        onPrev={() => selectLandmark(index - 1)}
        onNext={() => selectLandmark(index + 1)}
        onToggleFavorite={() => toggleFavorite(index)}
        onToggleTour={() => setTourActive((v) => !v)}
        onOpenInfo={() => setInfoOpen(true)}
        onOpenGallery={() => setGalleryOpen(true)}
        onOpenPostcard={handleOpenPostcard}
        onOpenGlobe={toggleGlobe}
        onShare={shareCurrentLandmark}
        onVibrate={() => ambientAudio.vibrate(18)}
      />

      {/* Desktop Orbit Hint */}
      {!fullscreen && !globeOpen && hintVisible && (
        <div className="hidden md:block fixed right-4 bottom-[calc(18px+env(safe-area-inset-bottom,0px))] text-[12px] text-[#a9a69e] pointer-events-none">
          Drag to orbit · Scroll to zoom · Tap pins for facts
        </div>
      )}

      {/* Globe Overlay HUD */}
      <GlobeOverlay
        open={globeOpen}
        activeProvince={activeProvince}
        onSelectProvince={(pv) => {
          setActiveProvince(pv);
          engineRef.current?.globe.flyToProvince(pv);
        }}
        onClose={toggleGlobe}
      />

      {/* Fact Callout */}
      {factText && (
        <div
          role="status"
          onClick={() => setFactText(null)}
          className="fixed left-3.5 bottom-[calc(var(--cl-card-h,218px)+env(safe-area-inset-bottom,0px)+26px)] z-20 w-[min(532px,calc(100vw-28px))] px-4 py-3 bg-[#121319]/95 border border-[#e8b04a]/45 rounded-2xl text-[13.5px] text-[#f3efe6] flex items-start gap-2.5 shadow-xl cursor-pointer"
        >
          <Sparkle size={16} weight="fill" className="text-[#e8b04a] shrink-0 mt-0.5" />
          <span>{factText}</span>
        </div>
      )}

      {/* Toast Notification */}
      {toastText && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(var(--cl-card-h,218px)+env(safe-area-inset-bottom,0px)+30px)] z-50 px-4 py-2 rounded-full bg-[#121319]/95 border border-white/15 text-[13px] text-[#f3efe6] shadow-lg">
          {toastText}
        </div>
      )}

      {/* Offline Status Pill */}
      {!isOnline && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(18px+env(safe-area-inset-bottom,0px))] z-50 px-3.5 py-1 rounded-full bg-[#14161e] border border-[#e8b04a]/40 text-[11.5px] text-[#e8b04a]">
          Offline mode · 3D models & cached photos ready
        </div>
      )}

      {/* Cinematic Tour Letterbox & Title */}
      {cineKey && (
        <>
          <div className="fixed inset-x-0 top-0 h-[6vh] bg-black z-30 pointer-events-none" />
          <div className="fixed inset-x-0 bottom-0 h-[6vh] bg-black z-30 pointer-events-none" />
          <div
            key={cineKey}
            className="fixed inset-x-0 top-[40%] text-center z-30 pointer-events-none animate-title-cine"
          >
            <small className="block text-[#e8b04a] tracking-[0.2em] text-[12px] uppercase">
              {LANDMARKS[index].c}
            </small>
            <b className="block font-serif-display italic font-normal text-[clamp(30px,8vw,54px)] leading-tight text-[#f3efe6] drop-shadow-[0_2px_24px_#000]">
              {LANDMARKS[index].k}
            </b>
          </div>
        </>
      )}

      {/* Passport Stamp Notification */}
      {stampBanner && (
        <div className="fixed inset-0 z-50 grid place-items-center pointer-events-none">
          <div className="px-6 py-4 rounded-2xl border-2 border-[#e8b04a] bg-[#121319]/95 text-center animate-stamp shadow-2xl">
            <div className="text-[11px] tracking-[0.22em] uppercase text-[#e8b04a]">
              Passport Stamped
            </div>
            <div className="font-serif-display italic text-[26px] text-[#f3efe6] mt-0.5">
              {stampBanner}
            </div>
          </div>
        </div>
      )}

      {/* Confetti Canvas */}
      <canvas ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-50" />

      {/* Modals & Drawers */}
      <SearchSheet
        open={searchOpen}
        activeIndex={index}
        thumbnails={thumbnails}
        visited={visited}
        favorites={favorites}
        onClose={() => setSearchOpen(false)}
        onSelectLandmark={(i) => selectLandmark(i)}
        onSelectTime={(h) => {
          setTimeHour(h);
          engineRef.current?.setSunAltitudeFromSlider(h);
        }}
        onToggleFavorite={toggleFavorite}
        onOpenPassport={() => setPassportOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onInstalledToast={showToast}
      />

      <InfoDrawer
        open={infoOpen}
        index={index}
        thumbnail={thumbnails[index]}
        bestMonths={bestMonths}
        onClose={() => setInfoOpen(false)}
        onOpenGallery={() => {
          setInfoOpen(false);
          setGalleryOpen(true);
        }}
      />

      <GalleryModal
        open={galleryOpen}
        index={index}
        captureFallbackShots={captureFallbackShots}
        onClose={() => setGalleryOpen(false)}
        onShare={shareCurrentLandmark}
      />

      <PassportModal
        open={passportOpen}
        visited={visited}
        onClose={() => setPassportOpen(false)}
        onResetPassport={() => {
          setVisited(new Set());
          try {
            localStorage.removeItem('cl-vs');
          } catch {
            // Ignore storage errors
          }
          showToast('Passport stamps cleared');
        }}
      />

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onUpdate={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
        onRequestTilt={() => engineRef.current?.requestTiltPermission() ?? Promise.resolve(false)}
        onClose={() => setSettingsOpen(false)}
      />

      <PostcardModal
        open={postcardOpen}
        dataUrl={postcardUrl}
        landmarkName={LANDMARKS[index].k}
        onShare={handleSharePostcard}
        onDownload={handleDownloadPostcard}
        onClose={() => setPostcardOpen(false)}
      />

      {/* Boot Splash */}
      {!booted && (
        <div className="fixed inset-0 z-50 bg-[#0e0f13] grid place-items-center text-center">
          <div>
            <div className="font-serif-display italic text-[42px] text-[#f3efe6]">cıtylit</div>
            <div className="text-[11px] tracking-[0.22em] uppercase text-[#e8b04a] mt-1">
              Landmarks in 3D
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
