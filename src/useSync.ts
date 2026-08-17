import { useEffect, useState } from 'react';
import { supabase, cloudEnabled, type SyncStatus } from './cloud';
import { pushState, pullState, uploadImage, downloadImage, listRemoteImageIds } from './sync';
import { useStore } from './store';
import { getImage, putImage } from './storage';
import type { AppState } from './types';

/**
 * Sync engine.
 *
 * Rules that keep this safe:
 *  - Local storage stays the source of truth while offline; the cloud is a
 *    mirror, never a dependency. Cloud failures must not lose local edits.
 *  - Pushes are debounced so typing a goal title isn't a write per keystroke.
 *  - On sign-in we compare timestamps and take the newer side wholesale
 *    (last-write-wins). Honest for one user on a few devices; NOT sufficient
 *    once two people edit the same board.
 */

const PUSH_DEBOUNCE_MS = 2500;
const LAST_PUSH_KEY = 'vg:lastPushedAt';

function snapshot(): AppState {
  const s = useStore.getState();
  return {
    version: 3,
    user: s.user,
    boards: s.boards,
    elements: s.elements,
    monthGoals: s.monthGoals,
    weekGoals: s.weekGoals,
    tasks: s.tasks,
  };
}

/** Upload any vision images the cloud doesn't have yet. */
async function syncImagesUp() {
  const ids = useStore
    .getState()
    .elements.map((e) => e.imageId)
    .filter((x): x is string => Boolean(x));
  if (!ids.length) return;

  const remote = await listRemoteImageIds();
  for (const id of ids) {
    if (remote.has(id)) continue;
    const blob = await getImage(id);
    if (blob) await uploadImage(id, blob);
  }
}

/** Fetch any images referenced by state but missing locally. */
async function syncImagesDown(state: AppState) {
  const ids = state.elements.map((e) => e.imageId).filter((x): x is string => Boolean(x));
  for (const id of ids) {
    const local = await getImage(id);
    if (local) continue;
    const blob = await downloadImage(id);
    if (blob) await putImage(id, blob);
  }
}

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>(cloudEnabled ? 'signed-out' : 'offline');
  const [email, setEmail] = useState<string | null>(null);

  // ---- track auth ----
  useEffect(() => {
    if (!cloudEnabled || !supabase) return;

    let cancelled = false;

    const apply = async (signedIn: boolean, mail: string | null) => {
      if (cancelled) return;
      setEmail(mail);
      if (!signedIn) {
        setStatus('signed-out');
        return;
      }
      setStatus('syncing');
      try {
        const remote = await pullState();
        const localPushedAt = localStorage.getItem(LAST_PUSH_KEY);

        if (!remote) {
          // first sign-in on this account: seed the cloud from local
          await pushState(snapshot());
          await syncImagesUp();
          localStorage.setItem(LAST_PUSH_KEY, new Date().toISOString());
        } else {
          const remoteNewer =
            !localPushedAt || new Date(remote.updatedAt) > new Date(localPushedAt);
          if (remoteNewer) {
            await syncImagesDown(remote.state);
            useStore.getState().replaceState(remote.state);
            localStorage.setItem(LAST_PUSH_KEY, remote.updatedAt);
          } else {
            await pushState(snapshot());
            await syncImagesUp();
            localStorage.setItem(LAST_PUSH_KEY, new Date().toISOString());
          }
        }
        if (!cancelled) setStatus('synced');
      } catch (err) {
        console.error('[sync] initial sync failed', err);
        if (!cancelled) setStatus('error');
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      apply(Boolean(data.session), data.session?.user.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      apply(Boolean(session), session?.user.email ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ---- debounced push on local change ----
  useEffect(() => {
    if (!cloudEnabled || !supabase) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsub = useStore.subscribe(() => {
      if (status === 'signed-out' || status === 'offline') return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          setStatus('syncing');
          const at = await pushState(snapshot());
          await syncImagesUp();
          if (at) localStorage.setItem(LAST_PUSH_KEY, at);
          setStatus('synced');
        } catch (err) {
          console.error('[sync] push failed', err);
          setStatus('error');
        }
      }, PUSH_DEBOUNCE_MS);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, [status]);

  return { status, email };
}
