import { useStore, useStoreData } from '../store';
import { MAX_MITS, type Task } from '../types';
import { todayLabel } from '../dates';
import { useImage } from '../hooks/useImage';
import { Coach, Example } from './Coach';
import { useT } from '../useT';
import StalledPrompt from './StalledPrompt';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskCheck } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { RotateCcw, Star, Target } from 'lucide-react';

function TaskRow({ task }: { task: Task }) {
  useStoreData();
  const toggleTask = useStore((s) => s.toggleTask);
  const toggleMit = useStore((s) => s.toggleMit);
  const vision = useStore((s) => s.visionForTask)(task);
  const weekGoals = useStore((s) => s.weekGoals);
  const url = useImage(vision?.imageId);
  const wg = weekGoals.find((w) => w.id === task.weekGoalId);
  const t = useT();

  return (
    <Card
      className={cn(
        'mb-2.5 flex items-center gap-3 border-s-[3px] p-3',
        task.isMit ? 'border-s-[#f0b429]' : 'border-s-transparent',
        task.done && 'opacity-70',
      )}
    >
      {url ? (
        <img
          src={url}
          alt=""
          className="h-11 w-11 shrink-0 rounded-lg border border-[#262c38] object-cover"
          draggable={false}
        />
      ) : (
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[#262c38] bg-[#1b2029] text-[#8b93a4]">
          <Target className="h-4 w-4" />
        </div>
      )}

      <TaskCheck checked={task.done} onClick={() => toggleTask(task.id)} />

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'flex flex-wrap items-center gap-2 text-[14px]',
            task.done && 'text-[#8b93a4] line-through',
          )}
        >
          {task.title}
          {!task.done && (task.postponed ?? 0) > 0 && (
            <Badge variant="accent" title={t('rolledOver')}>
              <RotateCcw className="me-1 h-2.5 w-2.5" />
              {task.postponed}
            </Badge>
          )}
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-[#8b93a4]">
          {wg?.title} → <b className="text-[#e6e9ef]">{vision?.title ?? '—'}</b>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        title={t('markMit')}
        onClick={() => toggleMit(task.id)}
      >
        <Star
          className={cn('h-4 w-4', task.isMit && 'fill-[#f0b429] text-[#f0b429]')}
        />
      </Button>
    </Card>
  );
}

export default function TodayView() {
  useStoreData();
  const tasks = useStore((s) => s.todayTasks)();
  const t = useT();
  const mits = tasks.filter((x) => x.isMit);
  const rest = tasks.filter((x) => !x.isMit);
  const doneCount = tasks.filter((x) => x.done).length;

  return (
    <div className="view">
      <div className="view-head">
        <h2 className="flex items-center gap-2">
          {todayLabel(t.lang)}
          <Coach id="today" title={t('coachTodayTitle')}>
            <p>{t('coachTodayBody')}</p>
            <p className="coach-rule">{t('coachTodayRule')}</p>
            <Example bad={t('exBadFinance')} good={t('exGoodFinance')} why={t('exWhyFinance')} />
            <Example bad={t('exBadStripe')} good={t('exGoodStripe')} why={t('exWhyStripe')} />
            <p className="coach-foot">{t('coachTodayFoot')}</p>
          </Coach>
        </h2>
        <p>
          {tasks.length === 0
            ? t('nothingScheduled')
            : `${doneCount}/${tasks.length} ${t('done')} · ${t('starHint')}`}
        </p>
      </div>

      <StalledPrompt />

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
              <div className="mb-2 flex items-center gap-1.5 text-[13px] text-[#8b93a4]">
                <Star className="h-3.5 w-3.5 fill-[#f0b429] text-[#f0b429]" />
                {t('mostImportant')} ({mits.length}/{MAX_MITS})
              </div>
              {mits.map((x) => (
                <TaskRow key={x.id} task={x} />
              ))}
            </>
          )}
          {rest.length > 0 && (
            <>
              <div className="mb-2 mt-5 text-[13px] text-[#8b93a4]">
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
