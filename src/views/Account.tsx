import { useEffect, useState } from 'react';
import { cloudEnabled } from '../cloud';
import { sendMagicLink, signOut } from '../sync';
import {
  fetchMyProfile, saveMyProfile, AVATAR_COLORS, AVATAR_EMOJI, type Profile,
} from '../social';
import { useT } from '../useT';
import type { SyncStatus } from '../cloud';
import Avatar from './Avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

/** Sign-in / profile / sync status. Hidden entirely when cloud is off. */
export default function Account({
  status,
  email,
  onClose,
}: {
  status: SyncStatus;
  email: string | null;
  onClose: () => void;
}) {
  const [mail, setMail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t = useT();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<string | null>(null);
  const [color, setColor] = useState<string>(AVATAR_COLORS[0]);
  const [saved, setSaved] = useState(false);

  const signedIn = status === 'synced' || status === 'syncing' || status === 'error';

  useEffect(() => {
    if (!signedIn) return;
    let dead = false;
    (async () => {
      try {
        const p = await fetchMyProfile();
        if (dead || !p) return;
        setProfile(p);
        setName(p.display_name ?? '');
        setEmoji(p.avatar_emoji);
        setColor(p.avatar_color ?? AVATAR_COLORS[0]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { dead = true; };
  }, [signedIn]);

  if (!cloudEnabled) return null;

  const submit = async () => {
    const v = mail.trim();
    if (!v) return;
    setBusy(true); setErr(null);
    try {
      await sendMagicLink(v);
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const save = async () => {
    setBusy(true); setErr(null); setSaved(false);
    try {
      await saveMyProfile({
        display_name: name.trim() || (email?.split('@')[0] ?? ''),
        avatar_emoji: emoji ?? '',
        avatar_color: color,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const dirty =
    signedIn && profile !== null &&
    (name.trim() !== (profile.display_name ?? '') ||
      (emoji ?? '') !== (profile.avatar_emoji ?? '') ||
      color !== (profile.avatar_color ?? AVATAR_COLORS[0]));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[480px] max-h-[86vh] overflow-y-auto">
        {!signedIn ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('signIn')}</DialogTitle>
              <DialogDescription>
                {sent ? t('magicLinkSent') : t('signInBlurb')}
              </DialogDescription>
            </DialogHeader>

            {!sent && (
              <Input
                type="email"
                value={mail}
                placeholder="you@example.com"
                onChange={(e) => setMail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            )}

            {err && <p className="text-[12.5px] text-[#f87171]">{err}</p>}

            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>{t('close')}</Button>
              {!sent && (
                <Button variant="primary" disabled={busy || !mail.trim()} onClick={submit}>
                  {busy ? '…' : t('sendLink')}
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('yourProfile')}</DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-3.5 rounded-[10px] border border-[#262c38] bg-[#0d0f14] p-3">
              <Avatar emoji={emoji} color={color} name={name || email} size={62} />
              <div className="min-w-0">
                <p className="truncate text-[14px]">{name.trim() || t('unnamedFriend')}</p>
                <p className="mt-0.5 truncate text-[12px] text-[#8b93a4]">{email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] text-[#8b93a4]">{t('displayName')}</label>
              <Input
                value={name}
                maxLength={40}
                placeholder={email?.split('@')[0] ?? t('displayName')}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-[12px] text-[#8b93a4]">{t('displayNameHint')}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] text-[#8b93a4]">{t('pickEmoji')}</label>
              <div className="grid grid-cols-6 gap-1.5 rounded-[8px] border border-[#262c38] bg-[#0d0f14] p-1.5">
                <button
                  type="button"
                  className={cn(
                    'grid aspect-square place-items-center rounded-md border text-[21px] transition-colors',
                    !emoji
                      ? 'border-[#f0b429] bg-[#f0b429]/15'
                      : 'border-transparent hover:bg-[#1b2029]',
                  )}
                  title={t('noEmoji')}
                  onClick={() => setEmoji(null)}
                >
                  {(name || email || '?').trim().charAt(0).toUpperCase()}
                </button>
                {AVATAR_EMOJI.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={cn(
                      'grid aspect-square place-items-center rounded-md border text-[21px] transition-colors',
                      emoji === e
                        ? 'border-[#f0b429] bg-[#f0b429]/15'
                        : 'border-transparent hover:bg-[#1b2029]',
                    )}
                    onClick={() => setEmoji(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] text-[#8b93a4]">{t('avatarColor')}</label>
              <div className="flex flex-wrap gap-[7px]">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      'h-[30px] w-[30px] shrink-0 rounded-full border-2 transition-transform',
                      color === c
                        ? 'border-white shadow-[0_0_0_2px_#f0b429] scale-110'
                        : 'border-transparent hover:scale-105',
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    aria-label={c}
                    aria-pressed={color === c}
                  />
                ))}
              </div>
            </div>

            <p className="text-[12px] text-[#8b93a4]">
              {status === 'synced' && t('syncedMsg')}
              {status === 'syncing' && t('syncingMsg')}
              {status === 'error' && t('syncErrorMsg')}
            </p>

            {err && <p className="text-[12.5px] text-[#f87171]">{err}</p>}
            {saved && (
              <p className="flex items-center gap-1.5 text-[12.5px] text-[#34d399]">
                <Check className="h-3.5 w-3.5" /> {t('profileSaved')}
              </p>
            )}

            <DialogFooter className="justify-between">
              <Button
                variant="ghost"
                className="text-[#f87171] hover:bg-[#f87171]/10 hover:text-[#f87171]"
                onClick={async () => { await signOut(); onClose(); }}
              >
                {t('signOut')}
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>{t('close')}</Button>
                <Button variant="primary" disabled={busy || !dirty} onClick={save}>
                  {busy ? '…' : t('save')}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
