# ◈ Vision Grid

A vision board that's a **system**, not decoration.

**Live at [visionboard.khaleds.com](https://visionboard.khaleds.com)**

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
- **Shapes** → rectangle and ellipse

**Shortcuts** — `R` rectangle · `O` ellipse · `Esc` cancel · `Delete` remove selected

**Drawing shapes.** Pick the rectangle or ellipse tool, then **drag on the canvas** to
draw it at the size you want — a live preview shows the dimensions while you drag.
Hold **Shift** for a perfect square or circle. Pick the fill colour from the toolbar
before drawing, or restyle later from the inspector. Selection is the default mode,
and the app returns to it automatically once a shape is placed. Delete elements with
the 🗑 button or the `Delete` key.

**Arabic / RTL.** Text elements auto-detect Arabic, Hebrew and other RTL scripts and
flip direction and alignment automatically. Override per element with Auto / LTR / RTL
in the inspector, and choose an Arabic-capable font (Sans / Serif / Mono — Noto Sans
Arabic, Noto Naskh Arabic). Alignment uses logical `start`/`end`, so "left" means the
leading edge in whichever direction the text runs. PNG export honours direction and
font too.

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

- **Month** — max 3 goals, each must select a vision (picked from a list showing the
  actual images, not filenames). The add form collapses behind a button so your goals
  are the first thing on screen.
- **Week** — max 2 goals, each must select a month goal. Add day tasks inline.
- **Today** — tasks with vision thumbnail + full thread. Star up to 3 MITs.
- **History** — every month you have planned, with each goal, week goal and task, and
  whether it finished. The planning tabs deliberately show only *now*; this is the
  record.

### The caps have a way out

A cap of 3 means *three things open at once*, not three things per month. When every
task under a goal is ticked, the goal offers to close:

```
🎉 Every task under this is done.   [Close it]
```

Closing frees a slot immediately, and the goal drops into "Finished this month" with an
↩ to reopen it. Without this the app locked you out until the 1st — the cap protected
focus but punished finishing.

### Unfinished work carries over

An unfinished task used to simply vanish the next day, and an unfinished week goal
vanished on Monday with nothing asking about it. Now:

```
task not ticked  →  rolls to today, badged ↻1
                 →  ↻2
                 →  ↻3
                 →  stops, and asks
```

After three postponements the task stops rolling silently and surfaces one prompt:
**Do it today** / **Not now** / **delete**. The original date is kept, so History stays
honest about when it was actually planned. `POSTPONE_LIMIT` in `types.ts` sets the
threshold. This is the only thing the carry-over ever asks you — the rest is automatic.

## Languages — English & العربية

The whole interface is bilingual. Toggle with the **English / العربية** switch in the
top bar; the choice persists in `localStorage` under `vg:lang`.

Switching to Arabic sets `<html lang="ar" dir="rtl">`, which:

- translates every label, button, placeholder, coach panel and the first-run guide
- mirrors the planning layout — text right-aligns, task rows and example boxes flip,
  the coach's accent border moves to the right edge
- formats dates with `Intl` in Arabic (`الاثنين، 17 أغسطس`), keeping Gregorian months
  and Western digits so planning stays unambiguous
- loads Arabic-capable fonts (Noto Sans Arabic / Dubai / Segoe UI)

**The canvas deliberately stays LTR.** Board elements carry absolute x/y coordinates,
so flipping the canvas would move everything on the board. Only the surrounding UI
mirrors; the board itself is unaffected. Text *elements* on the board still auto-detect
Arabic independently of the UI language.

Adding a third language means adding one entry per key in `src/i18n.ts` — no component
changes needed.

## Guidance

The hardest part of this system is knowing how to *phrase* a goal at each level, so
the app teaches it inline.

- **First-run guide** — a 4-step walkthrough of the chain that ticks off steps as you
  complete them and tells you exactly which tab to open next. Re-open any time with
  the `?` button in the top bar.
- **Coach panels** — every planning tab has a **?** beside its heading that opens what
  belongs at that level, with a one-line test and real ✗/✓ examples
  ("Get fit" → "Run 5km without stopping"). It used to be an always-open card ~480px
  tall, which pushed your actual goals below the fold — help you have to scroll past
  is not help.

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

## Together — the accountability layer

The original reason the app exists. One or two people going through it with you, who
notice when you go quiet.

- **Pairing** — "Show my code" mints a 6-character invite code valid 14 days. Your
  friend redeems it once; the friendship is permanent and unaffected when the code
  expires. Redeeming twice is a no-op, and you cannot pair with yourself.
- **Their board, read-only** — you see their real canvas: true coordinates, images,
  shapes, rotation, z-order, their board background, their progress rings and STARVING
  badges. Read-only is *structural*, not a disabled button: `ReadOnlyCanvas` renders
  from a plain array and contains zero store mutations, so there is no code path that
  could edit their data.
- **Drill into a vision** — tap any vision on their board to see the goals and tasks
  behind it, with a **👋 Nudge** beside each unfinished task.
- **Nudges with context** — a bare task name is useless for accountability, so every
  nudge carries the chain `vision → month goal → week goal`. Budget is **3 per person
  per day**, enforced in Postgres rather than the client so it can't be bypassed via
  the API.
- **Profiles** — display name plus an emoji avatar and colour (10 emoji × 12 colours,
  so two people picking 🎯 still look different). One short text column, no uploads, no
  storage bucket, no moderation surface.

## Account and sync

Cloud is **entirely optional**. Delete `.env` and the app is purely local — the sign-in
button disappears and nothing else changes.

- Magic-link email sign-in via Supabase; no passwords
- One JSONB document per user (`boards_state`); images in a private `visions` bucket
- Row-level security on every table, verified from outside with an anonymous key:
  reads return `[]`, forged inserts are rejected
- **Sign-out wipes local data.** An ownership stamp (`vg:localOwner`) records whose
  board is on this device. Signing in as someone else never uploads the previous
  person's board into the new account — a real bug this fixed, not a hypothetical one.

Environment:

```bash
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_KEY=<publishable key>   # never the secret key
```

Both are baked in at build time, so they must also be set wherever you build (e.g.
Cloudflare Pages environment variables) — a local `.env` is not visible to CI.

SQL lives in `supabase/`: `schema.sql`, `social.sql`, `nudges.sql`, `profile.sql`.

## Data

- App state → `localStorage`, key `vision-grid:state:v1`
- Images → IndexedDB `vision-grid-images`, stored as blobs (never file paths — those break)

Both live behind `src/storage.ts`. Swapping in Tauri + SQLite later means rewriting
that one file. When signed in, the same state is mirrored to Supabase — local stays the
source of truth and the cloud is a copy, not the other way round.

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
  types.ts        domain types, the three caps, POSTPONE_LIMIT
  dates.ts        day / month / ISO-week key helpers
  storage.ts      persistence adapter  ← the only Tauri-swap point
  store.ts        zustand store; chain rules, caps, carry-over, undo/redo
  canvas.ts       snapping, bounds, resize math
  export.ts       board -> PNG renderer
  i18n.ts         every UI string, English + Arabic
  useT.ts         translation hook, with {n} interpolation
  cloud.ts        Supabase client + sync status
  sync.ts         push/pull, sign-out wipe, ownership guard
  social.ts       invites, friends, nudges, profiles
  lib/utils.ts    cn() — class merging for the UI components
  hooks/useImage  IndexedDB id -> object URL
  components/ui/  shadcn primitives: dialog · popover · select · button
                  input · card · badge · progress · checkbox
  views/          BoardView · BoardCanvas · Inspector · Minimap
                  MonthView · WeekView · TodayView · ArchiveView
                  CircleView · FriendBoard · ReadOnlyCanvas
                  Account · Avatar · VisionPicker · StalledPrompt
                  Guide · Coach · Ask
supabase/         schema.sql · social.sql · nudges.sql · profile.sql
```

### UI components

The chrome uses [shadcn/ui](https://ui.shadcn.com) on Radix primitives — mainly for
what's tedious to hand-roll correctly: focus trapping in dialogs, focus restore on
close, collision-aware popovers, and `aria` wiring.

**The four canvas components are deliberately not migrated.** `BoardCanvas`,
`ReadOnlyCanvas`, `Inspector` and `Minimap` are ~1180 lines of hand-written SVG and
CSS, because shadcn has no equivalent for an infinite canvas — and they're the part of
the app that actually matters.

Two things worth knowing if you touch this:

- Radix portals content outside the app tree and **defaults to LTR regardless of
  `<html dir="rtl">`**. `DirectionProvider` in `App.tsx` fixes it; without it every
  dropdown renders mirrored inside an otherwise-correct Arabic page.
- Tailwind owns the class name `ring`. The board's progress ring used
  `className="ring"` for a year; installing Tailwind silently gave it
  `box-shadow: 0 0 0 1px`, drawing a literal box around every progress circle. It's
  `vg-ring` now. Prefix any class name that collides with a utility.

## Status

Live at **[visionboard.khaleds.com](https://visionboard.khaleds.com)** — Cloudflare
Pages, auto-deployed from `main`.

Everything below is shipped and verified by driving the real UI, not just by
typechecking: the board, the enforced chain, the caps and their exit, carry-over,
history, the bilingual UI, cloud sync, and the accountability layer.

**Shipped**

| | |
|---|---|
| **Board** | Infinite canvas, images become visions, drag-to-draw shapes, PNG export, minimap, undo/redo |
| **Chain** | Hard caps — 3 month goals, 2 week goals, 3 daily MITs — with a close-and-free-a-slot exit |
| **Carry-over** | Unfinished tasks roll forward with a ↻ count, and ask once after 3 |
| **History** | Every past month with its goals, week goals and individual tasks |
| **Signals** | Progress rings + starving visions, driven purely by completed tasks |
| **Onboarding** | First-run guide + per-tab coach panels with worked ✗/✓ examples |
| **Bilingual** | Full English/العربية with RTL layout; canvas stays LTR by design |
| **Cloud** | Optional Supabase sync, magic-link auth, RLS verified from outside |
| **Together** | Invite codes, read-only friend boards, contextual nudges with a DB-enforced budget |
| **Profiles** | Display name + emoji avatar and colour |
| **Responsive** | No horizontal overflow at 1440 / 1024 / 768 / 390 |

**Deliberately rejected**

A release built around a focus timer, hours-invested rings and a forced weekly
review was implemented and then reverted — it added ceremony without adding
clarity. It survives in the `v0.2` tag if any piece is ever wanted back. The
lesson stuck: progress signals must come from actions already being taken, not
from new rituals the user has to maintain.

## Roadmap

**The only thing that matters next: use it for a week.**

Every feature since v0.1 has been built without the app being lived in for a full
cycle. Two of the biggest defects found so far — goals vanishing at the month
boundary, and the cap locking you out after finishing everything — were only
obvious once real data sat in it across time. More features on an un-lived-in
system is how these die.

**Known gaps, in rough order of how much they'd hurt**

- **Last-write-wins sync.** Two devices editing the same board can overwrite each
  other. Mitigated by friend access being read-only, but not solved.
- **No revoke for invite codes**, and expired rows are never pruned.
- **Sign-out wipe is unverified against two real accounts.** The logic is right and
  the ownership guard is in place, but it's only been proven in isolation, not by
  signing in as two people on one machine.
- **Board templates** — a first attempt was written against the old fixed-artboard
  model and deleted; it would need rebuilding in world coordinates.

**Later / unscheduled**

- Desktop packaging via Tauri (see below)
- Tray widget, wallpaper export

## Desktop packaging (later)

Requires Rust + MSVC build tools (~4GB), not currently installed:

```bash
npm install -D @tauri-apps/cli
npx tauri init      # frontendDist: ../dist, devUrl: http://localhost:5173
npx tauri dev
```

The frontend needs no changes — only `src/storage.ts` gains a SQLite implementation.
