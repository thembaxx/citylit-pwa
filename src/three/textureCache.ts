/**
 * Persistent cache for the deterministic procedural surface canvases.
 *
 * Generating the stone/plaster/roof/canvas/wood height maps (and their derived
 * normal + roughness maps) costs ~1M pixel iterations with several
 * transcendentals each. The results never change, so store the finished
 * canvases in IndexedDB and decode them at boot instead of recomputing them on
 * every visit. The getters in `shaders.ts` stay synchronous: this module only
 * pre-populates a canvas map they consult before falling back to generation.
 */

const DB_NAME = 'citylit-textures-v1';
const STORE_NAME = 'proceduralTextures';
const CACHE_VERSION = 'v1';

interface StoredCanvas {
  signature: string;
  dataUrl: string;
}

const canvasCache = new Map<string, HTMLCanvasElement>();

function openTextureDb(): Promise<IDBDatabase | null> {
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

/** Fill the in-memory canvas map from any cached entries before builders run. */
export async function preloadProceduralCanvases(keys: readonly string[]): Promise<void> {
  const db = await openTextureDb();
  if (!db) return;
  await Promise.all(
    keys.map(
      (key) =>
        new Promise<void>((resolve) => {
          try {
            const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
            req.onsuccess = () => {
              const val = req.result as StoredCanvas | undefined;
              if (!val || val.signature !== `${CACHE_VERSION}:${key}`) {
                resolve();
                return;
              }
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                canvas.getContext('2d')?.drawImage(img, 0, 0);
                canvasCache.set(key, canvas);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = val.dataUrl;
            };
            req.onerror = () => resolve();
          } catch {
            resolve();
          }
        })
    )
  );
  db.close();
}

export function getCachedCanvas(key: string): HTMLCanvasElement | undefined {
  return canvasCache.get(key);
}

/** Remember a generated canvas for this session and persist it in the background. */
export function storeGeneratedCanvas(key: string, canvas: HTMLCanvasElement): void {
  canvasCache.set(key, canvas);
  void persistCanvas(key, canvas);
}

async function persistCanvas(key: string, canvas: HTMLCanvasElement): Promise<void> {
  const db = await openTextureDb();
  if (!db) return;
  try {
    const entry: StoredCanvas = {
      signature: `${CACHE_VERSION}:${key}`,
      dataUrl: canvas.toDataURL('image/png'),
    };
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(entry, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    // Storage is an optimisation; generation still works without it.
  } finally {
    db.close();
  }
}
