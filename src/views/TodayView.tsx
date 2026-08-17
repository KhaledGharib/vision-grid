import { useStore } from '../store';
import { MAX_MITS, type Task } from '../types';
import { todayLabel } from '../dates';
import { useImage } from '../hooks/useImage';
import { Coach, Example } from './Coach';

function TaskRow({ t }: { t: Task }) {
  const toggleTask = useStore((s) => s.toggleTask);
  const toggleMit = useStore((s) => s.toggleMit);
  const vision = useStore((s) => s.visionForTask)(t);
  const weekGoals = useStore((s) => s.weekGoals);
  const url = useImage(vision?.imageId);
  const wg = weekGoals.find((w) => w.id === t.weekGoalId);

  return (
    <div className={`card mit-card${t.done ? ' done' : ''}`} style={t.isMit ? {} : { borderLeftColor: 'transparent' }}>
      {url ? (
        <img className="mit-thumb" src={url} alt="" />
      ) : (
        <div className="mit-thumb ph">🎯</div>
      )}
      <button className={`chk${t.done ? ' on' : ''}`} onClick={() => toggleTask(t.id)}>
        {t.done ? '✓' : ''}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--muted)' : undefined }}>
          {t.title}
        </div>
        <div className="thread">
          {wg?.title} → <b>{vision?.title ?? '—'}</b>
        </div>
      </div>
      <button className="star" title="Mark as one of today's 3 MITs" onClick={() => toggleMit(t.id)}>
        {t.isMit ? '⭐' : '☆'}
      </button>
    </div>
  );
}

export default function TodayView() {
  const tasks = useStore((s) => s.todayTasks)();
  const mits = tasks.filter((t) => t.isMit);
  const rest = tasks.filter((t) => !t.isMit);
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="view">
      <div className="view-head">
        <h2>{todayLabel()}</h2>
        <p>
          {tasks.length === 0
            ? 'Nothing scheduled. Add tasks under a week goal.'
            : `${doneCount}/${tasks.length} done · star up to ${MAX_MITS} as today's most important.`}
        </p>
      </div>

      <Coach id="today" title="How to pick today's tasks">
        <p>
          A task is <b>one concrete action</b> you could sit down and finish in a single
          sitting — usually 20–60 minutes. If it needs several sessions, it's still a goal.
        </p>
        <p className="coach-rule">
          Test it: do you know exactly what to do first? If you'd have to think about
          "how do I even start", break it down further.
        </p>
        <Example
          bad="Sort out finances"
          good="Cancel the 3 subscriptions I don't use"
          why="You can start this in 10 seconds. The other one you'd avoid all week."
        />
        <Example
          bad="Work on Stripe"
          good="Add the webhook endpoint and test one payment"
          why="Specific enough that 'done' is obvious."
        />
        <p className="coach-foot">
          Star up to 3 as your MITs. If you only did those, the day counts.
        </p>
      </Coach>

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
              {mits.map((t) => (
                <TaskRow key={t.id} t={t} />
              ))}
            </>
          )}
          {rest.length > 0 && (
            <>
              <div className="muted" style={{ margin: '20px 0 8px' }}>
                Everything else
              </div>
              {rest.map((t) => (
                <TaskRow key={t.id} t={t} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
