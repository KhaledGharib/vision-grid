import { useStore, useStoreData } from '../store';
import { useT } from '../useT';
import { POSTPONE_LIMIT } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hourglass, X } from 'lucide-react';

/**
 * The only thing the carry-over ever asks you.
 *
 * Unfinished tasks roll to today silently. But once something has been pushed
 * POSTPONE_LIMIT times, silence stops being honest — either it matters and you
 * do it, or it doesn't and it should leave the list. This is that one prompt.
 */
export default function StalledPrompt() {
  useStoreData();
  const t = useT();
  const stalled = useStore((s) => s.stalledTasks)();
  const recommit = useStore((s) => s.recommitTask);
  const drop = useStore((s) => s.dropTask);
  const del = useStore((s) => s.deleteTask);

  if (stalled.length === 0) return null;

  return (
    <div className="mb-4 rounded-[12px] border border-[#f0b429]/35 bg-gradient-to-r from-[#f0b429]/[.11] to-[#f0b429]/[.03] px-[15px] py-[13px]">
      <div className="mb-2.5 flex items-start gap-3">
        <Hourglass className="mt-0.5 h-[19px] w-[19px] shrink-0 text-[#f0b429]" />
        <div>
          <b className="text-[14px]">{t('stalledTitle')}</b>
          <p className="mt-0.5 text-[12px] text-[#8b93a4]">
            {t('stalledBody', { n: String(POSTPONE_LIMIT) })}
          </p>
        </div>
      </div>

      {stalled.map((task) => (
        <div
          key={task.id}
          className="flex flex-wrap items-center gap-2 border-t border-white/[.06] py-2.5"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[14px]">{task.title}</div>
            <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[#8b93a4]">
              <Badge variant="accent">
                {t('postponedTimes', { n: String(task.postponed ?? 0) })}
              </Badge>
              {task.originalDate && (
                <span>{t('plannedFor')} {task.originalDate.slice(5)}</span>
              )}
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => recommit(task.id)}>
            {t('doItToday')}
          </Button>
          <Button size="sm" onClick={() => drop(task.id)}>{t('notNow')}</Button>
          <Button variant="ghost" size="icon" title={t('deleteQ')} onClick={() => del(task.id)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
