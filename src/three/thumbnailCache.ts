import { LANDMARKS } from '../data/landmarks';
import { resolveTheme } from '../lib/theme';
import type { ThemeSetting } from '../types/citylit';

const DB_NAME = 'citylit-cache-v1';
const STORE_NAME = 'thumbnails';
const CACHE_VERSION = 'v2';

function getLandmarkSignature(): string {
  return `${CACHE_VERSION}:${LANDMARKS.length}:${LANDMARKS.map((l) => l.k).join('|')}`;
}

function openThumbDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

interface StoredThumbBundle {
  signature: string;
  items: Record<number, string>;
}

export async function loadCachedThumbnails(
  theme: ThemeSetting
): Promise<Record<number, string> | null> {
  const db = await openThumbDb();
  if (!db) return null;
  const sig = getLandmarkSignature();
  const resolvedTheme = resolveTheme(theme);
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(`thumbs:${resolvedTheme}`);
      req.onsuccess = () => {
        const val = req.result as StoredThumbBundle | undefined;
        db.close();
        if (!val || val.signature !== sig || !val.items) {
          resolve(null);
          return;
        }
        resolve(val.items);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function saveCachedThumbnails(
  theme: ThemeSetting,
  items: Record<number, string>
): Promise<void> {
  const db = await openThumbDb();
  if (!db) return;
  const bundle: StoredThumbBundle = {
    signature: getLandmarkSignature(),
    items,
  };
  const resolvedTheme = resolveTheme(theme);
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(bundle, `thumbs:${resolvedTheme}`);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}
