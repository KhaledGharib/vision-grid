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

## Guidance

The hardest part of this system is knowing how to *phrase* a goal at each level, so
the app teaches it inline.

- **First-run guide** — a 4-step walkthrough of the chain that ticks off steps as you
  complete them and tells you exactly which tab to open next. Re-open any time with
  the `?` button in the top bar.
- **Coach panels** — every planning tab has a collapsible card explaining what belongs
  at that level, with a one-line test and real ✗/✓ examples
  ("Get fit" → "Run 5km without stopping"). Collapse state is remembered per tab.

The rule of thumb the app teaches:

| Level | Question | Example |
|---|---|---|
| Month | What will be **done** in 30 days? | Run 5km without stopping |
| Week | What slice fits in 7 days, even in a bad week? | Run 3 times, 2km each |
| Day | What can I finish in one sitting? | Run 2km before work |

## Progress and attention

- **Progress rings** on each vision tile show the share of its tasks that are finished.
  Caption shows `done/total` and days to target.
- **Starving visions** desaturate and dim as time passes with nothing completed,
  reaching full grayscale plus a `STARVING` badge after 30 days. Finish one task and
  the colour returns immediately. No notifications, no guilt copy — you just open the
  board and see which dreams are going gray.

Both are driven purely by **completed tasks**. There is no timer to run.

Multiple boards are supported, but only the **active** board's goals can receive tasks —
focus is enforced by design.

## Data

- App state → `localStorage`, key `vision-grid:state:v1`
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

- **v0.2** — focus timer, progress rings, starving visions (fade to gray after 30 days), Sunday review with carry/shrink/drop
- **v0.3** — social: pair with a friend, Circle tab, task-specific nudges (3/day budget), cheers
- **v0.4** — tray widget, fullscreen focus mode, wallpaper export, Graveyard view

## Desktop packaging (later)

Requires Rust + MSVC build tools (~4GB), not currently installed:

```bash
npm install -D @tauri-apps/cli
npx tauri init      # frontendDist: ../dist, devUrl: http://localhost:5173
npx tauri dev
```

The frontend needs no changes — only `src/storage.ts` gains a SQLite implementation.
