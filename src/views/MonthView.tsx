import { useState } from 'react';
import { useStore } from '../store';
import { MAX_MONTH_GOALS } from '../types';
import { monthKey, monthLabel } from '../dates';
import { Coach, Example } from './Coach';
import { useT } from '../useT';
import Ask, { type AskState } from './Ask';
import VisionPicker from './VisionPicker';
import { useImage } from '../hooks/useImage';
import type { BoardElement } from '../types';

/** The vision's picture next to its goal, so the link is visible not textual. */
function GoalThumb({ el }: { el?: BoardElement }) {
  const url = useImage(el?.imageId);
  if (!el) return null;
  return url
    ? <img src={url} alt="" className="goal-thumb" draggable={false} />
    : <div className="goal-thumb goal-thumb-ph">🎯</div>;
}

export default function MonthView() {
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
  const [title, setTitle] = useState('');
  const [visionId, setVisionId] = useState('');
  const t = useT();
  const [ask, setAsk] = useState<AskState>(null);
  const [adding, setAdding] = useState(false);

  const full = goals.length >= MAX_MONTH_GOALS;

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
        <h2>
          {monthLabel(monthKey(), t.lang)}{' '}
          <span className={`cap${full ? ' full' : ''}`}>
            {goals.length}/{MAX_MONTH_GOALS} {t('goals')}
          </span>
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
            return (
              <div className="card" key={g.id}>
                <div className="row">
                  <GoalThumb el={v} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, marginBottom: 4 }}>{g.title}</div>
                    <div className="thread">
                      {t('serves')} <b>{v?.title ?? '—'}</b> · {wks.length} {t('weekGoalCount')}
                    </div>
                  </div>
                  <button
                    className="ghost"
                    onClick={() =>
                      setAsk({
                        kind: 'confirm', danger: true,
                        title: t('deleteQ'), body: t('confirmDeleteMonth'),
                        onOk: () => deleteMonthGoal(g.id),
                      })
                    }
                  >
                    ✕
                  </button>
                </div>

                {monthGoalAllDone(g.id) && (
                  <div className="close-hint">
                    <span>🎉 {t('allTasksDoneHint')}</span>
                    <button className="primary" onClick={() => completeMonthGoal(g.id)}>
                      {t('closeIt')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {!full && (adding ? (
            <div className="card add-form">
              <div className="field">
                <label>{t('whichVision')}</label>
                <VisionPicker visions={myVisions} value={visionId} onChange={setVisionId} />
              </div>
              <div className="field">
                <label>{t('monthGoalLabel')}</label>
                <input
                  value={title}
                  placeholder={t('monthGoalPlaceholder')}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </div>
              <div className="row">
                <button className="ghost" onClick={() => setAdding(false)}>{t('cancel')}</button>
                <button className="primary" disabled={!visionId || !title.trim()} onClick={submit}>
                  {t('addMonthGoal')}
                </button>
              </div>
            </div>
          ) : (
            <button className="add-slot-btn" onClick={() => setAdding(true)}>
              + {t('addMonthGoal')}
            </button>
          ))}

          {full && (
            <div className="card cap-note">
              <b>{t('monthCapReached')}</b>
              <p className="muted small" style={{ margin: '4px 0 0' }}>
                {t('capWayOut')}
              </p>
            </div>
          )}

          {goals.length === 0 && <div className="empty">{t('noGoalsThisMonth')}</div>}

          {doneGoals.length > 0 && (
            <details className="done-list" open>
              <summary>✓ {t('finishedThisMonth')} ({doneGoals.length})</summary>
              {doneGoals.map((g) => {
                const v = allEls.find((x) => x.id === g.visionId);
                return (
                  <div className="card done-row" key={g.id}>
                    <span className="done-tick">✓</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="done-title">{g.title}</div>
                      <div className="thread">{t('serves')} {v?.title ?? '—'}</div>
                    </div>
                    <button
                      className="ghost"
                      disabled={full}
                      title={full ? t('reopenBlocked') : t('reopen')}
                      onClick={() => reopenMonthGoal(g.id)}
                    >
                      ↩
                    </button>
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
