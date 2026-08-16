# ◈ Vision Grid

A vision board that's a **system**, not decoration.

The whole app enforces one chain:

```
Vision (image) → Month goal (max 3) → Week goal (max 2) → Day task (star 3 MITs)
```

**Nothing can exist without a parent.** You cannot create a task that isn't attached
to a week goal, a week goal without a month goal, or a month goal without pointing at
a vision image. That's the point: every task you look at has a visible thread running
back to a picture of the life you're building.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build -> dist/
```

## The Board — a real canvas editor

An **infinite canvas** (pan/zoom), not a fixed page.

**Canvas engine**
- 8 resize handles + a separate rotation handle (Shift snaps to 15°)
- Multi-select: Shift+click, or drag a marquee on empty space
- Smart snap guides — pink lines when edges/centers align; hold Alt to disable
- Undo/redo, 50 steps (Ctrl+Z / Ctrl+Y)
- Pan with Space+drag or middle mouse; zoom 20%–300%
- Minimap in the bottom-right corner
- Per-element selection outlines; dashed box for multi-select

**Element types**
- **Images** → these become **visions**, the only elements goals can attach to
- **Text** → Heading / Body / Quote presets; double-click to edit inline
- **Shapes** → rectangle, ellipse, line

**Inspector** (adapts to selection)
| Selection | Controls |
|---|---|
| Vision | title, why, target date, cover/contain, corner radius, replace image |
| Text | size, weight, alignment, colour |
| Shape | fill, border width, border colour |
| Any | opacity, rotation, arrange (front/forward/backward/back), lock |
| Multiple | 6 alignment operations |
| Nothing | board background colour + layers list |

**Keyboard** — Ctrl+Z/Y · Ctrl+A · Ctrl+D duplicate · Delete · Esc · arrows nudge 1px (Shift = 10px)

**Export** — whole board as PNG at 2× resolution, or all data as JSON (⭳ in the top bar)

## Planning views

- **Month** — max 3 goals, each must select a vision. The form disappears at 3/3.
- **Week** — max 2 goals, each must select a month goal. Add day tasks inline.
- **Today** — tasks with vision thumbnail + full thread. Star up to 3 MITs.
- **Review** — the weekly reset (see below).

## v0.2 — effort, attention, and honesty

**Focus timer.** Every task has a `▶ Focus` button that runs a 25-minute block and
counts down in place; it turns red in overtime. Stopping banks a `FocusSession`.
Sessions under a minute are discarded — that's noise, not effort. `+` logs time
you spent away from the app. Today's header shows total minutes focused.

**Progress rings.** Vision tiles show a ring driven by **hours actually invested**,
not tasks checked. Tasks are easy to check; time is not. 20 focused hours = a full ring.

**Starving visions.** A vision with no focus time gradually **desaturates and dims**,
reaching full grayscale plus a `STARVING` badge after 30 days. No notification, no
guilt text — you just open the board and see which dreams are going gray. A vision
that has never been fed measures from its creation date, not from epoch.

**Weekly review.** Every unfinished week goal forces one of three choices:

| Action | Effect |
|---|---|
| **Carry** | Moves to this week. Blocked after 2 carries — the app stops letting you lie. |
| **Shrink** | Rewrite it smaller and honestly; resets the carry count. |
| **Drop** | Requires a one-line reason; moves to the **Graveyard**. |

The review also shows where your attention actually went (minutes per vision, sorted,
with "never fed" called out) and saves notes to your future self. The Review tab
carries a dot while the week's review is still pending.

The Graveyard is not deleted history. If one vision keeps filling it, that vision
probably isn't yours.

Multiple boards are supported, but only the **active** board's goals can receive tasks —
focus is enforced by design.

## Data

- App state → `localStorage`, key `vision-grid:state:v1` (schema v3, auto-migrates)
- Images → IndexedDB `vision-grid-images`, stored as blobs (never file paths — those break)

Both live behind `src/storage.ts`. Swapping in Tauri + SQLite later means rewriting
that one file. `userId` is already in the schema so a future social layer isn't a migration.

### Reset everything

DevTools console (F12):

```js
localStorage.removeItem('vision-grid:state:v1');
indexedDB.deleteDatabase('vision-grid-images');
location.reload();
```

## Structure

```
src/
  types.ts        domain types + the three caps
  dates.ts        day / month / ISO-week key helpers
  storage.ts      persistence adapter  ← the only Tauri-swap point
  store.ts        zustand store; chain rules, caps, undo/redo enforced here
  canvas.ts       snapping, bounds, resize math
  export.ts       board -> PNG renderer
  hooks/useImage  IndexedDB id -> object URL
  views/          BoardView · BoardCanvas · Inspector · Minimap
                  MonthView · WeekView · TodayView
```

## Roadmap

- ~~**v0.2** — focus timer, progress rings, starving visions, weekly review~~ ✅
- **v0.3** — social: pair with a friend, Circle tab, task-specific nudges (3/day budget), cheers
- **v0.4** — tray widget, fullscreen focus mode, wallpaper export, desktop packaging

## Desktop packaging (later)

Requires Rust + MSVC build tools (~4GB), not currently installed:

```bash
npm install -D @tauri-apps/cli
npx tauri init      # frontendDist: ../dist, devUrl: http://localhost:5173
npx tauri dev
```

The frontend needs no changes — only `src/storage.ts` gains a SQLite implementation.
