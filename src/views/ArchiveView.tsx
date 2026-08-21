import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { monthLabel } from '../dates';
import { useT } from '../useT';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, Circle, Star } from 'lucide-react';

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
        const isOpen = isNow || !closed.has(m.key);
        return (
          <div
            key={m.key}
            className={cn(
              'mb-2.5 overflow-hidden rounded-[12px] border bg-[#151922]',
              isNow ? 'border-[#7a5c14]' : 'border-[#262c38]',
            )}
          >
            <button
              className="btn-reset flex w-full items-center gap-3.5 px-4 py-3.5 text-start transition-colors hover:bg-[#1b2029]"
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
              <span className="flex flex-1 items-center gap-2.5 text-[15px] font-semibold">
                {monthLabel(m.key, t.lang)}
                {isNow && <Badge variant="accent">{t('thisMonthPill')}</Badge>}
              </span>
              <span className="flex items-center gap-2.5 text-[12.5px]">
                <Progress value={pct} className="w-[90px]" />
                <b className="tabular-nums">{m.done}/{m.total}</b>
                <span className="text-[#8b93a4] tabular-nums">{pct}%</span>
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-[#262c38] px-4 pb-3.5 pt-1">
                {m.goals.map((g) => {
                  const v = elements.find((e) => e.id === g.visionId);
                  const wgs = m.weekGoals.filter((w) => w.monthGoalId === g.id);
                  const gt = m.tasks.filter((x) => wgs.some((w) => w.id === x.weekGoalId));
                  const gd = gt.filter((x) => x.done).length;
                  const allDone = gt.length > 0 && gd === gt.length;
                  // A past month can't be "in progress": if everything under the
                  // goal is ticked it counts as finished even when it was never
                  // explicitly closed.
                  const finished = g.status === 'done' || allDone;
                  // An ACTIVE goal has not been abandoned, whichever month it
                  // was planned in: open goals carry forward now, so a past
                  // bucket can still hold live work. Keying this off "not the
                  // current month" would badge a goal as unfinished here while
                  // the Month tab is still showing it as open.
                  const carried = g.status === 'active' && !isNow;
                  const abandoned = !finished && gt.length > 0 && g.status !== 'active';
                  return (
                    <div
                      key={g.id}
                      className="border-b border-white/[.05] py-2.5 last:border-b-0"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                            finished && 'bg-[#34d399]/15 text-[#34d399]',
                            abandoned && 'bg-[#f87171]/[.14] text-[#f87171]',
                            !finished && !abandoned && 'bg-white/[.07] text-[#8b93a4]',
                          )}
                        >
                          {finished ? <Check className="h-3 w-3" />
                            : abandoned ? <Circle className="h-2 w-2 fill-current" />
                            : <ArrowRight className="h-3 w-3" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div
                            className={cn(
                              'text-[14px]',
                              finished && 'text-[#8b93a4] line-through',
                            )}
                          >
                            {g.title}
                          </div>
                          <div className="text-[12.5px] text-[#8b93a4]">
                            {t('serves')} {v?.title ?? '—'} · {gd}/{gt.length} {t('tasksWord')}
                          </div>
                        </div>
                        {abandoned && <Badge variant="danger">{t('unfinished')}</Badge>}
                        {carried && !finished && (
                          <Badge variant="accent" title={t('carriedTitle')}>{t('stillOpen')}</Badge>
                        )}
                      </div>

                      {wgs.map((w) => {
                        const wt = m.tasks
                          .filter((x) => x.weekGoalId === w.id)
                          .sort((a, b) => a.date.localeCompare(b.date));
                        const wd = wt.filter((x) => x.done).length;
                        return (
                          <div key={w.id}>
                            <div className="ms-[30px] mt-1.5 flex items-center gap-2 text-[12px] text-[#8b93a4]">
                              <span className="flex-1">{w.title}</span>
                              <span className="tabular-nums">{wd}/{wt.length}</span>
                            </div>
                            {wt.map((task) => (
                              <div
                                key={task.id}
                                className="ms-[46px] mt-1 flex items-center gap-2 text-[12.5px]"
                              >
                                <span
                                  className={cn(
                                    'w-3.5 shrink-0 text-center text-[11px]',
                                    task.done ? 'text-[#34d399]' : 'text-[#8b93a4]',
                                  )}
                                >
                                  {task.done ? '✓' : '○'}
                                </span>
                                <span
                                  className={cn(
                                    'flex min-w-0 flex-1 items-center gap-1.5 truncate',
                                    task.done && 'text-[#8b93a4] line-through',
                                  )}
                                >
                                  {task.isMit && (
                                    <Star className="h-2.5 w-2.5 shrink-0 fill-[#f0b429] text-[#f0b429]" />
                                  )}
                                  {task.title}
                                </span>
                                <span className="shrink-0 text-[11px] tabular-nums text-[#8b93a4]/70">
                                  {task.date.slice(5)}
                                </span>
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
