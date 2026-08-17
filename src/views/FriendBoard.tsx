import { useEffect, useState } from 'react';
import { fetchFriendBoard, friendImageUrl, nudgesLeft, sendNudge, type FriendSummary } from '../social';
import { useT } from '../useT';
import { STARVE_AFTER_DAYS, type AppState, type BoardElement, type Task } from '../types';
import Ask, { type AskState } from './Ask';
import ReadOnlyCanvas, { type ReadOnlyStats } from './ReadOnlyCanvas';
import Avatar from './Avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft, Star } from 'lucide-react';

/** The full chain behind one task, so a nudge can name what it's really about. */
interface Chain {
  task: Task;
  weekGoal?: string;
  monthGoal?: string;
  vision?: BoardElement;
}

function buildChain(state: AppState, task: Task): Chain {
  const wg = state.weekGoals.find((w) => w.id === task.weekGoalId);
  const mg = wg ? state.monthGoals.find((m) => m.id === wg.monthGoalId) : undefined;
  const vision = mg ? state.elements.find((e) => e.id === mg.visionId) : undefined;
  return { task, weekGoal: wg?.title, monthGoal: mg?.title, vision };
}

function deriveStats(state: AppState): ReadOnlyStats {
  const progress: ReadOnlyStats['progress'] = {};
  const starve: ReadOnlyStats['starve'] = {};
  for (const el of state.elements) {
    if (el.kind !== 'vision') continue;
    const mgIds = state.monthGoals.filter((g) => g.visionId === el.id).map((g) => g.id);
    const wgIds = state.weekGoals.filter((w) => mgIds.includes(w.monthGoalId)).map((w) => w.id);
    const tasks = state.tasks.filter((t) => wgIds.includes(t.weekGoalId));
    progress[el.id] = { done: tasks.filter((t) => t.done).length, total: tasks.length };
    const stamps = tasks.filter((t) => t.done && t.completedAt)
      .map((t) => new Date(t.completedAt as string).getTime());
    const days = stamps.length
      ? Math.floor((Date.now() - Math.max(...stamps)) / 86400000)
      : Math.floor((Date.now() - new Date(el.createdAt).getTime()) / 86400000);
    starve[el.id] = days <= 0 ? 0 : Math.max(0, Math.min(1, days / STARVE_AFTER_DAYS));
  }
  return { progress, starve };
}

export default function FriendBoard({
  friend, onBack,
}: { friend: FriendSummary; onBack: () => void }) {
  const t = useT();
  const [state, setState] = useState<AppState | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [left, setLeft] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [ask, setAsk] = useState<AskState>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [tab, setTab] = useState<'board' | 'today'>('board');
  /** vision drilled into from the canvas */
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const s = await fetchFriendBoard(friend.friend_id);
        if (dead) return;
        setState(s);
        setLeft(await nudgesLeft(friend.friend_id));
        const visions = (s?.elements ?? []).filter((e) => e.kind === 'vision' && e.imageId);
        const pairs = await Promise.all(visions.map(async (v) =>
          [v.id, await friendImageUrl(friend.friend_id, v.imageId!)] as const));
        if (dead) return;
        const map: Record<string, string> = {};
        for (const [id, url] of pairs) if (url) map[id] = url;
        setUrls(map);
      } catch (e) {
        if (!dead) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { dead = true; };
  }, [friend.friend_id]);

  const today = new Date().toISOString().slice(0, 10);
  const activeBoard = state?.boards.find((b) => b.isActive) ?? state?.boards[0];
  const boardEls = (state?.elements ?? []).filter((e) => e.boardId === activeBoard?.id);

  const nudge = (task: Task) => {
    if (!state) return;
    const c = buildChain(state, task);
    setAsk({
      kind: 'prompt',
      title: t('nudgeAbout') + ': ' + task.title,
      body: c.vision
        ? `${c.vision.title} → ${c.monthGoal ?? '—'} → ${c.weekGoal ?? '—'}`
        : undefined,
      placeholder: t('nudgePlaceholder'),
      okLabel: t('sendNudge'),
      onOk: async (msg) => {
        try {
          await sendNudge(friend.friend_id, task.id, task.title, msg);
          setSent((s) => [...s, task.id]);
          setLeft(await nudgesLeft(friend.friend_id));
        } catch (e) {
          const m = e instanceof Error ? e.message : String(e);
          setErr(/daily_budget/.test(m) ? t('budgetGone') : m);
        }
      },
    });
  };

  /** A task row that shows the chain above it. */
  const TaskRow = ({ task, showChain }: { task: Task; showChain: boolean }) => {
    if (!state) return null;
    const c = buildChain(state, task);
    return (
      <Card className={cn('mb-2.5 flex items-center gap-3 p-3', task.done && 'opacity-70')}>
        <div
          className={cn(
            'grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border',
            task.done
              ? 'border-[#34d399] bg-[#34d399] text-[#0d0f14]'
              : 'border-[#39424f]',
          )}
          aria-hidden
        >
          {task.done && <Check className="h-3 w-3" strokeWidth={3} />}
        </div>
        <div className="min-w-0 flex-1">
          {showChain && c.vision && (
            <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-[#8b93a4]">
              {urls[c.vision.id] && (
                <img
                  src={urls[c.vision.id]}
                  alt=""
                  className="h-[18px] w-[18px] rounded border border-[#262c38] object-cover"
                />
              )}
              <span className="text-[#e6e9ef]">{c.vision.title}</span>
              <span className="opacity-50">→</span>
              <span>{c.monthGoal}</span>
              <span className="opacity-50">→</span>
              <span>{c.weekGoal}</span>
            </div>
          )}
          <div
            className={cn(
              'flex items-center gap-1.5 text-[14px]',
              task.done && 'text-[#8b93a4] line-through',
            )}
          >
            {task.isMit && <Star className="h-3 w-3 shrink-0 fill-[#f0b429] text-[#f0b429]" />}
            {task.title}
          </div>
        </div>
        {!task.done && (
          <Button
            size="sm"
            disabled={left <= 0 || sent.includes(task.id)}
            title={left <= 0 ? t('budgetGone') : t('nudgeAbout')}
            onClick={() => nudge(task)}
          >
            {sent.includes(task.id) ? '✓ ' + t('nudged') : '👋 ' + t('nudge')}
          </Button>
        )}
      </Card>
    );
  };

  // ---- drilled into one vision ----
  if (focus && state) {
    const vision = state.elements.find((e) => e.id === focus);
    const months = state.monthGoals.filter((m) => m.visionId === focus);
    const stats = deriveStats(state);
    const p = stats.progress[focus];

    return (
      <div className="view">
        <Ask state={ask} onClose={() => setAsk(null)} />
        <div className="view-head">
          <div className="mb-1.5">
            <Button variant="ghost" size="sm" onClick={() => setFocus(null)}>
              <ChevronLeft className="h-3.5 w-3.5" /> {t('tabBoard')}
            </Button>
          </div>
          <div className="flex items-center gap-3.5">
            {urls[focus] && (
              <img
                src={urls[focus]}
                alt=""
                className="h-[62px] w-[62px] rounded-xl border border-[#262c38] object-cover"
              />
            )}
            <div>
              <h2 className="m-0">{vision?.title}</h2>
              <p className="mt-1">
                {p && p.total > 0
                  ? `${p.done}/${p.total} ${t('doneToday')} · ${Math.round((p.done / p.total) * 100)}%`
                  : t('noGoalsForVision')}
                {' · '}<b style={{ color: 'var(--accent)' }}>{left}</b> {t('nudgesLeft')}
              </p>
            </div>
          </div>
        </div>

        {err && <Card className="mb-3 text-[12.5px] text-[#f87171]">{err}</Card>}

        {months.length === 0 ? (
          <div className="empty">{t('noGoalsForVision')}</div>
        ) : months.map((m) => {
          const weeks = state.weekGoals.filter((w) => w.monthGoalId === m.id);
          return (
            <div key={m.id} className="mb-5">
              <h3 className="mb-2 text-[14px] font-semibold text-[#e6e9ef]">📅 {m.title}</h3>
              {weeks.length === 0 ? (
                <div className="empty small">{t('noWeekGoals')}</div>
              ) : weeks.map((w) => {
                const tasks = state.tasks.filter((x) => x.weekGoalId === w.id);
                return (
                  <div key={w.id} className="mb-3 ms-3.5">
                    <div className="mb-1.5 text-[13px] text-[#8b93a4]">🗓 {w.title}</div>
                    {tasks.length === 0
                      ? <div className="empty small">{t('noTasksYet')}</div>
                      : tasks.map((task) => (
                          <TaskRow key={task.id} task={task} showChain={false} />
                        ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // ---- board / today ----
  const tasksToday: Task[] = (state?.tasks ?? []).filter((x) => x.date === today);

  return (
    <div className={`view${tab === 'board' ? ' friend-view' : ''}`}>
      <Ask state={ask} onClose={() => setAsk(null)} />

      <div className="view-head">
        <div className="mb-1.5 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-3.5 w-3.5" /> {t('circle')}
          </Button>
          <div className="flex-1" />
          <div className="flex gap-1 rounded-[10px] border border-[#262c38] bg-[#0d0f14] p-1">
            {(['board', 'today'] as const).map((id) => (
              <button
                key={id}
                className={cn(
                  'rounded-md px-3 py-1 text-[13px] transition-colors',
                  tab === id
                    ? 'bg-[#1b2029] text-[#e6e9ef]'
                    : 'text-[#8b93a4] hover:text-[#e6e9ef]',
                )}
                onClick={() => setTab(id)}
              >
                {id === 'board' ? t('tabBoard') : t('tabToday')}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Avatar emoji={friend.avatar_emoji} color={friend.avatar_color}
                  name={friend.display_name} size={40} />
          <h2 className="m-0">{friend.display_name ?? t('unnamedFriend')}</h2>
        </div>
        <p>
          {tab === 'board' ? t('tapVisionHint') : t('readOnlyBoard')}
          {' · '}<b className="text-[#f0b429]">{left}</b> {t('nudgesLeft')}
        </p>
      </div>

      {err && <Card className="mb-3 text-[12.5px] text-[#f87171]">{err}</Card>}

      {!state ? (
        <div className="empty">{t('loading')}</div>
      ) : tab === 'board' ? (
        boardEls.length === 0 ? (
          <div className="empty">{t('noVisionsShared')}</div>
        ) : (
          <ReadOnlyCanvas
            elements={boardEls}
            bg={activeBoard?.bg ?? '#0d0f14'}
            imageUrls={urls}
            stats={deriveStats(state)}
            onVisionClick={(id) => setFocus(id)}
          />
        )
      ) : tasksToday.length === 0 ? (
        <div className="empty">{t('nothingPlannedToday')}</div>
      ) : (
        tasksToday.map((task) => <TaskRow key={task.id} task={task} showChain />)
      )}
    </div>
  );
}
