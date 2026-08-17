import { useState } from 'react';
import { useStore } from '../store';
import { MAX_MONTH_GOALS } from '../types';
import { monthKey, monthLabel } from '../dates';
import { Coach, Example } from './Coach';

export default function MonthView() {
  const myVisions = useStore((s) => s.visions)();
  const allEls = useStore((s) => s.elements);
  const addMonthGoal = useStore((s) => s.addMonthGoal);
  const deleteMonthGoal = useStore((s) => s.deleteMonthGoal);
  const goals = useStore((s) => s.currentMonthGoals)();
  const weekGoals = useStore((s) => s.weekGoals);
  const [title, setTitle] = useState('');
  const [visionId, setVisionId] = useState('');

  const full = goals.length >= MAX_MONTH_GOALS;

  const submit = () => {
    if (addMonthGoal(visionId, title)) {
      setTitle('');
      setVisionId('');
    }
  };

  return (
    <div className="view">
      <div className="view-head">
        <h2>
          {monthLabel(monthKey())}{' '}
          <span className={`cap${full ? ' full' : ''}`}>
            {goals.length}/{MAX_MONTH_GOALS} goals
          </span>
        </h2>
        <p>Three goals maximum. The limit is the feature — it forces you to choose.</p>
      </div>

      <Coach id="month" title="How to write a month goal">
        <p>
          A month goal is <b>one visible result</b> you could finish in about 30 days —
          not a habit, not a wish, not a whole project.
        </p>
        <p className="coach-rule">
          Test it: on the last day of the month, could you point at something and say
          <i> "there, that's done"</i>? If not, it's too vague.
        </p>
        <Example
          bad="Get fit"
          good="Run 5km without stopping"
          why="'Get fit' never ends. 5km is a finish line you can cross."
        />
        <Example
          bad="Work on the app"
          good="Ship the paid beta to 10 users"
          why="'Work on' has no end. 10 users is countable."
        />
        <Example
          bad="Save money"
          good="Move SAR 5,000 into savings"
          why="A number turns a hope into a target."
        />
        <p className="coach-foot">
          Three maximum. If everything matters, nothing does.
        </p>
      </Coach>

      {myVisions.length === 0 ? (
        <div className="empty">
          You need a vision first.
          <br />
          Go to <b>Board</b> and add an image — goals must attach to something you actually want.
        </div>
      ) : (
        <>
          {!full && (
            <div className="card">
              <div className="field">
                <label>Which vision does this serve?</label>
                <select value={visionId} onChange={(e) => setVisionId(e.target.value)}>
                  <option value="">— pick a vision —</option>
                  {myVisions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>What will be DONE by the end of this month?</label>
                <input
                  value={title}
                  placeholder="e.g. Run 5km without stopping"
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </div>
              <button className="primary" disabled={!visionId || !title.trim()} onClick={submit}>
                Add month goal
              </button>
            </div>
          )}

          {full && (
            <div className="card muted">
              You're at 3 goals — that's the cap. Finish or drop one before adding another.
            </div>
          )}

          {goals.map((g) => {
            const v = allEls.find((x) => x.id === g.visionId);
            const wks = weekGoals.filter((w) => w.monthGoalId === g.id);
            return (
              <div className="card" key={g.id}>
                <div className="row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, marginBottom: 4 }}>{g.title}</div>
                    <div className="thread">
                      serves <b>{v?.title ?? '—'}</b> · {wks.length} week goal
                      {wks.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <button
                    className="ghost"
                    onClick={() => confirm('Delete this goal and its week goals/tasks?') && deleteMonthGoal(g.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}

          {goals.length === 0 && (
            <div className="empty">No goals this month yet. Pick up to three.</div>
          )}
        </>
      )}
    </div>
  );
}
