import { useEffect, useState } from 'react';
import { fetchFriendBoard, friendImageUrl, nudgesLeft, sendNudge, type FriendSummary } from '../social';
import { useT } from '../useT';
import { STARVE_AFTER_DAYS, type AppState, type BoardElement, type Task } from '../types';
import Ask, { type AskState } from './Ask';
import ReadOnlyCanvas, { type ReadOnlyStats } from './ReadOnlyCanvas';

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
      <div className={`card mit-card${task.done ? ' done' : ''}`}>
        <div className={`chk${task.done ? ' on' : ''}`} aria-hidden>{task.done ? '✓' : ''}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {showChain && c.vision && (
            <div className="chain-crumb">
              {urls[c.vision.id] && <img src={urls[c.vision.id]} alt="" className="crumb-img" />}
              <span className="crumb-v">{c.vision.title}</span>
              <span className="crumb-sep">→</span>
              <span>{c.monthGoal}</span>
              <span className="crumb-sep">→</span>
              <span>{c.weekGoal}</span>
            </div>
          )}
          <div style={{
            textDecoration: task.done ? 'line-through' : 'none',
            color: task.done ? 'var(--muted)' : undefined,
          }}>
            {task.isMit && '⭐ '}{task.title}
          </div>
        </div>
        {!task.done && (
          <button
            disabled={left <= 0 || sent.includes(task.id)}
            title={left <= 0 ? t('budgetGone') : t('nudgeAbout')}
            onClick={() => nudge(task)}
          >
            {sent.includes(task.id) ? '✓ ' + t('nudged') : '👋 ' + t('nudge')}
          </button>
        )}
      </div>
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
          <div className="row" style={{ marginBottom: 6 }}>
            <button className="ghost" onClick={() => setFocus(null)}>‹ {t('tabBoard')}</button>
          </div>
          <div className="focus-head">
            {urls[focus] && <img src={urls[focus]} alt="" className="focus-img" />}
            <div>
              <h2 style={{ margin: 0 }}>{vision?.title}</h2>
              <p style={{ margin: '4px 0 0' }}>
                {p && p.total > 0
                  ? `${p.done}/${p.total} ${t('doneToday')} · ${Math.round((p.done / p.total) * 100)}%`
                  : t('noGoalsForVision')}
                {' · '}<b style={{ color: 'var(--accent)' }}>{left}</b> {t('nudgesLeft')}
              </p>
            </div>
          </div>
        </div>

        {err && <div className="card ask-err">{err}</div>}

        {months.length === 0 ? (
          <div className="empty">{t('noGoalsForVision')}</div>
        ) : months.map((m) => {
          const weeks = state.weekGoals.filter((w) => w.monthGoalId === m.id);
          return (
            <div key={m.id} className="chain-block">
              <h3 className="sec">📅 {m.title}</h3>
              {weeks.length === 0 ? (
                <div className="empty small">{t('noWeekGoals')}</div>
              ) : weeks.map((w) => {
                const tasks = state.tasks.filter((x) => x.weekGoalId === w.id);
                return (
                  <div key={w.id} className="week-block">
                    <div className="week-label">🗓 {w.title}</div>
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
        <div className="row" style={{ marginBottom: 6 }}>
          <button className="ghost" onClick={onBack}>‹ {t('circle')}</button>
          <div className="spacer" />
          <div className="tabs">
            <button className={`tab${tab === 'board' ? ' active' : ''}`} onClick={() => setTab('board')}>
              {t('tabBoard')}
            </button>
            <button className={`tab${tab === 'today' ? ' active' : ''}`} onClick={() => setTab('today')}>
              {t('tabToday')}
            </button>
          </div>
        </div>
        <h2>{friend.display_name ?? t('unnamedFriend')}</h2>
        <p>
          {tab === 'board' ? t('tapVisionHint') : t('readOnlyBoard')}
          {' · '}<b style={{ color: 'var(--accent)' }}>{left}</b> {t('nudgesLeft')}
        </p>
      </div>

      {err && <div className="card ask-err">{err}</div>}

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
