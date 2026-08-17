import { useStore } from '../store';
import { useT } from '../useT';

const KEY = 'vg:guide:seen';

/**
 * First-run guide. Explains the chain once, then gets out of the way.
 * Re-openable from the "?" button in the top bar.
 */
export default function Guide({ onClose }: { onClose: () => void }) {
  const visions = useStore((s) => s.visions)();
  const monthGoals = useStore((s) => s.currentMonthGoals)();
  const weekGoals = useStore((s) => s.currentWeekGoals)();
  const tasks = useStore((s) => s.todayTasks)();
  const t = useT();

  const steps = [
    {
      n: 1,
      tab: t('tabBoard'),
      title: t('guideStep1Title'),
      body: t('guideStep1Body'),
      hint: t('guideStep1Hint'),
      done: visions.length > 0,
    },
    {
      n: 2,
      tab: t('tabMonth'),
      title: t('guideStep2Title'),
      body: t('guideStep2Body'),
      hint: t('guideStep2Hint'),
      done: monthGoals.length > 0,
    },
    {
      n: 3,
      tab: t('tabWeek'),
      title: t('guideStep3Title'),
      body: t('guideStep3Body'),
      hint: t('guideStep3Hint'),
      done: weekGoals.length > 0,
    },
    {
      n: 4,
      tab: t('tabToday'),
      title: t('guideStep4Title'),
      body: t('guideStep4Body'),
      hint: t('guideStep4Hint'),
      done: tasks.length > 0,
    },
  ];

  const nextStep = steps.find((s) => !s.done);

  return (
    <div className="guide-overlay" onClick={onClose}>
      <div className="guide" onClick={(e) => e.stopPropagation()}>
        <button className="guide-x" onClick={onClose} title={t('close')}>×</button>

        <h2>{t('guideTitle')}</h2>
        <p className="guide-lead">{t('guideLead')}</p>

        <div className="chain-strip">
          <span>🖼 {t('vision')}</span><i>→</i>
          <span>📅 {t('tabMonth')}</span><i>→</i>
          <span>🗓 {t('tabWeek')}</span><i>→</i>
          <span>✅ {t('tabToday')}</span>
        </div>

        {steps.map((s) => (
          <div
            key={s.n}
            className={`guide-step${s.done ? ' done' : ''}${nextStep?.n === s.n ? ' next' : ''}`}
          >
            <div className="gs-num">{s.done ? '✓' : s.n}</div>
            <div className="gs-body">
              <div className="gs-title">
                {s.title} <span className="gs-tab">{s.tab}</span>
              </div>
              <div className="gs-text">{s.body}</div>
              <div className="gs-hint">{s.hint}</div>
            </div>
          </div>
        ))}

        <div className="guide-foot">
          {nextStep ? (
            <p>
              <b>{t('guideNextStep')}</b> {t('guideOpenTab')} <b>{nextStep.tab}</b> — {nextStep.title}
            </p>
          ) : (
            <p>{t('guideAllSet')}</p>
          )}
          <p className="muted small">{t('guideCaps')}</p>
          <button className="primary" onClick={onClose}>
            {nextStep ? `${t('goTo')} ${nextStep.tab}` : t('gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function guideSeen() {
  return localStorage.getItem(KEY) === '1';
}
export function markGuideSeen() {
  localStorage.setItem(KEY, '1');
}
