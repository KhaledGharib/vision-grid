// Storage adapter.
// v0.1 = browser (localStorage for state JSON + IndexedDB for image blobs).
// v0.2 = swap these two functions for Tauri SQLite + app-data dir. Nothing else changes.

import type { AppState } from './types';

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
 * Wipe everything local: state JSON and every image blob.
 * Used on sign-out so the next account never inherits the previous
 * account's board.
 */
export async function clearLocal(): Promise<void> {
  localStorage.removeItem(STATE_KEY);
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve(); // an open handle shouldn't hang sign-out
  });
}

export function exportState(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vision-grid-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
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
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getImage(id: string): Promise<Blob | null> {
  const db = await openDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

export async function deleteImage(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
  });
  db.close();
}

/** In-memory objectURL cache so tiles don't re-read IndexedDB on every render. */
const urlCache = new Map<string, string>();

export async function imageUrl(id: string): Promise<string | null> {
  if (urlCache.has(id)) return urlCache.get(id)!;
  const blob = await getImage(id);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}
