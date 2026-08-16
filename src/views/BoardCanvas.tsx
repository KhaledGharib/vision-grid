import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import type { BoardElement } from '../types';
import { RING_TARGET_HOURS } from '../types';
import { useImage } from '../hooks/useImage';
import { bounds, HANDLES, resizeBox, snapBox, type Guide, type HandleId } from '../canvas';
import { daysUntil } from '../dates';

/* ---------------- element renderers ---------------- */

/** Circular progress ring driven by hours actually invested. */
function Ring({ pct, size = 40 }: { pct: number; size?: number }) {
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2} y={size / 2} textAnchor="middle"
        dominantBaseline="central" dy="0.02em"
        fill="#fff" fontSize={size * 0.32} fontWeight="700"
      >
        {Math.round(pct)}
      </text>
    </svg>
  );
}

function VisionEl({ e }: { e: BoardElement }) {
  const url = useImage(e.imageId);
  const minutes = useStore((s) => s.visionMinutes)(e.id);
  const starve = useStore((s) => s.visionStarvation)(e.id);
  const idle = useStore((s) => s.visionIdleDays)(e.id);
  const days = daysUntil(e.targetDate ?? null);

  const hours = minutes / 60;
  const ringPct = Math.min(100, (hours / RING_TARGET_HOURS) * 100);
  // starving visions desaturate and dim — no nag, just an honest signal
  const gray = Math.round(starve * 100);
  const dim = 1 - starve * 0.45;

  return (
    <div className="el-vision" style={{ borderRadius: e.radius ?? 12 }}>
      {url ? (
        <img
          src={url} alt="" draggable={false}
          style={{ objectFit: e.fit ?? 'cover', filter: `grayscale(${gray}%) brightness(${dim})` }}
        />
      ) : (
        <div className="el-noimg">🎯</div>
      )}

      {minutes > 0 && <div className="el-ring"><Ring pct={ringPct} /></div>}

      {starve >= 1 && (
        <div className="starved-badge" title={idle === null
          ? 'Never fed — no focus time yet'
          : `${idle} days without attention`}>
          starving
        </div>
      )}

      <div className="el-cap">
        <span className="el-cap-title">{e.title}</span>
        <span className="el-cap-meta">
          {minutes > 0 ? (hours >= 1 ? `${hours.toFixed(1)}h` : `${minutes}m`) : ''}
          {days !== null && days >= 0 ? `${minutes > 0 ? ' · ' : ''}${days}d` : ''}
        </span>
      </div>
    </div>
  );
}

function TextEl({ e, editing, onCommit }: { e: BoardElement; editing: boolean; onCommit: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      const r = document.createRange();
      r.selectNodeContents(ref.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
    }
  }, [editing]);
  return (
    <div
      ref={ref}
      className="el-text"
      contentEditable={editing}
      suppressContentEditableWarning
      onBlur={(ev) => onCommit(ev.currentTarget.textContent ?? '')}
      style={{
        fontSize: e.fontSize, fontWeight: e.fontWeight, color: e.color,
        textAlign: e.align, fontStyle: e.italic ? 'italic' : 'normal',
        cursor: editing ? 'text' : 'inherit',
      }}
    >
      {e.text}
    </div>
  );
}

function ShapeEl({ e }: { e: BoardElement }) {
  if (e.shape === 'ellipse')
    return <div style={{ width: '100%', height: '100%', borderRadius: '50%',
      background: e.fill, border: e.strokeWidth ? `${e.strokeWidth}px solid ${e.stroke}` : 'none' }} />;
  if (e.shape === 'line')
    return <div style={{ width: '100%', height: '100%', background: e.stroke }} />;
  return <div style={{ width: '100%', height: '100%', borderRadius: e.radius ?? 8,
    background: e.fill, border: e.strokeWidth ? `${e.strokeWidth}px solid ${e.stroke}` : 'none' }} />;
}

/* ---------------- main editor ---------------- */

type DragState =
  | { mode: 'move'; startX: number; startY: number; orig: Record<string, { x: number; y: number }> }
  | { mode: 'resize'; handle: HandleId; startX: number; startY: number; orig: BoardElement }
  | { mode: 'rotate'; cx: number; cy: number; startAngle: number; orig: number; id: string }
  | { mode: 'marquee'; startX: number; startY: number }
  | { mode: 'pan'; startVX: number; startVY: number; startPanX: number; startPanY: number }
  | null;

export default function BoardCanvas() {
  const els = useStore((s) => s.boardElements)();
  const board = useStore((s) => s.activeBoard)();
  const selection = useStore((s) => s.selection);
  const zoom = useStore((s) => s.zoom);
  const panX = useStore((s) => s.panX);
  const panY = useStore((s) => s.panY);
  const select = useStore((s) => s.select);
  const toggleSelect = useStore((s) => s.toggleSelect);
  const updateMany = useStore((s) => s.updateMany);
  const updateEl = useStore((s) => s.updateEl);
  const commit = useStore((s) => s.commit);
  const panBy = useStore((s) => s.panBy);
  const zoomAt = useStore((s) => s.zoomAt);

  const [drag, setDrag] = useState<DragState>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const vpRef = useRef<HTMLDivElement>(null);

  const selEls = els.filter((e) => selection.includes(e.id));
  const box = bounds(selEls);

  /** viewport px -> world coords */
  const toWorld = (clientX: number, clientY: number) => {
    const r = vpRef.current!.getBoundingClientRect();
    return {
      x: (clientX - r.left - panX) / zoom,
      y: (clientY - r.top - panY) / zoom,
    };
  };

  // space bar = pan mode
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(t.tagName) || t.isContentEditable) return;
      if (e.code === 'Space') { e.preventDefault(); setSpaceDown(true); }
    };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setSpaceDown(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // wheel: scroll to pan, ctrl/cmd+wheel to zoom at cursor
  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = vp.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - r.left, e.clientY - r.top);
      } else if (e.shiftKey) {
        panBy(-e.deltaY, 0);
      } else {
        panBy(-e.deltaX, -e.deltaY);
      }
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, [panBy, zoomAt]);

  const onElPointerDown = (ev: React.PointerEvent, el: BoardElement) => {
    if (editingText === el.id || spaceDown) return;
    ev.stopPropagation();
    if (el.locked) return;
    const additive = ev.shiftKey || ev.metaKey || ev.ctrlKey;
    let sel = selection;
    if (additive) {
      toggleSelect(el.id);
      sel = selection.includes(el.id) ? selection.filter((i) => i !== el.id) : [...selection, el.id];
    } else if (!selection.includes(el.id)) {
      select([el.id]);
      sel = [el.id];
    }
    const p = toWorld(ev.clientX, ev.clientY);
    const orig: Record<string, { x: number; y: number }> = {};
    els.filter((e) => sel.includes(e.id)).forEach((e) => { orig[e.id] = { x: e.x, y: e.y }; });
    commit();
    setDrag({ mode: 'move', startX: p.x, startY: p.y, orig });
  };

  const onHandleDown = (ev: React.PointerEvent, handle: HandleId) => {
    ev.stopPropagation();
    if (selEls.length !== 1) return;
    const p = toWorld(ev.clientX, ev.clientY);
    commit();
    setDrag({ mode: 'resize', handle, startX: p.x, startY: p.y, orig: { ...selEls[0] } });
  };

  const onRotateDown = (ev: React.PointerEvent) => {
    ev.stopPropagation();
    if (selEls.length !== 1) return;
    const e = selEls[0];
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const p = toWorld(ev.clientX, ev.clientY);
    const startAngle = Math.atan2(p.y - cy, p.x - cx) * (180 / Math.PI);
    commit();
    setDrag({ mode: 'rotate', cx, cy, startAngle, orig: e.rotation, id: e.id });
  };

  const onViewportDown = (ev: React.PointerEvent) => {
    // middle mouse or space+drag = pan
    if (ev.button === 1 || spaceDown) {
      ev.preventDefault();
      setDrag({ mode: 'pan', startVX: ev.clientX, startVY: ev.clientY, startPanX: panX, startPanY: panY });
      return;
    }
    if (ev.button !== 0) return;
    setEditingText(null);
    select([]);
    const p = toWorld(ev.clientX, ev.clientY);
    setDrag({ mode: 'marquee', startX: p.x, startY: p.y });
  };

  useEffect(() => {
    if (!drag) return;
    const move = (ev: PointerEvent) => {
      if (drag.mode === 'pan') {
        useStore.getState().setPan(
          drag.startPanX + (ev.clientX - drag.startVX),
          drag.startPanY + (ev.clientY - drag.startVY),
        );
        return;
      }

      const p = toWorld(ev.clientX, ev.clientY);

      if (drag.mode === 'move') {
        const dx = p.x - drag.startX;
        const dy = p.y - drag.startY;
        const patches: Record<string, Partial<BoardElement>> = {};
        const movingIds = Object.keys(drag.orig);
        const others = els.filter((e) => !movingIds.includes(e.id));

        if (movingIds.length === 1) {
          const id = movingIds[0];
          const el = els.find((e) => e.id === id)!;
          const raw = { x: drag.orig[id].x + dx, y: drag.orig[id].y + dy, w: el.w, h: el.h };
          const s = ev.altKey ? { x: raw.x, y: raw.y, guides: [] } : snapBox(raw, others, zoom);
          patches[id] = { x: Math.round(s.x), y: Math.round(s.y) };
          setGuides(s.guides);
        } else {
          movingIds.forEach((id) => {
            patches[id] = { x: Math.round(drag.orig[id].x + dx), y: Math.round(drag.orig[id].y + dy) };
          });
          setGuides([]);
        }
        updateMany(patches, false);
      }

      if (drag.mode === 'resize') {
        const dx = p.x - drag.startX;
        const dy = p.y - drag.startY;
        const r = resizeBox(drag.orig, drag.handle, dx, dy, ev.shiftKey);
        updateEl(drag.orig.id, {
          x: Math.round(r.x), y: Math.round(r.y),
          w: Math.round(r.w), h: Math.round(r.h),
        }, false);
      }

      if (drag.mode === 'rotate') {
        const a = Math.atan2(p.y - drag.cy, p.x - drag.cx) * (180 / Math.PI);
        let deg = drag.orig + (a - drag.startAngle);
        if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
        updateEl(drag.id, { rotation: Math.round(deg) }, false);
      }

      if (drag.mode === 'marquee') {
        const x = Math.min(drag.startX, p.x);
        const y = Math.min(drag.startY, p.y);
        const w = Math.abs(p.x - drag.startX);
        const h = Math.abs(p.y - drag.startY);
        setMarquee({ x, y, w, h });
        const hit = els.filter((e) =>
          e.x < x + w && e.x + e.w > x && e.y < y + h && e.y + e.h > y);
        select(hit.map((e) => e.id));
      }
    };

    const up = () => { setDrag(null); setGuides([]); setMarquee(null); };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [drag, els, zoom, panX, panY, updateMany, updateEl, select]);

  const panning = drag?.mode === 'pan';

  /** Dots must contrast with whatever background colour the user picked. */
  const dotColor = (() => {
    const hex = (board?.bg ?? '#0d0f14').replace('#', '');
    const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    const r = parseInt(full.slice(0, 2), 16) || 0;
    const g = parseInt(full.slice(2, 4), 16) || 0;
    const b = parseInt(full.slice(4, 6), 16) || 0;
    // perceived luminance (0 = black, 255 = white)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    return lum > 140 ? 'rgba(0,0,0,.20)' : 'rgba(255,255,255,.11)';
  })();

  return (
    <div
      ref={vpRef}
      className={`canvas-viewport${spaceDown || panning ? ' panning' : ''}`}
      onPointerDown={onViewportDown}
      style={{
        backgroundColor: board?.bg ?? '#0d0f14',
        backgroundImage: `radial-gradient(circle at 1px 1px, ${dotColor} 1px, transparent 0)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${panX}px ${panY}px`,
      }}
    >
      {/* world layer — translated & scaled, unbounded */}
      <div
        className="world"
        style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: '0 0' }}
      >
        {els.map((e) => {
          const isSel = selection.includes(e.id);
          return (
            <div
              key={e.id}
              className={`el${isSel ? ' sel' : ''}${e.locked ? ' locked' : ''}`}
              style={{
                left: e.x, top: e.y, width: e.w, height: e.h,
                zIndex: e.z, opacity: e.opacity,
                transform: `rotate(${e.rotation}deg)`,
              }}
              onPointerDown={(ev) => onElPointerDown(ev, e)}
              onDoubleClick={() => e.kind === 'text' && setEditingText(e.id)}
            >
              {e.kind === 'vision' && <VisionEl e={e} />}
              {e.kind === 'shape' && <ShapeEl e={e} />}
              {e.kind === 'text' && (
                <TextEl
                  e={e}
                  editing={editingText === e.id}
                  onCommit={(v) => { updateEl(e.id, { text: v }); setEditingText(null); }}
                />
              )}
            </div>
          );
        })}

        {/* selection frame */}
        {box && !drag && (
          <div className="sel-frame" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
            {selEls.length === 1 && !selEls[0].locked && (
              <>
                {HANDLES.map((h) => (
                  <div
                    key={h.id}
                    className="handle"
                    style={{
                      left: `${h.cx * 100}%`, top: `${h.cy * 100}%`, cursor: h.cursor,
                      width: 10 / zoom, height: 10 / zoom, borderWidth: 1.5 / zoom,
                    }}
                    onPointerDown={(ev) => onHandleDown(ev, h.id)}
                  />
                ))}
                <div
                  className="rot-handle"
                  style={{ width: 13 / zoom, height: 13 / zoom, top: -42 / zoom }}
                  onPointerDown={onRotateDown}
                  title="Rotate (Shift = 15°)"
                />
              </>
            )}
          </div>
        )}

        {/* smart guides */}
        {guides.map((g, i) =>
          g.axis === 'x' ? (
            <div key={i} className="guide guide-v" style={{ left: g.pos, width: 1 / zoom }} />
          ) : (
            <div key={i} className="guide guide-h" style={{ top: g.pos, height: 1 / zoom }} />
          ),
        )}

        {/* marquee */}
        {marquee && (
          <div className="marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />
        )}
      </div>
    </div>
  );
}
