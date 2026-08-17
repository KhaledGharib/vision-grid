import { useStore } from '../store';
import { MAX_MITS, type Task } from '../types';
import { todayLabel } from '../dates';
import { useImage } from '../hooks/useImage';
import { Coach, Example } from './Coach';
import { useT } from '../useT';

function TaskRow({ task }: { task: Task }) {
  const toggleTask = useStore((s) => s.toggleTask);
  const toggleMit = useStore((s) => s.toggleMit);
  const vision = useStore((s) => s.visionForTask)(task);
  const weekGoals = useStore((s) => s.weekGoals);
  const url = useImage(vision?.imageId);
  const wg = weekGoals.find((w) => w.id === task.weekGoalId);
  const t = useT();

  return (
    <div
      className={`card mit-card${task.done ? ' done' : ''}`}
      style={task.isMit ? {} : { borderLeftColor: 'transparent' }}
    >
      {url ? (
        <img className="mit-thumb" src={url} alt="" />
      ) : (
        <div className="mit-thumb ph">🎯</div>
      )}
      <button className={`chk${task.done ? ' on' : ''}`} onClick={() => toggleTask(task.id)}>
        {task.done ? '✓' : ''}
      </button>
      <div style={{ flex: 1 }}>
        <div
          style={{
            textDecoration: task.done ? 'line-through' : 'none',
            color: task.done ? 'var(--muted)' : undefined,
          }}
        >
          {task.title}
        </div>
        <div className="thread">
          {wg?.title} → <b>{vision?.title ?? '—'}</b>
        </div>
      </div>
      <button className="star" title={t('markMit')} onClick={() => toggleMit(task.id)}>
        {task.isMit ? '⭐' : '☆'}
      </button>
    </div>
  );
}

export default function TodayView() {
  const tasks = useStore((s) => s.todayTasks)();
  const t = useT();
  const mits = tasks.filter((x) => x.isMit);
  const rest = tasks.filter((x) => !x.isMit);
  const doneCount = tasks.filter((x) => x.done).length;

  return (
    <div className="view">
      <div className="view-head">
        <h2>{todayLabel(t.lang)}</h2>
        <p>
          {tasks.length === 0
            ? t('nothingScheduled')
            : `${doneCount}/${tasks.length} ${t('done')} · ${t('starHint')}`}
        </p>
      </div>

      <Coach id="today" title={t('coachTodayTitle')}>
        <p>{t('coachTodayBody')}</p>
        <p className="coach-rule">{t('coachTodayRule')}</p>
        <Example bad={t('exBadFinance')} good={t('exGoodFinance')} why={t('exWhyFinance')} />
        <Example bad={t('exBadStripe')} good={t('exGoodStripe')} why={t('exWhyStripe')} />
        <p className="coach-foot">{t('coachTodayFoot')}</p>
      </Coach>

      {tasks.length === 0 ? (
        <div className="empty">
          {t('todayEmpty')}
          <br />
          {t('todayEmptyHint')}
        </div>
      ) : (
        <>
          {mits.length > 0 && (
            <>
              <div className="muted" style={{ margin: '0 0 8px' }}>
                ⭐ {t('mostImportant')} ({mits.length}/{MAX_MITS})
              </div>
              {mits.map((x) => (
                <TaskRow key={x.id} task={x} />
              ))}
            </>
          )}
          {rest.length > 0 && (
            <>
              <div className="muted" style={{ margin: '20px 0 8px' }}>
                {t('everythingElse')}
              </div>
              {rest.map((x) => (
                <TaskRow key={x.id} task={x} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
