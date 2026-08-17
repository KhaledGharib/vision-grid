import { useEffect, useState } from 'react';
import { cloudEnabled } from '../cloud';
import { sendMagicLink, signOut } from '../sync';
import {
  fetchMyProfile, saveMyProfile, AVATAR_COLORS, AVATAR_EMOJI, type Profile,
} from '../social';
import { useT } from '../useT';
import type { SyncStatus } from '../cloud';
import Avatar from './Avatar';

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
    <div className="ask-overlay" onClick={onClose}>
      <div className="ask ask-wide" onClick={(e) => e.stopPropagation()}>
        {!signedIn ? (
          <>
            <h3>{t('signIn')}</h3>
            {sent ? (
              <p className="ask-body">{t('magicLinkSent')}</p>
            ) : (
              <>
                <p className="ask-body">{t('signInBlurb')}</p>
                <input
                  type="email"
                  value={mail}
                  placeholder="you@example.com"
                  onChange={(e) => setMail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </>
            )}
            {err && <p className="ask-err">{err}</p>}
            <div className="ask-actions">
              <button className="ghost" onClick={onClose}>{t('close')}</button>
              {!sent && (
                <button className="primary" disabled={busy || !mail.trim()} onClick={submit}>
                  {busy ? '…' : t('sendLink')}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <h3>{t('yourProfile')}</h3>

            <div className="profile-head">
              <Avatar emoji={emoji} color={color} name={name || email} size={62} />
              <div style={{ minWidth: 0 }}>
                <p className="ask-body" style={{ margin: 0 }}>
                  {name.trim() || t('unnamedFriend')}
                </p>
                <p className="muted small" style={{ margin: '2px 0 0' }}>{email}</p>
              </div>
            </div>

            <div className="field">
              <label>{t('displayName')}</label>
              <input
                value={name}
                maxLength={40}
                placeholder={email?.split('@')[0] ?? t('displayName')}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="muted small">{t('displayNameHint')}</p>
            </div>

            <div className="field">
              <label>{t('pickEmoji')}</label>
              <div className="emoji-grid">
                <button
                  className={`emoji-cell${!emoji ? ' on' : ''}`}
                  title={t('noEmoji')}
                  onClick={() => setEmoji(null)}
                >
                  {(name || email || '?').trim().charAt(0).toUpperCase()}
                </button>
                {AVATAR_EMOJI.map((e) => (
                  <button
                    key={e}
                    className={`emoji-cell${emoji === e ? ' on' : ''}`}
                    onClick={() => setEmoji(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>{t('avatarColor')}</label>
              <div className="sw-row">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`sw-dot${color === c ? ' on' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    aria-label={c}
                    aria-pressed={color === c}
                  />
                ))}
              </div>
            </div>

            <p className="muted small">
              {status === 'synced' && t('syncedMsg')}
              {status === 'syncing' && t('syncingMsg')}
              {status === 'error' && t('syncErrorMsg')}
            </p>

            {err && <p className="ask-err">{err}</p>}
            {saved && <p className="ask-ok">✓ {t('profileSaved')}</p>}

            <div className="ask-actions">
              <button
                className="danger ghost"
                onClick={async () => { await signOut(); onClose(); }}
              >
                {t('signOut')}
              </button>
              <div className="spacer" />
              <button className="ghost" onClick={onClose}>{t('close')}</button>
              <button className="primary" disabled={busy || !dirty} onClick={save}>
                {busy ? '…' : t('save')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
