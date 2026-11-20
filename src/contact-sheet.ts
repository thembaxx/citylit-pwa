import { LANDMARKS } from './data/landmarks';
import { CitylitEngine } from './three/CitylitEngine';
import type { ThemeSetting } from './types/citylit';

/** Dev-only visual audit page: every landmark as a thumbnail in one grid. */

const params = new URLSearchParams(window.location.search);
const stage = document.getElementById('stage') as HTMLDivElement;
const grid = document.getElementById('grid') as HTMLDivElement;
const status = document.getElementById('status') as HTMLSpanElement;

const engine = new CitylitEngine(stage, {});
let theme = (params.get('theme') as ThemeSetting | null) ?? 'daylight';
let hour = Number(params.get('hour') ?? 12);
let cancel: (() => void) | null = null;

function syncButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.theme === theme));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-hour]').forEach((b) => {
    b.setAttribute('aria-pressed', String(Number(b.dataset.hour) === hour));
  });
}

function build(): void {
  cancel?.();
  grid.replaceChildren();
  const images: (HTMLImageElement | null)[] = LANDMARKS.map((landmark, index) => {
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.alt = landmark.k;
    const caption = document.createElement('figcaption');
    caption.innerHTML = `${index + 1}. ${landmark.k} <span>${landmark.c.split(' · ')[0]}</span>`;
    figure.append(img, caption);
    grid.append(figure);
    return img;
  });

  let done = 0;
  status.textContent = `Rendering 0 / ${LANDMARKS.length}…`;
  cancel = engine.generateThumbnailsAsync(
    (batch) => {
      for (const [key, src] of Object.entries(batch)) {
        const index = Number(key);
        const img = images[index];
        if (img) img.src = src;
      }
      done += Object.keys(batch).length;
      status.textContent = `Rendering ${done} / ${LANDMARKS.length}…`;
    },
    () => {
      status.textContent = `${LANDMARKS.length} landmarks · ${theme} · ${String(hour).padStart(2, '0')}:00`;
    }
  );
  syncButtons();
}

document.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((button) => {
  button.addEventListener('click', () => {
    theme = button.dataset.theme as ThemeSetting;
    engine.setTheme(theme, true);
    params.set('theme', theme);
    window.history.replaceState(null, '', `?${params.toString()}`);
    build();
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-hour]').forEach((button) => {
  button.addEventListener('click', () => {
    hour = Number(button.dataset.hour);
    engine.setWeather('sun', hour < 6 || hour >= 19, hour);
    params.set('hour', String(hour));
    window.history.replaceState(null, '', `?${params.toString()}`);
    window.setTimeout(build, 300);
  });
});

document.getElementById('refresh')?.addEventListener('click', build);

engine.setTheme(theme, true);
engine.setWeather('sun', hour < 6 || hour >= 19, hour);
engine.showLandmarkImmediate(0);
build();
