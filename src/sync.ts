import { supabase, cloudEnabled } from './cloud';
import type { AppState } from './types';
import { clearLocal } from './storage';
import { useStore } from './store';

/** Timestamp of our last successful push. */
export const LAST_PUSH_KEY = 'vg:lastPushedAt';
/** Which account the local copy belongs to — guards against cross-account bleed. */
export const OWNER_KEY = 'vg:localOwner';

/**
 * Cloud sync for the whole app state.
 *
 * The state is one JSONB document per user. Conflict handling is
 * last-write-wins by updated_at, which is honest for a single-user app used
 * on a couple of devices — it is NOT enough once two people edit one board,
 * and that will need real merging when sharing lands.
 *
 * Every function is a no-op when cloud is disabled or nobody is signed in,
 * so the local-only path is completely unaffected.
 */

export async function currentUser() {
  if (!cloudEnabled || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/** Push local state up. Returns the server timestamp it recorded. */
export async function pushState(state: AppState): Promise<string | null> {
  if (!cloudEnabled || !supabase) return null;
  const user = await currentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('boards_state')
    .upsert(
      { user_id: user.id, state, version: state.version ?? 3 },
      { onConflict: 'user_id' },
    )
    .select('updated_at')
    .single();

  if (error) throw error;
  return data?.updated_at ?? null;
}

/** Fetch remote state, or null when the account has none yet. */
export async function pullState(): Promise<{ state: AppState; updatedAt: string } | null> {
  if (!cloudEnabled || !supabase) return null;
  const user = await currentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('boards_state')
    .select('state, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { state: data.state as AppState, updatedAt: data.updated_at as string };
}

// ---------- images ----------
// Blobs live in Storage under <user_id>/<image_id>, never in the JSON doc.

export async function uploadImage(id: string, blob: Blob): Promise<void> {
  if (!cloudEnabled || !supabase) return;
  const user = await currentUser();
  if (!user) return;

  const { error } = await supabase.storage
    .from('visions')
    .upload(`${user.id}/${id}`, blob, { upsert: true, contentType: blob.type || 'image/png' });

  // an image already present is success, not failure
  if (error && !/exists/i.test(error.message)) throw error;
}

export async function downloadImage(id: string): Promise<Blob | null> {
  if (!cloudEnabled || !supabase) return null;
  const user = await currentUser();
  if (!user) return null;

  const { data, error } = await supabase.storage.from('visions').download(`${user.id}/${id}`);
  if (error) return null;
  return data ?? null;
}

/** Image ids already in the cloud, so we only upload what is missing. */
export async function listRemoteImageIds(): Promise<Set<string>> {
  if (!cloudEnabled || !supabase) return new Set();
  const user = await currentUser();
  if (!user) return new Set();

  const { data, error } = await supabase.storage.from('visions').list(user.id, { limit: 1000 });
  if (error || !data) return new Set();
  return new Set(data.map((f) => f.name));
}

// ---------- auth ----------

export async function sendMagicLink(email: string) {
  if (!cloudEnabled || !supabase) throw new Error('cloud disabled');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

/**
 * Sign out AND wipe the local copy.
 *
 * Without the wipe, the board stays in this browser and the next account to
 * sign in gets treated as "cloud is empty, seed it from local" — which
 * uploaded the previous user's board into a stranger's account. That was a
 * privacy leak, not just a stale-UI bug.
 */
export async function signOut() {
  if (!cloudEnabled || !supabase) return;
  await supabase.auth.signOut();
  await clearLocal();
  localStorage.removeItem(LAST_PUSH_KEY);
  localStorage.removeItem(OWNER_KEY);
  useStore.getState().resetToSeed();
}
