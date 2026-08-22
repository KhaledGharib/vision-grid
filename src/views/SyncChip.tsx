import { useEffect, useState } from 'react';
import { cloudEnabled, type SyncStatus } from '../cloud';
import { fetchMyProfile, AVATAR_COLORS, type Profile } from '../social';
import { useT } from '../useT';
import { SyncDone, SyncError, SyncUp } from '../icons';
import Avatar from './Avatar';
import { cn } from '@/lib/utils';

/**
 * Who you are, and whether your work is safe — one control in the toolbar.
 *
 * Sync status started life as a row inside the settings menu, which is the
 * wrong home for a readout: you had to go looking to learn whether a push had
 * landed. And the profile was invisible for the same reason — nobody opens a
 * settings menu to discover they have a name and an avatar, which is how a
 * friend ended up displayed as "pers.khwg".
 *
 * Signing in stays in the menu, because that's an action. Nothing renders here
 * when signed out: an idle cloud raises a question the user can't answer from
 * the toolbar.
 */
export default function SyncChip({
  status,
  email,
  onOpen,
}: {
  status: SyncStatus;
  email: string | null;
  onOpen: () => void;
}) {
  const t = useT();
  const [profile, setProfile] = useState<Profile | null>(null);
  const signedIn = status === 'synced' || status === 'syncing' || status === 'error';

  useEffect(() => {
    if (!signedIn) { setProfile(null); return; }
    let dead = false;
    // Cached after the first call, so this is instant on later renders.
    fetchMyProfile()
      .then((p) => { if (!dead) setProfile(p); })
      .catch(() => { /* the chip must never break the toolbar */ });
    return () => { dead = true; };
  }, [signedIn, status]);

  if (!cloudEnabled || !signedIn) return null;

  const name = profile?.display_name?.trim() || email?.split('@')[0] || null;
  // Until a name is set the friend list shows the email prefix, so nudge here.
  const needsName = !profile?.display_name?.trim();

  const label =
    status === 'syncing' ? t('syncingMsg')
    : status === 'error' ? t('syncFailedShort')
    : t('syncedShort');
  const tip = `${name ?? t('yourProfile')} · ${status === 'error' ? t('syncErrorMsg') : label}`;

  return (
    <button
      className={cn(
        'btn-reset flex shrink-0 items-center gap-2 rounded-full border py-1 pe-2.5 ps-1',
        'transition-colors',
        status === 'error'
          ? 'border-[#f87171]/40 bg-[#f87171]/[.08] hover:bg-[#f87171]/[.14]'
          : needsName
            ? 'border-[#7a5c14] bg-[#f0b429]/[.08] hover:bg-[#f0b429]/[.14]'
            : 'border-[#262c38] bg-[#151922] hover:border-[#39424f] hover:bg-[#1b2029]',
      )}
      onClick={onOpen}
      title={tip}
      aria-label={tip}
    >
      <Avatar
        emoji={profile?.avatar_emoji}
        color={profile?.avatar_color ?? AVATAR_COLORS[0]}
        name={name}
        size={24}
      />

      <span
        className={cn(
          'max-w-[110px] truncate text-[12.5px]',
          status === 'error' ? 'text-[#f87171]'
            : needsName ? 'text-[#f0b429]' : 'text-[#e6e9ef]',
        )}
      >
        {needsName ? t('profile') : name}
      </span>

      {/* the sync state, as an icon rather than a second control */}
      <span role="status" aria-live="polite" aria-label={label} title={label}>
        {status === 'error' ? <SyncError className="icon sync-ico err" />
          : status === 'syncing' ? <SyncUp className="icon sync-ico busy spin" />
          : <SyncDone className="icon sync-ico ok" />}
      </span>
    </button>
  );
}
