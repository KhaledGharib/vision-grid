// Storage adapter.
// v0.1 = browser (localStorage for state JSON + IndexedDB for image blobs).
// v0.2 = swap these two functions for Tauri SQLite + app-data dir. Nothing else changes.

import type { AppState } from './types';
import { MAX_IMAGE_BYTES, MAX_IMAGE_EDGE } from './types';

const STATE_KEY = 'vision-grid:state:v1';
const DB_NAME = 'vision-grid-images';
const STORE = 'images';

// ---------- State (JSON) ----------

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as AppState) : null;
  } catch (e) {
    console.error('loadState failed', e);
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('saveState failed', e);
  }
}

/**
 * Wipe everything local: state JSON, every image blob, and every object URL
 * minted from them. Used on sign-out so the next account never inherits the
 * previous account board.
 *
 * The URL cache matters as much as the database here: a blob URL stays alive
 * for the lifetime of the document even after its backing store is deleted,
 * so leaving the cache populated would keep the previous images resolvable.
 */
export async function clearLocal(): Promise<void> {
  localStorage.removeItem(STATE_KEY);
  clearImageUrlCache();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve(); // an open handle should not hang sign-out
  });
}

/**
 * Hand a blob to the user as a download.
 *
 * The object URL is revoked on a timer, never synchronously after click():
 * revoking immediately can cancel the download before the browser has read
 * the blob, which shows up as a silently missing file on larger exports.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function exportState(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  triggerDownload(blob, 'vision-grid-' + new Date().toISOString().slice(0, 10) + '.json');
}

// ---------- Images (IndexedDB) ----------
// Images are stored as blobs, never as file paths — original paths break.

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putImage(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function getImage(id: string): Promise<Blob | null> {
  const db = await openDb();
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as Blob) ?? null);
      req.onerror = () => reject(req.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function deleteImage(id: string): Promise<void> {
  forgetImageUrl(id);
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/**
 * Duplicate a stored blob under a new id.
 *
 * Two elements must never share an imageId: deleting either one would delete
 * the blob out from under the other.
 */
export async function copyImage(srcId: string, newId: string): Promise<boolean> {
  const blob = await getImage(srcId);
  if (!blob) return false;
  await putImage(newId, blob);
  return true;
}

/**
 * Validate and normalise a picked file before it ever reaches storage.
 *
 * Without this a 40MP phone photo goes into IndexedDB whole and then gets
 * uploaded whole, for a tile that is never drawn above a few hundred pixels.
 */
export async function prepareImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('not_an_image');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('image_too_large');

  // Vectors have no useful raster size, and re-encoding a GIF would drop its
  // animation. Both are already small enough to keep verbatim.
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file; // undecodable here; let the img tag try

  try {
    const longest = Math.max(bmp.width, bmp.height);
    if (longest <= MAX_IMAGE_EDGE) return file;

    const k = MAX_IMAGE_EDGE / longest;
    const w = Math.max(1, Math.round(bmp.width * k));
    const h = Math.max(1, Math.round(bmp.height * k));
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);

    const out = await new Promise<Blob | null>((resolve) =>
      cv.toBlob(resolve, 'image/webp', 0.9),
    );
    // Only take the re-encode if it actually won.
    return out && out.size < file.size ? out : file;
  } finally {
    bmp.close();
  }
}

// ---------- Object URL cache ----------
// In-memory objectURL cache so tiles do not re-read IndexedDB on every render.

const urlCache = new Map<string, string>();
/** De-dupes concurrent lookups so one id never mints two object URLs. */
const inflight = new Map<string, Promise<string | null>>();

export async function imageUrl(id: string): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) return cached;

  const pending = inflight.get(id);
  if (pending) return pending;

  const job = (async () => {
    const blob = await getImage(id);
    if (!blob) return null;
    // another caller may have won the race while we awaited
    const now = urlCache.get(id);
    if (now) return now;
    const url = URL.createObjectURL(blob);
    urlCache.set(id, url);
    return url;
  })();

  inflight.set(id, job);
  try {
    return await job;
  } finally {
    inflight.delete(id);
  }
}

/** Drop one cached URL and release its blob. */
export function forgetImageUrl(id: string): void {
  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(id);
  }
}

/** Drop every cached URL and release every blob. */
export function clearImageUrlCache(): void {
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache.clear();
  inflight.clear();
}
