import { useState } from 'react';
import { useStore } from '../store';
import { MAX_MONTH_GOALS } from '../types';
import { monthKey, monthLabel } from '../dates';
import { Coach, Example } from './Coach';
import { useT } from '../useT';
import Ask, { type AskState } from './Ask';

export default function MonthView() {
  const myVisions = useStore((s) => s.visions)();
  const allEls = useStore((s) => s.elements);
  const addMonthGoal = useStore((s) => s.addMonthGoal);
  const deleteMonthGoal = useStore((s) => s.deleteMonthGoal);
  const goals = useStore((s) => s.currentMonthGoals)();
  const weekGoals = useStore((s) => s.weekGoals);
  const [title, setTitle] = useState('');
  const [visionId, setVisionId] = useState('');
  const t = useT();
  const [ask, setAsk] = useState<AskState>(null);

  const full = goals.length >= MAX_MONTH_GOALS;

  const submit = () => {
    if (addMonthGoal(visionId, title)) {
      setTitle('');
      setVisionId('');
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
        </h2>
        <p>{t('monthCapLine')}</p>
      </div>

      <Coach id="month" title={t('coachMonthTitle')}>
        <p>{t('coachMonthBody')}</p>
        <p className="coach-rule">{t('coachMonthRule')}</p>
        <Example bad={t('exBadFit')} good={t('exGoodFit')} why={t('exWhyFit')} />
        <Example bad={t('exBadApp')} good={t('exGoodApp')} why={t('exWhyApp')} />
        <Example bad={t('exBadSave')} good={t('exGoodSave')} why={t('exWhySave')} />
        <p className="coach-foot">{t('coachMonthFoot')}</p>
      </Coach>

      {myVisions.length === 0 ? (
        <div className="empty">
          {t('needVisionFirst')}
          <br />
          {t('needVisionHint')}
        </div>
      ) : (
        <>
          {!full && (
            <div className="card">
              <div className="field">
                <label>{t('whichVision')}</label>
                <select value={visionId} onChange={(e) => setVisionId(e.target.value)}>
                  <option value="">{t('pickVision')}</option>
                  {myVisions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
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
              <button className="primary" disabled={!visionId || !title.trim()} onClick={submit}>
                {t('addMonthGoal')}
              </button>
            </div>
          )}

          {full && <div className="card muted">{t('monthCapReached')}</div>}

          {goals.map((g) => {
            const v = allEls.find((x) => x.id === g.visionId);
            const wks = weekGoals.filter((w) => w.monthGoalId === g.id);
            return (
              <div className="card" key={g.id}>
                <div className="row">
                  <div style={{ flex: 1 }}>
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
              </div>
            );
          })}

          {goals.length === 0 && <div className="empty">{t('noGoalsThisMonth')}</div>}
        </>
      )}
    </div>
  );
}
