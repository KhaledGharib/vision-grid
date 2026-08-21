import { useEffect, useRef, useState } from 'react';
import { useStore, useStoreData } from '../store';
import BoardCanvas from './BoardCanvas';
import Inspector from './Inspector';
import Minimap from './Minimap';
import { exportBoardPng } from '../export';
import { visualBounds } from '../canvas';
import { PALETTE, SHAPE_TOOLS } from '../types';
import { useT } from '../useT';
import type { StringKey } from '../i18n';
import {
  AddVision, TextHeading, TextBody, Quote, ShapeRect, ShapeEllipse,
  Undo, Redo, Duplicate, Delete, ZoomOut, ZoomIn, FitAll, ExportPng,
} from '../icons';

export default function BoardView() {
  useStoreData();
  const t = useT();
  const addVision = useStore((s) => s.addVision);
  const addText = useStore((s) => s.addText);
  const deleteSelected = useStore((s) => s.deleteSelected);
  const duplicateSelected = useStore((s) => s.duplicateSelected);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const setPan = useStore((s) => s.setPan);
  const tool = useStore((s) => s.tool);
  const setTool = useStore((s) => s.setTool);
  const shapeColor = useStore((s) => s.shapeColor);
  const setShapeColor = useStore((s) => s.setShapeColor);
  const zoomAt = useStore((s) => s.zoomAt);
  const select = useStore((s) => s.select);
  const selection = useStore((s) => s.selection);
  const els = useStore((s) => s.boardElements)();
  const updateMany = useStore((s) => s.updateMany);
  const commit = useStore((s) => s.commit);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [imgErr, setImgErr] = useState<StringKey | null>(null);

  /** Zoom about the viewport center. */
  const zoomCenter = (factor: number) => {
    const vp = document.querySelector('.canvas-viewport') as HTMLElement | null;
    if (!vp) return;
    zoomAt(factor, vp.clientWidth / 2, vp.clientHeight / 2);
  };

  /** Fit content inside the viewport. onlySelection=true frames just the selection. */
  const fitToScreen = (onlySelection = false) => {
    const vp = document.querySelector('.canvas-viewport') as HTMLElement | null;
    if (!vp) return;
    const target = onlySelection && selection.length
      ? els.filter((e) => selection.includes(e.id))
      : els;
    const bb = visualBounds(target);
    if (!bb) { setZoom(1); setPan(0, 0); return; }
    const pad = 80;
    const z = Math.max(
      0.1,
      Math.min(2, Math.min((vp.clientWidth - pad) / bb.w, (vp.clientHeight - pad) / bb.h)),
    );
    setZoom(z);
    setPan(
      vp.clientWidth / 2 - (bb.x + bb.w / 2) * z,
      vp.clientHeight / 2 - (bb.y + bb.h / 2) * z,
    );
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setImgErr(null);
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue;
      try {
        await addVision(f, f.name.replace(/\.[^.]+$/, ''));
      } catch (err) {
        // Keep going through the rest of the drop; report the first refusal.
        setImgErr(err instanceof Error && err.message === 'image_too_large'
          ? 'imageTooLarge' : 'imageInvalid');
      }
    }
  };

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA'].includes(t.tagName) || t.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault(); redo(); return;
      }
      if (typing) return;

      if (e.shiftKey && e.key === '!') { e.preventDefault(); fitToScreen(false); return; }
      if (e.shiftKey && e.key === '@') { e.preventDefault(); fitToScreen(true); return; }
      if (e.shiftKey && e.key === ')') { e.preventDefault(); zoomCenter(1 / zoom); return; }
      if (!mod && e.key.toLowerCase() === 'r') { setTool('rect'); return; }
      if (!mod && e.key.toLowerCase() === 'o') { setTool('ellipse'); return; }
      if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); select(els.map((x) => x.id)); return; }
      if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); void duplicateSelected(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); return; }
      if (e.key === 'Escape') { select([]); setTool('select'); return; }

      // arrow nudge
      if (e.key.startsWith('Arrow') && selection.length) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        const patches: Record<string, { x: number; y: number }> = {};
        els.filter((x) => selection.includes(x.id)).forEach((x) => {
          patches[x.id] = { x: x.x + dx, y: x.y + dy };
        });
        commit();
        updateMany(patches, false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [els, selection, undo, redo, select, duplicateSelected, deleteSelected, updateMany, commit, setTool]);

  return (
    <div className="board-wrap"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); void onFiles(e.dataTransfer.files); }}
      onPaste={(e) => void onFiles(e.clipboardData.files)}
    >
      <div className="board-toolbar">
        {SHAPE_TOOLS.includes(tool) && (
          <>
            <span className="tb-sep" />
            <div className="pen-colors">
              {PALETTE.slice(0, 8).map((c) => (
                <button
                  key={c}
                  className={`pen-sw${shapeColor === c ? ' on' : ''}`}
                  style={{ background: c }}
                  title={c}
                  onClick={() => setShapeColor(c)}
                />
              ))}
            </div>
          </>
        )}

        <span className="tb-sep" />
        <button
          className="primary add-vision with-icon"
          title={t('addVisionTitle')}
          onClick={() => fileRef.current?.click()}
        >
          <AddVision className="icon" />
          {t('addVision')}
        </button>
        <span className="tb-sep" />
        <button className="with-icon" onClick={() => addText('heading')}>
          <TextHeading className="icon" />
          {t('heading')}
        </button>
        <button className="with-icon" onClick={() => addText('body')}>
          <TextBody className="icon" />
          {t('body')}
        </button>
        <button className="with-icon" onClick={() => addText('quote')}>
          <Quote className="icon" />
          {t('quote')}
        </button>
        <span className="tb-sep" />
        <button className={tool === 'rect' ? 'on' : ''} title={t('rectTool')}
          aria-label={t('rectTool')} onClick={() => setTool('rect')}>
          <ShapeRect className="icon" />
        </button>
        <button className={tool === 'ellipse' ? 'on' : ''} title={t('ellipseTool')}
          aria-label={t('ellipseTool')} onClick={() => setTool('ellipse')}>
          <ShapeEllipse className="icon" />
        </button>

        <span className="tb-sep" />
        <button onClick={undo} title={t('undoTitle')} aria-label={t('undoTitle')}>
          <Undo className="icon" />
        </button>
        <button onClick={redo} title={t('redoTitle')} aria-label={t('redoTitle')}>
          <Redo className="icon" />
        </button>
        <button onClick={() => void duplicateSelected()} disabled={!selection.length}
          title={t('duplicateTitle')} aria-label={t('duplicateTitle')}>
          <Duplicate className="icon" />
        </button>
        <button onClick={deleteSelected} disabled={!selection.length}
          title={t('deleteEl')} aria-label={t('deleteEl')}>
          <Delete className="icon" />
        </button>

        <span className="spacer" />

        <div className="zoomer">
          <button onClick={() => zoomCenter(1 / 1.2)} title={t('zoomOut')} aria-label={t('zoomOut')}>
            <ZoomOut className="icon" />
          </button>
          <button className="zoom-val" onClick={() => zoomCenter(1 / zoom)} title={t('resetZoom')}>
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => zoomCenter(1.2)} title={t('zoomIn')} aria-label={t('zoomIn')}>
            <ZoomIn className="icon" />
          </button>
          <button onClick={() => fitToScreen(false)} title={t('fitAll')} aria-label={t('fitAll')}>
            <FitAll className="icon" />
          </button>
        </div>
        <button className="with-icon" disabled={busy} onClick={async () => {
          setBusy(true);
          try { await exportBoardPng(); } finally { setBusy(false); }
        }}>
          {busy ? '…' : <ExportPng className="icon" />}
          {t('exportPng')}
        </button>

        <input ref={fileRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => void onFiles(e.target.files)} />
      </div>

      <div className="board-body">
        <div className="canvas-stack">
          <BoardCanvas />
          {els.length === 0 && (
            <div className="board-empty">
              <div className="be-icon"><AddVision size={40} /></div>
              <h3>{t('emptyBoardTitle')}</h3>
              <p>{t('emptyBoardBody')}</p>
              <button className="primary" onClick={() => fileRef.current?.click()}>
                {t('emptyBoardCta')}
              </button>
              <p className="muted small">{t('dropImagesHint')}</p>
            </div>
          )}
          <Minimap />
        </div>
        <Inspector />
      </div>

      {imgErr && (
        <div className="canvas-empty" role="alert">{t(imgErr)}</div>
      )}
    </div>
  );
}
