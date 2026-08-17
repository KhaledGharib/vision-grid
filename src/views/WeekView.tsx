import { useState } from 'react';
import { useStore } from '../store';
import { MAX_WEEK_GOALS } from '../types';
import { dayKey, weekKey } from '../dates';
import { Coach, Example } from './Coach';
import { useT } from '../useT';
import Ask, { type AskState } from './Ask';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TaskCheck } from '@/components/ui/checkbox';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, Plus, Undo2, X } from 'lucide-react';

export default function WeekView() {
  const monthGoals = useStore((s) => s.currentMonthGoals)();
  const weekGoals = useStore((s) => s.currentWeekGoals)();
  const allEls = useStore((s) => s.elements);
  const allMonthGoals = useStore((s) => s.monthGoals);
  const tasks = useStore((s) => s.tasks);
  const addWeekGoal = useStore((s) => s.addWeekGoal);
  const deleteWeekGoal = useStore((s) => s.deleteWeekGoal);
  const doneWeekGoals = useStore((s) => s.doneWeekGoals)();
  const completeWeekGoal = useStore((s) => s.completeWeekGoal);
  const reopenWeekGoal = useStore((s) => s.reopenWeekGoal);
  const weekGoalAllDone = useStore((s) => s.weekGoalAllDone);
  const addTask = useStore((s) => s.addTask);
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const [title, setTitle] = useState('');
  const [mgId, setMgId] = useState('');
  const [taskDraft, setTaskDraft] = useState<Record<string, string>>({});
  const [ask, setAsk] = useState<AskState>(null);
  const [adding, setAdding] = useState(false);
  const t = useT();

  const full = weekGoals.length >= MAX_WEEK_GOALS;

  const submit = () => {
    if (addWeekGoal(mgId, title)) {
      setTitle('');
      setMgId('');
      setAdding(false);
    }
  };

  return (
    <div className="view">
      <Ask state={ask} onClose={() => setAsk(null)} />
      <div className="view-head">
        <h2 className="flex items-center gap-2">
          {t('thisWeek')} · {weekKey()}
          <Badge variant={full ? 'accent' : 'default'}>
            {weekGoals.length}/{MAX_WEEK_GOALS} {t('goals')}
          </Badge>
          <Coach id="week" title={t('coachWeekTitle')}>
            <p>{t('coachWeekBody')}</p>
            <p className="coach-rule">{t('coachWeekRule')}</p>
            <Example bad={t('exBadRun')} good={t('exGoodRun')} why={t('exWhyRun')} />
            <Example bad={t('exBadCheckout')} good={t('exGoodCheckout')} why={t('exWhyCheckout')} />
            <p className="coach-foot">{t('coachWeekFoot')}</p>
          </Coach>
        </h2>
      </div>

      {monthGoals.length === 0 ? (
        <div className="empty">{t('noMonthGoals')}</div>
      ) : (
        <>
          {weekGoals.map((w) => {
            const mg = allMonthGoals.find((g) => g.id === w.monthGoalId);
            const v = allEls.find((x) => x.id === mg?.visionId);
            const mine = tasks.filter((task) => task.weekGoalId === w.id);
            const draft = taskDraft[w.id] ?? '';
            const addIt = () => {
              if (addTask(w.id, draft, dayKey())) setTaskDraft({ ...taskDraft, [w.id]: '' });
            };
            return (
              <Card className="mb-3.5" key={w.id}>
                <div className="mb-2.5 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px]">{w.title}</div>
                    <div className="text-[12.5px] text-[#8b93a4]">
                      {mg?.title} → <b className="text-[#e6e9ef]">{v?.title ?? '—'}</b>
                    </div>
                  </div>
                  <Badge>
                    {mine.filter((task) => task.done).length}/{mine.length}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setAsk({
                        kind: 'confirm', danger: true,
                        title: t('deleteQ'), body: t('confirmDeleteWeek'),
                        onOk: () => deleteWeekGoal(w.id),
                      })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {weekGoalAllDone(w.id) && (
                  <div className="mb-2.5 flex flex-wrap items-center gap-2.5 rounded-[9px] border border-[#34d399]/30 bg-[#34d399]/10 px-3 py-2.5 text-[13px]">
                    <span className="flex-1">🎉 {t('allTasksDoneHint')}</span>
                    <Button variant="primary" size="sm" onClick={() => completeWeekGoal(w.id)}>
                      {t('closeIt')}
                    </Button>
                  </div>
                )}

                {mine.map((task) => (
                  <div
                    className="flex items-center gap-2.5 border-t border-white/[.05] py-2"
                    key={task.id}
                  >
                    <TaskCheck checked={task.done} onClick={() => toggleTask(task.id)} />
                    <span
                      className={cn(
                        'min-w-0 flex-1 text-[14px]',
                        task.done && 'text-[#8b93a4] line-through',
                      )}
                    >
                      {task.title}
                    </span>
                    <Badge>{task.date}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}

                <div className="mt-2.5 flex gap-2">
                  <Input
                    value={draft}
                    placeholder={t('taskPlaceholder')}
                    onChange={(e) => setTaskDraft({ ...taskDraft, [w.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addIt()}
                  />
                  <Button disabled={!draft.trim()} onClick={addIt}>{t('add')}</Button>
                </div>
              </Card>
            );
          })}

          {full && (
            <Card className="mb-3.5 border-[#7a5c14] bg-[#f0b429]/[.06]">
              <b>{t('weekCapReached')}</b>
              <p className="mt-1 text-[12px] text-[#8b93a4]">{t('capWayOut')}</p>
            </Card>
          )}

          {!full && (adding ? (
            <Card className="mb-3.5 border-[#7a5c14]">
              <div className="mb-3 flex flex-col gap-1.5">
                <label className="text-[12.5px] text-[#8b93a4]">{t('whichMonthGoal')}</label>
                <Select value={mgId} onValueChange={setMgId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('pickMonthGoal')} />
                  </SelectTrigger>
                  <SelectContent>
                    {monthGoals.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-3 flex flex-col gap-1.5">
                <label className="text-[12.5px] text-[#8b93a4]">{t('weekGoalLabel')}</label>
                <Input
                  value={title}
                  placeholder={t('weekGoalPlaceholder')}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAdding(false)}>{t('cancel')}</Button>
                <Button variant="primary" disabled={!mgId || !title.trim()} onClick={submit}>
                  {t('addWeekGoal')}
                </Button>
              </div>
            </Card>
          ) : (
            <button
              className={cn(
                'mb-3.5 w-full rounded-[12px] border border-dashed border-[#262c38] p-3.5',
                'text-[13.5px] text-[#8b93a4] transition-colors',
                'hover:border-[#7a5c14] hover:bg-[#f0b429]/[.04] hover:text-[#f0b429]',
              )}
              onClick={() => setAdding(true)}
            >
              <Plus className="me-1 inline h-4 w-4 align-[-3px]" />
              {t('addWeekGoal')}
            </button>
          ))}

          {weekGoals.length === 0 && <div className="empty">{t('nothingThisWeek')}</div>}

          {doneWeekGoals.length > 0 && (
            <details className="group mt-5" open>
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-[10px] border border-[#262c38] bg-[#151922] px-3 py-2 text-[13px] text-[#34d399] transition-colors hover:border-[#39424f] [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:rotate-90" />
                ✓ {t('finishedThisWeek')} ({doneWeekGoals.length})
              </summary>
              {doneWeekGoals.map((w) => {
                const mg = allMonthGoals.find((g) => g.id === w.monthGoalId);
                return (
                  <Card className="mt-2 flex items-center gap-3 opacity-75 transition-opacity hover:opacity-100" key={w.id}>
                    <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-[#34d399]/15 text-[#34d399]">
                      <Check className="h-3 w-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] text-[#8b93a4] line-through">{w.title}</div>
                      <div className="text-[12.5px] text-[#8b93a4]">{mg?.title ?? '—'}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={full}
                      title={full ? t('reopenBlocked') : t('reopen')}
                      onClick={() => reopenWeekGoal(w.id)}
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </Card>
                );
              })}
            </details>
          )}
        </>
      )}
    </div>
  );
}
