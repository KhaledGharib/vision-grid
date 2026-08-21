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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, Copy, Handshake, Plus, X } from 'lucide-react';

/** Big progress ring — the friend's day, as the hero stat. */
function DayRing({ done, total, size = 74 }: { done: number; total: number; size?: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const full = pct >= 100;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,.09)" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={full ? '#34d399' : '#f0b429'}
        strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .5s ease' }}
      />
      <text x={size / 2} y={size / 2 - 3} textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize={size * 0.27} fontWeight="700">
        {done}<tspan fill="#8b93a4" fontSize={size * 0.19}>/{total || 0}</tspan>
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" dominantBaseline="central"
        fill={full ? '#34d399' : '#8b93a4'} fontSize={size * 0.14} fontWeight="600">
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
        : /cannot_pair_with_self/.test(m) ? t('codeIsYours')
        : /too_many_attempts/.test(m) ? t('codeThrottled') : m);
    } finally { setBusy(false); }
  };

  if (viewing) {
    return <FriendBoard friend={viewing} onBack={() => { setViewing(null); void refresh(); }} />;
  }

  const unread = nudges.filter((n) => !n.read_at);
  const locale = t.lang === 'ar' ? 'ar' : 'en-GB';

  return (
    <div className="view">
      <Ask state={ask} onClose={() => setAsk(null)} />

      <div className="view-head mb-[18px]">
        <h2>{t('circle')}</h2>
        <p>{t('circleBlurb')}</p>
      </div>

      {err && <div className="mb-3 text-[12.5px] text-[#f87171]">{err}</div>}

      {/* ---------- nudges: loud when unread ---------- */}
      {unread.length > 0 && (
        <div className="mb-[22px] flex flex-col gap-2">
          {unread.map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-3 rounded-[12px] border border-[#7a5c14] bg-gradient-to-r from-[#f0b429]/[.13] to-[#f0b429]/[.03] px-[15px] py-[13px]"
            >
              <div className="animate-[wave_2.4s_ease-in-out_infinite] text-[22px]">👋</div>
              <Avatar emoji={n.from_emoji} color={n.from_color} name={n.from_name} size={40} />
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold">
                  {n.from_name ?? t('unnamedFriend')} ·{' '}
                  <span className="font-normal text-[#8b93a4]">{n.task_title}</span>
                </div>
                {n.message && <div className="my-0.5 text-[13.5px] italic">“{n.message}”</div>}
                <div className="text-[12px] text-[#8b93a4]">
                  {new Date(n.created_at).toLocaleString(locale)}
                </div>
              </div>
              <Button
                variant="primary"
                onClick={async () => { await markNudgeRead(n.id); void refresh(); }}
              >
                {t('markRead')}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* ---------- the people: the hero of this screen ---------- */}
      {friends.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#262c38] px-6 py-[52px] text-center">
          <div className="mb-3 flex justify-center">
            <Handshake className="h-11 w-11 text-[#8b93a4]" />
          </div>
          <h3 className="mb-1.5 text-[18px]">{t('noFriendsTitle')}</h3>
          <p className="mx-auto mb-5 max-w-[380px] text-[13.5px] text-[#8b93a4]">
            {t('noFriendsYet')}
          </p>
          <Button variant="primary" size="lg" disabled={busy} onClick={showCode}>
            {t('showMyCode')}
          </Button>
          <Button variant="ghost" className="ms-2" onClick={() => setShowInvite(true)}>
            {t('haveACode')}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] items-start gap-3.5">
            {friends.map((f) => {
              const quiet = f.updated_at
                ? Math.floor((Date.now() - new Date(f.updated_at).getTime()) / 86400000)
                : null;
              const isQuiet = quiet !== null && quiet >= 3;
              const perfect = f.tasks_today > 0 && f.done_today >= f.tasks_today;
              const idle = f.tasks_today === 0;
              return (
                <div
                  key={f.friend_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setViewing(f)}
                  onKeyDown={(e) => e.key === 'Enter' && setViewing(f)}
                  className={cn(
                    'group relative flex min-h-[196px] cursor-pointer flex-col rounded-[14px] border p-4',
                    'bg-[#151922] transition-all hover:-translate-y-0.5 hover:bg-[#1b2029]',
                    perfect ? 'border-[#34d399]/40'
                      : isQuiet ? 'border-[#f87171]/30'
                      : 'border-[#262c38] hover:border-[#7a5c14]',
                  )}
                >
                  <button
                    className="btn-reset absolute end-2 top-2 z-[2] grid h-6 w-6 place-items-center rounded-full text-[#8b93a4] opacity-0 transition hover:bg-[#f87171]/[.12] hover:text-[#f87171] group-hover:opacity-100"
                    title={t('unfriend')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAsk({
                        kind: 'confirm', danger: true,
                        title: t('unfriend'), body: t('unfriendConfirm'),
                        onOk: async () => { await unfriend(f.friend_id); void refresh(); },
                      });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>

                  <div className="mb-3 flex items-center justify-between">
                    <Avatar emoji={f.avatar_emoji} color={f.avatar_color}
                            name={f.display_name} size={52} />
                    <div className={cn(idle && 'opacity-55')}>
                      <DayRing done={f.done_today} total={f.tasks_today} />
                    </div>
                  </div>

                  <div className="mb-1 truncate text-[16px] font-semibold">
                    {f.display_name ?? t('unnamedFriend')}
                  </div>
                  <div className="text-[12.5px] text-[#8b93a4]">
                    {f.tasks_today > 0
                      ? (perfect ? '🔥 ' + t('perfectDay') : `${f.done_today}/${f.tasks_today} ${t('doneToday')}`)
                      : t('nothingPlannedToday')}
                  </div>

                  <div className="mt-auto">
                    {isQuiet && (
                      <div className="mt-2 inline-block rounded-full bg-[#f87171]/10 px-2.5 py-[3px] text-[11.5px] text-[#f87171]">
                        💤 {quiet}{t('daysQuiet')}
                      </div>
                    )}
                    {!isQuiet && idle && (
                      <div className="mt-2 inline-block rounded-full bg-[#f0b429]/10 px-2.5 py-[3px] text-[11.5px] text-[#f0b429]">
                        {t('nudgeThemToStart')}
                      </div>
                    )}
                    {!isQuiet && perfect && (
                      <div className="mt-2 inline-block rounded-full bg-[#34d399]/[.12] px-2.5 py-[3px] text-[11.5px] text-[#34d399]">
                        ✓ {t('allClear')}
                      </div>
                    )}
                    <div className="mt-3 text-[12.5px] text-[#f0b429] opacity-0 transition-opacity group-hover:opacity-100">
                      {t('viewBoard')} ›
                    </div>
                  </div>
                </div>
              );
            })}

            {/* invite slot sits inside the grid, quiet and secondary */}
            <button
              className="btn-reset flex min-h-[196px] flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-[#262c38] bg-transparent p-4 text-center text-[#8b93a4] transition-colors hover:border-[#7a5c14] hover:text-[#f0b429]"
              onClick={() => setShowInvite(true)}
            >
              <Plus className="mb-1 h-7 w-7" />
              <div className="text-[16px] font-semibold">{t('addAFriend')}</div>
              <div className="text-[12.5px]">{t('addAFriendHint')}</div>
            </button>
          </div>

          {nudges.length > unread.length && (
            <details className="group mt-[22px] max-w-[560px]">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-[10px] border border-[#262c38] bg-[#151922] px-3 py-2 text-[13px] text-[#8b93a4] transition-colors hover:border-[#39424f] hover:text-[#e6e9ef] [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:rotate-90" />
                {t('earlierNudges')} ({nudges.length - unread.length})
              </summary>
              {nudges.filter((n) => n.read_at).map((n) => (
                <div
                  key={n.id}
                  className="mt-2 flex items-center gap-3 rounded-[12px] border border-[#262c38] bg-[#151922] p-3"
                >
                  <Avatar emoji={n.from_emoji} color={n.from_color} name={n.from_name} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px]">
                      <b>{n.from_name ?? t('unnamedFriend')}</b> · {n.task_title}
                    </div>
                    {n.message && (
                      <div className="text-[12.5px] italic text-[#8b93a4]">“{n.message}”</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => { await dismissNudge(n.id); void refresh(); }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </details>
          )}
        </>
      )}

      {/* ---------- invite: a modal, not a wall of form ---------- */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{t('addAFriend')}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <label className="text-[12.5px] text-[#8b93a4]">{t('yourCode')}</label>
            {code ? (
              <div className="flex items-center gap-2.5">
                <code className="flex-1 rounded-[10px] border border-[#262c38] bg-[#0d0f14] px-3 py-2 font-mono text-[18px] tracking-[3px] text-[#f0b429]">
                  {code}
                </code>
                <Button
                  variant={copied ? 'primary' : 'default'}
                  onClick={() => {
                    navigator.clipboard?.writeText(code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t('copied') : t('copy')}
                </Button>
              </div>
            ) : (
              <Button variant="primary" disabled={busy} onClick={showCode}>
                {t('showMyCode')}
              </Button>
            )}
            <p className="text-[12px] text-[#8b93a4]">{t('codeHint')}</p>
          </div>

          <div className="my-2 flex items-center gap-3 text-[12px] text-[#8b93a4]
            before:h-px before:flex-1 before:bg-[#262c38]
            after:h-px after:flex-1 after:bg-[#262c38]">
            {t('or')}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12.5px] text-[#8b93a4]">{t('haveACode')}</label>
            <div className="flex gap-2">
              <Input
                value={joinCode}
                placeholder="ABC123"
                maxLength={8}
                className="max-w-[150px] font-mono text-[16px] uppercase tracking-[3px]"
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && join()}
              />
              <Button variant="primary" disabled={busy || !joinCode.trim()} onClick={join}>
                {t('connect')}
              </Button>
            </div>
          </div>

          {err && <p className="text-[12.5px] text-[#f87171]">{err}</p>}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInvite(false)}>{t('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="mt-[22px] text-[12px] text-[#8b93a4] opacity-55">
        {t('sharingReadOnlyNote')}
      </p>
    </div>
  );
}
