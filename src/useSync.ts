import { useEffect, useRef, useState } from 'react';
import { supabase, cloudEnabled, type SyncStatus } from './cloud';
import {
  pushState, pullState, uploadImage, downloadImage, listRemoteImageIds,
  LAST_PUSH_KEY, OWNER_KEY,
} from './sync';
import { useStore } from './store';
import { clearLocal, getImage, putImage } from './storage';
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

/**
 * The parts of the store that actually belong in the cloud document.
 *
 * zustand replaces only the slices a mutation touches, so comparing references
 * is enough to tell "the board changed" from "the user scrolled". Subscribing
 * to the whole store meant panning or zooming the canvas queued a full upload.
 */
type Slices = readonly unknown[];
const slicesOf = (s: ReturnType<typeof useStore.getState>): Slices =>
  [s.user, s.boards, s.elements, s.monthGoals, s.weekGoals, s.tasks];

const differ = (a: Slices, b: Slices) => a.some((v, i) => v !== b[i]);

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
        const me = (await supabase!.auth.getUser()).data.user?.id ?? null;
        const localOwner = localStorage.getItem(OWNER_KEY);
        const remote = await pullState();

        // Whose board is sitting in this browser?
        //  - same account  -> safe to merge by timestamp
        //  - different account, or unknown provenance -> NEVER upload it.
        //    Uploading here is how one user's board ended up in another's
        //    account, so a mismatch always defers to the cloud.
        const localIsMine = localOwner !== null && localOwner === me;
        // A board that has NEVER been associated with any account is an
        // unclaimed local-only board — the pre-cloud upgrade path. The first
        // account to sign in may adopt it. Once claimed, OWNER_KEY is set and
        // this can never happen again.
        const localIsUnclaimed = localOwner === null;

        if (remote) {
          const localPushedAt = localStorage.getItem(LAST_PUSH_KEY);
          const remoteNewer =
            !localIsMine || !localPushedAt ||
            new Date(remote.updatedAt) > new Date(localPushedAt);

          if (remoteNewer) {
            await syncImagesDown(remote.state);
            useStore.getState().replaceState(remote.state);
            localStorage.setItem(LAST_PUSH_KEY, remote.updatedAt);
          } else {
            await pushState(snapshot());
            await syncImagesUp();
            localStorage.setItem(LAST_PUSH_KEY, new Date().toISOString());
          }
        } else if (localIsMine || localIsUnclaimed) {
          // this account has no cloud copy yet and the local board is
          // provably theirs — seed the cloud from it
          await pushState(snapshot());
          await syncImagesUp();
          localStorage.setItem(LAST_PUSH_KEY, new Date().toISOString());
        } else {
          // New account on a browser holding someone else's (or unknown)
          // board. Start clean rather than adopting or uploading it.
          await clearLocal();
          useStore.getState().resetToSeed();
          localStorage.removeItem(LAST_PUSH_KEY);
        }

        if (me) localStorage.setItem(OWNER_KEY, me);
        if (!cancelled) setStatus('synced');
      } catch (err) {
        console.error('[sync] initial sync failed', err);
        if (!cancelled) setStatus('error');
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      apply(Boolean(data.session), data.session?.user.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
      // TOKEN_REFRESHED fires roughly hourly and says nothing new about which
      // account owns this browser, so a full pull/push there is pure waste.
      if (evt === 'TOKEN_REFRESHED') return;
      apply(Boolean(session), session?.user.email ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ---- debounced push on local change ----
  // status is read through a ref rather than a dependency: this effect's own
  // body calls setStatus, so depending on status tore the subscription down and
  // rebuilt it on every sync transition.
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    if (!cloudEnabled || !supabase) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let seen = slicesOf(useStore.getState());

    const unsub = useStore.subscribe((s) => {
      const next = slicesOf(s);
      if (!differ(next, seen)) return; // pan, zoom, selection, tool
      seen = next;

      const st = statusRef.current;
      if (st === 'signed-out' || st === 'offline') return;

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
  }, []);

  return { status, email };
}
