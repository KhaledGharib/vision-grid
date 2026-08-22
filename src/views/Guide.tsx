import { useStore, useStoreData } from '../store';
import { useT } from '../useT';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const KEY = 'vg:guide:seen';

/**
 * First-run guide. Explains the chain once, then gets out of the way.
 * Re-openable from the "?" button in the top bar.
 */
export default function Guide({ onClose }: { onClose: () => void }) {
  useStoreData();
  const visions = useStore((s) => s.visions)();
  const monthGoals = useStore((s) => s.currentMonthGoals)();
  const weekGoals = useStore((s) => s.currentWeekGoals)();
  const tasks = useStore((s) => s.todayTasks)();
  const t = useT();

  const steps = [
    { n: 1, tab: t('tabBoard'), title: t('guideStep1Title'), body: t('guideStep1Body'),
      hint: t('guideStep1Hint'), done: visions.length > 0 },
    { n: 2, tab: t('tabPlan'), title: t('guideStep2Title'), body: t('guideStep2Body'),
      hint: t('guideStep2Hint'), done: monthGoals.length > 0 },
    { n: 3, tab: t('tabPlan'), title: t('guideStep3Title'), body: t('guideStep3Body'),
      hint: t('guideStep3Hint'), done: weekGoals.length > 0 },
    { n: 4, tab: t('tabToday'), title: t('guideStep4Title'), body: t('guideStep4Body'),
      hint: t('guideStep4Hint'), done: tasks.length > 0 },
  ];

  const nextStep = steps.find((s) => !s.done);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[560px] max-h-[86vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[19px]">{t('guideTitle')}</DialogTitle>
          <DialogDescription>{t('guideLead')}</DialogDescription>
        </DialogHeader>

        <div className="my-1 flex flex-wrap items-center justify-center gap-2 rounded-[10px] border border-[#262c38] bg-[#0d0f14] px-3 py-2.5 text-[12.5px]">
          <span>🖼 {t('vision')}</span>
          <i className="not-italic text-[#8b93a4]">→</i>
          <span>📅 {t('tabMonth')}</span>
          <i className="not-italic text-[#8b93a4]">→</i>
          <span>🗓 {t('tabWeek')}</span>
          <i className="not-italic text-[#8b93a4]">→</i>
          <span>✅ {t('tabToday')}</span>
        </div>

        <div className="flex flex-col gap-1">
          {steps.map((s) => (
            <div
              key={s.n}
              className={cn(
                'flex items-start gap-3 rounded-[10px] border border-transparent p-2.5 transition-colors',
                s.done && 'opacity-60',
                nextStep?.n === s.n && 'border-[#f0b429]/35 bg-[#f0b429]/[.06]',
              )}
            >
              <div
                className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold',
                  s.done
                    ? 'bg-[#34d399]/20 text-[#34d399]'
                    : 'bg-[#1b2029] text-[#8b93a4]',
                )}
              >
                {s.done ? <Check className="h-3.5 w-3.5" /> : s.n}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[14px] font-medium">
                  {s.title}
                  <Badge>{s.tab}</Badge>
                </div>
                <div className="mt-0.5 text-[13px] text-[#8b93a4]">{s.body}</div>
                <div className="mt-1 text-[12px] italic text-[#8b93a4]/80">{s.hint}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-1 border-t border-[#262c38] pt-3">
          {nextStep ? (
            <p className="text-[13.5px]">
              <b>{t('guideNextStep')}</b> {t('guideOpenTab')} <b>{nextStep.tab}</b> — {nextStep.title}
            </p>
          ) : (
            <p className="text-[13.5px]">{t('guideAllSet')}</p>
          )}
          <p className="mt-1 text-[12px] text-[#8b93a4]">{t('guideCaps')}</p>
          <div className="mt-3 flex justify-end">
            <Button variant="primary" onClick={onClose}>
              {nextStep ? `${t('goTo')} ${nextStep.tab}` : t('gotIt')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function guideSeen() {
  return localStorage.getItem(KEY) === '1';
}
export function markGuideSeen() {
  localStorage.setItem(KEY, '1');
}
