import { Sparkle } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { toastVariants } from './lib/motion';
import { ambientAudio } from './audio/ambientAudio';
import { AudioVisualizerBar } from './components/AudioVisualizerBar';
import { BootSplash } from './components/BootSplash';
import { GalleryModal } from './components/GalleryModal';
import { GlobeOverlay } from './components/GlobeOverlay';
import { InfoDrawer } from './components/InfoDrawer';
import { LandmarkCard } from './components/LandmarkCard';
import { PassportModal } from './components/PassportModal';
import { PlacesOverlay } from './components/PlacesOverlay';
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
  type LiveWeatherResult,
} from './data/weatherData';
import { WEATHER_CONDITIONS } from './data/weatherData';
import { useOnlineStatus, usePWARegistration } from './hooks/usePWAInstall';
import type { CitylitEngine } from './three/CitylitEngine';
import { loadCachedThumbnails, saveCachedThumbnails } from './three/thumbnailCache';
import type { PlacesSelectionInfo, PlacesWeatherMode } from './three/placesScene';
import type {
  CitylitSettings,
  ForecastSlot,
  LiveWeatherSample,
  WeatherConditionKey,
  WeatherDisplayState,
} from './types/citylit';

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
        uiSounds: parsed.uiSounds ?? true,
        motion: parsed.motion ?? 'auto',
        tilt: parsed.tilt ?? false,
        theme: parsed.theme === 'daylight' || parsed.theme === 'studio' ? parsed.theme : 'dark',
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
    uiSounds: true,
    motion: 'auto',
    tilt: false,
    theme: 'dark',
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
  /** True once the user has taken manual control of the time-of-day slider. */
  const [timeScrubbed, setTimeScrubbed] = useState(false);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  /** Real hourly forecast, used instead of the climate estimate when available. */
  const [liveForecast, setLiveForecast] = useState<ForecastSlot[] | null>(null);
  /** Most recent real observation, reused while a refresh is in flight. */
  const lastLiveRef = useRef<{ index: number; result: LiveWeatherResult } | null>(null);
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
  const [docHidden, setDocHidden] = useState(() =>
    typeof document !== 'undefined' ? document.hidden : false
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const galleryOpenRef = useRef(galleryOpen);
  const [passportOpen, setPassportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [globeOpen, setGlobeOpen] = useState(false);
  const [placesOpen, setPlacesOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlacesSelectionInfo | null>(null);
  const [activeProvince, setActiveProvince] = useState('All');
  const [placesWeatherMode, setPlacesWeatherMode] = useState<PlacesWeatherMode>('auto');

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
    ambientAudio.playUi('info');
    setToastText(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastText(null), 2600);
  }, []);

  const showFact = useCallback((text: string) => {
    ambientAudio.playUi('subtle', { intensity: 0.7 });
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

  // Initialize Three.js engine once. The engine and its Three.js chunk are
  // dynamically imported so the DOM UI can paint before the WebGL bundle loads.
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;

    let unmounted = false;
    let engine: CitylitEngine | null = null;
    let cancelThumbs: (() => void) | null = null;
    let thumbTimer = 0;

    const onVisibility = () => {
      setDocHidden(document.hidden);
      ambientAudio.handleVisibilityChange(document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibility);

    void import('./three/CitylitEngine')
      .then(({ CitylitEngine: Engine }) => {
        if (unmounted) return;

        const instance = new Engine(host, {
          onFirstInteract: () => setHintVisible(false),
          onFactDot: (text) => showFact(text),
          onSelectLandmarkFromGlobe: (pickedIndex) => {
            instance.closeGlobe();
            setGlobeOpen(false);
            selectLandmark(pickedIndex, { cinematic: true });
          },
          onSelectPlaceSlice: (info) => {
            setSelectedPlace(info);
          },
          onOpenLandmarkFromPlaces: (pickedIndex) => {
            instance.closePlaces();
            setPlacesOpen(false);
            selectLandmark(pickedIndex, { cinematic: true });
          },
        });
        engine = instance;
        engineRef.current = instance;
        instance.setPaused(document.hidden || galleryOpenRef.current);

        const initialIdx = readInitialLandmarkIndex();
        const initialTheme = readSettings().theme;
        document.documentElement.dataset.theme = initialTheme;
        instance.setTheme(initialTheme, true);
        instance.setSeasonMonth(new Date().getMonth() + 1, true);
        instance.showLandmarkImmediate(initialIdx);
        setBooted(true);
        instance.prewarmShaders();

        void loadCachedThumbnails(initialTheme).then((cached) => {
          if (unmounted) return;
          const accumulated: Record<number, string> = cached ? { ...cached } : {};
          if (cached && Object.keys(cached).length > 0) {
            setThumbnails(cached);
          }
          if (cached && Object.keys(cached).length >= LANDMARKS.length) {
            return;
          }
          thumbTimer = window.setTimeout(() => {
            if (unmounted) return;
            cancelThumbs = instance.generateThumbnailsAsync(
              (batch) => {
                Object.assign(accumulated, batch);
                setThumbnails((prev) => ({ ...prev, ...batch }));
              },
              () => {
                if (!unmounted) {
                  void saveCachedThumbnails(initialTheme, accumulated);
                }
              }
            );
          }, 80);
        });
      })
      .catch((error: unknown) => {
        if (!unmounted) {
          // Leave the UI usable (search/info/offline media) if WebGL fails.
          console.error('Failed to load the 3D engine', error);
          setBooted(true);
        }
      });

    return () => {
      unmounted = true;
      window.clearTimeout(thumbTimer);
      cancelThumbs?.();
      document.removeEventListener('visibilitychange', onVisibility);
      engine?.dispose();
      engineRef.current = null;
    };
  }, [selectLandmark, showFact]);

  // Pause WebGL render loop while tab is hidden or full-screen opaque gallery covers viewport
  useEffect(() => {
    galleryOpenRef.current = galleryOpen;
    engineRef.current?.setPaused(docHidden || galleryOpen);
  }, [docHidden, galleryOpen]);

  // Sync audio & engine settings
  useEffect(() => {
    document.body.classList.toggle('rm', reducedMotion);
    ambientAudio.setPreferences({
      volume: settings.volume / 100,
      mixer: settings.mixer,
      haptics: settings.haptics,
      reducedMotion,
      uiSounds: settings.uiSounds,
    });
    document.documentElement.dataset.theme = settings.theme;
    engineRef.current?.applyQuality(settings.quality);
    engineRef.current?.setTheme(settings.theme);
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

    const applyState = (
      k: WeatherConditionKey,
      temp: number,
      isNight: boolean,
      source: string,
      sample?: LiveWeatherSample,
      label?: string,
      nextForecast?: ForecastSlot[]
    ) => {
      const live = source === 'Live' ? sample : undefined;
      setWeatherState({
        condition: k,
        temp,
        night: isNight,
        label: label ?? WEATHER_CONDITIONS[k].label,
        timeText: `${pad2(Math.floor(timeHour))}:${pad2(Math.floor((timeHour % 1) * 60))} SAST`,
        city,
        source,
        live,
      });
      setLiveForecast(live && nextForecast?.length ? nextForecast : null);
      if (live) {
        engineRef.current?.setLiveWeather(live, timeHour);
      } else {
        engineRef.current?.setWeather(k, isNight, timeHour);
      }
    };

    const applyLive = (result: LiveWeatherResult) => {
      lastLiveRef.current = { index, result };
      applyState(
        result.condition,
        result.temp,
        result.night,
        'Live',
        result.sample,
        result.label,
        result.forecast
      );
    };

    engineRef.current?.setSeasonMonth(month);
    const cached = lastLiveRef.current;
    if (isNow && isOnline && cached?.index === index) {
      // Keep the scene on real conditions while the next observation loads.
      applyLive(cached.result);
    } else {
      applyState(cond.k, cond.temp, night, 'Climate');
    }

    if (isNow && isOnline) {
      let cancelled = false;
      fetchLiveWeather(index)
        .then((live) => {
          if (!cancelled) applyLive(live);
        })
        .catch(() => {
          // Keep the last observation, or the climatology estimate, on failure
        });
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [index, month, timeHour, isOnline]);

  // Keep the scene on SAST real time until the user takes manual control
  useEffect(() => {
    if (timeScrubbed) return undefined;
    const timer = window.setInterval(() => {
      const { h, m } = getSASTParts();
      setTimeHour(h + m / 60);
    }, 60000);
    return () => window.clearInterval(timer);
  }, [timeScrubbed]);

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

  // Sync visited set to Places 3D highlights when passport stamps update
  useEffect(() => {
    engineRef.current?.places.refreshVisited(visited);
  }, [visited]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || galleryOpen) return;
      if (placesOpen) {
        if (e.key === 'ArrowRight') {
          const next = engineRef.current?.places.stepSlice(1, activeProvince);
          if (next) {
            engineRef.current?.focusPlaceSiteAudio(next.landmarkIndex);
            setSelectedPlace(next);
          }
          return;
        }
        if (e.key === 'ArrowLeft') {
          const prev = engineRef.current?.places.stepSlice(-1, activeProvince);
          if (prev) {
            engineRef.current?.focusPlaceSiteAudio(prev.landmarkIndex);
            setSelectedPlace(prev);
          }
          return;
        }
        if (e.key === 'Enter' && selectedPlace) {
          engineRef.current?.closePlaces();
          setPlacesOpen(false);
          selectLandmark(selectedPlace.landmarkIndex, { cinematic: true });
          return;
        }
      }
      if (e.key === 'ArrowRight') selectLandmark(index + 1);
      else if (e.key === 'ArrowLeft') selectLandmark(index - 1);
      else if (e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false);
        else if (postcardOpen) setPostcardOpen(false);
        else if (passportOpen) setPassportOpen(false);
        else if (searchOpen) setSearchOpen(false);
        else if (infoOpen) setInfoOpen(false);
        else if (placesOpen) {
          ambientAudio.playUi('close');
          engineRef.current?.closePlaces();
          setPlacesOpen(false);
        } else if (globeOpen) {
          ambientAudio.playUi('close');
          engineRef.current?.closeGlobe();
          setGlobeOpen(false);
        } else if (fullscreen) setFullscreen(false);
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
    placesOpen,
    activeProvince,
    selectedPlace,
    passportOpen,
    settingsOpen,
    postcardOpen,
    fullscreen,
    selectLandmark,
  ]);

  const toggleFavorite = useCallback(
    (targetIndex: number) => {
      ambientAudio.playUi(favorites.has(targetIndex) ? 'toggle' : 'success', { intensity: 0.75 });
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
    },
    [favorites]
  );

  const handleToggleSound = useCallback(() => {
    const enabled = ambientAudio.toggle();
    setSoundOn(enabled);
    if (enabled) ambientAudio.playUi('toggle');
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
      ambientAudio.playUi('close');
      engineRef.current.closeGlobe();
      setGlobeOpen(false);
    } else {
      setSearchOpen(false);
      setInfoOpen(false);
      setWeatherExpanded(false);
      setPlacesOpen(false);
      engineRef.current.openGlobe(visited);
      if (activeProvince !== 'All') {
        engineRef.current.globe.flyToProvince(activeProvince);
      }
      setGlobeOpen(true);
    }
  }, [globeOpen, visited, activeProvince]);

  const openPlaces = useCallback(() => {
    if (!engineRef.current) return;
    setSearchOpen(false);
    setInfoOpen(false);
    setWeatherExpanded(false);
    setTodOpen(false);
    setGlobeOpen(false);
    const info = engineRef.current.openPlaces(visited, activeProvince, index);
    setSelectedPlace(info);
    setPlacesOpen(true);
  }, [visited, activeProvince, index]);

  const closePlaces = useCallback(() => {
    if (!engineRef.current) return;
    ambientAudio.playUi('close');
    engineRef.current.closePlaces();
    setPlacesOpen(false);
  }, []);

  const forecast = useMemo(
    () => liveForecast ?? getForecastSlots(index, month),
    [liveForecast, index, month]
  );
  const bestMonths = useMemo(() => getBestMonths(index), [index]);

  return (
    <LayoutGroup>
      <div className="relative w-full h-full overflow-hidden select-none">
        {/* Three.js WebGL Viewport */}
        <div ref={canvasHostRef} className="fixed inset-0" />

        {/* Vignette */}
        {!globeOpen && !placesOpen && (
          <>
            <div
              aria-hidden="true"
              className={`fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(0,0,0,0.42))] transition-opacity duration-700 ease-out ${
                settings.theme === 'dark' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              aria-hidden="true"
              className={`fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_64%,rgba(16,32,48,0.16))] transition-opacity duration-700 ease-out ${
                settings.theme === 'daylight' ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        )}

        {/* Top Navigation */}
        <TopBar
          soundOn={soundOn}
          todOpen={todOpen}
          fullscreen={fullscreen}
          idleInFullscreen={idleInFullscreen}
          globeOpen={globeOpen || placesOpen}
          theme={settings.theme}
          reducedMotion={reducedMotion}
          onToggleSound={handleToggleSound}
          onToggleTod={() => {
            ambientAudio.playUi(todOpen ? 'close' : 'open');
            setTodOpen((v) => !v);
          }}
          onToggleFullscreen={() => setFullscreen((v) => !v)}
          onHeroView={() => {
            ambientAudio.playUi('tap', { intensity: 0.7 });
            engineRef.current?.frameCurrentLandmark();
          }}
          onOpenSearch={() => setSearchOpen(true)}
        />

        {/* Quick Time-of-Day Scrubber */}
        {todOpen && !fullscreen && !globeOpen && !placesOpen && (
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
                setTimeScrubbed(true);
                engineRef.current?.setSunAltitudeFromSlider(val);
                ambientAudio.playUi('tick');
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
            {timeScrubbed && (
              <button
                type="button"
                onClick={() => {
                  const { h, m } = getSASTParts();
                  setTimeHour(h + m / 60);
                  setTimeScrubbed(false);
                }}
                className="mt-2 w-full py-1 rounded-lg border border-[#e8b04a]/45 bg-[#e8b04a]/10 text-[11px] text-[#e8b04a] cursor-pointer"
              >
                Return to live time
              </button>
            )}
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
          globeOpen={globeOpen || placesOpen}
          reducedMotion={reducedMotion}
          onToggleExpand={() => setWeatherExpanded((v) => !v)}
          onSelectTimePreset={(h) => {
            setTimeHour(h);
            setTimeScrubbed(true);
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
          visible={!fullscreen && !globeOpen && !placesOpen}
          reducedMotion={reducedMotion}
          onPrev={() => selectLandmark(index - 1)}
          onNext={() => selectLandmark(index + 1)}
          onToggleFavorite={() => toggleFavorite(index)}
          onToggleTour={() => {
            ambientAudio.playUi('toggle');
            setTourActive((v) => !v);
          }}
          onOpenInfo={() => setInfoOpen(true)}
          onOpenGallery={() => setGalleryOpen(true)}
          onOpenPostcard={handleOpenPostcard}
          onOpenGlobe={toggleGlobe}
          onShare={shareCurrentLandmark}
          onVibrate={() => {
            ambientAudio.playUi('expand');
            ambientAudio.vibrate(18);
          }}
        />

        {/* Desktop Orbit Hint */}
        {!fullscreen && !globeOpen && !placesOpen && hintVisible && (
          <div
            className={`hidden md:block fixed right-4 bottom-[calc(18px+env(safe-area-inset-bottom,0px))] text-[12px] pointer-events-none transition-colors duration-500 ${
              settings.theme === 'dark' ? 'text-[#a9a69e]' : 'text-[#1c2330]/75'
            }`}
          >
            Drag to orbit · Scroll to zoom · Tap pins for facts
          </div>
        )}

        {/* Minimalist Ambient Audio Frequency Bar (visible only when sound is ON) */}
        <AudioVisualizerBar active={soundOn} theme={settings.theme} reducedMotion={reducedMotion} />

        {/* Globe Overlay HUD */}
        <GlobeOverlay
          open={globeOpen}
          activeProvince={activeProvince}
          reducedMotion={reducedMotion}
          onSelectProvince={(pv) => {
            setActiveProvince(pv);
            engineRef.current?.globe.flyToProvince(pv);
          }}
          onOpenPlaces={openPlaces}
          onClose={toggleGlobe}
        />

        {/* Places 3D Geological Diorama Archipelago HUD */}
        <PlacesOverlay
          open={placesOpen}
          activeProvince={activeProvince}
          selectedPlace={selectedPlace}
          visited={visited}
          weather={weatherState}
          weatherMode={placesWeatherMode}
          activeTimeHour={timeHour}
          soundOn={soundOn}
          reducedMotion={reducedMotion}
          onSelectProvince={(pv) => {
            setActiveProvince(pv);
            if (!engineRef.current) return;
            engineRef.current.places.flyToProvince(pv);
            const nextInfo = engineRef.current.places.getSelectedInfo();
            engineRef.current.focusPlaceSiteAudio(nextInfo.landmarkIndex);
            setSelectedPlace(nextInfo);
          }}
          onStepSlice={(dir) => {
            if (!engineRef.current) return;
            const nextInfo = engineRef.current.places.stepSlice(dir, activeProvince);
            engineRef.current.focusPlaceSiteAudio(nextInfo.landmarkIndex);
            setSelectedPlace(nextInfo);
          }}
          onOpenLandmark={(pickedIndex) => {
            engineRef.current?.closePlaces();
            setPlacesOpen(false);
            selectLandmark(pickedIndex, { cinematic: true });
          }}
          onResetView={() => {
            setActiveProvince('All');
            engineRef.current?.places.resetOverview();
          }}
          onSwitchToGlobe={toggleGlobe}
          onToggleSound={handleToggleSound}
          onSelectTimePreset={(h) => {
            setTimeHour(h);
            setTimeScrubbed(true);
            engineRef.current?.setSunAltitudeFromSlider(h);
          }}
          onSelectWeatherMode={(mode) => {
            setPlacesWeatherMode(mode);
            engineRef.current?.places.setWeatherMode(mode);
          }}
          onClose={closePlaces}
        />

        {/* Fact Callout */}
        <AnimatePresence>
          {factText && (
            <motion.div
              key="fact"
              role="status"
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={reducedMotion ? { duration: 0 } : undefined}
              onClick={() => setFactText(null)}
              className="fixed left-3.5 bottom-[calc(var(--cl-card-h,218px)+env(safe-area-inset-bottom,0px)+26px)] z-20 w-[min(532px,calc(100vw-28px))] px-4 py-3 bg-[#121319]/95 border border-[#e8b04a]/45 rounded-2xl text-[13.5px] text-[#f3efe6] flex items-start gap-2.5 shadow-xl cursor-pointer"
            >
              <Sparkle size={16} weight="fill" className="text-[#e8b04a] shrink-0 mt-0.5" />
              <span>{factText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toastText && (
            <motion.div
              key="toast"
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={reducedMotion ? { duration: 0 } : undefined}
              className="fixed left-1/2 -translate-x-1/2 bottom-[calc(var(--cl-card-h,218px)+env(safe-area-inset-bottom,0px)+30px)] z-50 px-4 py-2 rounded-full bg-[#121319]/95 border border-white/15 text-[13px] text-[#f3efe6] shadow-lg"
            >
              {toastText}
            </motion.div>
          )}
        </AnimatePresence>

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
            <motion.div
              key={cineKey}
              initial={{ opacity: 0, y: 14, letterSpacing: '0.3em' }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [14, 0, 0, -8],
                letterSpacing: ['0.3em', '0.04em', '0.04em', '0.04em'],
              }}
              transition={{
                duration: reducedMotion ? 0 : 2.2,
                times: [0, 0.25, 0.7, 1],
                ease: 'easeOut',
              }}
              className="fixed inset-x-0 top-[40%] text-center z-30 pointer-events-none"
            >
              <small className="block text-[#e8b04a] tracking-[0.2em] text-[12px] uppercase">
                {LANDMARKS[index].c}
              </small>
              <b className="block font-serif-display italic font-normal text-[clamp(30px,8vw,54px)] leading-tight text-[#f3efe6] drop-shadow-[0_2px_24px_#000]">
                {LANDMARKS[index].k}
              </b>
            </motion.div>
          </>
        )}

        {/* Passport Stamp Notification */}
        <AnimatePresence>
          {stampBanner && (
            <motion.div
              key="stamp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 grid place-items-center pointer-events-none"
            >
              <motion.div
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 2.4, rotate: -14 }}
                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: -14 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, mass: 0.7 }}
                className="px-6 py-4 rounded-2xl border-2 border-[#e8b04a] bg-[#121319]/95 text-center shadow-2xl"
              >
                <div className="text-[11px] tracking-[0.22em] uppercase text-[#e8b04a]">
                  Passport Stamped
                </div>
                <div className="font-serif-display italic text-[26px] text-[#f3efe6] mt-0.5">
                  {stampBanner}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confetti Canvas */}
        <canvas ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-50" />

        {/* Modals & Drawers */}
        <SearchSheet
          open={searchOpen}
          activeIndex={index}
          thumbnails={thumbnails}
          visited={visited}
          favorites={favorites}
          reducedMotion={reducedMotion}
          onClose={() => setSearchOpen(false)}
          onSelectLandmark={(i) => selectLandmark(i)}
          onSelectTime={(h) => {
            setTimeHour(h);
            setTimeScrubbed(true);
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
          bestMonths={bestMonths}
          reducedMotion={reducedMotion}
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
          reducedMotion={reducedMotion}
          onClose={() => setGalleryOpen(false)}
          onShare={shareCurrentLandmark}
        />

        <PassportModal
          open={passportOpen}
          visited={visited}
          reducedMotion={reducedMotion}
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
          reducedMotion={reducedMotion}
          onUpdate={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          onRequestTilt={() => engineRef.current?.requestTiltPermission() ?? Promise.resolve(false)}
          onClose={() => setSettingsOpen(false)}
        />

        <PostcardModal
          open={postcardOpen}
          dataUrl={postcardUrl}
          landmarkName={LANDMARKS[index].k}
          reducedMotion={reducedMotion}
          onShare={handleSharePostcard}
          onDownload={handleDownloadPostcard}
          onClose={() => setPostcardOpen(false)}
        />

        {/* Boot Splash */}
        <BootSplash done={booted} reducedMotion={reducedMotion} />
      </div>
    </LayoutGroup>
  );
}
export default App;
