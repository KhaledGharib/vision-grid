import { useStore } from '../store';
import { useT } from '../useT';
import { POSTPONE_LIMIT } from '../types';

/**
 * The only thing the carry-over ever asks you.
 *
 * Unfinished tasks roll to today silently. But once something has been pushed
 * POSTPONE_LIMIT times, silence stops being honest — either it matters and you
 * do it, or it doesn't and it should leave the list. This is that one prompt.
 */
export default function StalledPrompt() {
  const t = useT();
  const stalled = useStore((s) => s.stalledTasks)();
  const recommit = useStore((s) => s.recommitTask);
  const drop = useStore((s) => s.dropTask);
  const del = useStore((s) => s.deleteTask);

  if (stalled.length === 0) return null;

  return (
    <div className="stalled">
      <div className="stalled-head">
        <span className="st-ico">⏳</span>
        <div>
          <b>{t('stalledTitle')}</b>
          <p className="muted small" style={{ margin: '2px 0 0' }}>
            {t('stalledBody', { n: String(POSTPONE_LIMIT) })}
          </p>
        </div>
      </div>

      {stalled.map((task) => (
        <div className="stalled-row" key={task.id}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="st-title">{task.title}</div>
            <div className="thread">
              {t('postponedTimes', { n: String(task.postponed ?? 0) })}
              {task.originalDate && ` · ${t('plannedFor')} ${task.originalDate.slice(5)}`}
            </div>
          </div>
          <button className="primary" onClick={() => recommit(task.id)}>
            {t('doItToday')}
          </button>
          <button onClick={() => drop(task.id)}>{t('notNow')}</button>
          <button className="ghost" title={t('deleteQ')} onClick={() => del(task.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
