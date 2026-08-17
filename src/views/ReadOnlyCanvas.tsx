import { useEffect, useRef, useState } from 'react';
import type { BoardElement } from '../types';
import { FONTS, isRtlText } from '../types';
import { useT } from '../useT';

/**
 * A friend's canvas, rendered read-only.
 *
 * Deliberately a separate component from BoardCanvas: that one reads the whole
 * global store (selection, tools, undo) and mutates it on pointer events.
 * Reusing it would mean either editing someone else's board or gutting it with
 * flags. This renders the same visual result from a plain array — real
 * coordinates, rotation, opacity, z-order, pan and zoom — with no mutation
 * paths at all.
 */

function Ring({ pct, size = 40 }: { pct: number; size?: number }) {
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg className="vg-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="3.5" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2} y={size / 2} textAnchor="middle"
        dominantBaseline="central" dy="0.02em"
        fill="#fff" fontSize={size * 0.3} fontWeight="700"
      >
        {Math.round(pct)}
        <tspan fontSize={size * 0.19} dx="0.5">%</tspan>
      </text>
    </svg>
  );
}

export interface ReadOnlyStats {
  /** vision element id -> { done, total } from the friend's own task chain */
  progress: Record<string, { done: number; total: number }>;
  /** vision element id -> 0..1 starvation */
  starve: Record<string, number>;
}

export default function ReadOnlyCanvas({
  elements,
  bg,
  imageUrls,
  stats,
  onVisionClick,
}: {
  elements: BoardElement[];
  bg: string;
  imageUrls: Record<string, string>;
  stats: ReadOnlyStats;
  /** Drill into a vision's goal chain. Clicking is navigation, not editing. */
  onVisionClick?: (id: string) => void;
}) {
  const t = useT();
  const vpRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const movedRef = useRef(false);

  // fit all content on first paint — a friend's board can be anywhere in space
  useEffect(() => {
    const vp = vpRef.current;
    if (!vp || !elements.length) return;
    const xs = elements.map((e) => e.x);
    const ys = elements.map((e) => e.y);
    const xe = elements.map((e) => e.x + e.w);
    const ye = elements.map((e) => e.y + e.h);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const maxX = Math.max(...xe), maxY = Math.max(...ye);
    const pad = 60;
    const cw = vp.clientWidth, ch = vp.clientHeight;
    const z = Math.min(
      Math.min(cw / (maxX - minX + pad * 2), ch / (maxY - minY + pad * 2)),
      1,
    );
    const zz = Math.max(0.1, z);
    setZoom(zz);
    setPan({
      x: (cw - (maxX - minX) * zz) / 2 - minX * zz,
      y: (ch - (maxY - minY) * zz) / 2 - minY * zz,
    });
  }, [elements]);

  // wheel: pan, ctrl+wheel: zoom at cursor
  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      if (ev.ctrlKey || ev.metaKey) {
        const rect = vp.getBoundingClientRect();
        const cx = ev.clientX - rect.left;
        const cy = ev.clientY - rect.top;
        const next = Math.max(0.1, Math.min(4, zoom * (ev.deltaY < 0 ? 1.1 : 1 / 1.1)));
        // keep the point under the cursor fixed
        setPan((p) => ({
          x: cx - ((cx - p.x) / zoom) * next,
          y: cy - ((cy - p.y) / zoom) * next,
        }));
        setZoom(next);
      } else {
        setPan((p) => ({ x: p.x - ev.deltaX, y: p.y - ev.deltaY }));
      }
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, [zoom]);

  useEffect(() => {
    if (!drag) return;
    const move = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - drag.sx) > 3 || Math.abs(ev.clientY - drag.sy) > 3) {
        movedRef.current = true;
      }
      setPan({ x: drag.px + (ev.clientX - drag.sx), y: drag.py + (ev.clientY - drag.sy) });
    };
    const up = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [drag]);

  const sorted = [...elements].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

  // dot grid contrast, same luminance rule as the editor
  const hex = (bg || '#0d0f14').replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) || 13;
  const g = parseInt(hex.slice(2, 4), 16) || 15;
  const b = parseInt(hex.slice(4, 6), 16) || 20;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const dot = lum > 140 ? 'rgba(0,0,0,.20)' : 'rgba(255,255,255,.11)';

  return (
    <div className="ro-wrap">
      <div
        ref={vpRef}
        className={`canvas-viewport ro${drag ? ' panning' : ''}`}
        style={{
          backgroundColor: bg || '#0d0f14',
          backgroundImage: `radial-gradient(${dot} 1px, transparent 1px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        onPointerDown={(ev) => {
          if (ev.button !== 0 && ev.button !== 1) return;
          movedRef.current = false;
          setDrag({ sx: ev.clientX, sy: ev.clientY, px: pan.x, py: pan.y });
        }}
      >
        <div
          className="world"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
        >
          {sorted.map((e) => {
            const prog = stats.progress[e.id];
            const pct = prog?.total ? Math.round((prog.done / prog.total) * 100) : 0;
            const st = stats.starve[e.id] ?? 0;
            return (
              <div
                key={e.id}
                className={`el ro-el${e.kind === 'vision' && onVisionClick ? ' clickable' : ''}`}
                onClick={() => {
                  // a pan gesture must not count as a click
                  if (movedRef.current) return;
                  if (e.kind === 'vision') onVisionClick?.(e.id);
                }}
                style={{
                  left: e.x, top: e.y, width: e.w, height: e.h,
                  opacity: e.opacity ?? 1,
                  transform: e.rotation ? `rotate(${e.rotation}deg)` : undefined,
                  zIndex: e.z ?? 0,
                }}
              >
                {e.kind === 'vision' && (
                  <div className="el-vision" style={{ borderRadius: e.radius ?? 12 }}>
                    {imageUrls[e.id] ? (
                      <img
                        src={imageUrls[e.id]} alt="" draggable={false}
                        style={{
                          objectFit: e.fit ?? 'cover',
                          filter: `grayscale(${Math.round(st * 100)}%) brightness(${1 - st * 0.45})`,
                        }}
                      />
                    ) : (
                      <div className="el-noimg">🎯</div>
                    )}
                    {prog && prog.total > 0 && <div className="el-ring"><Ring pct={pct} /></div>}
                    {st >= 1 && <div className="starved-badge">{t('starving')}</div>}
                    <div className="el-cap">
                      <span className="el-cap-title">{e.title}</span>
                      <span className="el-cap-meta">
                        {prog && prog.total > 0 ? `${prog.done}/${prog.total}` : ''}
                      </span>
                    </div>
                  </div>
                )}

                {e.kind === 'text' && (
                  <div
                    className="el-text"
                    dir={e.dir && e.dir !== 'auto' ? e.dir : (isRtlText(e.text ?? '') ? 'rtl' : 'ltr')}
                    style={{
                      fontSize: e.fontSize, fontWeight: e.fontWeight, color: e.color,
                      textAlign: e.align === 'left' ? 'start' : e.align === 'right' ? 'end' : e.align,
                      fontStyle: e.italic ? 'italic' : 'normal',
                      fontFamily: FONTS.find((f) => f.id === (e.fontFamily ?? 'sans'))?.css,
                    }}
                  >
                    {e.text}
                  </div>
                )}

                {e.kind === 'shape' && (
                  e.shape === 'ellipse' ? (
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      background: e.fill,
                      border: e.strokeWidth ? `${e.strokeWidth}px solid ${e.stroke}` : undefined,
                    }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', borderRadius: e.radius ?? 10,
                      background: e.fill,
                      border: e.strokeWidth ? `${e.strokeWidth}px solid ${e.stroke}` : undefined,
                    }} />
                  )
                )}
              </div>
            );
          })}
        </div>

        <div className="ro-badge">🔒 {t('readOnlyBoard')}</div>
      </div>

      <div className="zoomer ro-zoom">
        <button onClick={() => setZoom((z) => Math.max(0.1, z / 1.2))}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(4, z * 1.2))}>+</button>
      </div>
    </div>
  );
}
