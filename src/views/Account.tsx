import { useState } from 'react';
import { cloudEnabled } from '../cloud';
import { sendMagicLink, signOut } from '../sync';
import { useT } from '../useT';
import type { SyncStatus } from '../cloud';

/** Sign-in / sync status panel. Hidden entirely when cloud is not configured. */
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

  if (!cloudEnabled) return null;

  const submit = async () => {
    const v = mail.trim();
    if (!v) return;
    setBusy(true);
    setErr(null);
    try {
      await sendMagicLink(v);
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ask-overlay" onClick={onClose}>
      <div className="ask" onClick={(e) => e.stopPropagation()}>
        {status === 'signed-out' ? (
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
            <h3>{t('account')}</h3>
            <p className="ask-body">{email}</p>
            <p className="ask-body muted small">
              {status === 'synced' && t('syncedMsg')}
              {status === 'syncing' && t('syncingMsg')}
              {status === 'error' && t('syncErrorMsg')}
            </p>
            <div className="ask-actions">
              <button className="ghost" onClick={onClose}>{t('close')}</button>
              <button className="danger" onClick={async () => { await signOut(); onClose(); }}>
                {t('signOut')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
