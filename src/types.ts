// Core domain types for Vision Grid
// v2: Canva-style board elements. Visions remain the only goal-anchorable element.

export type Visibility = 'private' | 'friends' | 'active-only';
export type GoalStatus = 'active' | 'done' | 'dropped';
export type ElementKind = 'vision' | 'text' | 'shape';
export type ShapeKind = 'rect' | 'ellipse';
export type TextDir = 'auto' | 'ltr' | 'rtl';
/** Active canvas tool. 'select' is the normal pointer. */
export type Tool = 'select' | 'rect' | 'ellipse';

/** Tools that create a shape by dragging out its bounds. */
export const SHAPE_TOOLS: Tool[] = ['rect', 'ellipse'];

export interface User {
  id: string;
  handle: string;
  tz: string;
}

export interface Board {
  id: string;
  userId: string;
  name: string;
  visibility: Visibility;
  isActive: boolean;
  bg: string;          // artboard background colour
  createdAt: string;
}

/** Everything on the canvas is an Element. */
export interface BoardElement {
  id: string;
  boardId: string;
  kind: ElementKind;

  // transform
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;    // degrees
  z: number;
  locked: boolean;
  opacity: number;     // 0..1

  // vision-only (kind === 'vision')
  title?: string;
  why?: string;
  imageId?: string | null;
  targetDate?: string | null;
  radius?: number;     // corner radius
  fit?: 'cover' | 'contain';

  // text-only (kind === 'text')
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  italic?: boolean;
  /** 'auto' detects Arabic/Hebrew per string; explicit rtl/ltr overrides. */
  dir?: TextDir;
  fontFamily?: string;

  // shape-only (kind === 'shape')
  shape?: ShapeKind;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;

  // draw-only (kind === 'draw') — freehand ink
  /** Normalised points (0..1 within the element box) so strokes scale on resize. */
  points?: { x: number; y: number }[];
  smooth?: boolean;

  createdAt: string;
}

export interface MonthGoal {
  id: string;
  visionId: string;    // -> BoardElement.id where kind === 'vision'
  title: string;
  monthKey: string;
  status: GoalStatus;
  droppedReason?: string;
  createdAt: string;
}

export interface WeekGoal {
  id: string;
  monthGoalId: string;
  title: string;
  weekKey: string;
  status: GoalStatus;
  carryCount: number;
  droppedReason?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  weekGoalId: string;
  title: string;
  date: string;
  isMit: boolean;
  done: boolean;
  minutesSpent: number;
  /** When this task was last ticked off. Drives progress + starvation — no timer needed. */
  completedAt?: string | null;
  /** How many days this task has been rolled forward without being finished. */
  postponed?: number;
  /** The day it was originally planned for — kept so history stays honest. */
  originalDate?: string;
  createdAt: string;
}

/** After this many roll-forwards the app stops moving it silently and asks. */
export const POSTPONE_LIMIT = 3;

export interface AppState {
  version: number;
  user: User;
  boards: Board[];
  elements: BoardElement[];
  monthGoals: MonthGoal[];
  weekGoals: WeekGoal[];
  tasks: Task[];
}

// ---- Hard caps: the constraint IS the feature ----
export const MAX_MONTH_GOALS = 3;
export const MAX_WEEK_GOALS = 2;
export const MAX_MITS = 3;

// ---- Attention ----
/** Days with no completed task before a vision starts visibly fading. */
export const STARVE_AFTER_DAYS = 30;

// ---- Canvas (infinite) ----
// No artboard bounds. These only seed where new elements first appear.
export const SPAWN_W = 1400;
export const SPAWN_H = 900;
export const SNAP_TOLERANCE = 6;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;

/** Arabic-capable font stacks. First entry is the default. */
export const FONTS = [
  { id: 'sans', label: 'Sans', css: "'Segoe UI', 'Noto Sans Arabic', Tahoma, ui-sans-serif, system-ui, sans-serif" },
  { id: 'serif', label: 'Serif', css: "'Noto Naskh Arabic', 'Times New Roman', Georgia, serif" },
  { id: 'mono', label: 'Mono', css: "'Cascadia Mono', 'Noto Sans Mono', Consolas, monospace" },
];

/** True when the string contains Arabic, Hebrew, or other RTL script. */
export function isRtlText(s: string): boolean {
  return /[\u0591-\u07FF\u0860-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(s);
}

export const PALETTE = [
  '#f0b429', '#f87171', '#34d399', '#60a5fa', '#c084fc',
  '#fb923c', '#2dd4bf', '#f472b6', '#e6e9ef', '#8b93a4',
  '#1b2029', '#0d0f14',
];

export const isVision = (e: BoardElement) => e.kind === 'vision';
