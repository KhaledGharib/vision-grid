import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { monthLabel } from '../dates';
import { useT } from '../useT';

/**
 * History, grouped by month.
 *
 * The planning tabs deliberately show only the current month/week — that's the
 * point of the app. But that meant finished work vanished with no trace, and a
 * goal you didn't finish disappeared on the 1st with nobody asking about it.
 * This is where the record lives.
 */
export default function ArchiveView() {
  const t = useT();
  const monthGoals = useStore((s) => s.monthGoals);
  const weekGoals = useStore((s) => s.weekGoals);
  const tasks = useStore((s) => s.tasks);
  const elements = useStore((s) => s.elements);
  const [closed, setClosed] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('vg:archive:closed');
      return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    } catch { return new Set<string>(); }
  });

  const months = useMemo(() => {
    const byMonth = new Map<string, typeof monthGoals>();
    for (const g of monthGoals) {
      const list = byMonth.get(g.monthKey) ?? [];
      list.push(g);
      byMonth.set(g.monthKey, list);
    }
    return [...byMonth.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))  // newest first
      .map(([key, goals]) => {
        const wgs = weekGoals.filter((w) => goals.some((g) => g.id === w.monthGoalId));
        const ts = tasks.filter((x) => wgs.some((w) => w.id === x.weekGoalId));
        const done = ts.filter((x) => x.done).length;
        return { key, goals, weekGoals: wgs, tasks: ts, done, total: ts.length };
      });
  }, [monthGoals, weekGoals, tasks]);

  const thisMonth = new Date().toISOString().slice(0, 7);

  if (months.length === 0) {
    return (
      <div className="view">
        <div className="view-head"><h2>{t('tabArchive')}</h2></div>
        <div className="empty">{t('archiveEmpty')}</div>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="view-head">
        <h2>{t('tabArchive')}</h2>
        <p>{t('archiveBlurb')}</p>
      </div>

      {months.map((m) => {
        const pct = m.total ? Math.round((m.done / m.total) * 100) : 0;
        const isNow = m.key === thisMonth;
        // Months are open by default and independently collapsible — an archive
        // is for scanning, so opening one must not shut another.
        const isOpen = isNow || !closed.has(m.key);
        return (
          <div className={`month-block${isNow ? ' current' : ''}`} key={m.key}>
            <button
              className="month-head"
              onClick={() => {
                if (isNow) return;
                setClosed((prev) => {
                  const next = new Set(prev);
                  if (next.has(m.key)) next.delete(m.key);
                  else next.add(m.key);
                  localStorage.setItem('vg:archive:closed', JSON.stringify([...next]));
                  return next;
                });
              }}
            >
              <span className="mh-name">
                {monthLabel(m.key, t.lang)}
                {isNow && <span className="pill now">{t('thisMonthPill')}</span>}
              </span>
              <span className="mh-stats">
                <span className="mh-bar">
                  <span className="mh-fill" style={{ width: `${pct}%` }} />
                </span>
                <b>{m.done}/{m.total}</b>
                <span className="muted">{pct}%</span>
              </span>
            </button>

            {isOpen && (
              <div className="month-body">
                {m.goals.map((g) => {
                  const v = elements.find((e) => e.id === g.visionId);
                  const wgs = m.weekGoals.filter((w) => w.monthGoalId === g.id);
                  const gt = m.tasks.filter((x) => wgs.some((w) => w.id === x.weekGoalId));
                  const gd = gt.filter((x) => x.done).length;
                  const allDone = gt.length > 0 && gd === gt.length;
                  // A past month can't be "in progress": if everything under the
                  // goal is ticked it counts as finished even when it was never
                  // explicitly closed.
                  const finished = g.status === 'done' || (allDone && !isNow) || allDone;
                  const abandoned = !finished && gt.length > 0 && !isNow;
                  return (
                    <div className={`arc-goal${finished ? ' ok' : ''}${abandoned ? ' miss' : ''}`} key={g.id}>
                      <div className="ag-head">
                        <span className="ag-mark">
                          {finished ? '✓' : abandoned ? '·' : '→'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ag-title">{g.title}</div>
                          <div className="thread">
                            {t('serves')} {v?.title ?? '—'} · {gd}/{gt.length} {t('tasksWord')}
                          </div>
                        </div>
                        {abandoned && <span className="pill danger">{t('unfinished')}</span>}
                      </div>

                      {wgs.map((w) => {
                        const wt = m.tasks
                          .filter((x) => x.weekGoalId === w.id)
                          .sort((a, b) => a.date.localeCompare(b.date));
                        const wd = wt.filter((x) => x.done).length;
                        return (
                          <div key={w.id}>
                            <div className="ag-week">
                              <span className="aw-title">{w.title}</span>
                              <span className="aw-count">{wd}/{wt.length}</span>
                            </div>
                            {wt.map((task) => (
                              <div className={`arc-task${task.done ? ' done' : ''}`} key={task.id}>
                                <span className="at-chk">{task.done ? '✓' : '○'}</span>
                                <span className="at-title">
                                  {task.isMit && <span className="at-mit">★</span>}
                                  {task.title}
                                </span>
                                <span className="at-date">{task.date.slice(5)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
