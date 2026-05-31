# GymRush — Build Progress

## Current task
**Player character** — click-to-move on gym floor (raycast), action queue, walk/idle placeholder mesh.

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

### Item system
- [x] `itemTypes.js` — all type configs (TREADMILL, BENCH, BIKE, DUMBBELL_RACK, WATER_DISPENSER, TOWEL_BOX, BOXING_RING, MAT_AREA, SOAP_DISPENSER)
- [x] `GymItem` — base: state, mesh, `interact(actor)`, `update(delta)`
- [x] `OccupiableItem` — `usingPeople[]`, `maxCapacity`, queue system (`queue[]`, `queuePositions[]`, `enqueue/dequeue/leaveQueue`)
- [x] `Machine` — wear-based break chance, `repairTimer`, NEEDS_REPAIR/BROKEN states
- [x] `SharedFeature` — multi-customer capacity (boxing ring, mat area)
- [x] `Utility` — stock/capacity, AVAILABLE/NEEDS_REFILL
- [x] `TowelBox` — dual cleanCount/dirtyCount, `washComplete()` hook
- [x] `ItemManager` — factory by typeKey, ticks all items, raycast lookup
- [x] `meshBuilders.js` — treadmill, bench, bike, dumbbell rack as composed Three.js geometry
- [x] Multi-grid slots (colSpan/rowSpan) — machines span 1×2 or 2×1 cells
- [x] Walls shortened to 1.5 — room fully visible from isometric camera
- [x] `CameraController` — arrow key isometric panning

---

## Up next (in order)

1. **Player character** ← current — click-to-move on floor, action queue
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
- None. All decisions resolved — see GDD §13.
