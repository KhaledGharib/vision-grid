import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { FOCUS_MINUTES, MAX_MITS, type Task } from '../types';
import { todayLabel } from '../dates';
import { useImage } from '../hooks/useImage';

/** mm:ss */
function clock(totalSec: number) {
  const m = Math.floor(Math.abs(totalSec) / 60);
  const s = Math.abs(totalSec) % 60;
  return `${totalSec < 0 ? '+' : ''}${m}:${String(s).padStart(2, '0')}`;
}

export function fmtMins(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function TaskRow({ t, nowTick }: { t: Task; nowTick: number }) {
  const toggleTask = useStore((s) => s.toggleTask);
  const toggleMit = useStore((s) => s.toggleMit);
  const vision = useStore((s) => s.visionForTask)(t);
  const weekGoals = useStore((s) => s.weekGoals);
  const startTimer = useStore((s) => s.startTimer);
  const stopTimer = useStore((s) => s.stopTimer);
  const logMinutes = useStore((s) => s.logMinutes);
  const timerTaskId = useStore((s) => s.timerTaskId);
  const timerStartedAt = useStore((s) => s.timerStartedAt);
  const url = useImage(vision?.imageId);
  const wg = weekGoals.find((w) => w.id === t.weekGoalId);

  const running = timerTaskId === t.id && timerStartedAt !== null;
  const elapsedSec = running ? Math.floor((nowTick - timerStartedAt!) / 1000) : 0;
  const remaining = FOCUS_MINUTES * 60 - elapsedSec;
  const overtime = remaining < 0;

  return (
    <div
      className={`card mit-card${t.done ? ' done' : ''}${running ? ' running' : ''}`}
      style={t.isMit ? {} : { borderLeftColor: 'transparent' }}
    >
      {url ? <img className="mit-thumb" src={url} alt="" /> : <div className="mit-thumb ph">🎯</div>}

      <button className={`chk${t.done ? ' on' : ''}`} onClick={() => toggleTask(t.id)}>
        {t.done ? '✓' : ''}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          textDecoration: t.done ? 'line-through' : 'none',
          color: t.done ? 'var(--muted)' : undefined,
        }}>
          {t.title}
        </div>
        <div className="thread">
          {wg?.title} → <b>{vision?.title ?? '—'}</b>
          {t.minutesSpent > 0 && <span className="spent"> · {fmtMins(t.minutesSpent)} invested</span>}
        </div>
      </div>

      {running ? (
        <button
          className={`timer-btn on${overtime ? ' over' : ''}`}
          onClick={stopTimer}
          title="Stop and bank this session"
        >
          ⏸ {clock(remaining)}
        </button>
      ) : (
        <button
          className="timer-btn"
          onClick={() => startTimer(t.id)}
          title={`Start a ${FOCUS_MINUTES} minute focus block`}
          disabled={t.done}
        >
          ▶ Focus
        </button>
      )}

      <button
        className="ghost log-btn"
        title="Log time done away from the app"
        onClick={() => {
          const v = prompt('How many minutes did you spend?');
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) logMinutes(t.id, Math.round(n));
        }}
      >
        +
      </button>

      <button className="star" title="Mark as one of today's 3 MITs" onClick={() => toggleMit(t.id)}>
        {t.isMit ? '⭐' : '☆'}
      </button>
    </div>
  );
}

export default function TodayView() {
  const tasks = useStore((s) => s.todayTasks)();
  const sessions = useStore((s) => s.sessions);
  const timerTaskId = useStore((s) => s.timerTaskId);
  const [nowTick, setNowTick] = useState(Date.now());

  // tick only while a timer runs
  useEffect(() => {
    if (!timerTaskId) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timerTaskId]);

  // warn before closing mid-session
  useEffect(() => {
    if (!timerTaskId) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [timerTaskId]);

  const mits = tasks.filter((t) => t.isMit);
  const rest = tasks.filter((t) => !t.isMit);
  const doneCount = tasks.filter((t) => t.done).length;

  const today = new Date().toISOString().slice(0, 10);
  const minsToday = sessions
    .filter((s) => s.endedAt.slice(0, 10) === today)
    .reduce((sum, s) => sum + s.minutes, 0);

  return (
    <div className="view">
      <div className="view-head">
        <h2>{todayLabel()}</h2>
        <p>
          {tasks.length === 0
            ? 'Nothing scheduled. Add tasks under a week goal.'
            : `${doneCount}/${tasks.length} done · star up to ${MAX_MITS} as today's most important.`}
          {minsToday > 0 && (
            <> · <b style={{ color: 'var(--accent)' }}>{fmtMins(minsToday)} focused today</b></>
          )}
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="empty">
          No tasks today.
          <br />
          Every task lives under a week goal — go to <b>Week</b> to add one.
        </div>
      ) : (
        <>
          {mits.length > 0 && (
            <>
              <div className="muted" style={{ margin: '0 0 8px' }}>
                ⭐ Most important ({mits.length}/{MAX_MITS})
              </div>
              {mits.map((t) => <TaskRow key={t.id} t={t} nowTick={nowTick} />)}
            </>
          )}
          {rest.length > 0 && (
            <>
              <div className="muted" style={{ margin: '20px 0 8px' }}>Everything else</div>
              {rest.map((t) => <TaskRow key={t.id} t={t} nowTick={nowTick} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}
