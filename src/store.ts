import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { AppState, Board, BoardElement, MonthGoal, ShapeKind, Task, Tool, WeekGoal } from './types';
import { MAX_MITS, MAX_MONTH_GOALS, MAX_WEEK_GOALS, MAX_ZOOM, MIN_ZOOM, SPAWN_H, SPAWN_W, STARVE_AFTER_DAYS } from './types';
import { dayKey, monthKey, weekKey } from './dates';
import type { Lang } from './i18n';
import { loadState, saveState, putImage, deleteImage } from './storage';

const now = () => new Date().toISOString();

function seed(): AppState {
  const userId = nanoid();
  return {
    version: 2,
    user: { id: userId, handle: 'me', tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
    boards: [
      { id: nanoid(), userId, name: 'Main', visibility: 'private', isActive: true,
        bg: '#0d0f14', createdAt: now() },
    ],
    elements: [],
    monthGoals: [],
    weekGoals: [],
    tasks: [],
  };
}

/** v1 (visions[]) -> v2 (elements[]) */
function migrate(raw: any): AppState {
  if (!raw) return seed();
  if (raw.version >= 2 && raw.elements) return raw as AppState;
  const elements: BoardElement[] = (raw.visions ?? []).map((v: any) => ({
    id: v.id, boardId: v.boardId, kind: 'vision' as const,
    x: v.x ?? 40, y: v.y ?? 40, w: v.w ?? 220, h: v.h ?? 220,
    rotation: 0, z: v.z ?? 0, locked: false, opacity: 1,
    title: v.title, why: v.why, imageId: v.imageId, targetDate: v.targetDate,
    radius: 12, fit: 'cover' as const, createdAt: v.createdAt ?? now(),
  }));
  return {
    version: 2,
    user: raw.user,
    boards: (raw.boards ?? []).map((b: any) => ({ ...b, bg: b.bg ?? '#0d0f14' })),
    elements,
    monthGoals: raw.monthGoals ?? [],
    weekGoals: raw.weekGoals ?? [],
    tasks: raw.tasks ?? [],
  };
}

type Snapshot = Pick<AppState, 'boards' | 'elements' | 'monthGoals' | 'weekGoals' | 'tasks'>;

interface Store extends AppState {
  selection: string[];
  zoom: number;
  panX: number;
  panY: number;

  // ---- language ----
  lang: Lang;
  setLang: (l: Lang) => void;

  // ---- shape drawing ----
  tool: Tool;
  shapeColor: string;
  setTool: (t: Tool) => void;
  setShapeColor: (c: string) => void;
  past: Snapshot[];
  future: Snapshot[];

  // history
  commit: () => void;
  undo: () => void;
  redo: () => void;

  // selection
  select: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  panBy: (dx: number, dy: number) => void;
  /** Zoom toward a viewport point so the world point under the cursor stays put. */
  zoomAt: (factor: number, vx: number, vy: number) => void;

  // boards
  addBoard: (name: string) => string;
  setActiveBoard: (id: string) => void;
  deleteBoard: (id: string) => void;
  setBoardBg: (color: string) => void;
  activeBoard: () => Board | undefined;
  boardElements: () => BoardElement[];

  // elements
  addVision: (file: File | null, title: string) => Promise<void>;
  addText: (preset?: 'heading' | 'body' | 'quote') => void;
  /** Create a shape from a dragged-out box (world coords). */
  drawShape: (shape: ShapeKind, box: { x: number; y: number; w: number; h: number }) => void;
  updateEl: (id: string, patch: Partial<BoardElement>, history?: boolean) => void;
  updateMany: (patches: Record<string, Partial<BoardElement>>, history?: boolean) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  align: (mode: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') => void;

  // goals
  addMonthGoal: (visionId: string, title: string) => string | null;
  addWeekGoal: (monthGoalId: string, title: string) => string | null;
  addTask: (weekGoalId: string, title: string, date?: string) => string | null;
  toggleTask: (id: string) => void;
  toggleMit: (id: string) => void;
  deleteMonthGoal: (id: string) => void;
  deleteWeekGoal: (id: string) => void;
  deleteTask: (id: string) => void;

  // derived
  visions: () => BoardElement[];
  currentMonthGoals: () => MonthGoal[];
  currentWeekGoals: () => WeekGoal[];
  todayTasks: () => Task[];
  visionForTask: (t: Task) => BoardElement | undefined;
  visionProgress: (visionId: string) => { done: number; total: number };
  /** Days since the last completed task for this vision; null if nothing done yet. */
  visionIdleDays: (visionId: string) => number | null;
  /** 0..1 — how starved this vision looks. 1 = fully faded. */
  visionStarvation: (visionId: string) => number;
}

const snap = (s: AppState): Snapshot => ({
  boards: s.boards, elements: s.elements, monthGoals: s.monthGoals,
  weekGoals: s.weekGoals, tasks: s.tasks,
});

export const useStore = create<Store>((set, get) => {
  const initial = migrate(loadState());

  const persist = () => {
    const s = get();
    saveState({
      version: 2, user: s.user, boards: s.boards, elements: s.elements,
      monthGoals: s.monthGoals, weekGoals: s.weekGoals, tasks: s.tasks,
    });
  };

  /** push current state onto undo stack before a mutation */
  const push = () => {
    const s = get();
    set({ past: [...s.past.slice(-49), snap(s)], future: [] });
  };

  const nextZ = () => {
    const els = get().boardElements();
    return els.length ? Math.max(...els.map((e) => e.z)) + 1 : 0;
  };

  /** Place new elements in the first free slot — unbounded, spirals outward if needed. */
  const freeSpot = (w: number, h: number) => {
    const els = get().boardElements();
    const pad = 16;
    const stepX = w + pad;
    const stepY = h + pad;
    const cols = Math.max(1, Math.floor(SPAWN_W / stepX));
    for (let i = 0; i < 500; i++) {
      const x = 80 + (i % cols) * stepX;
      const y = 420 + Math.floor(i / cols) * stepY;
      const clash = els.some(
        (e) => x < e.x + e.w + pad && x + w + pad > e.x && y < e.y + e.h + pad && y + h + pad > e.y,
      );
      if (!clash) return { x, y };
    }
    return { x: 80, y: 420 + SPAWN_H };
  };

  const baseEl = (kind: BoardElement['kind']): BoardElement => ({
    id: nanoid(),
    boardId: get().activeBoard()!.id,
    kind,
    x: 120, y: 120, w: 240, h: 240,
    rotation: 0, z: nextZ(), locked: false, opacity: 1,
    createdAt: now(),
  });

  return {
    ...initial,
    selection: [],
    zoom: 1,
    panX: 0,
    panY: 0,
    lang: (localStorage.getItem('vg:lang') as Lang) || 'en',
    tool: 'select',
    shapeColor: '#f0b429',
    past: [],
    future: [],

    commit: () => push(),

    undo: () => {
      const s = get();
      if (!s.past.length) return;
      const prev = s.past[s.past.length - 1];
      set({
        ...prev,
        past: s.past.slice(0, -1),
        future: [snap(s), ...s.future.slice(0, 49)],
        selection: [],
      });
      persist();
    },

    redo: () => {
      const s = get();
      if (!s.future.length) return;
      const nxt = s.future[0];
      set({
        ...nxt,
        past: [...s.past, snap(s)],
        future: s.future.slice(1),
        selection: [],
      });
      persist();
    },

    select: (ids) => set({ selection: ids }),
    toggleSelect: (id) => {
      const sel = get().selection;
      set({ selection: sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id] });
    },
    clearSelection: () => set({ selection: [] }),
    setTool: (t) => set({ tool: t, selection: t === 'select' ? get().selection : [] }),
    setLang: (l) => {
      localStorage.setItem('vg:lang', l);
      document.documentElement.lang = l;
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
      set({ lang: l });
    },
    setShapeColor: (c) => set({ shapeColor: c }),

    setZoom: (z) => set({ zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)) }),
    setPan: (x, y) => set({ panX: x, panY: y }),
    panBy: (dx, dy) => set((s) => ({ panX: s.panX + dx, panY: s.panY + dy })),
    zoomAt: (factor, vx, vy) => {
      const s = get();
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s.zoom * factor));
      if (next === s.zoom) return;
      // world point under the cursor must stay under the cursor
      const wx = (vx - s.panX) / s.zoom;
      const wy = (vy - s.panY) / s.zoom;
      set({ zoom: next, panX: vx - wx * next, panY: vy - wy * next });
    },

    // ---------- boards ----------
    addBoard: (name) => {
      push();
      const id = nanoid();
      set((s) => ({
        // switch to the new board immediately — creating something and seeing
        // no change reads as "the button is broken"
        boards: [
          ...s.boards.map((b) => ({ ...b, isActive: false })),
          { id, userId: s.user.id, name, visibility: 'private',
            isActive: true, bg: '#0d0f14', createdAt: now() },
        ],
        selection: [],
        panX: 0, panY: 0, zoom: 1,
      }));
      persist();
      return id;
    },
    setActiveBoard: (id) => {
      set((s) => ({ boards: s.boards.map((b) => ({ ...b, isActive: b.id === id })), selection: [] }));
      persist();
    },
    deleteBoard: (id) => {
      const s = get();
      if (s.boards.length <= 1) return;
      push();
      const elIds = s.elements.filter((e) => e.boardId === id).map((e) => e.id);
      const mgIds = s.monthGoals.filter((g) => elIds.includes(g.visionId)).map((g) => g.id);
      const wgIds = s.weekGoals.filter((w) => mgIds.includes(w.monthGoalId)).map((w) => w.id);
      const wasActive = s.boards.find((b) => b.id === id)?.isActive;
      const remaining = s.boards.filter((b) => b.id !== id).map((b, i) =>
        wasActive && i === 0 ? { ...b, isActive: true } : b);
      set({
        boards: remaining,
        elements: s.elements.filter((e) => e.boardId !== id),
        monthGoals: s.monthGoals.filter((g) => !mgIds.includes(g.id)),
        weekGoals: s.weekGoals.filter((w) => !wgIds.includes(w.id)),
        tasks: s.tasks.filter((t) => !wgIds.includes(t.weekGoalId)),
        selection: [],
      });
      persist();
    },
    setBoardBg: (color) => {
      push();
      set((s) => ({ boards: s.boards.map((b) => (b.isActive ? { ...b, bg: color } : b)) }));
      persist();
    },
    activeBoard: () => get().boards.find((b) => b.isActive),
    boardElements: () => {
      const b = get().boards.find((x) => x.isActive);
      return b ? get().elements.filter((e) => e.boardId === b.id).sort((a, c) => a.z - c.z) : [];
    },

    // ---------- elements ----------
    addVision: async (file, title) => {
      if (!get().activeBoard()) return;
      let imageId: string | null = null;
      if (file) {
        imageId = nanoid();
        await putImage(imageId, file);
      }
      push();
      const n = get().boardElements().filter((e) => e.kind === 'vision').length;
      const el: BoardElement = {
        ...baseEl('vision'),
        x: 80 + (n % 3) * 270, y: 80 + Math.floor(n / 3) * 270,
        w: 250, h: 250,
        title: title || 'Untitled vision', why: '', imageId, targetDate: null,
        radius: 14, fit: 'cover',
      };
      set((s) => ({ elements: [...s.elements, el], selection: [el.id] }));
      persist();
    },

    addText: (preset = 'body') => {
      if (!get().activeBoard()) return;
      push();
      const cfg = {
        heading: { text: 'Your headline', fontSize: 54, fontWeight: 800, h: 80, w: 460 },
        body:    { text: 'Add your text', fontSize: 22, fontWeight: 400, h: 44, w: 300 },
        quote:   { text: '"The obstacle is the way."', fontSize: 30, fontWeight: 500, h: 60, w: 420 },
      }[preset];
      const spot = freeSpot(cfg.w, cfg.h);
      const el: BoardElement = {
        ...baseEl('text'),
        x: spot.x, y: spot.y, w: cfg.w, h: cfg.h,
        text: cfg.text, fontSize: cfg.fontSize, fontWeight: cfg.fontWeight,
        color: '#e6e9ef', align: 'left', italic: preset === 'quote',
      };
      set((s) => ({ elements: [...s.elements, el], selection: [el.id] }));
      persist();
    },

    drawShape: (shape, box) => {
      if (!get().activeBoard()) return;
      const s = get();
      push();
      const el: BoardElement = {
        ...baseEl('shape'),
        x: Math.round(box.x), y: Math.round(box.y),
        w: Math.max(8, Math.round(box.w)), h: Math.max(8, Math.round(box.h)),
        shape,
        fill: s.shapeColor,
        stroke: s.shapeColor,
        strokeWidth: 0,
        radius: 10,
      };
      set((st) => ({ elements: [...st.elements, el], selection: [el.id], tool: 'select' }));
      persist();
    },

    updateEl: (id, patch, history = true) => {
      if (history) push();
      set((s) => ({ elements: s.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
      persist();
    },

    updateMany: (patches, history = true) => {
      if (history) push();
      set((s) => ({
        elements: s.elements.map((e) => (patches[e.id] ? { ...e, ...patches[e.id] } : e)),
      }));
      persist();
    },

    deleteSelected: () => {
      const s = get();
      const ids = s.selection.filter((id) => !s.elements.find((e) => e.id === id)?.locked);
      if (!ids.length) return;
      push();
      ids.forEach((id) => {
        const el = s.elements.find((e) => e.id === id);
        if (el?.kind === 'vision' && el.imageId) void deleteImage(el.imageId);
      });
      const mgIds = s.monthGoals.filter((g) => ids.includes(g.visionId)).map((g) => g.id);
      const wgIds = s.weekGoals.filter((w) => mgIds.includes(w.monthGoalId)).map((w) => w.id);
      set({
        elements: s.elements.filter((e) => !ids.includes(e.id)),
        monthGoals: s.monthGoals.filter((g) => !mgIds.includes(g.id)),
        weekGoals: s.weekGoals.filter((w) => !wgIds.includes(w.id)),
        tasks: s.tasks.filter((t) => !wgIds.includes(t.weekGoalId)),
        selection: [],
      });
      persist();
    },

    duplicateSelected: () => {
      const s = get();
      if (!s.selection.length) return;
      push();
      const copies = s.elements
        .filter((e) => s.selection.includes(e.id))
        .map((e, i) => ({ ...e, id: nanoid(), x: e.x + 24, y: e.y + 24, z: nextZ() + i, createdAt: now() }));
      set({ elements: [...s.elements, ...copies], selection: copies.map((c) => c.id) });
      persist();
    },

    bringForward: (id) => {
      const els = get().boardElements();
      const i = els.findIndex((e) => e.id === id);
      if (i < 0 || i === els.length - 1) return;
      push();
      const a = els[i], b = els[i + 1];
      set((s) => ({ elements: s.elements.map((e) =>
        e.id === a.id ? { ...e, z: b.z } : e.id === b.id ? { ...e, z: a.z } : e) }));
      persist();
    },
    sendBackward: (id) => {
      const els = get().boardElements();
      const i = els.findIndex((e) => e.id === id);
      if (i <= 0) return;
      push();
      const a = els[i], b = els[i - 1];
      set((s) => ({ elements: s.elements.map((e) =>
        e.id === a.id ? { ...e, z: b.z } : e.id === b.id ? { ...e, z: a.z } : e) }));
      persist();
    },
    bringToFront: (id) => { push(); get().updateEl(id, { z: nextZ() }, false); },
    sendToBack: (id) => {
      const els = get().boardElements();
      const minZ = els.length ? Math.min(...els.map((e) => e.z)) : 0;
      push();
      get().updateEl(id, { z: minZ - 1 }, false);
    },

    align: (mode) => {
      const s = get();
      const els = s.elements.filter((e) => s.selection.includes(e.id));
      if (els.length < 2) return;
      push();
      const minX = Math.min(...els.map((e) => e.x));
      const maxX = Math.max(...els.map((e) => e.x + e.w));
      const minY = Math.min(...els.map((e) => e.y));
      const maxY = Math.max(...els.map((e) => e.y + e.h));
      const patches: Record<string, Partial<BoardElement>> = {};
      els.forEach((e) => {
        if (mode === 'left') patches[e.id] = { x: minX };
        if (mode === 'right') patches[e.id] = { x: maxX - e.w };
        if (mode === 'hcenter') patches[e.id] = { x: (minX + maxX) / 2 - e.w / 2 };
        if (mode === 'top') patches[e.id] = { y: minY };
        if (mode === 'bottom') patches[e.id] = { y: maxY - e.h };
        if (mode === 'vcenter') patches[e.id] = { y: (minY + maxY) / 2 - e.h / 2 };
      });
      get().updateMany(patches, false);
    },

    // ---------- goals (chain rules unchanged) ----------
    addMonthGoal: (visionId, title) => {
      if (!visionId || !title.trim()) return null;
      if (get().currentMonthGoals().length >= MAX_MONTH_GOALS) return null;
      push();
      const g: MonthGoal = { id: nanoid(), visionId, title: title.trim(),
        monthKey: monthKey(), status: 'active', createdAt: now() };
      set((s) => ({ monthGoals: [...s.monthGoals, g] }));
      persist();
      return g.id;
    },
    addWeekGoal: (monthGoalId, title) => {
      if (!monthGoalId || !title.trim()) return null;
      if (get().currentWeekGoals().length >= MAX_WEEK_GOALS) return null;
      push();
      const w: WeekGoal = { id: nanoid(), monthGoalId, title: title.trim(),
        weekKey: weekKey(), status: 'active', carryCount: 0, createdAt: now() };
      set((s) => ({ weekGoals: [...s.weekGoals, w] }));
      persist();
      return w.id;
    },
    addTask: (weekGoalId, title, date) => {
      if (!weekGoalId || !title.trim()) return null;
      push();
      const t: Task = { id: nanoid(), weekGoalId, title: title.trim(),
        date: date ?? dayKey(), isMit: false, done: false, minutesSpent: 0, createdAt: now() };
      set((s) => ({ tasks: [...s.tasks, t] }));
      persist();
      return t.id;
    },
    toggleTask: (id) => {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id
            ? { ...t, done: !t.done, completedAt: !t.done ? now() : null }
            : t),
      }));
      persist();
    },
    toggleMit: (id) => {
      const s = get();
      const t = s.tasks.find((x) => x.id === id);
      if (!t) return;
      if (!t.isMit && s.todayTasks().filter((x) => x.isMit).length >= MAX_MITS) return;
      set({ tasks: s.tasks.map((x) => (x.id === id ? { ...x, isMit: !x.isMit } : x)) });
      persist();
    },
    deleteMonthGoal: (id) => {
      const s = get();
      push();
      const wgIds = s.weekGoals.filter((w) => w.monthGoalId === id).map((w) => w.id);
      set({
        monthGoals: s.monthGoals.filter((g) => g.id !== id),
        weekGoals: s.weekGoals.filter((w) => w.monthGoalId !== id),
        tasks: s.tasks.filter((t) => !wgIds.includes(t.weekGoalId)),
      });
      persist();
    },
    deleteWeekGoal: (id) => {
      push();
      set((s) => ({
        weekGoals: s.weekGoals.filter((w) => w.id !== id),
        tasks: s.tasks.filter((t) => t.weekGoalId !== id),
      }));
      persist();
    },
    deleteTask: (id) => {
      push();
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      persist();
    },

    // ---------- derived ----------
    visions: () => get().boardElements().filter((e) => e.kind === 'vision'),
    currentMonthGoals: () => {
      const s = get();
      const ids = s.visions().map((v) => v.id);
      const mk = monthKey();
      return s.monthGoals.filter((g) => g.monthKey === mk && g.status === 'active' && ids.includes(g.visionId));
    },
    currentWeekGoals: () => {
      const s = get();
      const mgIds = s.currentMonthGoals().map((g) => g.id);
      const wk = weekKey();
      return s.weekGoals.filter((w) => w.weekKey === wk && w.status === 'active' && mgIds.includes(w.monthGoalId));
    },
    todayTasks: () => {
      const s = get();
      const wgIds = s.currentWeekGoals().map((w) => w.id);
      const d = dayKey();
      return s.tasks.filter((t) => t.date === d && wgIds.includes(t.weekGoalId));
    },
    visionForTask: (t) => {
      const s = get();
      const wg = s.weekGoals.find((w) => w.id === t.weekGoalId);
      const mg = s.monthGoals.find((g) => g.id === wg?.monthGoalId);
      return s.elements.find((e) => e.id === mg?.visionId);
    },
    visionProgress: (visionId) => {
      const s = get();
      const mgIds = s.monthGoals.filter((g) => g.visionId === visionId).map((g) => g.id);
      const wgIds = s.weekGoals.filter((w) => mgIds.includes(w.monthGoalId)).map((w) => w.id);
      const tasks = s.tasks.filter((t) => wgIds.includes(t.weekGoalId));
      return { done: tasks.filter((t) => t.done).length, total: tasks.length };
    },

    visionIdleDays: (visionId) => {
      const s = get();
      const mgIds = s.monthGoals.filter((g) => g.visionId === visionId).map((g) => g.id);
      const wgIds = s.weekGoals.filter((w) => mgIds.includes(w.monthGoalId)).map((w) => w.id);
      const stamps = s.tasks
        .filter((t) => wgIds.includes(t.weekGoalId) && t.done && t.completedAt)
        .map((t) => new Date(t.completedAt as string).getTime());
      if (!stamps.length) return null;
      return Math.floor((Date.now() - Math.max(...stamps)) / 86400000);
    },

    visionStarvation: (visionId) => {
      const s = get();
      const idle = s.visionIdleDays(visionId);
      const el = s.elements.find((e) => e.id === visionId);
      // nothing finished yet: measure from when the vision was created, not epoch
      const days = idle ?? (el
        ? Math.floor((Date.now() - new Date(el.createdAt).getTime()) / 86400000)
        : 0);
      if (days <= 0) return 0;
      return Math.max(0, Math.min(1, days / STARVE_AFTER_DAYS));
    },
  };
});
