import { useState } from 'react';
import { Check, LayoutGrid, LogOut, Settings } from 'lucide-react';
import { useStore } from '../store';
import { useT } from '../useT';
import { LANGS, type Lang } from '../i18n';
import { exportBoardPng } from '../export';
import { cloudEnabled, type SyncStatus } from '../cloud';
import { signOut } from '../sync';
import {
  Rename, NewBoard, Delete, ExportPng, Help, SyncCloud,
} from '../icons';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import type { AskState } from './Ask';

/**
 * Everything that is not "which board am I on" and not a tab.
 *
 * The top bar had eight controls competing for the right-hand side, which is
 * what pushed it into wrapping onto a second row. Board management, language,
 * account, export and help are all things you reach for occasionally and never
 * mid-thought, so they belong behind one button rather than on permanent
 * display. The board switcher stays outside: it answers a question ("which
 * board is active?") rather than performing an action.
 */
export default function SettingsMenu({
  syncStatus,
  onAccount,
  onGuide,
  onAsk,
  onBoardCreated,
}: {
  syncStatus: SyncStatus;
  onAccount: () => void;
  onGuide: () => void;
  onAsk: (s: AskState) => void;
  onBoardCreated: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const elements = useStore((s) => s.elements);
  const boards = useStore((s) => s.boards);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const renameBoard = useStore((s) => s.renameBoard);
  const addBoard = useStore((s) => s.addBoard);
  const deleteBoard = useStore((s) => s.deleteBoard);
  const setActiveBoard = useStore((s) => s.setActiveBoard);

  const active = boards.find((b) => b.isActive);
  const signedIn =
    syncStatus === 'synced' || syncStatus === 'syncing' || syncStatus === 'error';
  const lastBoard = boards.length <= 1;
  // exportBoardPng crops to the content bounding box, so an empty board would
  // produce nothing at all. Say so rather than looking broken.
  const boardIsEmpty = !active || !elements.some((e) => e.boardId === active.id);

  /** Close before opening a dialog, or the two overlays fight for focus. */
  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="ghost settings-btn" title={t('settings')} aria-label={t('settings')}>
          <Settings className="icon" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="settings-menu">
        <div className="menu-label">{t('switchBoard')}</div>

        {boards.map((b) => (
          <button
            key={b.id}
            className={`menu-item${b.isActive ? ' on' : ''}`}
            aria-pressed={b.isActive}
            onClick={() => run(() => setActiveBoard(b.id))}
          >
            <LayoutGrid className="icon" />
            <span className="menu-item-label">{b.name}</span>
            {b.isActive && <Check className="icon menu-item-tick" />}
          </button>
        ))}

        <div className="menu-sep" />
        <div className="menu-label">{t('boardPanel')}</div>

        <button
          className="menu-item"
          disabled={!active}
          onClick={() =>
            active &&
            run(() =>
              onAsk({
                kind: 'prompt',
                title: t('renameBoardTitle'),
                placeholder: t('boardNamePlaceholder'),
                value: active.name,
                okLabel: t('save'),
                onOk: (name) => renameBoard(active.id, name),
              }),
            )
          }
        >
          <Rename className="icon" />
          {t('renameBoardTitle')}
        </button>

        <button
          className="menu-item"
          onClick={() =>
            run(() =>
              onAsk({
                kind: 'prompt',
                title: t('newBoardPrompt'),
                placeholder: t('boardNamePlaceholder'),
                onOk: (name) => {
                  addBoard(name);
                  onBoardCreated();
                },
              }),
            )
          }
        >
          <NewBoard className="icon" />
          {t('newBoard')}
        </button>

        <button
          className="menu-item danger"
          disabled={!active || lastBoard}
          title={lastBoard ? t('deleteBoardBlocked') : undefined}
          onClick={() => {
            if (!active) return;
            const n = useStore.getState().boardImpact(active.id);
            const empty = n.visions + n.monthGoals + n.weekGoals + n.tasks === 0;
            run(() =>
              onAsk({
                kind: 'confirm',
                danger: true,
                title: t('deleteBoardTitle'),
                body: empty
                  ? t('confirmDeleteBoardEmpty', { name: active.name })
                  : t('confirmDeleteBoard', {
                      name: active.name,
                      v: String(n.visions),
                      m: String(n.monthGoals),
                      w: String(n.weekGoals),
                      t: String(n.tasks),
                    }),
                onOk: () => deleteBoard(active.id),
              }),
            );
          }}
        >
          <Delete className="icon" />
          {t('deleteBoard')}
        </button>

        <div className="menu-sep" />
        <div className="menu-label">{t('language')}</div>
        <div className="menu-langs">
          {LANGS.map((l) => (
            <button
              key={l.id}
              className={`menu-lang${lang === l.id ? ' on' : ''}`}
              aria-pressed={lang === l.id}
              onClick={() => setLang(l.id as Lang)}
            >
              {l.native}
            </button>
          ))}
        </div>

        <div className="menu-sep" />

        {cloudEnabled && (
          <button className="menu-item" onClick={() => run(onAccount)}>
            <SyncCloud className="icon" />
            {signedIn ? t('editProfile') : t('signIn')}
          </button>
        )}

        {cloudEnabled && signedIn && (
          <button
            className="menu-item danger"
            onClick={() =>
              run(() =>
                onAsk({
                  kind: 'confirm',
                  danger: true,
                  title: t('signOutTitle'),
                  body: t('confirmSignOut'),
                  onOk: () => { void signOut(); },
                }),
              )
            }
          >
            <LogOut className="icon" />
            {t('signOut')}
          </button>
        )}

        <button
          className="menu-item"
          disabled={boardIsEmpty || exporting}
          title={boardIsEmpty ? t('exportPngEmpty') : undefined}
          onClick={async () => {
            setExporting(true);
            try {
              setOpen(false);
              await exportBoardPng();
            } finally {
              setExporting(false);
            }
          }}
        >
          <ExportPng className="icon" />
          {exporting ? t('exportPngBusy') : t('exportPng')}
        </button>

        <button className="menu-item" onClick={() => run(onGuide)}>
          <Help className="icon" />
          {t('howItWorks')}
        </button>
      </PopoverContent>
    </Popover>
  );
}
