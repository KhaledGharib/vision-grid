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
import Avatar from './Avatar';

/** Big progress ring — the friend's day, as the hero stat. */
function DayRing({ done, total, size = 74 }: { done: number; total: number; size?: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const full = pct >= 100;
  return (
    <svg className="day-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,.09)" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={full ? 'var(--green)' : 'var(--accent)'}
        strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .5s ease' }}
      />
      <text x={size / 2} y={size / 2 - 3} textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize={size * 0.27} fontWeight="700">
        {done}<tspan fill="var(--muted)" fontSize={size * 0.19}>/{total || 0}</tspan>
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" dominantBaseline="central"
        fill={full ? 'var(--green)' : 'var(--muted)'} fontSize={size * 0.14} fontWeight="600">
        {pct}%
      </text>
    </svg>
  );
}

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
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);

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
      const c = await myInviteCode();
      setCode(c);
      setShowInvite(true);
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
      setShowInvite(false);
      await refresh();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setErr(/invalid_or_expired/.test(m) ? t('codeInvalid')
        : /cannot_pair_with_self/.test(m) ? t('codeIsYours') : m);
    } finally { setBusy(false); }
  };

  if (viewing) {
    return <FriendBoard friend={viewing} onBack={() => { setViewing(null); void refresh(); }} />;
  }

  const unread = nudges.filter((n) => !n.read_at);
  const locale = t.lang === 'ar' ? 'ar' : 'en-GB';

  return (
    <div className="view together">
      <Ask state={ask} onClose={() => setAsk(null)} />

      <div className="view-head">
        <h2>{t('circle')}</h2>
        <p>{t('circleBlurb')}</p>
      </div>

      {err && <div className="card ask-err">{err}</div>}

      {/* ---------- nudges: loud when unread ---------- */}
      {unread.length > 0 && (
        <div className="nudge-stack">
          {unread.map((n) => (
            <div className="nudge-hero" key={n.id}>
              <div className="nudge-wave">👋</div>
              <Avatar emoji={n.from_emoji} color={n.from_color} name={n.from_name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nudge-from">
                  {n.from_name ?? t('unnamedFriend')} · <span>{n.task_title}</span>
                </div>
                {n.message && <div className="nudge-msg">“{n.message}”</div>}
                <div className="muted small">{new Date(n.created_at).toLocaleString(locale)}</div>
              </div>
              <button className="primary" onClick={async () => { await markNudgeRead(n.id); void refresh(); }}>
                {t('markRead')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ---------- the people: the hero of this screen ---------- */}
      {friends.length === 0 ? (
        <div className="together-empty">
          <div className="te-emoji">🤝</div>
          <h3>{t('noFriendsTitle')}</h3>
          <p>{t('noFriendsYet')}</p>
          <button className="primary big" disabled={busy} onClick={showCode}>
            {t('showMyCode')}
          </button>
          <button className="ghost" onClick={() => setShowInvite(true)}>{t('haveACode')}</button>
        </div>
      ) : (
        <>
          <div className="friend-grid">
            {friends.map((f) => {
              const quiet = f.updated_at
                ? Math.floor((Date.now() - new Date(f.updated_at).getTime()) / 86400000)
                : null;
              const isQuiet = quiet !== null && quiet >= 3;
              const perfect = f.tasks_today > 0 && f.done_today >= f.tasks_today;
              return (
                <div
                  className={`friend-card${isQuiet ? ' quiet' : ''}${perfect ? ' perfect' : ''}${f.tasks_today === 0 ? ' idle' : ''}`}
                  key={f.friend_id}
                  onClick={() => setViewing(f)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setViewing(f)}
                >
                  <button
                    className="fc-x"
                    title={t('unfriend')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAsk({
                        kind: 'confirm', danger: true,
                        title: t('unfriend'), body: t('unfriendConfirm'),
                        onOk: async () => { await unfriend(f.friend_id); void refresh(); },
                      });
                    }}
                  >✕</button>

                  <div className="fc-top">
                    <Avatar emoji={f.avatar_emoji} color={f.avatar_color}
                            name={f.display_name} size={52} />
                    <DayRing done={f.done_today} total={f.tasks_today} />
                  </div>

                  <div className="fc-name">{f.display_name ?? t('unnamedFriend')}</div>
                  <div className={`fc-status${f.tasks_today === 0 ? ' fc-idle' : ''}`}>
                    {f.tasks_today > 0
                      ? (perfect ? '🔥 ' + t('perfectDay') : `${f.done_today}/${f.tasks_today} ${t('doneToday')}`)
                      : t('nothingPlannedToday')}
                  </div>

                  <div className="fc-foot">
                    {isQuiet && <div className="fc-quiet">💤 {quiet}{t('daysQuiet')}</div>}
                    {!isQuiet && f.tasks_today === 0 && (
                      <div className="fc-invite">{t('nudgeThemToStart')}</div>
                    )}
                    {!isQuiet && perfect && (
                      <div className="fc-streak">✓ {t('allClear')}</div>
                    )}
                    <div className="fc-cta">{t('viewBoard')} ›</div>
                  </div>
                </div>
              );
            })}

            {/* invite slot sits inside the grid, quiet and secondary */}
            <button className="friend-card add-slot" onClick={() => setShowInvite(true)}>
              <div className="as-plus">+</div>
              <div className="fc-name">{t('addAFriend')}</div>
              <div className="fc-status">{t('addAFriendHint')}</div>
            </button>
          </div>

          {nudges.length > unread.length && (
            <details className="past-nudges">
              <summary>{t('earlierNudges')} ({nudges.length - unread.length})</summary>
              {nudges.filter((n) => n.read_at).map((n) => (
                <div className="card nudge" key={n.id}>
                  <Avatar emoji={n.from_emoji} color={n.from_color} name={n.from_name} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5 }}>
                      <b>{n.from_name ?? t('unnamedFriend')}</b> · {n.task_title}
                    </div>
                    {n.message && <div className="thread">“{n.message}”</div>}
                  </div>
                  <button className="ghost" onClick={async () => { await dismissNudge(n.id); void refresh(); }}>✕</button>
                </div>
              ))}
            </details>
          )}
        </>
      )}

      {/* ---------- invite: a modal, not a wall of form ---------- */}
      {showInvite && (
        <div className="ask-overlay" onClick={() => setShowInvite(false)}>
          <div className="ask ask-wide" onClick={(e) => e.stopPropagation()}>
            <h3>{t('addAFriend')}</h3>

            <div className="field">
              <label>{t('yourCode')}</label>
              {code ? (
                <div className="code-box">
                  <code className="invite-code">{code}</code>
                  <button
                    className={copied ? 'primary' : ''}
                    onClick={() => {
                      navigator.clipboard?.writeText(code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    }}
                  >
                    {copied ? '✓ ' + t('copied') : t('copy')}
                  </button>
                </div>
              ) : (
                <button className="primary" disabled={busy} onClick={showCode}>
                  {t('showMyCode')}
                </button>
              )}
              <p className="muted small">{t('codeHint')}</p>
            </div>

            <div className="or-split"><span>{t('or')}</span></div>

            <div className="field">
              <label>{t('haveACode')}</label>
              <div className="row">
                <input
                  value={joinCode}
                  placeholder="ABC123"
                  maxLength={8}
                  className="code-input"
                  onChange={(e) => setJoinCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && join()}
                />
                <button className="primary" disabled={busy || !joinCode.trim()} onClick={join}>
                  {t('connect')}
                </button>
              </div>
            </div>

            {err && <p className="ask-err">{err}</p>}

            <div className="ask-actions">
              <button className="ghost" onClick={() => setShowInvite(false)}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}

      <p className="muted small footnote">{t('sharingReadOnlyNote')}</p>
    </div>
  );
}
