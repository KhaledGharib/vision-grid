import { useState } from 'react';
import { useStore } from '../store';
import { MAX_MONTH_GOALS, MAX_WEEK_GOALS, type BoardElement, type MonthGoal } from '../types';
import { dayKey, monthKey, monthLabel, weekKey } from '../dates';
import { Coach, Example } from './Coach';
import { useT } from '../useT';
import Ask, { type AskState } from './Ask';
import VisionPicker from './VisionPicker';
import { useImage } from '../hooks/useImage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TaskCheck } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Check, ChevronRight, Plus, Star, Target, Undo2, X,
} from 'lucide-react';

const OPEN_KEY = 'vg:plan:open';

/** The vision's picture, so the link to the board is visible rather than textual. */
function Thumb({ el, size = 40 }: { el?: BoardElement; size?: number }) {
  const url = useImage(el?.imageId);
  if (!el) return null;
  return url ? (
    <img
      src={url}
      alt=""
      className="shrink-0 rounded-lg border border-[#262c38] object-cover"
      style={{ width: size, height: size }}
      draggable={false}
    />
  ) : (
    <div
      className="grid shrink-0 place-items-center rounded-lg border border-[#262c38] bg-[#1b2029] text-[#8b93a4]"
      style={{ width: size, height: size }}
    >
      <Target className="h-4 w-4" />
    </div>
  );
}

/**
 * Month and Week in one place.
 *
 * They used to be separate tabs, but after week goals became addable from the
 * month card the two screens showed the same goals — the week tab's only extra
 * was the tasks. That made you check both to know where you stood, and the
 * same goal appeared twice.
 *
 * The risk of merging is volume: 3 month goals x 2 week goals x 3 tasks is 18
 * rows, which is exactly the wall of text the caps exist to prevent. So a
 * month goal is one line until you open it, and the open set is remembered.
 */
export default function PlanView() {
  const t = useT();
  const myVisions = useStore((s) => s.visions)();
  const allEls = useStore((s) => s.elements);
  const goals = useStore((s) => s.currentMonthGoals)();
  const thisMonth = useStore((s) => s.thisMonthGoals)();
  const doneGoals = useStore((s) => s.doneMonthGoals)();
  const weekGoals = useStore((s) => s.weekGoals);
  const thisWeek = useStore((s) => s.thisWeekGoals)();
  const tasks = useStore((s) => s.tasks);

  const addMonthGoal = useStore((s) => s.addMonthGoal);
  const deleteMonthGoal = useStore((s) => s.deleteMonthGoal);
  const completeMonthGoal = useStore((s) => s.completeMonthGoal);
  const reopenMonthGoal = useStore((s) => s.reopenMonthGoal);
  const monthGoalAllDone = useStore((s) => s.monthGoalAllDone);
  const addWeekGoal = useStore((s) => s.addWeekGoal);
  const deleteWeekGoal = useStore((s) => s.deleteWeekGoal);
  const completeWeekGoal = useStore((s) => s.completeWeekGoal);
  const weekGoalAllDone = useStore((s) => s.weekGoalAllDone);
  const addTask = useStore((s) => s.addTask);
  const toggleTask = useStore((s) => s.toggleTask);
  const toggleMit = useStore((s) => s.toggleMit);
  const deleteTask = useStore((s) => s.deleteTask);

  const [ask, setAsk] = useState<AskState>(null);
  const [addingMonth, setAddingMonth] = useState(false);
  const [mTitle, setMTitle] = useState('');
  const [mVision, setMVision] = useState('');
  const [wgFor, setWgFor] = useState<string | null>(null);
  const [wgTitle, setWgTitle] = useState('');
  const [taskFor, setTaskFor] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');

  // Which month goals are expanded. Persisted, because losing it on every
  // reload was a complaint about the old collapsible coach panels too.
  const [open, setOpen] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(OPEN_KEY);
      return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    } catch { return new Set<string>(); }
  });
  const persistOpen = (next: Set<string>) => {
    setOpen(next);
    localStorage.setItem(OPEN_KEY, JSON.stringify([...next]));
  };
  const toggleOpen = (id: string) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id); else next.add(id);
    persistOpen(next);
  };

  const monthFull = thisMonth.length >= MAX_MONTH_GOALS;
  const weekFull = thisWeek.length >= MAX_WEEK_GOALS;
  const today = dayKey();

  const submitMonth = () => {
    if (addMonthGoal(mVision, mTitle)) {
      setMTitle(''); setMVision(''); setAddingMonth(false);
    }
  };
  const submitWeek = (monthGoalId: string) => {
    if (addWeekGoal(monthGoalId, wgTitle)) { setWgTitle(''); setWgFor(null); }
  };
  const submitTask = (weekGoalId: string) => {
    if (addTask(weekGoalId, taskTitle, today)) { setTaskTitle(''); setTaskFor(null); }
  };

  /** One month goal: header row always, chain underneath when open. */
  const MonthRow = ({ g }: { g: MonthGoal }) => {
    const v = allEls.find((x) => x.id === g.visionId);
    const wks = weekGoals.filter((w) => w.monthGoalId === g.id && w.status === 'active');
    const allW = weekGoals.filter((w) => w.monthGoalId === g.id);
    const mine = tasks.filter((x) => allW.some((w) => w.id === x.weekGoalId));
    const done = mine.filter((x) => x.done).length;
    const isOpen = open.has(g.id);
    const ready = monthGoalAllDone(g.id);
    const carried = g.monthKey !== monthKey();

    return (
      <Card className={cn('mb-2.5 p-0 overflow-hidden', ready && 'border-[#34d399]/35')}>
        {/* header — the one line you see when collapsed */}
        <div className="flex items-center gap-3 p-3.5">
          <button
            className="btn-reset grid h-6 w-6 shrink-0 place-items-center rounded-md text-[#8b93a4] transition-colors hover:bg-[#1b2029] hover:text-[#e6e9ef]"
            onClick={() => toggleOpen(g.id)}
            aria-expanded={isOpen}
            title={isOpen ? t('collapseAll') : t('expandAll')}
          >
            <ChevronRight
              className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90',
                'rtl:rotate-180', isOpen && 'rtl:-rotate-90')}
            />
          </button>

          <button
            className="btn-reset flex min-w-0 flex-1 items-center gap-3 text-start"
            onClick={() => toggleOpen(g.id)}
          >
            <Thumb el={v} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px]">{g.title}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#8b93a4]">
                {v?.title ?? '—'}
                {carried && <Badge>{monthLabel(g.monthKey, t.lang)}</Badge>}
                {!isOpen && wks.length > 0 && (
                  <span>· {wks.length} {t('weekGoalCount')}</span>
                )}
              </span>
            </span>
          </button>

          {mine.length > 0 && (
            <Badge variant={done === mine.length ? 'success' : 'default'}>
              {done}/{mine.length}
            </Badge>
          )}

          {ready && (
            <Button variant="primary" size="sm" onClick={() => completeMonthGoal(g.id)}>
              {t('closeIt')}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAsk({
              kind: 'confirm', danger: true,
              title: t('deleteQ'), body: t('confirmDeleteMonth'),
              onOk: () => deleteMonthGoal(g.id),
            })}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* the chain, only when open */}
        {isOpen && (
          <div className="border-t border-[#262c38] bg-[#0d0f14]/40 px-3.5 pb-3 pt-2">
            {wks.length === 0 && (
              <div className="py-1.5 ps-[38px] text-[12.5px] text-[#8b93a4]">
                {t('noWeekGoalsUnder')}
              </div>
            )}

            {wks.map((w) => {
              const wt = tasks.filter((x) => x.weekGoalId === w.id);
              const wd = wt.filter((x) => x.done).length;
              const wReady = weekGoalAllDone(w.id);
              const wCarried = w.weekKey !== weekKey();
              return (
                <div key={w.id} className="mt-1.5 ps-[38px]">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-[13px] opacity-60">🗓</span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px]">{w.title}</span>
                    {wCarried && <Badge>{t('fromWeek')} {w.weekKey}</Badge>}
                    <Badge variant={wReady ? 'success' : 'default'}>{wd}/{wt.length}</Badge>
                    {wReady && (
                      <Button variant="primary" size="sm" onClick={() => completeWeekGoal(w.id)}>
                        {t('closeIt')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAsk({
                        kind: 'confirm', danger: true,
                        title: t('deleteQ'), body: t('confirmDeleteWeek'),
                        onOk: () => deleteWeekGoal(w.id),
                      })}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {wt.map((task) => (
                    <div key={task.id} className="mt-1 flex items-center gap-2 ps-6">
                      <TaskCheck checked={task.done} onClick={() => toggleTask(task.id)} />
                      <span
                        className={cn('min-w-0 flex-1 truncate text-[13px]',
                          task.done && 'text-[#8b93a4] line-through')}
                      >
                        {task.title}
                      </span>
                      {(task.postponed ?? 0) > 0 && !task.done && (
                        <Badge variant="accent" title={t('rolledOver')}>↻{task.postponed}</Badge>
                      )}
                      <span className="shrink-0 text-[11.5px] tabular-nums text-[#8b93a4]/70">
                        {task.date.slice(5)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('markMit')}
                        onClick={() => toggleMit(task.id)}
                      >
                        <Star className={cn('h-3.5 w-3.5',
                          task.isMit && 'fill-[#f0b429] text-[#f0b429]')} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  {taskFor === w.id ? (
                    <div className="mt-1.5 flex gap-2 ps-6">
                      <Input
                        autoFocus
                        value={taskTitle}
                        placeholder={t('taskPlaceholder')}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitTask(w.id);
                          if (e.key === 'Escape') { setTaskFor(null); setTaskTitle(''); }
                        }}
                      />
                      <Button variant="primary" disabled={!taskTitle.trim()}
                              onClick={() => submitTask(w.id)}>
                        {t('add')}
                      </Button>
                      <Button variant="ghost"
                              onClick={() => { setTaskFor(null); setTaskTitle(''); }}>
                        {t('cancel')}
                      </Button>
                    </div>
                  ) : (
                    <button
                      className="btn-reset mt-1 ms-6 rounded-md px-2 py-1 text-[12px] text-[#8b93a4] transition-colors hover:bg-[#f0b429]/10 hover:text-[#f0b429]"
                      onClick={() => { setTaskFor(w.id); setTaskTitle(''); }}
                    >
                      {t('addTaskHere')}
                    </button>
                  )}
                </div>
              );
            })}

            {wgFor === g.id ? (
              <div className="mt-2 flex gap-2 ps-[38px]">
                <Input
                  autoFocus
                  value={wgTitle}
                  placeholder={t('weekGoalPlaceholder')}
                  onChange={(e) => setWgTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitWeek(g.id);
                    if (e.key === 'Escape') { setWgFor(null); setWgTitle(''); }
                  }}
                />
                <Button variant="primary" disabled={!wgTitle.trim()}
                        onClick={() => submitWeek(g.id)}>
                  {t('add')}
                </Button>
                <Button variant="ghost" onClick={() => { setWgFor(null); setWgTitle(''); }}>
                  {t('cancel')}
                </Button>
              </div>
            ) : (
              <button
                className="btn-reset mt-1.5 ms-[38px] rounded-md px-2 py-1 text-[12.5px] text-[#8b93a4] transition-colors hover:bg-[#f0b429]/10 hover:text-[#f0b429] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={weekFull}
                title={weekFull ? t('weekCapHitHere') : undefined}
                onClick={() => { setWgFor(g.id); setWgTitle(''); }}
              >
                {t('addWeekGoalHere')}
              </button>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="view">
      <Ask state={ask} onClose={() => setAsk(null)} />

      <div className="view-head">
        <h2 className="flex flex-wrap items-center gap-2">
          {monthLabel(monthKey(), t.lang)}
          <Badge variant={monthFull ? 'accent' : 'default'}>
            {thisMonth.length}/{MAX_MONTH_GOALS} {t('monthCap')}
          </Badge>
          <Badge variant={weekFull ? 'accent' : 'default'}>
            {thisWeek.length}/{MAX_WEEK_GOALS} {t('weekCap')}
          </Badge>
          <Coach id="plan" title={t('coachMonthTitle')}>
            <p>{t('coachMonthBody')}</p>
            <p className="coach-rule">{t('coachMonthRule')}</p>
            <Example bad={t('exBadFit')} good={t('exGoodFit')} why={t('exWhyFit')} />
            <Example bad={t('exBadApp')} good={t('exGoodApp')} why={t('exWhyApp')} />
            <p className="coach-rule">{t('coachWeekRule')}</p>
            <Example bad={t('exBadRun')} good={t('exGoodRun')} why={t('exWhyRun')} />
            <p className="coach-foot">{t('coachMonthFoot')}</p>
          </Coach>
        </h2>
        <p>{t('planBlurb')}</p>
      </div>

      {myVisions.length === 0 ? (
        <div className="empty">
          {t('needVisionFirst')}<br />{t('needVisionHint')}
        </div>
      ) : (
        <>
          {goals.length > 1 && (
            <div className="mb-2.5 flex gap-2">
              <button
                className="btn-reset rounded-md px-2 py-1 text-[12px] text-[#8b93a4] transition-colors hover:text-[#e6e9ef]"
                onClick={() => persistOpen(new Set(goals.map((g) => g.id)))}
              >
                {t('expandAll')}
              </button>
              <button
                className="btn-reset rounded-md px-2 py-1 text-[12px] text-[#8b93a4] transition-colors hover:text-[#e6e9ef]"
                onClick={() => persistOpen(new Set())}
              >
                {t('collapseAll')}
              </button>
            </div>
          )}

          {goals.map((g) => <MonthRow key={g.id} g={g} />)}

          {!monthFull && (addingMonth ? (
            <Card className="mb-3.5 border-[#7a5c14]">
              <div className="mb-3 flex flex-col gap-1.5">
                <label className="text-[12.5px] text-[#8b93a4]">{t('whichVision')}</label>
                <VisionPicker visions={myVisions} value={mVision} onChange={setMVision} />
              </div>
              <div className="mb-3 flex flex-col gap-1.5">
                <label className="text-[12.5px] text-[#8b93a4]">{t('monthGoalLabel')}</label>
                <Input
                  autoFocus
                  value={mTitle}
                  placeholder={t('monthGoalPlaceholder')}
                  onChange={(e) => setMTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitMonth()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAddingMonth(false)}>
                  {t('cancel')}
                </Button>
                <Button variant="primary" disabled={!mVision || !mTitle.trim()}
                        onClick={submitMonth}>
                  {t('addMonthGoal')}
                </Button>
              </div>
            </Card>
          ) : (
            <button
              className={cn(
                'btn-reset mb-3.5 w-full rounded-[12px] border border-dashed border-[#262c38] p-3.5',
                'text-[13.5px] text-[#8b93a4] transition-colors',
                'hover:border-[#7a5c14] hover:bg-[#f0b429]/[.04] hover:text-[#f0b429]',
              )}
              onClick={() => setAddingMonth(true)}
            >
              <Plus className="me-1 inline h-4 w-4 align-[-3px]" />
              {t('addMonthGoal')}
            </button>
          ))}

          {monthFull && (
            <Card className="mb-3.5 border-[#7a5c14] bg-[#f0b429]/[.06]">
              <b>{t('monthCapReached')}</b>
              <p className="mt-1 text-[12px] text-[#8b93a4]">{t('capWayOut')}</p>
            </Card>
          )}

          {goals.length === 0 && <div className="empty">{t('noGoalsThisMonth')}</div>}

          {doneGoals.length > 0 && (
            <details className="group mt-5">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-[10px] border border-[#262c38] bg-[#151922] px-3 py-2 text-[13px] text-[#34d399] transition-colors hover:border-[#39424f] [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:-rotate-90" />
                ✓ {t('finishedThisMonth')} ({doneGoals.length})
              </summary>
              {doneGoals.map((g) => {
                const v = allEls.find((x) => x.id === g.visionId);
                return (
                  <Card key={g.id}
                        className="mt-2 flex items-center gap-3 opacity-75 transition-opacity hover:opacity-100">
                    <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-[#34d399]/15 text-[#34d399]">
                      <Check className="h-3 w-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] text-[#8b93a4] line-through">{g.title}</div>
                      <div className="text-[12.5px] text-[#8b93a4]">
                        {t('serves')} {v?.title ?? '—'}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={monthFull}
                      title={monthFull ? t('reopenBlocked') : t('reopen')}
                      onClick={() => reopenMonthGoal(g.id)}
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
