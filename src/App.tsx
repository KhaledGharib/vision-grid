import { useEffect, useState } from 'react';
import { useStore } from './store';
import { useT } from './useT';
import { LANGS, type Lang } from './i18n';
import { exportState } from './storage';
import BoardView from './views/BoardView';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import TodayView from './views/TodayView';
import Guide, { guideSeen, markGuideSeen } from './views/Guide';
import Ask, { type AskState } from './views/Ask';

type Tab = 'board' | 'month' | 'week' | 'today';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [showGuide, setShowGuide] = useState(() => !guideSeen());
  const [ask, setAsk] = useState<AskState>(null);
  const boards = useStore((s) => s.boards);
  const setActiveBoard = useStore((s) => s.setActiveBoard);
  const addBoard = useStore((s) => s.addBoard);
  const state = useStore();

  const active = boards.find((b) => b.isActive);
  const t = useT();
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);

  // keep <html lang/dir> in sync on first paint and on change
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const tabLabel: Record<Tab, ReturnType<typeof t>> = {
    board: t('tabBoard'), month: t('tabMonth'), week: t('tabWeek'), today: t('tabToday'),
  };

  return (
    <div className="app">
      <div className="topbar">
        <span className="logo">◈ {t('appName')}</span>

        <div className="tabs">
          {(['board', 'month', 'week', 'today'] as Tab[]).map((id) => (
            <button
              key={id}
              className={`tab${tab === id ? ' active' : ''}`}
              onClick={() => setTab(id)}
            >
              {tabLabel[id]}
            </button>
          ))}
        </div>

        <div className="spacer" />

        <span className="chain-hint">{t('chainHint')}</span>

        <div className="board-chip">
          <select
            value={active?.id ?? ''}
            onChange={(e) => setActiveBoard(e.target.value)}
            style={{ width: 150 }}
            title={t('activeBoardTitle')}
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            className="ghost"
            title={t('newBoard')}
            onClick={() =>
              setAsk({
                kind: 'prompt',
                title: t('newBoardPrompt'),
                placeholder: t('boardNamePlaceholder'),
                onOk: (name) => {
                  addBoard(name);
                  setTab('board'); // land on the new (now active) board
                },
              })
            }
          >
            + {t('boardPanel')}
          </button>
        </div>

        <select
          className="lang-select"
          title={t('language')}
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
        >
          {LANGS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.flag} {l.native}
            </option>
          ))}
        </select>

        <button
          className="ghost help-btn"
          title={t('howItWorks')}
          onClick={() => setShowGuide(true)}
        >
          ?
        </button>

        <button
          className="ghost"
          title={t('exportJson')}
          onClick={() =>
            exportState({
              version: state.version,
              user: state.user,
              boards: state.boards,
              elements: state.elements,
              monthGoals: state.monthGoals,
              weekGoals: state.weekGoals,
              tasks: state.tasks,
            })
          }
        >
          ⭳
        </button>
      </div>

      {tab === 'board' && <BoardView />}
      {tab === 'month' && <MonthView />}
      {tab === 'week' && <WeekView />}
      {tab === 'today' && <TodayView />}

      <Ask state={ask} onClose={() => setAsk(null)} />

      {showGuide && (
        <Guide
          onClose={() => {
            markGuideSeen();
            setShowGuide(false);
          }}
        />
      )}
    </div>
  );
}
