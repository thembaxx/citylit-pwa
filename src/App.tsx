import { MapPin, Sparkle, Trash, X } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { DURATION, EASE_SMOOTH_OUT, SPRING, toastVariants } from './lib/motion';
import { referenceDisplayFactor } from './lib/scale';
import { msUntilNextThemeBoundary, resolveAutoTheme, resolveTheme } from './lib/theme';
import {
  readInitialCoordinate,
  readInitialGlobeState,
  setUrlForCoordinates,
  setUrlForGlobe,
  setUrlForLandmark,
} from './lib/urlState';
import { ambientAudio } from './audio/ambientAudio';
import { AudioVisualizerBar } from './components/AudioVisualizerBar';
import { BootSplash } from './components/BootSplash';
import { Compass } from './components/Compass';
import { GalleryModal } from './components/GalleryModal';
import { GlobeOverlay } from './components/GlobeOverlay';
import { InfoDrawer } from './components/InfoDrawer';
import { LandmarkCard } from './components/LandmarkCard';
import { PassportModal } from './components/PassportModal';
import { PlacesOverlay } from './components/PlacesOverlay';
import { PostcardModal } from './components/PostcardModal';
import { ScaleRulerModal } from './components/ScaleRulerModal';
import { SearchSheet } from './components/SearchSheet';
import { SettingsModal } from './components/SettingsModal';
import { TopBar } from './components/TopBar';
import { WeatherWidget } from './components/WeatherWidget';
import { EASTER_EGGS } from './data/easterEggs';
import { LANDMARKS, PROVINCES, slugifyLandmark } from './data/landmarks';
import { formatMetres, referenceHeightM, SCALE_FACTS, scaleRatio } from './data/scaleFacts';
import { HERITAGE_ROUTES } from './data/routes';
import { getSkyEvent, getUpcomingSkyEvents } from './data/skyEvents';
import { getWeatherMoment } from './data/weatherMoments';
import {
  fetchLiveWeather,
  getBestMonths,
  getForecastSlots,
  getMonthCondition,
  getSASTParts,
  pad2,
  type LiveWeatherResult,
  WEATHER_CONDITIONS,
} from './data/weatherData';
import { useOnlineStatus, usePWARegistration } from './hooks/usePWAInstall';
import { formatCoordinates, loadOsmPlace, type LatLon } from './services/osmService';
import type { CitylitEngine } from './three/CitylitEngine';
import { loadCachedThumbnails, saveCachedThumbnails } from './three/thumbnailCache';
import type { PlacesSelectionInfo, PlacesWeatherMode } from './three/placesScene';
import type {
  CameraPreset,
  CitylitSettings,
  ForecastSlot,
  LandmarkNote,
  LiveWeatherSample,
  NoteCategory,
  ResolvedTheme,
  ScaleReferenceKind,
  SavedCustomPlace,
  SkyEvent,
  WeatherConditionKey,
  WeatherDisplayState,
  WeatherMoment,
} from './types/citylit';

function readInitialLandmarkIndex(): number {
  const hash = window.location.hash.slice(1).toLowerCase();
  if (!hash) return 0;
  const idx = LANDMARKS.findIndex((lm) => slugifyLandmark(lm.k) === hash);
  return idx >= 0 ? idx : 0;
}

const INITIAL_GLOBE = readInitialGlobeState(PROVINCES);

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

const EGGS_STORAGE_KEY = 'cl-eggs';

function readStoredEggs(): Set<string> {
  try {
    const raw = localStorage.getItem(EGGS_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set<string>();
    const valid = new Set(Object.values(EASTER_EGGS).map((egg) => egg.id));
    return new Set(arr.filter((v): v is string => typeof v === 'string' && valid.has(v)));
  } catch {
    return new Set<string>();
  }
}

const NOTES_STORAGE_KEY = 'cl-notes';

function readStoredNotes(): Record<number, LandmarkNote[]> {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<number, LandmarkNote[]> = {};
    for (const [key, val] of Object.entries(parsed)) {
      const idx = Number(key);
      if (!Number.isInteger(idx) || idx < 0 || idx >= LANDMARKS.length || !Array.isArray(val)) {
        continue;
      }
      const clean = val.filter((item): item is LandmarkNote => {
        if (!item || typeof item !== 'object') return false;
        const n = item as Partial<LandmarkNote>;
        return (
          typeof n.id === 'string' &&
          typeof n.text === 'string' &&
          n.text.trim().length > 0 &&
          Array.isArray(n.position) &&
          n.position.length === 3 &&
          n.position.every((c) => typeof c === 'number' && Number.isFinite(c)) &&
          typeof n.createdAt === 'number'
        );
      });
      if (clean.length > 0) out[idx] = clean;
    }
    return out;
  } catch {
    return {};
  }
}

const SAVED_PLACES_KEY = 'cl-saved-places';

function readStoredSavedPlaces(): SavedCustomPlace[] {
  try {
    const raw = localStorage.getItem(SAVED_PLACES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SavedCustomPlace => {
      if (!item || typeof item !== 'object') return false;
      const p = item as Partial<SavedCustomPlace>;
      return (
        typeof p.id === 'string' &&
        typeof p.label === 'string' &&
        typeof p.detail === 'string' &&
        typeof p.lat === 'number' &&
        Number.isFinite(p.lat) &&
        typeof p.lon === 'number' &&
        Number.isFinite(p.lon) &&
        typeof p.savedAt === 'number'
      );
    });
  } catch {
    return [];
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
        renderer:
          parsed.renderer === 'webgpu' || parsed.renderer === 'webgl' ? parsed.renderer : 'auto',
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
        // Keep an explicit persisted choice (including 'auto' or 'dark'); only
        // fall back to the first-run default when no valid theme was stored.
        theme:
          parsed.theme === 'auto' ||
          parsed.theme === 'dark' ||
          parsed.theme === 'daylight' ||
          parsed.theme === 'studio'
            ? parsed.theme
            : 'daylight',
        cinematic: parsed.cinematic ?? false,
        scaleMode: parsed.scaleMode ?? false,
        scaleReference:
          parsed.scaleReference === 'person' ||
          parsed.scaleReference === 'springbok' ||
          parsed.scaleReference === 'eiffel'
            ? parsed.scaleReference
            : 'person',
        wildlife: parsed.wildlife ?? true,
        hiddenDetails: parsed.hiddenDetails ?? true,
      };
    }
  } catch {
    // Ignore invalid stored settings
  }
  return {
    quality: 'auto',
    renderer: 'auto',
    volume: 80,
    mixer: defaultMixer,
    haptics: true,
    uiSounds: true,
    motion: 'auto',
    tilt: false,
    theme: 'daylight',
    cinematic: false,
    scaleMode: false,
    scaleReference: 'person',
    wildlife: true,
    hiddenDetails: true,
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
  const [foundEggs, setFoundEggs] = useState<Set<string>>(readStoredEggs);
  const foundEggsRef = useRef(foundEggs);
  const [rulerOpen, setRulerOpen] = useState(false);
  // Captured at mount for the engine's one-time setup effect (deep-link open).
  const visitedRef = useRef(visited);
  const [settings, setSettings] = useState<CitylitSettings>(readSettings);
  const settingsRef = useRef(settings);
  const [autoResolvedTheme, setAutoResolvedTheme] = useState<'daylight' | 'dark'>(() =>
    resolveAutoTheme()
  );
  const effectiveTheme: ResolvedTheme =
    settings.theme === 'auto' ? autoResolvedTheme : resolveTheme(settings.theme);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  const [soundOn, setSoundOn] = useState(false);
  const [todOpen, setTodOpen] = useState(false);
  const [timeHour, setTimeHour] = useState(() => {
    const { h, m } = getSASTParts();
    return h + m / 60;
  });
  /** True once the user has taken manual control of the time-of-day slider. */
  const [timeScrubbed, setTimeScrubbed] = useState(false);
  const [timeLapseActive, setTimeLapseActive] = useState(false);
  const timeHourRef = useRef(timeHour);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  /** Calendar day/year used by the curated sky-event calendar. */
  const [calendarDay, setCalendarDay] = useState(() => new Date().getDate());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
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

  // Enter/exit the cinematic view: hide the in-app chrome and, where the
  // browser permits it, take the whole document fullscreen as well.
  const enterFullscreen = useCallback(() => {
    setFullscreen(true);
    if (typeof document === 'undefined' || document.fullscreenElement) return;
    try {
      const request = document.documentElement.requestFullscreen?.();
      if (request && typeof request.catch === 'function') {
        // Blocked when embedded without the fullscreen permission; the
        // cinematic UI mode still applies as a graceful fallback.
        void request.catch(() => undefined);
      }
    } catch {
      // Ignore: fall back to the cinematic UI mode.
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    setFullscreen(false);
    if (typeof document === 'undefined' || !document.fullscreenElement) return;
    try {
      const result = document.exitFullscreen?.();
      if (result && typeof result.catch === 'function') {
        void result.catch(() => undefined);
      }
    } catch {
      // Ignore: native fullscreen was already released.
    }
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (fullscreen) exitFullscreen();
    else enterFullscreen();
  }, [fullscreen, enterFullscreen, exitFullscreen]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [instantOpen, setInstantOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const galleryOpenRef = useRef(galleryOpen);
  const [passportOpen, setPassportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [globeOpen, setGlobeOpen] = useState(INITIAL_GLOBE.open);
  const [placesOpen, setPlacesOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlacesSelectionInfo | null>(null);
  const [exploring, setExploring] = useState(false);
  const [activeProvince, setActiveProvince] = useState(INITIAL_GLOBE.province);
  const [globeHover, setGlobeHover] = useState<{ index: number; x: number; y: number } | null>(
    null
  );
  const globeUrlSynced = useRef(false);
  const [placesWeatherMode, setPlacesWeatherMode] = useState<PlacesWeatherMode>('auto');

  const [postcardUrl, setPostcardUrl] = useState('');
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [postcardNoteId, setPostcardNoteId] = useState<string | null>(null);
  const [postcardPreviewHour, setPostcardPreviewHour] = useState(13);

  const [tourActive, setTourActive] = useState(false);
  const [compact, setCompact] = useState(() => {
    try {
      const stored = window.localStorage.getItem('cl-compact');
      if (stored === '0' || stored === '1') return stored === '1';
    } catch {
      // Ignore storage failures.
    }
    return window.matchMedia('(max-width: 640px)').matches;
  });
  const [showDirection, setShowDirection] = useState(false);
  const [cutawayActive, setCutawayActive] = useState(false);
  const [pinDropMode, setPinDropMode] = useState(false);
  const [pendingDropPos, setPendingDropPos] = useState<[number, number, number] | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedCustomPlace[]>(readStoredSavedPlaces);
  const [activeExplorerCoords, setActiveExplorerCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [notesByLandmark, setNotesByLandmark] =
    useState<Record<number, LandmarkNote[]>>(readStoredNotes);
  const notesByLandmarkRef = useRef(notesByLandmark);
  const indexRef = useRef(index);
  const [activeNoteCallout, setActiveNoteCallout] = useState<{
    landmarkIndex: number;
    noteId: string;
  } | null>(null);
  const [factText, setFactText] = useState<string | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(true);
  const [cineKey, setCineKey] = useState<number | null>(null);
  const [stampBanner, setStampBanner] = useState<string | null>(null);

  const activeRoute = useMemo(
    () => HERITAGE_ROUTES.find((r) => r.id === activeRouteId) ?? null,
    [activeRouteId]
  );

  const factTimerRef = useRef<number | null>(null);
  const noteTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const cineTimerRef = useRef<number | null>(null);
  const stampTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    notesByLandmarkRef.current = notesByLandmark;
  }, [notesByLandmark]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

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
    setActiveNoteCallout(null);
    setFactText(text);
    if (factTimerRef.current) window.clearTimeout(factTimerRef.current);
    factTimerRef.current = window.setTimeout(() => setFactText(null), 5200);
  }, []);

  const addFoundEgg = useCallback((id: string) => {
    setFoundEggs((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(EGGS_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Ignore storage failures
      }
      engineRef.current?.setFoundEggs(next);
      return next;
    });
  }, []);

  const resetEggs = useCallback(() => {
    setFoundEggs(new Set<string>());
    try {
      localStorage.removeItem(EGGS_STORAGE_KEY);
    } catch {
      // Ignore storage failures
    }
    engineRef.current?.setFoundEggs(new Set<string>());
    showToast('Hidden details cleared');
  }, [showToast]);

  const showUserNoteCallout = useCallback((landmarkIndex: number, noteId: string) => {
    ambientAudio.playUi('subtle', { intensity: 0.8 });
    setFactText(null);
    setActiveNoteCallout({ landmarkIndex, noteId });
    if (noteTimerRef.current) window.clearTimeout(noteTimerRef.current);
    noteTimerRef.current = window.setTimeout(() => setActiveNoteCallout(null), 8500);
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
      setActiveNoteCallout(null);
      setPinDropMode(false);
      setPendingDropPos(null);
      setCutawayActive(false);
      engineRef.current?.setPinDropMode(false);
      engineRef.current?.setCutawayMode(false);
      setUrlForLandmark(slugifyLandmark(LANDMARKS[wrapped].k));
      engineRef.current?.setUserNotes(wrapped, notesByLandmarkRef.current[wrapped] ?? []);
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
      .then(async ({ CitylitEngine: Engine }) => {
        if (unmounted) return;

        const instance = await Engine.create(host, {
          onFirstInteract: () => setHintVisible(false),
          onFactDot: (text) => showFact(text),
          onWildlifeTap: (_id, fact) => {
            ambientAudio.vibrate(10);
            showFact(fact);
          },
          onHiddenDetailFound: (id, label, fact) => {
            addFoundEgg(id);
            ambientAudio.playUi('success', { intensity: 0.85 });
            ambientAudio.vibrate(18);
            setFactText(`${label} — ${fact}`);
            if (factTimerRef.current) window.clearTimeout(factTimerRef.current);
            factTimerRef.current = window.setTimeout(() => setFactText(null), 6200);
            launchConfetti();
            showToast('Hidden detail found');
          },
          onUserNotePin: (noteId) => showUserNoteCallout(indexRef.current, noteId),
          onPinDropPosition: (pos) => {
            setPinDropMode(false);
            if (pos) {
              setPendingDropPos(pos);
              ambientAudio.playUi('tap', { intensity: 0.8 });
              showToast('3D point locked — write your note');
            }
          },
          onGlobePinHover: (pinIndex, x, y) => {
            setGlobeHover((prev) => {
              if (pinIndex === null) return prev === null ? prev : null;
              const px = x ?? 0;
              const py = y ?? 0;
              if (
                prev &&
                prev.index === pinIndex &&
                Math.abs(prev.x - px) < 8 &&
                Math.abs(prev.y - py) < 8
              ) {
                return prev;
              }
              return { index: pinIndex, x: px, y: py };
            });
          },
          onGlobeReset: () => setActiveProvince('All'),
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
        const initialTheme = resolveTheme(readSettings().theme);
        document.documentElement.dataset.theme = initialTheme;
        instance.setTheme(initialTheme, true);
        instance.setSeasonMonth(new Date().getMonth() + 1, true);
        instance.setFoundEggs(foundEggsRef.current);
        const initialSettings = settingsRef.current;
        instance.setWildlifeEnabled(initialSettings.wildlife ?? true);
        instance.setHiddenDetailsEnabled(initialSettings.hiddenDetails ?? true);
        instance.setScaleReference(
          initialSettings.scaleMode ? initialSettings.scaleReference ?? 'person' : null
        );
        for (const [lmKey, lmNotes] of Object.entries(notesByLandmarkRef.current)) {
          instance.setUserNotes(Number(lmKey), lmNotes);
        }
        const initialCoord = readInitialCoordinate();
        if (initialCoord) {
          setActiveExplorerCoords(initialCoord);
          void loadOsmPlace(initialCoord).then((data) => {
            if (unmounted) return;
            const info = instance.openOsmPlace(data);
            setSelectedPlace(info);
            setPlacesOpen(true);
          });
        } else {
          instance.showLandmarkImmediate(initialIdx);
          if (INITIAL_GLOBE.open) {
            instance.openGlobe(visitedRef.current);
            instance.globe.setActiveProvince(INITIAL_GLOBE.province);
            if (INITIAL_GLOBE.province !== 'All') {
              instance.globe.flyToProvince(INITIAL_GLOBE.province);
            }
            setGlobeOpen(true);
          }
        }
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
  }, [selectLandmark, showFact, showToast, showUserNoteCallout, addFoundEgg, launchConfetti]);

  // Pause WebGL render loop while tab is hidden or full-screen opaque gallery covers viewport
  useEffect(() => {
    galleryOpenRef.current = galleryOpen;
    engineRef.current?.setPaused(docHidden || galleryOpen);
  }, [docHidden, galleryOpen]);

  // Dynamically update resolved theme from local wall-clock time when 'auto' is selected.
  useEffect(() => {
    if (settings.theme !== 'auto') return undefined;
    let boundaryTimer = 0;
    const syncAndSchedule = () => {
      const now = new Date();
      setAutoResolvedTheme(resolveAutoTheme(now));
      window.clearTimeout(boundaryTimer);
      boundaryTimer = window.setTimeout(syncAndSchedule, msUntilNextThemeBoundary(now));
    };
    syncAndSchedule();
    const interval = window.setInterval(() => {
      setAutoResolvedTheme(resolveAutoTheme());
    }, 30_000);
    const onResume = () => {
      if (!document.hidden) syncAndSchedule();
    };
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('focus', onResume);
    return () => {
      window.clearTimeout(boundaryTimer);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('focus', onResume);
    };
  }, [settings.theme]);

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
    document.documentElement.dataset.theme = effectiveTheme;
    engineRef.current?.applyQuality(settings.quality);
    engineRef.current?.setTheme(effectiveTheme);
    engineRef.current?.setMotionPreferences(reducedMotion);
    engineRef.current?.setTiltEnabled(settings.tilt);
    engineRef.current?.setCinematic(settings.cinematic);
    settingsRef.current = settings;
    engineRef.current?.setScaleReference(
      settings.scaleMode ? settings.scaleReference ?? 'person' : null
    );
    engineRef.current?.setWildlifeEnabled(settings.wildlife ?? true);
    engineRef.current?.setHiddenDetailsEnabled(settings.hiddenDetails ?? true);
    try {
      localStorage.setItem('cl-st', JSON.stringify(settings));
    } catch {
      // Ignore storage failures
    }
  }, [settings, effectiveTheme, reducedMotion]);

  useEffect(() => {
    foundEggsRef.current = foundEggs;
    engineRef.current?.setFoundEggs(foundEggs);
  }, [foundEggs]);

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

    if (isNow && isOnline && !timeLapseActive) {
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
  }, [index, month, timeHour, isOnline, timeLapseActive]);

  // The dated sky calendar and the real-condition weather moments both feed
  // the same weather scene: one drives the sky, the other the ground weather.
  const skyEvent = useMemo<SkyEvent | null>(
    () => getSkyEvent(month, calendarDay, calendarYear),
    [month, calendarDay, calendarYear]
  );
  const upcomingSkyEvents = useMemo(
    () => getUpcomingSkyEvents(month, calendarDay, calendarYear, 3),
    [month, calendarDay, calendarYear]
  );
  const weatherMoment = useMemo<WeatherMoment | null>(
    () =>
      weatherState.live
        ? getWeatherMoment(LANDMARKS[index]?.k ?? '', weatherState.live)
        : null,
    [index, weatherState.live]
  );

  // `booted` is read here so the scene effects are replayed once the
  // dynamically imported engine finishes initialising.
  useEffect(() => {
    if (!booted) return;
    engineRef.current?.setSkyEvent(skyEvent);
    engineRef.current?.setWeatherMoment(weatherMoment);
  }, [skyEvent, weatherMoment, booted]);

  useEffect(() => {
    timeHourRef.current = timeHour;
  }, [timeHour]);

  useEffect(() => {
    engineRef.current?.setTimeLapsePlaying(
      timeLapseActive && !docHidden && !globeOpen && !placesOpen
    );
  }, [timeLapseActive, docHidden, globeOpen, placesOpen]);

  useEffect(() => {
    if (!globeOpen && !placesOpen && !fullscreen) {
      const id = window.requestAnimationFrame(() => {
        engineRef.current?.refreshFraming();
      });
      return () => window.cancelAnimationFrame(id);
    }
    return undefined;
  }, [fullscreen, globeOpen, placesOpen]);

  // 24-hour atmospheric Time Lapse cycle
  useEffect(() => {
    if (!timeLapseActive || docHidden || globeOpen || placesOpen) return undefined;
    let raf = 0;
    let last = performance.now();
    let lastUiSync = last;
    let curHour = timeHourRef.current;

    const step = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      curHour = (curHour + dt * 2.2) % 24;
      engineRef.current?.setSunAltitudeFromSlider(curHour);
      if (now - lastUiSync >= 140) {
        lastUiSync = now;
        setTimeHour(curHour);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [timeLapseActive, docHidden, globeOpen, placesOpen]);

  // Keep the scene on SAST real time until the user takes manual control
  useEffect(() => {
    if (timeScrubbed || timeLapseActive) return undefined;
    const timer = window.setInterval(() => {
      const { h, m } = getSASTParts();
      setTimeHour(h + m / 60);
    }, 60000);
    return () => window.clearInterval(timer);
  }, [timeScrubbed, timeLapseActive]);

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

  // Mirror native fullscreen changes (Esc, browser UI, permission loss) into
  // app state so the in-app chrome follows the real fullscreen state.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

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

  // Keep 3D directional indicator aligned with the active landmark & UI toggle
  useEffect(() => {
    engineRef.current?.setDirectionGuide(showDirection && !fullscreen, index);
  }, [showDirection, index, fullscreen]);

  // Sync cutaway Inspect mode & active Heritage Route onto 3D scene and Globe
  useEffect(() => {
    engineRef.current?.setCutawayMode(cutawayActive && !globeOpen && !placesOpen);
  }, [cutawayActive, globeOpen, placesOpen]);

  useEffect(() => {
    engineRef.current?.globe.setActiveRoute(
      activeRoute ? activeRoute.stopIndices : [],
      activeRoute?.color ?? '#e8b04a'
    );
  }, [activeRoute]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        galleryOpen
      ) {
        return;
      }
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
      if (e.key === 'ArrowRight' || e.key === ']') selectLandmark(index + 1);
      else if (e.key === 'ArrowLeft' || e.key === '[') selectLandmark(index - 1);
      else if (e.key === ' ') {
        if (
          !globeOpen &&
          !placesOpen &&
          !settingsOpen &&
          !passportOpen &&
          !searchOpen &&
          !postcardOpen &&
          !infoOpen
        ) {
          e.preventDefault();
          ambientAudio.playUi('toggle');
          setTourActive((v) => !v);
        }
      } else if (e.key === 'p' || e.key === 'P') {
        if (
          !globeOpen &&
          !placesOpen &&
          !settingsOpen &&
          !passportOpen &&
          !searchOpen &&
          !postcardOpen &&
          !infoOpen
        ) {
          e.preventDefault();
          const stepped = engineRef.current?.stepInteractivePin(e.shiftKey ? -1 : 1);
          if (stepped?.kind === 'note' && stepped.noteId) {
            showUserNoteCallout(index, stepped.noteId);
          } else if (stepped?.kind === 'fact' && stepped.text) {
            showFact(stepped.text);
          }
        }
      } else if (e.key === 'r' || e.key === 'R' || e.key === '0') {
        if (
          !globeOpen &&
          !placesOpen &&
          !settingsOpen &&
          !passportOpen &&
          !searchOpen &&
          !postcardOpen
        ) {
          engineRef.current?.frameCurrentLandmark();
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (
          !globeOpen &&
          !placesOpen &&
          !settingsOpen &&
          !passportOpen &&
          !searchOpen &&
          !postcardOpen &&
          !infoOpen &&
          !rulerOpen
        ) {
          e.preventDefault();
          ambientAudio.playUi('toggle');
          setSettings((prev) => ({ ...prev, scaleMode: !prev.scaleMode }));
        }
      } else if (e.key === '/') {
        e.preventDefault();
        setInstantOpen(true);
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
        } else if (rulerOpen) {
          setRulerOpen(false);
        } else if (activeNoteCallout) {
          setActiveNoteCallout(null);
        } else if (fullscreen) exitFullscreen();
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
    rulerOpen,
    activeNoteCallout,
    fullscreen,
    exitFullscreen,
    selectLandmark,
    showFact,
    showUserNoteCallout,
  ]);

  // Mirror globe state into the URL for deep-linking. Skip the first run so an
  // incoming `?lat=&lon=` coordinate link isn't clobbered on mount.
  useEffect(() => {
    if (!globeUrlSynced.current) {
      globeUrlSynced.current = true;
      return;
    }
    setUrlForGlobe(globeOpen, activeProvince);
  }, [globeOpen, activeProvince]);

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

  const persistNotes = useCallback((next: Record<number, LandmarkNote[]>) => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }, []);

  const handleAddNote = useCallback(
    (
      text: string,
      category: NoteCategory = 'memory',
      customPosition?: readonly [number, number, number]
    ) => {
      const existing = notesByLandmarkRef.current[index] ?? [];
      const position: [number, number, number] = customPosition
        ? [customPosition[0], customPosition[1], customPosition[2]]
        : (engineRef.current?.computeDefaultNotePosition(index, existing.length) ?? [
            Number((Math.cos(existing.length * 2.4) * 2.4).toFixed(2)),
            2.2,
            Number((Math.sin(existing.length * 2.4) * 2.4).toFixed(2)),
          ]);
      const newNote: LandmarkNote = {
        id:
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text,
        category,
        position,
        createdAt: Date.now(),
      };
      const updatedList = [...existing, newNote];
      const next = { ...notesByLandmarkRef.current, [index]: updatedList };
      setNotesByLandmark(next);
      persistNotes(next);
      setPendingDropPos(null);
      setPinDropMode(false);
      engineRef.current?.setPinDropMode(false);
      engineRef.current?.setUserNotes(index, updatedList, newNote.id);
      ambientAudio.playUi('success', { intensity: 0.72 });
      ambientAudio.vibrate(10);
      showToast('Pinned private note in 3D');
    },
    [index, persistNotes, showToast]
  );

  const handleUpdateNote = useCallback(
    (noteId: string, text: string) => {
      const existing = notesByLandmarkRef.current[index] ?? [];
      const updatedList = existing.map((n) => (n.id === noteId ? { ...n, text } : n));
      const next = { ...notesByLandmarkRef.current, [index]: updatedList };
      setNotesByLandmark(next);
      persistNotes(next);
      engineRef.current?.setUserNotes(index, updatedList);
      ambientAudio.playUi('tap', { intensity: 0.65 });
      showToast('Note updated');
    },
    [index, persistNotes, showToast]
  );

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      const existing = notesByLandmarkRef.current[index] ?? [];
      const updatedList = existing.filter((n) => n.id !== noteId);
      const next = { ...notesByLandmarkRef.current };
      if (updatedList.length > 0) next[index] = updatedList;
      else delete next[index];
      setNotesByLandmark(next);
      persistNotes(next);
      engineRef.current?.setUserNotes(index, updatedList);
      setActiveNoteCallout((prev) =>
        prev && prev.landmarkIndex === index && prev.noteId === noteId ? null : prev
      );
      ambientAudio.playUi('toggle');
      showToast('Note removed');
    },
    [index, persistNotes, showToast]
  );

  const handleFocusNote = useCallback(
    (noteId: string) => {
      engineRef.current?.focusUserNote(noteId);
      showUserNoteCallout(index, noteId);
    },
    [index, showUserNoteCallout]
  );

  const handleStepPin = useCallback(
    (dir: 1 | -1) => {
      const stepped = engineRef.current?.stepInteractivePin(dir);
      if (stepped?.kind === 'note' && stepped.noteId) {
        showUserNoteCallout(index, stepped.noteId);
      } else if (stepped?.kind === 'fact' && stepped.text) {
        showFact(stepped.text);
      }
    },
    [index, showFact, showUserNoteCallout]
  );

  const handleJumpToNote = useCallback(
    (landmarkIndex: number, noteId: string) => {
      if (globeOpen) engineRef.current?.closeGlobe();
      if (placesOpen) engineRef.current?.closePlaces();
      setGlobeOpen(false);
      setPlacesOpen(false);
      if (landmarkIndex !== index) {
        selectLandmark(landmarkIndex, { cinematic: true });
        window.setTimeout(() => {
          engineRef.current?.focusUserNote(noteId);
          showUserNoteCallout(landmarkIndex, noteId);
        }, 620);
      } else {
        engineRef.current?.focusUserNote(noteId);
        showUserNoteCallout(landmarkIndex, noteId);
      }
    },
    [globeOpen, placesOpen, index, selectLandmark, showUserNoteCallout]
  );

  const handleSelectRoute = useCallback(
    (routeId: string | null) => {
      setActiveRouteId(routeId);
      if (!routeId) {
        showToast('Heritage route cleared');
        return;
      }
      const route = HERITAGE_ROUTES.find((r) => r.id === routeId);
      if (!route) return;
      showToast(`Following ${route.name}`);
      if (!route.stopIndices.includes(index)) {
        selectLandmark(route.stopIndices[0], { cinematic: true });
      }
    },
    [index, selectLandmark, showToast]
  );

  const handleNextRouteStop = useCallback(() => {
    if (!activeRoute || activeRoute.stopIndices.length === 0) return;
    const curPos = activeRoute.stopIndices.indexOf(index);
    const nextStop =
      curPos >= 0
        ? activeRoute.stopIndices[(curPos + 1) % activeRoute.stopIndices.length]
        : activeRoute.stopIndices[0];
    selectLandmark(nextStop, { cinematic: true });
  }, [activeRoute, index, selectLandmark]);

  const handleViewRouteOnGlobe = useCallback(
    (routeId: string) => {
      const route = HERITAGE_ROUTES.find((r) => r.id === routeId);
      if (!route || !engineRef.current) return;
      setActiveRouteId(routeId);
      setSearchOpen(false);
      setInfoOpen(false);
      setWeatherExpanded(false);
      if (engineRef.current.places.isOpen) engineRef.current.closePlaces();
      setPlacesOpen(false);
      engineRef.current.openGlobe(visited);
      engineRef.current.globe.setActiveRoute(route.stopIndices, route.color);
      setGlobeOpen(true);
    },
    [visited]
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
    setPostcardNoteId(null);
    setPostcardPreviewHour(timeHour);
    const url = engineRef.current.capturePostcard(
      index,
      `${weatherState.temp}°C · ${weatherState.label} · ${weatherState.timeText}`
    );
    setPostcardUrl(url);
    setPostcardOpen(true);
  }, [index, weatherState, timeHour]);

  const handleRegeneratePostcard = useCallback(
    (opts: { noteId?: string | null; hour?: number }) => {
      if (!engineRef.current) return;
      const nextHour = opts.hour ?? postcardPreviewHour;
      const nextNoteId = opts.noteId !== undefined ? opts.noteId : postcardNoteId;
      if (opts.hour !== undefined) {
        setPostcardPreviewHour(opts.hour);
        setTimeHour(opts.hour);
        setTimeScrubbed(true);
        setTimeLapseActive(false);
        engineRef.current.setSunAltitudeImmediate(opts.hour);
      }
      if (opts.noteId !== undefined) {
        setPostcardNoteId(opts.noteId);
      }
      const noteObj = nextNoteId
        ? (notesByLandmarkRef.current[index] ?? []).find((n) => n.id === nextNoteId)
        : undefined;
      const cond = getMonthCondition(index, month, nextHour);
      const timeStr = `${pad2(Math.floor(nextHour))}:${pad2(Math.floor((nextHour % 1) * 60))} SAST`;
      const weatherLine = `${cond.temp}°C · ${WEATHER_CONDITIONS[cond.k].label} · ${timeStr}`;
      const url = engineRef.current.capturePostcard(index, weatherLine, {
        noteText: noteObj?.text,
      });
      setPostcardUrl(url);
    },
    [index, month, postcardNoteId, postcardPreviewHour]
  );

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

  /** Leave both exploration stages and restore the landmark diorama. */
  const backToLandmarks = useCallback(() => {
    if (!engineRef.current) return;
    ambientAudio.playUi('close');
    if (engineRef.current.places.isOpen) engineRef.current.closePlaces();
    if (engineRef.current.globe.isOpen) engineRef.current.closeGlobe();
    setPlacesOpen(false);
    setGlobeOpen(false);
    setSelectedPlace(null);
    setUrlForLandmark(slugifyLandmark(LANDMARKS[index].k));
  }, [index]);

  const toggleGlobe = useCallback(() => {
    if (!engineRef.current) return;
    if (globeOpen) {
      ambientAudio.playUi('close');
      setGlobeHover(null);
      // Never leave the Places stage visible behind a closed globe.
      if (engineRef.current.places.isOpen) engineRef.current.closePlaces();
      engineRef.current.closeGlobe();
      setPlacesOpen(false);
      setGlobeOpen(false);
    } else {
      setSearchOpen(false);
      setInfoOpen(false);
      setWeatherExpanded(false);
      if (engineRef.current.places.isOpen) engineRef.current.closePlaces();
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

  const exploreCoordinates = useCallback(
    async (center: LatLon) => {
      if (!engineRef.current) return;
      setExploring(true);
      setSearchOpen(false);
      setInfoOpen(false);
      setWeatherExpanded(false);
      setTodOpen(false);
      setGlobeOpen(false);
      try {
        const data = await loadOsmPlace(center);
        const info = engineRef.current.openOsmPlace(data);
        setActiveExplorerCoords(center);
        setSelectedPlace(info);
        setPlacesOpen(true);
        setUrlForCoordinates(center);
        showToast(`Exploring ${formatCoordinates(center)}`);
      } finally {
        setExploring(false);
      }
    },
    [showToast]
  );

  const handleToggleSavePlace = useCallback(
    (place: { lat: number; lon: number; label: string; detail: string }) => {
      setSavedPlaces((prev) => {
        const existingIdx = prev.findIndex(
          (p) => Math.abs(p.lat - place.lat) < 0.0002 && Math.abs(p.lon - place.lon) < 0.0002
        );
        const next =
          existingIdx >= 0
            ? prev.filter((_, idx) => idx !== existingIdx)
            : [
                {
                  id:
                    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                      ? crypto.randomUUID()
                      : `place-${Date.now()}`,
                  lat: place.lat,
                  lon: place.lon,
                  label: place.label,
                  detail: place.detail,
                  savedAt: Date.now(),
                },
                ...prev,
              ].slice(0, 12);
        try {
          localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage failures
        }
        ambientAudio.playUi(existingIdx >= 0 ? 'toggle' : 'success', { intensity: 0.7 });
        showToast(existingIdx >= 0 ? 'Removed saved place' : 'Saved coordinate slice');
        return next;
      });
    },
    [showToast]
  );

  const handleRemoveSavedPlace = useCallback((id: string) => {
    setSavedPlaces((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage failures
      }
      return next;
    });
    ambientAudio.playUi('toggle');
  }, []);

  const handleOpenSavedPlace = useCallback(
    (place: SavedCustomPlace) => {
      void exploreCoordinates({ lat: place.lat, lon: place.lon });
    },
    [exploreCoordinates]
  );

  const closePlaces = useCallback(() => {
    if (!engineRef.current) return;
    ambientAudio.playUi('close');
    engineRef.current.closePlaces();
    setPlacesOpen(false);
    setSelectedPlace(null);
    setActiveExplorerCoords(null);
    setUrlForLandmark(slugifyLandmark(LANDMARKS[index].k));
  }, [index]);

  const forecast = useMemo(
    () => liveForecast ?? getForecastSlots(index, month),
    [liveForecast, index, month]
  );
  const bestMonths = useMemo(() => getBestMonths(index), [index]);
  const scaleFact = SCALE_FACTS[LANDMARKS[index].k];
  const scaleKind: ScaleReferenceKind = settings.scaleReference ?? 'person';
  const referenceFactor = scaleFact?.modelUnits
    ? referenceDisplayFactor(scaleFact.magnitudeM, scaleFact.modelUnits, scaleKind)
    : null;

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
                effectiveTheme === 'dark' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              aria-hidden="true"
              className={`fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_64%,rgba(16,32,48,0.16))] transition-opacity duration-700 ease-out ${
                effectiveTheme === 'daylight' ? 'opacity-100' : 'opacity-0'
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
          theme={effectiveTheme}
          scaleMode={settings.scaleMode ?? false}
          reducedMotion={reducedMotion}
          onToggleScale={() => {
            ambientAudio.playUi('toggle');
            setSettings((prev) => ({ ...prev, scaleMode: !prev.scaleMode }));
          }}
          onToggleSound={handleToggleSound}
          onToggleTod={() => {
            ambientAudio.playUi(todOpen ? 'close' : 'open');
            setTodOpen((v) => !v);
          }}
          onToggleFullscreen={handleToggleFullscreen}
          onOpenSearch={() => {
            setInstantOpen(false);
            setSearchOpen(true);
          }}
        />

        {/* Scale-mode badge */}
        {settings.scaleMode &&
          !globeOpen &&
          !placesOpen &&
          !fullscreen &&
          scaleFact?.magnitudeM && (
            <div className="fixed left-4 top-[calc(116px+env(safe-area-inset-top,0px))] z-40 max-w-[min(320px,calc(100vw-32px))] px-3 py-2 rounded-xl bg-[#121319]/90 border border-[#e8b04a]/35 text-[11.5px] text-[#f3efe6] pointer-events-none sm:top-[calc(70px+env(safe-area-inset-top,0px))]">
              <div className="font-medium">
                {formatMetres(scaleFact.magnitudeM)} {scaleFact.label} · ≈
                {Math.round(scaleRatio(scaleFact.magnitudeM, referenceHeightM(scaleKind))).toLocaleString('en-ZA')}{' '}
                {scaleKind === 'eiffel' ? 'Eiffel Towers' : `${scaleKind}s`} tall
              </div>
              {referenceFactor !== null && Math.abs(referenceFactor - 1) >= 0.02 && (
                <div className="mt-0.5 text-[10.5px] text-[#a9a69e]">
                  Silhouette {referenceFactor > 1 ? 'enlarged' : 'reduced'} ×
                  {referenceFactor.toFixed(1)} for legibility
                </div>
              )}
            </div>
          )}

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
                setTimeLapseActive(false);
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
                  setTimeLapseActive(false);
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
          landmarkIndex={index}
          weather={weatherState}
          expanded={weatherExpanded}
          month={month}
          bestMonths={bestMonths}
          forecast={forecast}
          activeTimeHour={timeHour}
          timeLapseActive={timeLapseActive}
          visible={!fullscreen}
          globeOpen={globeOpen || placesOpen}
          reducedMotion={reducedMotion}
          skyEvent={skyEvent}
          upcomingSkyEvents={upcomingSkyEvents}
          weatherMoment={weatherMoment}
          calendarDay={calendarDay}
          calendarYear={calendarYear}
          onChangeCalendarDate={(year, m, day) => {
            setCalendarYear(year);
            setMonth(m);
            setCalendarDay(day);
          }}
          onResetCalendarDate={() => {
            const today = new Date();
            setCalendarYear(today.getFullYear());
            setMonth(today.getMonth() + 1);
            setCalendarDay(today.getDate());
          }}
          onToggleExpand={() => {
            setWeatherExpanded((v) => !v);
            window.requestAnimationFrame(() => engineRef.current?.refreshFraming());
          }}
          onSelectTimePreset={(h) => {
            setTimeLapseActive(false);
            setTimeHour(h);
            setTimeScrubbed(true);
            engineRef.current?.setSunAltitudeFromSlider(h);
          }}
          onToggleTimeLapse={() => {
            setTimeScrubbed(true);
            setTimeLapseActive((v) => !v);
          }}
          onChangeMonth={(m) => {
            setMonth(m);
            setCalendarDay((d) => Math.min(d, new Date(calendarYear, m, 0).getDate()));
          }}
          onTriggerRainbow={() => engineRef.current?.toggleRainRainbow()}
          onToggleGlobe={toggleGlobe}
        />

        {/* Compass */}
        <Compass
          getEngine={() => engineRef.current}
          landmarkIndex={index}
          visible={!fullscreen || !idleInFullscreen}
          directionActive={showDirection}
          reducedMotion={reducedMotion}
        />

        {/* Bottom Landmark Card */}
        <LandmarkCard
          index={index}
          isFavorite={favorites.has(index)}
          compact={compact}
          onToggleCompact={() => {
            ambientAudio.playUi('toggle');
            setCompact((v) => {
              try {
                window.localStorage.setItem('cl-compact', v ? '0' : '1');
              } catch {
                // Ignore storage failures.
              }
              return !v;
            });
          }}
          directionActive={showDirection}
          cutawayActive={cutawayActive}
          pinDropMode={pinDropMode}
          pendingDropPos={pendingDropPos}
          activeRoute={activeRoute}
          notes={notesByLandmark[index] ?? []}
          activeNoteId={
            activeNoteCallout?.landmarkIndex === index ? activeNoteCallout.noteId : null
          }
          visible={!fullscreen && !globeOpen && !placesOpen}
          reducedMotion={reducedMotion}
          onPrev={() => selectLandmark(index - 1)}
          onNext={() => selectLandmark(index + 1)}
          onToggleFavorite={() => toggleFavorite(index)}
          onToggleDirection={() => {
            ambientAudio.playUi('toggle');
            setShowDirection((v) => !v);
          }}
          onToggleCutaway={() => {
            ambientAudio.playUi('toggle');
            setCutawayActive((v) => !v);
          }}
          onTogglePinDrop={() => {
            setPinDropMode((prev) => {
              const next = !prev;
              engineRef.current?.setPinDropMode(next);
              ambientAudio.playUi('toggle');
              if (next) showToast('Tap anywhere on the 3D landmark to anchor pin');
              return next;
            });
          }}
          onClearPendingDrop={() => setPendingDropPos(null)}
          onApplyCameraPreset={(preset: CameraPreset) => {
            ambientAudio.playUi('tap', { intensity: 0.7 });
            engineRef.current?.applyCameraPreset(preset);
          }}
          onStepPin={handleStepPin}
          onNextRouteStop={handleNextRouteStop}
          onClearRoute={() => handleSelectRoute(null)}
          onAddNote={handleAddNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onFocusNote={handleFocusNote}
          onOpenInfo={() => setInfoOpen(true)}
          onOpenGallery={() => setGalleryOpen(true)}
          onOpenPostcard={handleOpenPostcard}
          onOpenGlobe={toggleGlobe}
          onShare={shareCurrentLandmark}
          onVibrate={() => {
            ambientAudio.playUi('expand');
            ambientAudio.vibrate(18);
          }}
          onDragParallax={(dx) => engineRef.current?.setCardDragParallax(dx)}
        />

        {/* Desktop Orbit Hint */}
        {!fullscreen && !globeOpen && !placesOpen && hintVisible && (
          <div
            className={`hidden md:block fixed right-4 bottom-[calc(18px+env(safe-area-inset-bottom,0px))] text-[12px] pointer-events-none transition-colors duration-500 ${
              effectiveTheme === 'dark' ? 'text-[#a9a69e]' : 'text-[#1c2330]/75'
            }`}
          >
            Drag to orbit · Scroll to zoom · Space tour · R reframe · Tap pins
          </div>
        )}

        {/* Minimalist Ambient Audio Frequency Bar (visible only when sound is ON) */}
        <AudioVisualizerBar active={soundOn} theme={effectiveTheme} reducedMotion={reducedMotion} />

        {/* Globe Overlay HUD */}
        <GlobeOverlay
          open={globeOpen}
          activeProvince={activeProvince}
          reducedMotion={reducedMotion}
          onSelectProvince={(pv) => {
            setActiveProvince(pv);
            engineRef.current?.globe.flyToProvince(pv);
          }}
          onSelectLandmark={(i) => {
            setGlobeHover(null);
            selectLandmark(i, { cinematic: true });
          }}
          onResetView={() => {
            setActiveProvince('All');
            engineRef.current?.globe.resetView();
          }}
          onOpenPlaces={openPlaces}
          onBackToLandmarks={backToLandmarks}
          onClose={toggleGlobe}
        />

        {/* Hover label for globe pins, which live inside the WebGL canvas. */}
        {globeOpen && globeHover && LANDMARKS[globeHover.index] && (
          <div
            className="pointer-events-none fixed z-30 max-w-[220px] -translate-y-full rounded-lg border border-white/15 bg-[#121319]/95 px-2.5 py-1.5 text-[12px] leading-tight text-[#f3efe6] shadow-xl backdrop-blur-sm"
            style={{ left: globeHover.x + 14, top: globeHover.y - 6 }}
            role="status"
          >
            <span className="font-semibold text-[#e8b04a]">{LANDMARKS[globeHover.index].k}</span>
            <span className="block text-[11px] text-white/60">
              {LANDMARKS[globeHover.index].c}
              {visited.has(globeHover.index) ? ' · visited' : ''}
            </span>
          </div>
        )}

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
          activeExplorerCoords={activeExplorerCoords}
          savedPlaces={savedPlaces}
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
            setSelectedPlace(null);
            setActiveExplorerCoords(null);
            selectLandmark(pickedIndex, { cinematic: true });
          }}
          onResetView={() => {
            setActiveProvince('All');
            engineRef.current?.places.resetOverview();
          }}
          onSwitchToGlobe={toggleGlobe}
          onBackToLandmarks={backToLandmarks}
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
          onToggleSavePlace={handleToggleSavePlace}
          onOpenSavedPlace={handleOpenSavedPlace}
          onRemoveSavedPlace={handleRemoveSavedPlace}
          onClose={closePlaces}
        />

        {/* Fact & Private User Pin Callouts */}
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
          {!factText &&
            activeNoteCallout &&
            (() => {
              const pinnedNote = (notesByLandmark[activeNoteCallout.landmarkIndex] ?? []).find(
                (n) => n.id === activeNoteCallout.noteId
              );
              if (!pinnedNote) return null;
              const catInfo =
                pinnedNote.category === 'photo'
                  ? { label: 'Photo Spot Pin', color: '#e8b04a', border: 'border-[#e8b04a]/55' }
                  : pinnedNote.category === 'history'
                    ? { label: 'History Pin', color: '#ff7a8a', border: 'border-[#ff7a8a]/55' }
                    : { label: 'Memory Pin', color: '#5cd6a9', border: 'border-[#5cd6a9]/55' };
              return (
                <motion.div
                  key={`user-note-${pinnedNote.id}`}
                  role="status"
                  variants={toastVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={reducedMotion ? { duration: 0 } : undefined}
                  className={`fixed left-3.5 bottom-[calc(var(--cl-card-h,218px)+env(safe-area-inset-bottom,0px)+26px)] z-20 w-[min(532px,calc(100vw-28px))] px-4 py-3 bg-[#121319]/95 border ${catInfo.border} rounded-2xl text-[13.5px] text-[#f3efe6] flex items-start gap-2.5 shadow-xl`}
                >
                  <MapPin
                    size={17}
                    weight="fill"
                    style={{ color: catInfo.color }}
                    className="shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.12em] mb-0.5"
                      style={{ color: catInfo.color }}
                    >
                      <span>{catInfo.label}</span>
                      <span aria-hidden="true" className="text-white/30">
                        ·
                      </span>
                      <span className="font-mono tabular-nums text-[#a9a69e] normal-case tracking-normal">
                        {new Date(pinnedNote.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="m-0 leading-snug break-words text-[#f3efe6]">{pinnedNote.text}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(pinnedNote.id)}
                      aria-label="Delete this private note"
                      title="Delete note"
                      className="w-7 h-7 rounded-lg grid place-items-center text-[#a9a69e] hover:text-[#ff7a8a] hover:bg-white/[0.08] cursor-pointer"
                    >
                      <Trash size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveNoteCallout(null)}
                      aria-label="Dismiss note callout"
                      className="w-7 h-7 rounded-lg grid place-items-center text-[#a9a69e] hover:text-[#f3efe6] hover:bg-white/[0.08] cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })()}
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
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              key="offline-pill"
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={reducedMotion ? { duration: 0 } : undefined}
              className="fixed left-1/2 -translate-x-1/2 bottom-[calc(18px+env(safe-area-inset-bottom,0px))] z-50 px-3.5 py-1 rounded-full bg-[#14161e] border border-[#e8b04a]/40 text-[11.5px] text-[#e8b04a]"
            >
              Offline mode · 3D models & cached photos ready
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinematic Tour Letterbox & Title */}
        {cineKey && (
          <>
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0 }}
              transition={{ duration: reducedMotion ? 0 : DURATION.fast, ease: EASE_SMOOTH_OUT }}
              style={{ transformOrigin: 'top' }}
              className="fixed inset-x-0 top-0 h-[6vh] bg-black z-30 pointer-events-none"
            />
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0 }}
              transition={{ duration: reducedMotion ? 0 : DURATION.fast, ease: EASE_SMOOTH_OUT }}
              style={{ transformOrigin: 'bottom' }}
              className="fixed inset-x-0 bottom-0 h-[6vh] bg-black z-30 pointer-events-none"
            />
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
                transition={SPRING.pop}
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
          instantOpen={instantOpen}
          onClose={() => setSearchOpen(false)}
          onSelectLandmark={(i) => selectLandmark(i)}
          onSelectTime={(h) => {
            setTimeLapseActive(false);
            setTimeHour(h);
            setTimeScrubbed(true);
            engineRef.current?.setSunAltitudeFromSlider(h);
          }}
          onToggleFavorite={toggleFavorite}
          onOpenPassport={() => setPassportOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenRuler={() => setRulerOpen(true)}
          onExploreCoordinates={(center) => void exploreCoordinates(center)}
          exploring={exploring}
          onInstalledToast={showToast}
        />

        <InfoDrawer
          open={infoOpen}
          index={index}
          bestMonths={bestMonths}
          month={month}
          reducedMotion={reducedMotion}
          onWildlifeFact={showFact}
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
          foundEggs={foundEggs}
          notesByLandmark={notesByLandmark}
          activeRouteId={activeRouteId}
          reducedMotion={reducedMotion}
          onClose={() => setPassportOpen(false)}
          onJumpToNote={handleJumpToNote}
          onOpenRuler={() => setRulerOpen(true)}
          onResetEggs={resetEggs}
          onSelectRoute={handleSelectRoute}
          onViewRouteOnGlobe={handleViewRouteOnGlobe}
          onResetPassport={() => {
            setVisited(new Set());
            try {
              localStorage.removeItem('cl-vs');
            } catch {
              // Ignore storage errors
            }
            showToast('Passport stamps cleared');
            resetEggs();
          }}
        />

        <ScaleRulerModal
          open={rulerOpen}
          visited={visited}
          reference={scaleKind}
          reducedMotion={reducedMotion}
          onChangeReference={(kind) => setSettings((prev) => ({ ...prev, scaleReference: kind }))}
          onClose={() => setRulerOpen(false)}
          onSelectLandmark={(i) => {
            setRulerOpen(false);
            setPassportOpen(false);
            setSearchOpen(false);
            selectLandmark(i);
          }}
        />

        <SettingsModal
          open={settingsOpen}
          settings={settings}
          effectiveTheme={effectiveTheme}
          reducedMotion={reducedMotion}
          tourActive={tourActive}
          onToggleTour={() => {
            ambientAudio.playUi('toggle');
            setTourActive((v) => !v);
          }}
          onUpdate={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
          onRequestTilt={() => engineRef.current?.requestTiltPermission() ?? Promise.resolve(false)}
          onClose={() => setSettingsOpen(false)}
        />

        <PostcardModal
          open={postcardOpen}
          dataUrl={postcardUrl}
          landmarkName={LANDMARKS[index].k}
          notes={notesByLandmark[index] ?? []}
          selectedNoteId={postcardNoteId}
          previewHour={postcardPreviewHour}
          reducedMotion={reducedMotion}
          onRegeneratePostcard={handleRegeneratePostcard}
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
