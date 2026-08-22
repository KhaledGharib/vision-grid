import { useState } from 'react';
import { useStore, useStoreData } from '../store';
import { MAX_MONTH_GOALS, MAX_WEEK_GOALS } from '../types';
import { monthKey, monthLabel, weekKey } from '../dates';
import { Coach, Example } from './Coach';
import { useT } from '../useT';
import Ask, { type AskState } from './Ask';
import VisionPicker from './VisionPicker';
import { useImage } from '../hooks/useImage';
import type { BoardElement } from '../types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, Plus, Target, Undo2, X } from 'lucide-react';

/** The vision's picture next to its goal, so the link is visible not textual. */
function GoalThumb({ el }: { el?: BoardElement }) {
  const url = useImage(el?.imageId);
  if (!el) return null;
  return url ? (
    <img
      src={url}
      alt=""
      className="h-10 w-10 shrink-0 rounded-lg border border-[#262c38] object-cover"
      draggable={false}
    />
  ) : (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#262c38] bg-[#1b2029] text-[#8b93a4]">
      <Target className="h-4 w-4" />
    </div>
  );
}

export default function MonthView() {
  useStoreData();
  const myVisions = useStore((s) => s.visions)();
  const allEls = useStore((s) => s.elements);
  const addMonthGoal = useStore((s) => s.addMonthGoal);
  const deleteMonthGoal = useStore((s) => s.deleteMonthGoal);
  const goals = useStore((s) => s.currentMonthGoals)();
  const doneGoals = useStore((s) => s.doneMonthGoals)();
  const completeMonthGoal = useStore((s) => s.completeMonthGoal);
  const reopenMonthGoal = useStore((s) => s.reopenMonthGoal);
  const monthGoalAllDone = useStore((s) => s.monthGoalAllDone);
  const weekGoals = useStore((s) => s.weekGoals);
  const addWeekGoal = useStore((s) => s.addWeekGoal);
  const thisWeekGoals = useStore((s) => s.thisWeekGoals)();
  const thisMonthGoals = useStore((s) => s.thisMonthGoals)();
  const [title, setTitle] = useState('');
  const [visionId, setVisionId] = useState('');
  const t = useT();
  const [ask, setAsk] = useState<AskState>(null);
  const [adding, setAdding] = useState(false);
  /** id of the month goal whose inline "week goal" form is open */
  const [wgFor, setWgFor] = useState<string | null>(null);
  const [wgTitle, setWgTitle] = useState('');

  const full = thisMonthGoals.length >= MAX_MONTH_GOALS;
  const weekFull = thisWeekGoals.length >= MAX_WEEK_GOALS;

  // Adding a week goal used to mean: leave this card, switch to the Week tab,
  // then pick this same goal back out of a dropdown. The app already knows
  // which goal you meant.
  const submitWeekGoal = (monthGoalId: string) => {
    if (addWeekGoal(monthGoalId, wgTitle)) {
      setWgTitle('');
      setWgFor(null);
    }
  };

  const submit = () => {
    if (addMonthGoal(visionId, title)) {
      setTitle('');
      setVisionId('');
      setAdding(false);
    }
  };

  return (
    <div className="view">
      <Ask state={ask} onClose={() => setAsk(null)} />
      <div className="view-head">
        <h2 className="flex items-center gap-2">
          {monthLabel(monthKey(), t.lang)}
          <Badge variant={full ? 'accent' : 'default'}>
            {thisMonthGoals.length}/{MAX_MONTH_GOALS} {t('goals')}
          </Badge>
          <Coach id="month" title={t('coachMonthTitle')}>
            <p>{t('coachMonthBody')}</p>
            <p className="coach-rule">{t('coachMonthRule')}</p>
            <Example bad={t('exBadFit')} good={t('exGoodFit')} why={t('exWhyFit')} />
            <Example bad={t('exBadApp')} good={t('exGoodApp')} why={t('exWhyApp')} />
            <Example bad={t('exBadSave')} good={t('exGoodSave')} why={t('exWhySave')} />
            <p className="coach-foot">{t('coachMonthFoot')}</p>
          </Coach>
        </h2>
      </div>

      {myVisions.length === 0 ? (
        <div className="empty">
          {t('needVisionFirst')}
          <br />
          {t('needVisionHint')}
        </div>
      ) : (
        <>
          {goals.map((g) => {
            const v = allEls.find((x) => x.id === g.visionId);
            const wks = weekGoals.filter((w) => w.monthGoalId === g.id);
            const carried = g.monthKey !== monthKey();
            return (
              <Card className="mb-3.5" key={g.id}>
                <div className="flex items-center gap-3">
                  <GoalThumb el={v} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-[15px]">
                      {g.title}
                      {carried && (
                        <Badge variant="accent" title={t('carriedTitle')}>
                          {t('carriedFromMonth', { m: monthLabel(g.monthKey, t.lang) })}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[12.5px] text-[#8b93a4]">
                      {t('serves')} <b className="text-[#e6e9ef]">{v?.title ?? '—'}</b> · {wks.length} {t('weekGoalCount')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setAsk({
                        kind: 'confirm', danger: true,
                        title: t('deleteQ'), body: t('confirmDeleteMonth'),
                        onOk: () => deleteMonthGoal(g.id),
                      })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {monthGoalAllDone(g.id) && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2.5 rounded-[9px] border border-[#34d399]/30 bg-[#34d399]/10 px-3 py-2.5 text-[13px]">
                    <span className="flex-1">🎉 {t('allTasksDoneHint')}</span>
                    <Button variant="primary" size="sm" onClick={() => completeMonthGoal(g.id)}>
                      {t('closeIt')}
                    </Button>
                  </div>
                )}

                {/* the week goals hanging off this month goal, in place */}
                {wks.filter((w) => w.status === 'active').map((w) => (
                  <div
                    key={w.id}
                    className="mt-1.5 flex items-center gap-2 border-t border-white/[.05] pt-1.5 ps-[52px] text-[13px] text-[#8b93a4]"
                  >
                    <span className="opacity-60">🗓</span>
                    <span className="min-w-0 flex-1 truncate">{w.title}</span>
                    {w.weekKey !== weekKey() && (
                      <Badge>{t('fromWeek')} {w.weekKey}</Badge>
                    )}
                  </div>
                ))}

                {wgFor === g.id ? (
                  <div className="mt-2.5 flex gap-2 border-t border-white/[.05] pt-2.5">
                    <Input
                      autoFocus
                      value={wgTitle}
                      placeholder={t('weekGoalPlaceholder')}
                      onChange={(e) => setWgTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitWeekGoal(g.id);
                        if (e.key === 'Escape') { setWgFor(null); setWgTitle(''); }
                      }}
                    />
                    <Button
                      variant="primary"
                      disabled={!wgTitle.trim()}
                      onClick={() => submitWeekGoal(g.id)}
                    >
                      {t('add')}
                    </Button>
                    <Button variant="ghost" onClick={() => { setWgFor(null); setWgTitle(''); }}>
                      {t('cancel')}
                    </Button>
                  </div>
                ) : (
                  <button
                    className="btn-reset mt-2 ms-[52px] rounded-md px-2 py-1 text-[12.5px] text-[#8b93a4] transition-colors hover:bg-[#f0b429]/10 hover:text-[#f0b429] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={weekFull}
                    title={weekFull ? t('weekCapHitHere') : undefined}
                    onClick={() => { setWgFor(g.id); setWgTitle(''); }}
                  >
                    {t('addWeekGoalHere')}
                  </button>
                )}
              </Card>
            );
          })}

          {!full && (adding ? (
            <Card className="mb-3.5 border-[#7a5c14]">
              <div className="mb-3 flex flex-col gap-1.5">
                <label className="text-[12.5px] text-[#8b93a4]">{t('whichVision')}</label>
                <VisionPicker visions={myVisions} value={visionId} onChange={setVisionId} />
              </div>
              <div className="mb-3 flex flex-col gap-1.5">
                <label className="text-[12.5px] text-[#8b93a4]">{t('monthGoalLabel')}</label>
                <Input
                  value={title}
                  placeholder={t('monthGoalPlaceholder')}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAdding(false)}>{t('cancel')}</Button>
                <Button variant="primary" disabled={!visionId || !title.trim()} onClick={submit}>
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
              onClick={() => setAdding(true)}
            >
              <Plus className="me-1 inline h-4 w-4 align-[-3px]" />
              {t('addMonthGoal')}
            </button>
          ))}

          {full && (
            <Card className="mb-3.5 border-[#7a5c14] bg-[#f0b429]/[.06]">
              <b>{t('monthCapReached')}</b>
              <p className="mt-1 text-[12px] text-[#8b93a4]">{t('capWayOut')}</p>
            </Card>
          )}

          {goals.length === 0 && <div className="empty">{t('noGoalsThisMonth')}</div>}

          {doneGoals.length > 0 && (
            <details className="group mt-5" open>
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-[10px] border border-[#262c38] bg-[#151922] px-3 py-2 text-[13px] text-[#34d399] transition-colors hover:border-[#39424f] [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:rotate-90" />
                ✓ {t('finishedThisMonth')} ({doneGoals.length})
              </summary>
              {doneGoals.map((g) => {
                const v = allEls.find((x) => x.id === g.visionId);
                return (
                  <Card className="mt-2 flex items-center gap-3 opacity-75 transition-opacity hover:opacity-100" key={g.id}>
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
                      disabled={full}
                      title={full ? t('reopenBlocked') : t('reopen')}
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
