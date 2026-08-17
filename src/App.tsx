import { useState } from 'react';
import { useStore } from './store';
import { exportState } from './storage';
import BoardView from './views/BoardView';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import TodayView from './views/TodayView';
import Guide, { guideSeen, markGuideSeen } from './views/Guide';

type Tab = 'board' | 'month' | 'week' | 'today';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [showGuide, setShowGuide] = useState(() => !guideSeen());
  const boards = useStore((s) => s.boards);
  const setActiveBoard = useStore((s) => s.setActiveBoard);
  const addBoard = useStore((s) => s.addBoard);
  const state = useStore();

  const active = boards.find((b) => b.isActive);

  return (
    <div className="app">
      <div className="topbar">
        <span className="logo">◈ Vision Grid</span>

        <div className="tabs">
          {(['board', 'month', 'week', 'today'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="spacer" />

        <span className="chain-hint">Vision → Month → Week → Day</span>

        <div className="board-chip">
          <select
            value={active?.id ?? ''}
            onChange={(e) => setActiveBoard(e.target.value)}
            style={{ width: 150 }}
            title="Active board — only this board's goals can get tasks"
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            className="ghost"
            title="New board"
            onClick={() => {
              const n = prompt('Board name (e.g. Health, Career, Money)');
              if (n?.trim()) addBoard(n.trim());
            }}
          >
            +
          </button>
        </div>

        <button
          className="ghost help-btn"
          title="How this works"
          onClick={() => setShowGuide(true)}
        >
          ?
        </button>

        <button
          className="ghost"
          title="Export all data as JSON"
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
