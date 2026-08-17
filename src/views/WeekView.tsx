import { useState } from 'react';
import { useStore } from '../store';
import { MAX_WEEK_GOALS } from '../types';
import { dayKey, weekKey } from '../dates';
import { Coach, Example } from './Coach';

export default function WeekView() {
  const monthGoals = useStore((s) => s.currentMonthGoals)();
  const weekGoals = useStore((s) => s.currentWeekGoals)();
  const allEls = useStore((s) => s.elements);
  const allMonthGoals = useStore((s) => s.monthGoals);
  const tasks = useStore((s) => s.tasks);
  const addWeekGoal = useStore((s) => s.addWeekGoal);
  const deleteWeekGoal = useStore((s) => s.deleteWeekGoal);
  const addTask = useStore((s) => s.addTask);
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const [title, setTitle] = useState('');
  const [mgId, setMgId] = useState('');
  const [taskDraft, setTaskDraft] = useState<Record<string, string>>({});

  const full = weekGoals.length >= MAX_WEEK_GOALS;

  const submit = () => {
    if (addWeekGoal(mgId, title)) {
      setTitle('');
      setMgId('');
    }
  };

  return (
    <div className="view">
      <div className="view-head">
        <h2>
          This week · {weekKey()}{' '}
          <span className={`cap${full ? ' full' : ''}`}>
            {weekGoals.length}/{MAX_WEEK_GOALS} goals
          </span>
        </h2>
        <p>Pull one or two month goals into this week, then break them into day tasks.</p>
      </div>

      <Coach id="week" title="How to write a week goal">
        <p>
          A week goal is <b>one slice</b> of a month goal — the part you can realistically
          finish in 7 days, around your actual life.
        </p>
        <p className="coach-rule">
          Test it: could you finish this even in a bad week? If it needs everything to go
          perfectly, cut it in half.
        </p>
        <Example
          bad="Start running"
          good="Run 3 times this week, 2km each"
          why="A count and a distance. You'll know on Sunday if you did it."
        />
        <Example
          bad="Make progress on checkout"
          good="Stripe checkout works end to end in test mode"
          why="Names the finish line, not the activity."
        />
        <p className="coach-foot">
          Two maximum — and one is often the honest answer.
        </p>
      </Coach>

      {monthGoals.length === 0 ? (
        <div className="empty">
          No month goals yet.
          <br />
          Go to <b>Month</b> and set up to three first.
        </div>
      ) : (
        <>
          {!full && (
            <div className="card">
              <div className="field">
                <label>Which month goal are you advancing?</label>
                <select value={mgId} onChange={(e) => setMgId(e.target.value)}>
                  <option value="">— pick a month goal —</option>
                  {monthGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Week goal</label>
                <input
                  value={title}
                  placeholder="e.g. Run 3 times this week, 2km each"
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </div>
              <button className="primary" disabled={!mgId || !title.trim()} onClick={submit}>
                Add week goal
              </button>
            </div>
          )}

          {weekGoals.map((w) => {
            const mg = allMonthGoals.find((g) => g.id === w.monthGoalId);
            const v = allEls.find((x) => x.id === mg?.visionId);
            const mine = tasks.filter((t) => t.weekGoalId === w.id);
            const draft = taskDraft[w.id] ?? '';
            const addIt = () => {
              if (addTask(w.id, draft, dayKey())) setTaskDraft({ ...taskDraft, [w.id]: '' });
            };
            return (
              <div className="card" key={w.id}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15 }}>{w.title}</div>
                    <div className="thread">
                      {mg?.title} → <b>{v?.title ?? '—'}</b>
                    </div>
                  </div>
                  <span className="pill">
                    {mine.filter((t) => t.done).length}/{mine.length}
                  </span>
                  <button
                    className="ghost"
                    onClick={() => confirm('Delete this week goal and its tasks?') && deleteWeekGoal(w.id)}
                  >
                    ✕
                  </button>
                </div>

                {mine.map((t) => (
                  <div className={`task${t.done ? ' done' : ''}`} key={t.id}>
                    <button className={`chk${t.done ? ' on' : ''}`} onClick={() => toggleTask(t.id)}>
                      {t.done ? '✓' : ''}
                    </button>
                    <span className="title">{t.title}</span>
                    <span className="pill">{t.date}</span>
                    <button className="ghost" onClick={() => deleteTask(t.id)}>
                      ✕
                    </button>
                  </div>
                ))}

                <div className="row" style={{ marginTop: 10 }}>
                  <input
                    value={draft}
                    placeholder="+ a task you could do today in one sitting"
                    onChange={(e) => setTaskDraft({ ...taskDraft, [w.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addIt()}
                  />
                  <button disabled={!draft.trim()} onClick={addIt}>
                    Add
                  </button>
                </div>
              </div>
            );
          })}

          {weekGoals.length === 0 && (
            <div className="empty">Nothing pulled into this week yet.</div>
          )}
        </>
      )}
    </div>
  );
}
