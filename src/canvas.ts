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

/**
 * Axis-aligned box of ONE element as it actually appears: rotated, and grown by
 * the half of a stroke that straddles the edge.
 *
 * A rectangle rotated 45 degrees sticks out well past its own x/y/w/h, so using
 * the raw box to frame an export clipped the corners off anything turned.
 */
export function elementBox(e: BoardElement) {
  const grow = e.kind === 'shape' ? (e.strokeWidth ?? 0) / 2 : 0;
  const w = e.w + grow * 2;
  const h = e.h + grow * 2;
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  const rad = ((e.rotation ?? 0) * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  const hw = (w * c + h * s) / 2;
  const hh = (w * s + h * c) / 2;
  return { x: cx - hw, y: cy - hh, w: hw * 2, h: hh * 2 };
}

/**
 * Bounding box of what the eye sees. Use this for export and fit-to-screen.
 * The plain bounds() below is the untransformed box, which is what the
 * selection frame and the resize maths need.
 */
export function visualBounds(els: BoardElement[]) {
  if (!els.length) return null;
  const boxes = els.map(elementBox);
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.w));
  const bottom = Math.max(...boxes.map((b) => b.y + b.h));
  return { x, y, w: right - x, h: bottom - y };
}

/** Bounding box of a set of elements, ignoring rotation. */
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

/** Compass bearing of each handle, clockwise from the top. */
const HANDLE_BEARING: Record<HandleId, number> = {
  n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315,
};
const CURSOR_BY_BEARING = ['ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize'];

/**
 * The cursor a handle should show once the element is rotated.
 *
 * A handle on the "east" edge of an element turned 90 degrees is pointing north
 * on screen, so the fixed per-handle cursor pointed the wrong way as soon as
 * anything was rotated.
 */
export function handleCursor(handle: HandleId, rotation = 0): string {
  const bearing = ((HANDLE_BEARING[handle] + rotation) % 180 + 180) % 180;
  return CURSOR_BY_BEARING[Math.round(bearing / 45) % 4];
}

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

/**
 * Resize a ROTATED element from a handle drag, keeping the anchored edge put.
 *
 * Two corrections over resizeBox, both needed the moment rotation is non-zero:
 *
 *  1. The handles sit in the element's own turned frame, so the pointer delta
 *     has to be rotated into that frame before the box maths. Feeding raw world
 *     dx/dy to a 45-degree element made the east handle grow it diagonally.
 *
 *  2. Resizing moves the box centre, and the box spins about its centre, so
 *     moving the centre swings the anchored edge away by (I - R) * dCentre.
 *     Subtract exactly that, or the edge you are not dragging drifts across the
 *     canvas as you drag.
 *
 * With rotation 0 this reduces to resizeBox exactly.
 */
export function resizeRotated(
  start: { x: number; y: number; w: number; h: number },
  rotation: number,
  handle: HandleId,
  dx: number,
  dy: number,
  keepRatio: boolean,
) {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // pointer delta expressed in the element's own frame
  const box = resizeBox(start, handle, dx * cos + dy * sin, -dx * sin + dy * cos, keepRatio);

  const dcx = box.x + box.w / 2 - (start.x + start.w / 2);
  const dcy = box.y + box.h / 2 - (start.y + start.h / 2);
  // (R - I) * dCentre
  const ox = dcx * cos - dcy * sin - dcx;
  const oy = dcx * sin + dcy * cos - dcy;

  return { x: box.x + ox, y: box.y + oy, w: box.w, h: box.h };
}
