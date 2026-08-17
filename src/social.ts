import { supabase, cloudEnabled } from './cloud';
import { currentUser } from './sync';
import type { AppState } from './types';

/**
 * Social layer: pairing by invite code, reading a friend's board, nudges.
 *
 * Everything here is read-only across the boundary. A friend can see your
 * board but never write to it — state sync is last-write-wins, so two
 * authors on one document would silently lose someone's edits.
 */

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  avatar_color: string | null;
}

export interface FriendSummary {
  friend_id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  avatar_color: string | null;
  updated_at: string | null;
  visions: number;
  tasks_today: number;
  done_today: number;
}

export interface Nudge {
  id: string;
  from_id: string;
  from_name: string | null;
  from_emoji: string | null;
  from_color: string | null;
  task_id: string;
  task_title: string;
  message: string | null;
  created_at: string;
  read_at: string | null;
}

/** Default palette for emoji avatars — same 12 the board uses. */
export const AVATAR_COLORS = [
  '#e0b64a', '#e07a5f', '#81b29a', '#6c9bd1', '#b48ead', '#d1707a',
  '#5fa8a0', '#c08457', '#8f7fd1', '#7fa650', '#d1943f', '#6f7f8f',
];

export const AVATAR_EMOJI = [
  '👨‍💻', '👩‍💻', '🐛', '⚙️', '🤖',
  '🎯', '🚀', '🧠', '🔥', '☕',
];

function requireCloud() {
  if (!cloudEnabled || !supabase) throw new Error('cloud_disabled');
  return supabase;
}

// ---------- invite codes ----------

/** Human-friendly code: no O/0/I/1 to avoid transcription mistakes. */
function makeCode(len = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** Get this user's active code, creating one if needed. */
export async function myInviteCode(): Promise<string | null> {
  const sb = requireCloud();
  const user = await currentUser();
  if (!user) return null;

  const { data: existing } = await sb
    .from('invite_codes')
    .select('code, expires_at')
    .eq('owner_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (existing?.length) return existing[0].code as string;

  // retry on the (unlikely) chance of a collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    const { error } = await sb.from('invite_codes').insert({ code, owner_id: user.id });
    if (!error) return code;
    if (!/duplicate|unique/i.test(error.message)) throw error;
  }
  throw new Error('could_not_allocate_code');
}

/** Join someone by their code. Server-side: validates, rejects self, idempotent. */
export async function redeemInvite(code: string): Promise<{ friendId: string }> {
  const sb = requireCloud();
  const { data, error } = await sb.rpc('redeem_invite', { p_code: code });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { friendId: row?.friend_id as string };
}

// ---------- my profile ----------

export async function fetchMyProfile(): Promise<Profile | null> {
  if (!cloudEnabled || !supabase) return null;
  const user = await currentUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_emoji, avatar_color')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function saveMyProfile(p: {
  display_name?: string;
  avatar_emoji?: string;
  avatar_color?: string;
}): Promise<void> {
  const sb = requireCloud();
  const user = await currentUser();
  if (!user) throw new Error('not_signed_in');
  const { error } = await sb
    .from('profiles')
    .upsert({ id: user.id, ...p, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ---------- friends ----------

/** Cheap progress summary for every accepted friend. */
export async function listFriends(): Promise<FriendSummary[]> {
  if (!cloudEnabled || !supabase) return [];
  const user = await currentUser();
  if (!user) return [];
  const { data, error } = await supabase.rpc('friend_summary');
  if (error) throw error;
  return (data ?? []) as FriendSummary[];
}

/** Full board of one friend — allowed by the "friends read state" policy. */
export async function fetchFriendBoard(friendId: string): Promise<AppState | null> {

  const sb = requireCloud();
  const { data, error } = await sb
    .from('boards_state')
    .select('state')
    .eq('user_id', friendId)
    .maybeSingle();
  if (error) throw error;
  return (data?.state as AppState) ?? null;
}

/** Signed URL for a friend's vision image (bucket is private). */
export async function friendImageUrl(friendId: string, imageId: string): Promise<string | null> {

  if (!cloudEnabled || !supabase) return null;
  const { data, error } = await supabase.storage
    .from('visions')
    .createSignedUrl(`${friendId}/${imageId}`, 60 * 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function unfriend(friendId: string): Promise<void> {
  const sb = requireCloud();
  const user = await currentUser();
  if (!user) return;
  const { error } = await sb
    .from('friendships')
    .delete()
    .or(
      `and(a_id.eq.${user.id},b_id.eq.${friendId}),and(a_id.eq.${friendId},b_id.eq.${user.id})`,
    );
  if (error) throw error;
}

// ---------- nudges ----------

/** Budget is enforced in the database; this is only for showing it. */
export async function nudgesLeft(friendId: string): Promise<number> {
  if (!cloudEnabled || !supabase) return 0;
  const { data, error } = await supabase.rpc('nudges_left_today', { p_to: friendId });
  if (error) return 0;
  return typeof data === 'number' ? data : 0;
}

export async function sendNudge(
  toId: string,
  taskId: string,
  taskTitle: string,
  message?: string,
): Promise<void> {
  const sb = requireCloud();
  const { error } = await sb.rpc('send_nudge', {
    p_to: toId,
    p_task_id: taskId,
    p_task_title: taskTitle,
    p_message: message ?? null,
  });
  if (error) throw error;
}

export async function inbox(): Promise<Nudge[]> {
  if (!cloudEnabled || !supabase) return [];
  const user = await currentUser();
  if (!user) return [];
  const { data, error } = await supabase.rpc('my_nudges');
  if (error) throw error;
  return (data ?? []) as Nudge[];
}

export async function markNudgeRead(id: string): Promise<void> {
  if (!cloudEnabled || !supabase) return;
  await supabase.from('nudges').update({ read_at: new Date().toISOString() }).eq('id', id);
}

export async function dismissNudge(id: string): Promise<void> {
  if (!cloudEnabled || !supabase) return;
  await supabase.from('nudges').delete().eq('id', id);
}
