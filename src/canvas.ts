import type { BoardElement } from './types';
import { SNAP_TOLERANCE } from './types';

export interface Guide {
  axis: 'x' | 'y';
  pos: number;
}

/** Candidate snap lines — other elements only (canvas is infinite). */
export function snapLines(others: BoardElement[]) {
  const xs: number[] = [];
  const ys: number[] = [];
  others.forEach((o) => {
    xs.push(o.x, o.x + o.w / 2, o.x + o.w);
    ys.push(o.y, o.y + o.h / 2, o.y + o.h);
  });
  return { xs, ys };
}

/**
 * Snap a moving box to nearby lines.
 * Returns adjusted x/y plus the guides that matched (for rendering).
 */
export function snapBox(
  box: { x: number; y: number; w: number; h: number },
  others: BoardElement[],
  zoom = 1,
): { x: number; y: number; guides: Guide[] } {
  const tol = SNAP_TOLERANCE / zoom;
  const { xs, ys } = snapLines(others);

  let bestDx = Infinity;
  let snapX = box.x;
  for (const [edge, off] of [[box.x, 0], [box.x + box.w / 2, box.w / 2], [box.x + box.w, box.w]] as [number, number][]) {
    for (const line of xs) {
      const d = Math.abs(edge - line);
      if (d < tol && d < Math.abs(bestDx)) {
        bestDx = d;
        snapX = line - off;
      }
    }
  }

  let bestDy = Infinity;
  let snapY = box.y;
  for (const [edge, off] of [[box.y, 0], [box.y + box.h / 2, box.h / 2], [box.y + box.h, box.h]] as [number, number][]) {
    for (const line of ys) {
      const d = Math.abs(edge - line);
      if (d < tol && d < Math.abs(bestDy)) {
        bestDy = d;
        snapY = line - off;
      }
    }
  }

  const guides: Guide[] = [];
  if (bestDx !== Infinity) {
    const hit = [snapX, snapX + box.w / 2, snapX + box.w]
      .find((v) => xs.some((l) => Math.abs(v - l) < 0.5));
    if (hit !== undefined) guides.push({ axis: 'x', pos: hit });
  }
  if (bestDy !== Infinity) {
    const hit = [snapY, snapY + box.h / 2, snapY + box.h]
      .find((v) => ys.some((l) => Math.abs(v - l) < 0.5));
    if (hit !== undefined) guides.push({ axis: 'y', pos: hit });
  }

  return { x: snapX, y: snapY, guides };
}

/** Bounding box of a set of elements. */
export function bounds(els: BoardElement[]) {
  if (!els.length) return null;
  const x = Math.min(...els.map((e) => e.x));
  const y = Math.min(...els.map((e) => e.y));
  const r = Math.max(...els.map((e) => e.x + e.w));
  const b = Math.max(...els.map((e) => e.y + e.h));
  return { x, y, w: r - x, h: b - y };
}

export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const HANDLES: { id: HandleId; cx: number; cy: number; cursor: string }[] = [
  { id: 'nw', cx: 0,   cy: 0,   cursor: 'nwse-resize' },
  { id: 'n',  cx: 0.5, cy: 0,   cursor: 'ns-resize' },
  { id: 'ne', cx: 1,   cy: 0,   cursor: 'nesw-resize' },
  { id: 'e',  cx: 1,   cy: 0.5, cursor: 'ew-resize' },
  { id: 'se', cx: 1,   cy: 1,   cursor: 'nwse-resize' },
  { id: 's',  cx: 0.5, cy: 1,   cursor: 'ns-resize' },
  { id: 'sw', cx: 0,   cy: 1,   cursor: 'nesw-resize' },
  { id: 'w',  cx: 0,   cy: 0.5, cursor: 'ew-resize' },
];

/** Apply a resize from a handle drag. */
export function resizeBox(
  start: { x: number; y: number; w: number; h: number },
  handle: HandleId,
  dx: number,
  dy: number,
  keepRatio: boolean,
) {
  let { x, y, w, h } = start;
  const ratio = start.w / start.h;

  if (handle.includes('e')) w = start.w + dx;
  if (handle.includes('w')) { w = start.w - dx; x = start.x + dx; }
  if (handle.includes('s')) h = start.h + dy;
  if (handle.includes('n')) { h = start.h - dy; y = start.y + dy; }

  if (keepRatio && handle.length === 2) {
    if (Math.abs(dx) > Math.abs(dy)) h = w / ratio;
    else w = h * ratio;
    if (handle.includes('n')) y = start.y + (start.h - h);
    if (handle.includes('w')) x = start.x + (start.w - w);
  }

  const MIN = 24;
  if (w < MIN) { w = MIN; if (handle.includes('w')) x = start.x + start.w - MIN; }
  if (h < MIN) { h = MIN; if (handle.includes('n')) y = start.y + start.h - MIN; }

  return { x, y, w, h };
}
