import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { AppState, Board, BoardElement, MonthGoal, ShapeKind, Task, Tool, WeekGoal } from './types';
import { MAX_MITS, MAX_MONTH_GOALS, MAX_WEEK_GOALS, MAX_ZOOM, MIN_ZOOM, POSTPONE_DROPPED, POSTPONE_LIMIT, SPAWN_H, SPAWN_W, STARVE_AFTER_DAYS } from './types';
import { dayKey, monthKey, weekKey } from './dates';
import type { Lang } from './i18n';
import { loadState, saveState, putImage, deleteImage, copyImage, prepareImage } from './storage';

const now = () => new Date().toISOString();

function seed(): AppState {
  const userId = nanoid();
  return {
    version: 3,
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
    version: 3,
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
  /** Overwrite everything (used when the cloud has newer state). */
  replaceState: (s: AppState) => void;
  /** Back to a fresh, empty board. Used on sign-out. */
  resetToSeed: () => void;
  addBoard: (name: string) => string;
  renameBoard: (id: string, name: string) => void;
  setActiveBoard: (id: string) => void;
  deleteBoard: (id: string) => void;
  setBoardBg: (color: string) => void;
  activeBoard: () => Board | undefined;
  boardElements: () => BoardElement[];

  // elements
  /** Rejects with 'not_an_image' or 'image_too_large' so the UI can say why. */
  addVision: (file: File | null, title: string) => Promise<void>;
  addText: (preset?: 'heading' | 'body' | 'quote') => void;
  /** Create a shape from a dragged-out box (world coords). */
  drawShape: (shape: ShapeKind, box: { x: number; y: number; w: number; h: number }) => void;
  updateEl: (id: string, patch: Partial<BoardElement>, history?: boolean) => void;
  updateMany: (patches: Record<string, Partial<BoardElement>>, history?: boolean) => void;
  /**
   * Mutation for a gesture in progress: no undo entry, and the write to disk is
   * coalesced. Pointermove fires at screen rate, and persisting the whole state
   * document per event pegs the main thread on JSON.stringify.
   */
  updateLive: (patches: Record<string, Partial<BoardElement>>) => void;
  /** Force any coalesced write out now (end of gesture, before unload). */
  flush: () => void;
  deleteSelected: () => void;
  duplicateSelected: () => Promise<void>;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  align: (mode: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') => void;

  // goals
  addMonthGoal: (visionId: string, title: string) => string | null;
  /** Mark a goal done so it leaves the active count and frees a slot. */
  completeMonthGoal: (id: string) => void;
  reopenMonthGoal: (id: string) => void;
  completeWeekGoal: (id: string) => void;
  reopenWeekGoal: (id: string) => void;
  /** Goals finished this month/week — shown separately, not counted in the cap. */
  doneMonthGoals: () => MonthGoal[];
  doneWeekGoals: () => WeekGoal[];
  /** True when every task under this goal is done (drives the "close it?" hint). */
  monthGoalAllDone: (id: string) => boolean;
  weekGoalAllDone: (id: string) => boolean;
  addWeekGoal: (monthGoalId: string, title: string) => string | null;
  addTask: (weekGoalId: string, title: string, date: string, isMit?: boolean) => string | null;
  /** Move unfinished tasks from past days onto today, counting the postponements. */
  rollForward: () => number;
  /** Tasks that have hit the postpone limit and need a decision. */
  stalledTasks: () => Task[];
  /** Stop rolling this one — it stays on its day and drops out of Today. */
  dropTask: (id: string) => void;
  /** Reset the counter: the user consciously recommitted to it. */
  recommitTask: (id: string) => void;
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

/**
 * Subscribe a component to the data the derived getters read.
 *
 * The getters on this store are plain functions hanging off an object that
 * `set` shallow-merges, so their identity never changes. That makes
 *
 *     const tasks = useStore((s) => s.todayTasks)();
 *
 * a subscription to the FUNCTION, not to the tasks behind it — zustand compares
 * the selector result, sees the same function, and skips the re-render. Every
 * component written that way only refreshed when some unrelated subscription
 * (local state, selection, zoom) happened to fire, so an edit made anywhere
 * else left it showing stale values: editing text on the canvas did not update
 * the inspector, and adding a goal only appeared to work because the form reset
 * its own local state at the same moment.
 *
 * Call this once in any component that reads derived state.
 */
export function useStoreData(): void {
  useStore((s) => s.boards);
  useStore((s) => s.elements);
  useStore((s) => s.monthGoals);
  useStore((s) => s.weekGoals);
  useStore((s) => s.tasks);
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
      version: 3, user: s.user, boards: s.boards, elements: s.elements,
      monthGoals: s.monthGoals, weekGoals: s.weekGoals, tasks: s.tasks,
    });
  };

  let persistTimer: ReturnType<typeof setTimeout> | null = null;

  /** Coalesce writes during a continuous gesture. */
  const persistSoon = () => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      persistNow();
    }, 350);
  };

  /** Write immediately, cancelling anything pending. */
  const persistNow = () => {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    persist();
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
      persistNow();
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
      persistNow();
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
    resetToSeed: () => {
      const fresh = seed();
      set({
        version: fresh.version,
        user: fresh.user,
        boards: fresh.boards,
        elements: fresh.elements,
        monthGoals: fresh.monthGoals,
        weekGoals: fresh.weekGoals,
        tasks: fresh.tasks,
        selection: [],
        past: [],
        future: [],
        panX: 0, panY: 0, zoom: 1,
      });
      // deliberately NOT persisted — clearLocal() owns wiping storage
    },

    replaceState: (next) => {
      set({
        version: next.version ?? 3,
        user: next.user,
        boards: next.boards,
        elements: next.elements,
        monthGoals: next.monthGoals,
        weekGoals: next.weekGoals,
        tasks: next.tasks,
        selection: [],
        past: [],
        future: [],
      });
      persistNow();
    },

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
      persistNow();
      return id;
    },
    renameBoard: (id, name) => {
      const clean = name.trim();
      if (!clean) return;
      push();
      set((s) => ({
        boards: s.boards.map((b) => (b.id === id ? { ...b, name: clean } : b)),
      }));
      persistNow();
    },

    setActiveBoard: (id) => {
      set((s) => ({ boards: s.boards.map((b) => ({ ...b, isActive: b.id === id })), selection: [] }));
      persistNow();
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
      persistNow();
    },
    setBoardBg: (color) => {
      push();
      set((s) => ({ boards: s.boards.map((b) => (b.isActive ? { ...b, bg: color } : b)) }));
      persistNow();
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
        // Throws on a non-image or an oversized file, before any state changes,
        // so a rejected pick leaves the board exactly as it was.
        const blob = await prepareImage(file);
        imageId = nanoid();
        await putImage(imageId, blob);
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
      persistNow();
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
      persistNow();
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
      persistNow();
    },

    updateEl: (id, patch, history = true) => {
      if (history) push();
      set((s) => ({ elements: s.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
      persistNow();
    },

    updateMany: (patches, history = true) => {
      if (history) push();
      set((s) => ({
        elements: s.elements.map((e) => (patches[e.id] ? { ...e, ...patches[e.id] } : e)),
      }));
      persistNow();
    },

    updateLive: (patches) => {
      set((s) => ({
        elements: s.elements.map((e) => (patches[e.id] ? { ...e, ...patches[e.id] } : e)),
      }));
      persistSoon();
    },

    flush: () => persistNow(),

    deleteSelected: () => {
      const s = get();
      const ids = s.selection.filter((id) => {
        const el = s.elements.find((e) => e.id === id);
        return el !== undefined && !el.locked;
      });
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
      persistNow();
    },

    duplicateSelected: async () => {
      const s = get();
      if (!s.selection.length) return;
      const originals = s.elements.filter((e) => s.selection.includes(e.id));

      // Each copy gets its OWN blob. Sharing an imageId meant deleting either
      // copy deleted the picture out from under the other one.
      const copies: BoardElement[] = [];
      for (const e of originals) {
        const clone: BoardElement = { ...e, id: nanoid(), x: e.x + 24, y: e.y + 24, createdAt: now() };
        if (e.kind === 'vision' && e.imageId) {
          const imageId = nanoid();
          clone.imageId = (await copyImage(e.imageId, imageId)) ? imageId : null;
        }
        copies.push(clone);
      }

      push();
      const base = nextZ();
      const placed = copies.map((c, i) => ({ ...c, z: base + i }));
      set((st) => ({
        elements: [...st.elements, ...placed],
        selection: placed.map((c) => c.id),
      }));
      persistNow();
    },

    bringForward: (id) => {
      const els = get().boardElements();
      const i = els.findIndex((e) => e.id === id);
      if (i < 0 || i === els.length - 1) return;
      push();
      const a = els[i], b = els[i + 1];
      set((s) => ({ elements: s.elements.map((e) =>
        e.id === a.id ? { ...e, z: b.z } : e.id === b.id ? { ...e, z: a.z } : e) }));
      persistNow();
    },
    sendBackward: (id) => {
      const els = get().boardElements();
      const i = els.findIndex((e) => e.id === id);
      if (i <= 0) return;
      push();
      const a = els[i], b = els[i - 1];
      set((s) => ({ elements: s.elements.map((e) =>
        e.id === a.id ? { ...e, z: b.z } : e.id === b.id ? { ...e, z: a.z } : e) }));
      persistNow();
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
      persistNow();
      return g.id;
    },
    addWeekGoal: (monthGoalId, title) => {
      if (!monthGoalId || !title.trim()) return null;
      if (get().currentWeekGoals().length >= MAX_WEEK_GOALS) return null;
      push();
      const w: WeekGoal = { id: nanoid(), monthGoalId, title: title.trim(),
        weekKey: weekKey(), status: 'active', createdAt: now() };
      set((s) => ({ weekGoals: [...s.weekGoals, w] }));
      persistNow();
      return w.id;
    },
    addTask: (weekGoalId, title, date, isMit = false) => {
      if (!weekGoalId || !title.trim()) return null;
      const s = get();
      const day = date || dayKey();
      // Starring on creation still has to respect the MIT cap for that day.
      const mitFull = s.tasks.filter((x) => x.date === day && x.isMit).length >= MAX_MITS;
      push();
      const t: Task = { id: nanoid(), weekGoalId, title: title.trim(),
        date: day, isMit: isMit && !mitFull, done: false, minutesSpent: 0, createdAt: now() };
      set((st) => ({ tasks: [...st.tasks, t] }));
      persistNow();
      return t.id;
    },
    toggleTask: (id) => {
      // undo() restores the tasks array, so a task change that skipped the undo
      // stack would be silently reverted by the next Ctrl+Z.
      push();
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id
            ? { ...t, done: !t.done, completedAt: !t.done ? now() : null }
            : t),
      }));
      persistNow();
    },
    toggleMit: (id) => {
      const s = get();
      const t = s.tasks.find((x) => x.id === id);
      if (!t) return;
      if (!t.isMit && s.todayTasks().filter((x) => x.isMit).length >= MAX_MITS) return;
      push();
      set({ tasks: s.tasks.map((x) => (x.id === id ? { ...x, isMit: !x.isMit } : x)) });
      persistNow();
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
      persistNow();
    },
    deleteWeekGoal: (id) => {
      push();
      set((s) => ({
        weekGoals: s.weekGoals.filter((w) => w.id !== id),
        tasks: s.tasks.filter((t) => t.weekGoalId !== id),
      }));
      persistNow();
    },
    deleteTask: (id) => {
      push();
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      persistNow();
    },

    // ---------- derived ----------
    visions: () => get().boardElements().filter((e) => e.kind === 'vision'),
    completeMonthGoal: (id) => {
      push();
      const at = now();
      set((s) => ({
        monthGoals: s.monthGoals.map((g) =>
          g.id === id ? { ...g, status: 'done' as const, completedAt: at } : g),
        // week goals under it retire with it, or they'd dangle in the week view
        weekGoals: s.weekGoals.map((w) =>
          w.monthGoalId === id && w.status === 'active'
            ? { ...w, status: 'done' as const, completedAt: at } : w),
      }));
      persistNow();
    },
    reopenMonthGoal: (id) => {
      // Reopening must respect the cap — otherwise close-then-reopen is a
      // trivial way to get 4/3 and the whole constraint stops meaning anything.
      if (get().currentMonthGoals().length >= MAX_MONTH_GOALS) return;
      push();
      set((s) => ({
        monthGoals: s.monthGoals.map((g) =>
          g.id === id ? { ...g, status: 'active' as const, completedAt: null } : g),
      }));
      persistNow();
    },
    completeWeekGoal: (id) => {
      push();
      const at = now();
      set((s) => ({
        weekGoals: s.weekGoals.map((w) =>
          w.id === id ? { ...w, status: 'done' as const, completedAt: at } : w),
      }));
      persistNow();
    },
    reopenWeekGoal: (id) => {
      if (get().currentWeekGoals().length >= MAX_WEEK_GOALS) return;
      push();
      set((s) => ({
        weekGoals: s.weekGoals.map((w) =>
          w.id === id ? { ...w, status: 'active' as const, completedAt: null } : w),
      }));
      persistNow();
    },
    doneMonthGoals: () => {
      const s = get();
      const ids = new Set(s.visions().map((v) => v.id));
      const mk = monthKey();
      // A goal planned in August and closed in September belongs in September's
      // "finished" list. monthKey is the plan month, so it cannot answer this.
      // Rows written before completedAt existed fall back to it.
      return s.monthGoals.filter((g) =>
        g.status === 'done' && ids.has(g.visionId) &&
        (g.completedAt ? monthKey(new Date(g.completedAt)) : g.monthKey) === mk);
    },
    doneWeekGoals: () => {
      const s = get();
      const wk = weekKey();
      return s.weekGoals.filter((w) =>
        w.status === 'done' &&
        (w.completedAt ? weekKey(new Date(w.completedAt)) : w.weekKey) === wk);
    },
    monthGoalAllDone: (id) => {
      const s = get();
      const wgIds = s.weekGoals.filter((w) => w.monthGoalId === id).map((w) => w.id);
      if (!wgIds.length) return false;
      const tasks = s.tasks.filter((t) => wgIds.includes(t.weekGoalId));
      return tasks.length > 0 && tasks.every((t) => t.done);
    },
    weekGoalAllDone: (id) => {
      const s = get();
      const tasks = s.tasks.filter((t) => t.weekGoalId === id);
      return tasks.length > 0 && tasks.every((t) => t.done);
    },

    rollForward: () => {
      const today = dayKey();
      const s = get();
      // Only tasks under a goal the user can still see are worth carrying;
      // anything else belongs to a closed chain and stays in history.
      const liveWgIds = new Set(s.currentWeekGoals().map((w) => w.id));
      const stale = s.tasks.filter(
        (t) => !t.done && t.date < today && liveWgIds.has(t.weekGoalId)
          // "Not now" is a decision, not a pause. Without this check the drop
          // sentinel (-1) satisfied "< POSTPONE_LIMIT" and the task came back
          // tomorrow with its counter reset, restarting the whole cycle.
          && t.postponed !== POSTPONE_DROPPED
          && (t.postponed ?? 0) < POSTPONE_LIMIT,
      );
      if (stale.length === 0) return 0;
      const ids = new Set(stale.map((t) => t.id));
      set((st) => ({
        tasks: st.tasks.map((t) =>
          ids.has(t.id)
            ? {
                ...t,
                date: today,
                postponed: (t.postponed ?? 0) + 1,
                originalDate: t.originalDate ?? t.date,
              }
            : t),
      }));
      persistNow();
      return stale.length;
    },

    stalledTasks: () => {
      const s = get();
      const today = dayKey();
      // The same live set Today uses. Using a looser filter here meant "Do it
      // today" could move a task into a week that Today does not render, so the
      // button appeared to do nothing.
      const liveWgIds = new Set(s.currentWeekGoals().map((w) => w.id));
      return s.tasks.filter(
        (t) => !t.done && liveWgIds.has(t.weekGoalId)
          && t.postponed !== POSTPONE_DROPPED
          && (t.postponed ?? 0) >= POSTPONE_LIMIT && t.date <= today,
      );
    },

    dropTask: (id) => {
      push();
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id
            ? { ...t, date: t.originalDate ?? t.date, postponed: POSTPONE_DROPPED }
            : t),
      }));
      persistNow();
    },

    recommitTask: (id) => {
      push();
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, date: dayKey(), postponed: 0 } : t),
      }));
      persistNow();
    },

    currentMonthGoals: () => {
      const s = get();
      const ids = new Set(s.visions().map((v) => v.id));
      const mk = monthKey();
      // An OPEN goal, not "a goal stamped with this month". Matching monthKey
      // exactly meant every active goal disappeared at midnight on the 1st, and
      // because Week and Today derive from this, all three views emptied at
      // once — mid-week, if the ISO week straddled the boundary.
      return s.monthGoals.filter(
        (g) => g.status === 'active' && g.monthKey <= mk && ids.has(g.visionId));
    },
    currentWeekGoals: () => {
      const s = get();
      const mgIds = new Set(s.currentMonthGoals().map((g) => g.id));
      const wk = weekKey();
      // Same rule one level down: still open means still shown. Keys are
      // zero-padded and year-first, so a plain string compare orders them.
      return s.weekGoals.filter(
        (w) => w.status === 'active' && w.weekKey <= wk && mgIds.has(w.monthGoalId));
    },
    todayTasks: () => {
      const s = get();
      const wgIds = new Set(s.currentWeekGoals().map((w) => w.id));
      const d = dayKey();
      // A dropped task stays in history but is never asked about again, so it
      // must not come back into Today.
      return s.tasks.filter(
        (t) => t.date === d && wgIds.has(t.weekGoalId) && t.postponed !== POSTPONE_DROPPED);
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
