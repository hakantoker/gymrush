# GymRush — Build Progress

## Current task
**Item system architecture** — data-driven item type configs, Machine and Utility base classes, state machines with timer-based escalation. One open question to resolve first (see Open Decisions).

---

## Completed

### Project setup
- [x] Webpack + Three.js + PixiJS + GSAP scaffold
- [x] Dual-canvas architecture (`#game-canvas` Three.js, `#ui-canvas` PixiJS overlay)
- [x] Core systems: `Renderer`, `GameLoop`, `InputManager`, `UI`
- [x] Git repo initialized, published to GitHub (`hakantoker/gymrush`)

### Design decisions (locked)
- [x] No stamina bar — player runs indefinitely
- [x] No day/night cycle — gym runs continuously
- [x] Fixed predefined machine slots (Monkey Mart style, not a builder game)
- [x] No failure state — satisfaction affects tips/rating only
- [x] Expansion = unlock new predefined rooms
- [x] Two item categories: **Machines** (IDLE/IN_USE/NEEDS_REPAIR/BROKEN) and **Utilities** (AVAILABLE/NEEDS_REFILL)
- [x] NEEDS_REPAIR is timer-based — expires → BROKEN
- [x] Towel system: dual-slot Towel Box (clean/dirty), Washing Machine cycles dirty→clean
- [x] Workers: Personal Trainer, Laundry Worker, Cashier, Cleaning Worker (post-MVP)

### Scene setup
- [x] Orthographic isometric camera at (15,15,15), `VIEW_SIZE=10`
- [x] `GymRoom` — 14×12 world-unit room, 7 cols × 6 rows grid (`CELL=2`)
- [x] Floor, 4 walls with 3-unit entrance gap, green entrance mat
- [x] 7 machine slot markers matching GDD layout

---

## Up next (in order)

1. **Item system** ← current
   - `src/items/itemTypes.js` — type configs (TREADMILL, BENCH, WATER_DISPENSER, TOWEL_BOX, …)
   - `src/items/Item.js` — base class: state machine, timer, mesh placeholder
   - `src/items/Machine.js` — extends Item (IDLE/IN_USE/NEEDS_REPAIR/BROKEN + repair timer)
   - `src/items/Utility.js` — extends Item (AVAILABLE/NEEDS_REFILL + capacity counter)
   - `src/systems/ItemManager.js` — ticks all items, drives escalations
2. Player character — click-to-move on floor, action queue
3. Customer agents — spawn, browse, use machine, pay/leave FSM
4. Waypoint pathfinding — fixed node graph for the room
5. Economy + HUD — money counter, satisfaction, tips
6. Areas system — Area class, unlock mechanic, multi-room layout
7. Towel / Laundry system — Washing Machine cycle, dual Towel Box
8. Workers system — NPC workers with task priority loops
9. Polish — GSAP fly-ups, end-of-day summary
10. Save system — `localStorage` JSON snapshot

---

## Open decisions
- **Machine malfunction trigger** — does malfunction happen randomly during a session (probability per session) or after a fixed number of uses / fixed time regardless of use? Answer determines the timer architecture.
