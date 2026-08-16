import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { bounds } from '../canvas';
import { useImage } from '../hooks/useImage';
import type { BoardElement } from '../types';

/** One dot on the minimap. Visions show their real thumbnail. */
function MiniEl({
  el, sel, left, top, width, height,
}: {
  el: BoardElement; sel: boolean;
  left: number; top: number; width: number; height: number;
}) {
  const url = useImage(el.kind === 'vision' ? el.imageId : null);
  const style: React.CSSProperties = { left, top, width, height };
  if (el.rotation) style.transform = `rotate(${el.rotation}deg)`;
  if (url) {
    style.backgroundImage = `url(${url})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  } else if (el.kind === 'shape' && el.fill) {
    style.backgroundColor = el.fill;
  }
  return <div className={`mm-el mm-${el.kind}${sel ? ' sel' : ''}`} style={style} />;
}

const MAP_W = 208;
const MAP_H = 132;
const PAD = 12;

/**
 * Minimap: shows every element plus the current viewport rectangle.
 * Click to centre there; drag the viewport box to pan.
 */
export default function Minimap() {
  const els = useStore((s) => s.boardElements)();
  const selection = useStore((s) => s.selection);
  const zoom = useStore((s) => s.zoom);
  const panX = useStore((s) => s.panX);
  const panY = useStore((s) => s.panY);
  const setPan = useStore((s) => s.setPan);
  const board = useStore((s) => s.activeBoard)();

  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

  // track viewport size
  useEffect(() => {
    const read = () => {
      const el = document.querySelector('.canvas-viewport') as HTMLElement | null;
      if (el) setVp({ w: el.clientWidth, h: el.clientHeight });
    };
    read();
    window.addEventListener('resize', read);
    const t = setInterval(read, 500); // catches inspector open/close
    return () => { window.removeEventListener('resize', read); clearInterval(t); };
  }, []);

  // world rect currently visible
  const view = {
    x: -panX / zoom,
    y: -panY / zoom,
    w: vp.w / zoom,
    h: vp.h / zoom,
  };

  // union of content + viewport so the box never leaves the map
  const content = bounds(els);
  const world = (() => {
    if (!content) return view.w ? view : { x: 0, y: 0, w: 1000, h: 700 };
    const x = Math.min(content.x, view.x);
    const y = Math.min(content.y, view.y);
    const r = Math.max(content.x + content.w, view.x + view.w);
    const b = Math.max(content.y + content.h, view.y + view.h);
    return { x, y, w: Math.max(r - x, 1), h: Math.max(b - y, 1) };
  })();

  const scale = Math.min((MAP_W - PAD * 2) / world.w, (MAP_H - PAD * 2) / world.h);
  const offX = (MAP_W - world.w * scale) / 2 - world.x * scale;
  const offY = (MAP_H - world.h * scale) / 2 - world.y * scale;

  const toMap = (wx: number, wy: number) => ({ x: wx * scale + offX, y: wy * scale + offY });

  /** centre the real viewport on a world point */
  const centreOn = (wx: number, wy: number) => {
    setPan(vp.w / 2 - wx * zoom, vp.h / 2 - wy * zoom);
  };

  const fromEvent = (clientX: number, clientY: number) => {
    const r = mapRef.current!.getBoundingClientRect();
    return {
      x: (clientX - r.left - offX) / scale,
      y: (clientY - r.top - offY) / scale,
    };
  };

  const onDown = (ev: React.PointerEvent) => {
    ev.stopPropagation();
    setDragging(true);
    const p = fromEvent(ev.clientX, ev.clientY);
    centreOn(p.x, p.y);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (ev: PointerEvent) => {
      const p = fromEvent(ev.clientX, ev.clientY);
      centreOn(p.x, p.y);
    };
    const up = () => setDragging(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [dragging, scale, offX, offY, zoom, vp.w, vp.h]);

  if (!els.length) return null;

  if (!open) {
    return (
      <button className="minimap-toggle" onClick={() => setOpen(true)} title="Show minimap">
        🗺
      </button>
    );
  }

  const vBox = toMap(view.x, view.y);

  return (
    <div
      ref={mapRef}
      className={`minimap${dragging ? ' dragging' : ''}`}
      style={{ width: MAP_W, height: MAP_H, background: board?.bg ?? '#0d0f14' }}
      onPointerDown={onDown}
      title="Click or drag to navigate"
    >
      <button
        className="mm-close"
        title="Hide minimap"
        onPointerDown={(e) => { e.stopPropagation(); }}
        onClick={(e) => { e.stopPropagation(); setOpen(false); }}
      >
        ×
      </button>
      {els.map((e) => {
        const p = toMap(e.x, e.y);
        const sel = selection.includes(e.id);
        return (
          <MiniEl
            key={e.id}
            el={e}
            sel={sel}
            left={p.x}
            top={p.y}
            width={Math.max(2, e.w * scale)}
            height={Math.max(2, e.h * scale)}
          />
        );
      })}

      {/* current viewport */}
      <div
        className="mm-view"
        style={{
          left: vBox.x,
          top: vBox.y,
          width: Math.max(6, view.w * scale),
          height: Math.max(6, view.h * scale),
        }}
      />
    </div>
  );
}
