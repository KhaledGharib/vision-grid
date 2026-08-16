// Core domain types for Vision Grid
// v2: Canva-style board elements. Visions remain the only goal-anchorable element.

export type Visibility = 'private' | 'friends' | 'active-only';
export type GoalStatus = 'active' | 'done' | 'dropped';
export type ElementKind = 'vision' | 'text' | 'shape';
export type ShapeKind = 'rect' | 'ellipse' | 'line';

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

  // shape-only (kind === 'shape')
  shape?: ShapeKind;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;

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
  createdAt: string;
}

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

// ---- Canvas (infinite) ----
// No artboard bounds. These only seed where new elements first appear.
export const SPAWN_W = 1400;
export const SPAWN_H = 900;
export const SNAP_TOLERANCE = 6;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;

export const PALETTE = [
  '#f0b429', '#f87171', '#34d399', '#60a5fa', '#c084fc',
  '#fb923c', '#2dd4bf', '#f472b6', '#e6e9ef', '#8b93a4',
  '#1b2029', '#0d0f14',
];

export const isVision = (e: BoardElement) => e.kind === 'vision';
