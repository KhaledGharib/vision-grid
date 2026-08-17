import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import BoardCanvas from './BoardCanvas';
import Inspector from './Inspector';
import Minimap from './Minimap';
import { exportBoardPng } from '../export';
import { bounds } from '../canvas';
import { PALETTE, SHAPE_TOOLS } from '../types';

export default function BoardView() {
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
    const bb = bounds(target);
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
    for (const f of Array.from(files)) {
      if (f.type.startsWith('image/')) await addVision(f, f.name.replace(/\.[^.]+$/, ''));
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
      if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected(); return; }
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
        <button className="primary" onClick={() => fileRef.current?.click()}>🖼 Image</button>
        <span className="tb-sep" />
        <button onClick={() => addText('heading')}>T Heading</button>
        <button onClick={() => addText('body')}>T Body</button>
        <button onClick={() => addText('quote')}>❝ Quote</button>
        <span className="tb-sep" />
        <button className={tool === 'rect' ? 'on' : ''} title="Rectangle (R) — drag to draw"
          onClick={() => setTool('rect')}>▭</button>
        <button className={tool === 'ellipse' ? 'on' : ''} title="Ellipse (O) — drag to draw"
          onClick={() => setTool('ellipse')}>◯</button>

        <span className="tb-sep" />
        <button onClick={undo} title="Undo (Ctrl+Z)">↶</button>
        <button onClick={redo} title="Redo (Ctrl+Y)">↷</button>
        <button onClick={duplicateSelected} disabled={!selection.length} title="Duplicate (Ctrl+D)">⧉</button>
        <button onClick={deleteSelected} disabled={!selection.length} title="Delete">🗑</button>

        <span className="spacer" />

        <div className="zoomer">
          <button onClick={() => zoomCenter(1 / 1.2)} title="Zoom out">−</button>
          <button className="zoom-val" onClick={() => zoomCenter(1 / zoom)} title="Reset to 100%">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => zoomCenter(1.2)} title="Zoom in">+</button>
          <button onClick={() => fitToScreen(false)} title="Zoom to fit all (Shift+1)">⤢</button>
        </div>
        <button disabled={busy} onClick={async () => {
          setBusy(true);
          try { await exportBoardPng(); } finally { setBusy(false); }
        }}>{busy ? 'Exporting…' : '⭳ PNG'}</button>

        <input ref={fileRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => void onFiles(e.target.files)} />
      </div>

      <div className="board-body">
        <div className="canvas-stack">
          <BoardCanvas />
          <Minimap />
        </div>
        <Inspector />
      </div>

      {els.length === 0 && (
        <div className="canvas-empty">
          Drop images anywhere, or use the toolbar.
          <br />
          <span className="muted small">
            Images become <b>visions</b> — the only elements you can attach goals to.
          </span>
        </div>
      )}
    </div>
  );
}
