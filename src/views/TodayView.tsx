import { useStore } from '../store';
import { MAX_MITS, type Task } from '../types';
import { todayLabel } from '../dates';
import { useImage } from '../hooks/useImage';

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
