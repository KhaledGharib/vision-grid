import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { useT } from './useT';
import { sweepOrphanImages } from './storage';
import { dayKey } from './dates';
import { LogoDiamond } from './icons';
import BoardView from './views/BoardView';
import PlanView from './views/PlanView';
import SyncChip from './views/SyncChip';
import TodayView from './views/TodayView';
import Guide, { guideSeen, markGuideSeen } from './views/Guide';
import Ask, { type AskState } from './views/Ask';
import Account from './views/Account';
import SettingsMenu from './views/SettingsMenu';
import CircleView from './views/CircleView';
import ArchiveView from './views/ArchiveView';
import { DirectionProvider } from '@radix-ui/react-direction';
import { useSync } from './useSync';
import { cloudEnabled } from './cloud';
import { deleteRemoteImages } from './sync';

type Tab = 'board' | 'plan' | 'today' | 'archive' | 'circle';

export default function App() {
  const [tab, setTab] = useState<Tab>('board');
  const [showGuide, setShowGuide] = useState(() => !guideSeen());
  const [ask, setAsk] = useState<AskState>(null);
  const [showAccount, setShowAccount] = useState(false);
  const { status: syncStatus, email, ready: syncReady } = useSync();
  const flush = useStore((s) => s.flush);
  const swept = useRef(false);

  const t = useT();
  const lang = useStore((s) => s.lang);

  // keep <html lang/dir> in sync on first paint and on change
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Carry unfinished work forward once per day. Runs on open (and on the tab
  // regaining focus) so a session left open overnight still rolls over.
  useEffect(() => {
    const roll = () => {
      // dayKey() is local time. Using toISOString() here compared a UTC date
      // against local task dates, so east of UTC the carry-over did not happen
      // until the UTC date caught up — 04:00 local in UTC+4.
      const today = dayKey();
      if (localStorage.getItem('vg:rolledOn') === today) return;
      useStore.getState().rollForward();
      localStorage.setItem('vg:rolledOn', today);
    };
    roll();
    window.addEventListener('focus', roll);
    return () => window.removeEventListener('focus', roll);
  }, []);

  /**
   * Collect image blobs nothing points at any more — deleted visions, replaced
   * pictures, deleted boards.
   *
   * Timing is the whole point. The delete paths deliberately leave blobs behind
   * so undo can restore a vision with its picture, which means the bytes are
   * only safe to drop once the undo stack cannot reach them. The stack is not
   * persisted, so after a load is exactly that moment. Waiting for 'synced'
   * matters too: sweeping before the initial pull lands would delete blobs the
   * incoming remote state still references.
   */
  useEffect(() => {
    if (swept.current || !syncReady) return;
    swept.current = true;
    const referenced = useStore
      .getState()
      .elements.map((e) => e.imageId)
      .filter((x): x is string => Boolean(x));

    void sweepOrphanImages(referenced).then((gone) => {
      if (!gone.length) return;
      console.info('[images] swept ' + gone.length + ' orphaned blob(s)');

      // Same blobs, same reasoning: nothing references them, so the cloud
      // copies go too. Only the signed-in case has any to remove.
      if (!cloudEnabled || syncStatus === 'signed-out' || syncStatus === 'offline') return;
      void deleteRemoteImages(gone)
        .then((n) => console.info('[images] removed ' + n + ' from Storage'))
        .catch((e) => console.error('[images] Storage cleanup failed', e));
    });
  }, [syncReady, syncStatus]);

  // Writes during a gesture are coalesced, so make sure the last one lands if
  // the tab goes away mid-drag.
  useEffect(() => {
    const save = () => flush();
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', save);
    return () => {
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', save);
    };
  }, [flush]);

  const tabLabel: Record<Tab, ReturnType<typeof t>> = {
    board: t('tabBoard'), plan: t('tabPlan'),
    today: t('tabToday'), archive: t('tabArchive'), circle: t('tabCircle'),
  };
  const signedIn =
    syncStatus === 'synced' || syncStatus === 'syncing' || syncStatus === 'error';

  return (
    <DirectionProvider dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <div className="app">
      <div className="topbar">
        <span className="logo">
          <LogoDiamond className="icon" />
          {t('appName')}
        </span>

        <div className="tabs">
          {(['board', 'plan', 'today', 'archive', ...(cloudEnabled ? ['circle' as Tab] : [])] as Tab[]).map((id) => (
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

        <SyncChip status={syncStatus} email={email} onOpen={() => setShowAccount(true)} />

        <SettingsMenu
          syncStatus={syncStatus}
          onAccount={() => setShowAccount(true)}
          onGuide={() => setShowGuide(true)}
          onAsk={setAsk}
          onBoardCreated={() => setTab('board')}
        />
      </div>

      {tab === 'board' && <BoardView />}
      {tab === 'plan' && <PlanView />}
      {tab === 'today' && <TodayView />}
      {tab === 'archive' && <ArchiveView />}
      {tab === 'circle' && <CircleView signedIn={signedIn} />}

      <Ask state={ask} onClose={() => setAsk(null)} />

      {showAccount && (
        <Account status={syncStatus} email={email} onClose={() => setShowAccount(false)} />
      )}

      {showGuide && (
        <Guide
          onClose={() => {
            markGuideSeen();
            setShowGuide(false);
          }}
        />
      )}
    </div>
    </DirectionProvider>
  );
}
