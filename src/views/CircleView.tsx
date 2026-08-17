import { useCallback, useEffect, useState } from 'react';
import { cloudEnabled } from '../cloud';
import {
  myInviteCode, redeemInvite, listFriends, unfriend,
  inbox, markNudgeRead, dismissNudge,
  type FriendSummary, type Nudge,
} from '../social';
import { useT } from '../useT';
import Ask, { type AskState } from './Ask';
import FriendBoard from './FriendBoard';

export default function CircleView({ signedIn }: { signedIn: boolean }) {
  const t = useT();
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ask, setAsk] = useState<AskState>(null);
  const [viewing, setViewing] = useState<FriendSummary | null>(null);

  const refresh = useCallback(async () => {
    if (!cloudEnabled || !signedIn) return;
    try {
      const [f, n] = await Promise.all([listFriends(), inbox()]);
      setFriends(f);
      setNudges(n);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [signedIn]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (!cloudEnabled) {
    return (
      <div className="view">
        <div className="view-head"><h2>{t('circle')}</h2></div>
        <div className="empty">{t('circleNeedsCloud')}</div>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="view">
        <div className="view-head">
          <h2>{t('circle')}</h2>
          <p>{t('circleBlurb')}</p>
        </div>
        <div className="empty">{t('circleNeedsSignIn')}</div>
      </div>
    );
  }

  const showCode = async () => {
    setBusy(true); setErr(null);
    try {
      setCode(await myInviteCode());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const join = async () => {
    const v = joinCode.trim().toUpperCase();
    if (!v) return;
    setBusy(true); setErr(null);
    try {
      await redeemInvite(v);
      setJoinCode('');
      await refresh();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setErr(/invalid_or_expired/.test(m) ? t('codeInvalid')
        : /cannot_pair_with_self/.test(m) ? t('codeIsYours') : m);
    } finally { setBusy(false); }
  };

  if (viewing) {
    return (
      <FriendBoard
        friend={viewing}
        onBack={() => { setViewing(null); void refresh(); }}
      />
    );
  }

  const unread = nudges.filter((n) => !n.read_at);

  return (
    <div className="view">
      <Ask state={ask} onClose={() => setAsk(null)} />

      <div className="view-head">
        <h2>{t('circle')}</h2>
        <p>{t('circleBlurb')}</p>
      </div>

      {err && <div className="card ask-err">{err}</div>}

      {/* ---- nudges received ---- */}
      {nudges.length > 0 && (
        <>
          <h3 className="sec">
            {t('nudgesForYou')} {unread.length > 0 && <span className="pill">{unread.length}</span>}
          </h3>
          {nudges.map((n) => (
            <div className={`card nudge${n.read_at ? '' : ' unread'}`} key={n.id}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5 }}>👋 {n.task_title}</div>
                {n.message && <div className="thread">“{n.message}”</div>}
                <div className="thread muted small">
                  {new Date(n.created_at).toLocaleString(t.lang === 'ar' ? 'ar' : 'en-GB')}
                </div>
              </div>
              <div className="row">
                {!n.read_at && (
                  <button onClick={async () => { await markNudgeRead(n.id); void refresh(); }}>
                    {t('markRead')}
                  </button>
                )}
                <button className="ghost" onClick={async () => { await dismissNudge(n.id); void refresh(); }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ---- friends ---- */}
      <h3 className="sec">{t('yourCircle')}</h3>
      {friends.length === 0 ? (
        <div className="empty">{t('noFriendsYet')}</div>
      ) : (
        friends.map((f) => {
          const pct = f.tasks_today ? Math.round((f.done_today / f.tasks_today) * 100) : 0;
          const quiet = f.updated_at
            ? Math.floor((Date.now() - new Date(f.updated_at).getTime()) / 86400000)
            : null;
          return (
            <div className="card friend-row" key={f.friend_id}>
              <div className="friend-avatar">{(f.display_name ?? '?')[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15 }}>{f.display_name ?? t('unnamedFriend')}</div>
                <div className="thread">
                  {f.tasks_today > 0
                    ? `${f.done_today}/${f.tasks_today} ${t('doneToday')} · ${pct}%`
                    : t('nothingPlannedToday')}
                  {quiet !== null && quiet >= 3 && (
                    <span className="pill danger" style={{ marginInlineStart: 8 }}>
                      {quiet}d {t('quiet')}
                    </span>
                  )}
                </div>
              </div>
              <button className="primary" onClick={() => setViewing(f)}>{t('viewBoard')}</button>
              <button
                className="ghost"
                title={t('unfriend')}
                onClick={() =>
                  setAsk({
                    kind: 'confirm', danger: true,
                    title: t('unfriend'),
                    body: t('unfriendConfirm'),
                    onOk: async () => { await unfriend(f.friend_id); void refresh(); },
                  })
                }
              >
                ✕
              </button>
            </div>
          );
        })
      )}

      {/* ---- pairing ---- */}
      <h3 className="sec">{t('addAFriend')}</h3>
      <div className="card">
        <div className="field">
          <label>{t('yourCode')}</label>
          {code ? (
            <div className="row">
              <code className="invite-code">{code}</code>
              <button onClick={() => navigator.clipboard?.writeText(code)}>{t('copy')}</button>
            </div>
          ) : (
            <button disabled={busy} onClick={showCode}>{t('showMyCode')}</button>
          )}
          <p className="muted small">{t('codeHint')}</p>
        </div>

        <div className="field">
          <label>{t('haveACode')}</label>
          <div className="row">
            <input
              value={joinCode}
              placeholder="ABC123"
              maxLength={8}
              style={{ textTransform: 'uppercase', maxWidth: 160 }}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && join()}
            />
            <button className="primary" disabled={busy || !joinCode.trim()} onClick={join}>
              {t('connect')}
            </button>
          </div>
        </div>
      </div>

      <p className="muted small" style={{ marginTop: 16 }}>{t('sharingReadOnlyNote')}</p>
    </div>
  );
}
