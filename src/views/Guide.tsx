import { useStore } from '../store';

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

  const steps = [
    {
      n: 1,
      tab: 'Board',
      title: 'Put a picture of what you want',
      body: 'Drag an image onto the board. That image is a vision — the thing you are actually working toward. Give it a title and write why it matters.',
      done: visions.length > 0,
      hint: 'Start with ONE. You can add more later.',
    },
    {
      n: 2,
      tab: 'Month',
      title: 'Name one result for this month',
      body: 'Pick the vision, then write one thing that will be DONE in 30 days. Not a habit — a finish line you can point at.',
      done: monthGoals.length > 0,
      hint: 'e.g. "Run 5km without stopping", not "get fit".',
    },
    {
      n: 3,
      tab: 'Week',
      title: 'Slice off this week',
      body: 'Take the month goal and ask: what part of it can I finish in 7 days, in my real life, even in a bad week?',
      done: weekGoals.length > 0,
      hint: 'e.g. "Run 3 times, 2km each".',
    },
    {
      n: 4,
      tab: 'Today',
      title: 'Do one thing today',
      body: 'Break the week goal into single-sitting actions. Star up to 3 as your most important. Tick them off as you go.',
      done: tasks.length > 0,
      hint: 'If you would have to think "how do I start?", it is still too big.',
    },
  ];

  const nextStep = steps.find((s) => !s.done);

  return (
    <div className="guide-overlay" onClick={onClose}>
      <div className="guide" onClick={(e) => e.stopPropagation()}>
        <button className="guide-x" onClick={onClose} title="Close">×</button>

        <h2>How Vision Grid works</h2>
        <p className="guide-lead">
          One rule: <b>nothing exists without a parent.</b> Every task belongs to a week
          goal, every week goal to a month goal, every month goal to a picture of the life
          you want. That way the thing in front of you on a Tuesday is visibly connected
          to the reason you care.
        </p>

        <div className="chain-strip">
          <span>🖼 Vision</span><i>→</i>
          <span>📅 Month</span><i>→</i>
          <span>🗓 Week</span><i>→</i>
          <span>✅ Today</span>
        </div>

        {steps.map((s) => (
          <div key={s.n} className={`guide-step${s.done ? ' done' : ''}${nextStep?.n === s.n ? ' next' : ''}`}>
            <div className="gs-num">{s.done ? '✓' : s.n}</div>
            <div className="gs-body">
              <div className="gs-title">
                {s.title} <span className="gs-tab">{s.tab} tab</span>
              </div>
              <div className="gs-text">{s.body}</div>
              <div className="gs-hint">{s.hint}</div>
            </div>
          </div>
        ))}

        <div className="guide-foot">
          {nextStep ? (
            <p>
              <b>Your next step:</b> open the <b>{nextStep.tab}</b> tab and {nextStep.title.toLowerCase()}.
            </p>
          ) : (
            <p>You have the full chain set up. Now just tick things off.</p>
          )}
          <p className="muted small">
            Caps are deliberate: 3 month goals, 2 week goals, 3 starred tasks a day.
            The limit is the feature — it forces you to choose.
          </p>
          <button className="primary" onClick={onClose}>
            {nextStep ? `Go to ${nextStep.tab}` : 'Got it'}
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
