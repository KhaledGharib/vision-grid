import { useState } from 'react';
import { useStore } from '../store';
import { MAX_WEEK_GOALS } from '../types';
import { dayKey, weekKey } from '../dates';
import { Coach, Example } from './Coach';
import { useT } from '../useT';
import Ask, { type AskState } from './Ask';

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
        <h2>
          {t('thisWeek')} · {weekKey()}{' '}
          <span className={`cap${full ? ' full' : ''}`}>
            {weekGoals.length}/{MAX_WEEK_GOALS} {t('goals')}
          </span>
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
              <div className="card" key={w.id}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15 }}>{w.title}</div>
                    <div className="thread">
                      {mg?.title} → <b>{v?.title ?? '—'}</b>
                    </div>
                  </div>
                  <span className="pill">
                    {mine.filter((task) => task.done).length}/{mine.length}
                  </span>
                  <button
                    className="ghost"
                    onClick={() =>
                      setAsk({
                        kind: 'confirm', danger: true,
                        title: t('deleteQ'), body: t('confirmDeleteWeek'),
                        onOk: () => deleteWeekGoal(w.id),
                      })
                    }
                  >
                    ✕
                  </button>
                </div>

                {weekGoalAllDone(w.id) && (
                  <div className="close-hint">
                    <span>🎉 {t('allTasksDoneHint')}</span>
                    <button className="primary" onClick={() => completeWeekGoal(w.id)}>
                      {t('closeIt')}
                    </button>
                  </div>
                )}

                {mine.map((task) => (
                  <div className={`task${task.done ? ' done' : ''}`} key={task.id}>
                    <button className={`chk${task.done ? ' on' : ''}`} onClick={() => toggleTask(task.id)}>
                      {task.done ? '✓' : ''}
                    </button>
                    <span className="title">{task.title}</span>
                    <span className="pill">{task.date}</span>
                    <button className="ghost" onClick={() => deleteTask(task.id)}>
                      ✕
                    </button>
                  </div>
                ))}

                <div className="row" style={{ marginTop: 10 }}>
                  <input
                    value={draft}
                    placeholder={t('taskPlaceholder')}
                    onChange={(e) => setTaskDraft({ ...taskDraft, [w.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addIt()}
                  />
                  <button disabled={!draft.trim()} onClick={addIt}>
                    {t('add')}
                  </button>
                </div>
              </div>
            );
          })}

          {full && (
            <div className="card cap-note">
              <b>{t('weekCapReached')}</b>
              <p className="muted small" style={{ margin: '4px 0 0' }}>{t('capWayOut')}</p>
            </div>
          )}

          {!full && (adding ? (
            <div className="card add-form">
              <div className="field">
                <label>{t('whichMonthGoal')}</label>
                <select value={mgId} onChange={(e) => setMgId(e.target.value)}>
                  <option value="">{t('pickMonthGoal')}</option>
                  {monthGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('weekGoalLabel')}</label>
                <input
                  value={title}
                  placeholder={t('weekGoalPlaceholder')}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </div>
              <div className="row">
                <button className="ghost" onClick={() => setAdding(false)}>{t('cancel')}</button>
                <button className="primary" disabled={!mgId || !title.trim()} onClick={submit}>
                  {t('addWeekGoal')}
                </button>
              </div>
            </div>
          ) : (
            <button className="add-slot-btn" onClick={() => setAdding(true)}>
              + {t('addWeekGoal')}
            </button>
          ))}

          {weekGoals.length === 0 && (
            <div className="empty">{t('nothingThisWeek')}</div>
          )}

          {doneWeekGoals.length > 0 && (
            <details className="done-list" open>
              <summary>✓ {t('finishedThisWeek')} ({doneWeekGoals.length})</summary>
              {doneWeekGoals.map((w) => {
                const mg = allMonthGoals.find((g) => g.id === w.monthGoalId);
                return (
                  <div className="card done-row" key={w.id}>
                    <span className="done-tick">✓</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="done-title">{w.title}</div>
                      <div className="thread">{mg?.title ?? '—'}</div>
                    </div>
                    <button
                      className="ghost"
                      disabled={full}
                      title={full ? t('reopenBlocked') : t('reopen')}
                      onClick={() => reopenWeekGoal(w.id)}
                    >↩</button>
                  </div>
                );
              })}
            </details>
          )}
        </>
      )}
    </div>
  );
}
