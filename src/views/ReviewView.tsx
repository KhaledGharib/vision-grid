import { useState } from 'react';
import { useStore } from '../store';
import { MAX_CARRIES } from '../types';
import { weekKey } from '../dates';
import { fmtMins } from './TodayView';

export default function ReviewView() {
  const stale = useStore((s) => s.staleWeekGoals)();
  const graveyard = useStore((s) => s.graveyard)();
  const monthGoals = useStore((s) => s.monthGoals);
  const elements = useStore((s) => s.elements);
  const sessions = useStore((s) => s.sessions);
  const visions = useStore((s) => s.visions)();
  const visionMinutes = useStore((s) => s.visionMinutes);
  const visionIdleDays = useStore((s) => s.visionIdleDays);
  const carryWeekGoal = useStore((s) => s.carryWeekGoal);
  const shrinkWeekGoal = useStore((s) => s.shrinkWeekGoal);
  const dropWeekGoal = useStore((s) => s.dropWeekGoal);
  const saveReview = useStore((s) => s.saveReview);
  const reviews = useStore((s) => s.reviews);

  const wk = weekKey();
  const existing = reviews.find((r) => r.periodKey === wk);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [shrinking, setShrinking] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // last 7 days of focus
  const weekAgo = Date.now() - 7 * 86400000;
  const recent = sessions.filter((s) => new Date(s.endedAt).getTime() >= weekAgo);
  const minsWeek = recent.reduce((sum, s) => sum + s.minutes, 0);

  const chain = (monthGoalId: string) => {
    const mg = monthGoals.find((g) => g.id === monthGoalId);
    const v = elements.find((e) => e.id === mg?.visionId);
    return `${mg?.title ?? '—'} → ${v?.title ?? '—'}`;
  };

  return (
    <div className="view">
      <div className="view-head">
        <h2>Weekly review</h2>
        <p>
          Five minutes. What got fed, what starved, what you're honestly dropping.
          {minsWeek > 0 && <> · <b style={{ color: 'var(--accent)' }}>{fmtMins(minsWeek)} focused this week</b></>}
        </p>
      </div>

      {/* ---- unfinished goals: forced choice ---- */}
      <h3 className="sec">Unfinished from previous weeks</h3>
      {stale.length === 0 ? (
        <div className="card muted">Nothing carried over. Clean slate.</div>
      ) : (
        stale.map((w) => {
          const blocked = w.carryCount >= MAX_CARRIES;
          const draft = shrinking[w.id];
          return (
            <div className="card" key={w.id}>
              <div style={{ fontSize: 15 }}>{w.title}</div>
              <div className="thread" style={{ marginBottom: 10 }}>
                {chain(w.monthGoalId)}
                {w.carryCount > 0 && (
                  <span className={`pill${blocked ? ' danger' : ''}`} style={{ marginLeft: 8 }}>
                    carried {w.carryCount}×
                  </span>
                )}
              </div>

              {draft !== undefined ? (
                <div className="row">
                  <input
                    autoFocus
                    value={draft}
                    placeholder="Smaller, honest version of this goal"
                    onChange={(e) => setShrinking({ ...shrinking, [w.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && draft.trim()) {
                        shrinkWeekGoal(w.id, draft);
                        const n = { ...shrinking }; delete n[w.id]; setShrinking(n);
                      }
                    }}
                  />
                  <button
                    className="primary"
                    disabled={!draft.trim()}
                    onClick={() => {
                      shrinkWeekGoal(w.id, draft);
                      const n = { ...shrinking }; delete n[w.id]; setShrinking(n);
                    }}
                  >
                    Save
                  </button>
                  <button className="ghost" onClick={() => {
                    const n = { ...shrinking }; delete n[w.id]; setShrinking(n);
                  }}>Cancel</button>
                </div>
              ) : (
                <div className="row">
                  <button
                    disabled={blocked}
                    title={blocked ? `Carried ${MAX_CARRIES}× already — shrink it or drop it` : 'Move to this week'}
                    onClick={() => carryWeekGoal(w.id)}
                  >
                    Carry
                  </button>
                  <button onClick={() => setShrinking({ ...shrinking, [w.id]: w.title })}>
                    Shrink
                  </button>
                  <button
                    style={{ color: 'var(--red)' }}
                    onClick={() => {
                      const why = prompt('Why are you dropping this? One line.');
                      if (why !== null) dropWeekGoal(w.id, why || 'no reason given');
                    }}
                  >
                    Drop
                  </button>
                  {blocked && (
                    <span className="muted small">
                      Carried {MAX_CARRIES}× — be honest: shrink it or drop it.
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* ---- attention report ---- */}
      <h3 className="sec">Where your attention actually went</h3>
      {visions.length === 0 ? (
        <div className="card muted">No visions yet.</div>
      ) : (
        <div className="card">
          {visions
            .map((v) => ({ v, mins: visionMinutes(v.id), idle: visionIdleDays(v.id) }))
            .sort((a, b) => b.mins - a.mins)
            .map(({ v, mins, idle }) => (
              <div className="attn-row" key={v.id}>
                <span className="attn-name">{v.title}</span>
                <span className={`attn-mins${mins === 0 ? ' zero' : ''}`}>
                  {mins > 0 ? fmtMins(mins) : 'never fed'}
                </span>
                <span className="muted small">
                  {idle === null ? '' : idle === 0 ? 'today' : `${idle}d ago`}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* ---- notes ---- */}
      <h3 className="sec">Notes to your future self</h3>
      <div className="card">
        <textarea
          rows={4}
          value={notes}
          placeholder="What actually happened this week? What will you change?"
          onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        />
        <div className="row" style={{ marginTop: 10 }}>
          <button className="primary" onClick={() => { saveReview(notes); setSaved(true); }}>
            {existing ? 'Update review' : 'Save review'}
          </button>
          {saved && <span className="muted small">Saved ✓</span>}
        </div>
      </div>

      {/* ---- graveyard ---- */}
      {graveyard.length > 0 && (
        <>
          <h3 className="sec">Graveyard — {graveyard.length} dropped</h3>
          <div className="card">
            <p className="muted small" style={{ marginTop: 0 }}>
              Not deleted. If one vision fills this list, it probably isn't yours.
            </p>
            {graveyard.map((w) => (
              <div className="grave-row" key={w.id}>
                <span className="grave-title">{w.title}</span>
                <span className="muted small">{w.droppedReason}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
