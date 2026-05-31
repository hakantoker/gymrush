# GymRush — Build Progress

## Current task
**Customer agents** — spawn at entrance, walk to machine, join queue, use machine, pay and exit. Includes basic straight-line pathfinding and economy foundation.

---

## Milestone 1 — Core scene + item system + player ✅

Everything needed to see and move around the gym is done. This is the foundation all gameplay systems build on.

### Project setup
- [x] Webpack + Three.js + PixiJS + GSAP scaffold
- [x] Dual-canvas architecture (`#game-canvas` Three.js, `#ui-canvas` PixiJS overlay)
- [x] Core systems: `Renderer`, `GameLoop`, `InputManager`, `UI`
- [x] Git repo initialized, published to GitHub (`hakantoker/gymrush`)

### Design decisions (all locked — see GDD §13)
- [x] No stamina bar, no day/night cycle, no failure state
- [x] Fixed predefined machine slots (Monkey Mart style)
- [x] Two item categories: Machine (IDLE/IN_USE/NEEDS_REPAIR/BROKEN) and Utility (AVAILABLE/NEEDS_REFILL)
- [x] Wear-based break chance: `min(max, base + useCount × growth)`, checked per session end
- [x] Wear resets only on full repair (BROKEN), not quick fix (NEEDS_REPAIR)
- [x] Towel system: dual-slot Towel Box, Washing Machine cycle
- [x] Workers: post-MVP
- [x] Player movement: WASD with isometric screen-space projection

### Scene
- [x] Orthographic isometric camera (18,18,18), `VIEW_SIZE=13`
- [x] `GymRoom` — 20×16 world units, 10 cols × 8 rows, `CELL=2`
- [x] Procedural grid floor texture (128 px/cell, rubber tile look)
- [x] Low walls (1.5 u), 4-unit entrance gap, green entrance mat
- [x] 7 slot markers (3 treadmill, 1 bench, 1 bike, 1 dumbbell rack, 2 reserved)

### Item system
- [x] `itemTypes.js` — 9 type configs (TREADMILL, BENCH, BIKE, DUMBBELL_RACK, BOXING_RING, MAT_AREA, WATER_DISPENSER, SOAP_DISPENSER, TOWEL_BOX)
- [x] `GymItem` — base: state, emissive-tinted mesh, `interact(actor)`, `update(delta)`
- [x] `OccupiableItem` — `usingPeople[]`, `maxCapacity`, queue system (`queue[]`, `queuePositions[]`, enqueue/dequeue/leaveQueue)
- [x] `Machine` — wear accumulator, `repairTimer`, NEEDS_REPAIR/BROKEN with timer escalation
- [x] `SharedFeature` — multi-customer capacity
- [x] `Utility` — stock/capacity, AVAILABLE/NEEDS_REFILL
- [x] `TowelBox` — dual cleanCount/dirtyCount, `washComplete()` hook
- [x] `meshBuilders.js` — Treadmill, Bench, Bike, Dumbbell Rack as composed Three.js geometry
- [x] `ItemManager` — factory by typeKey, per-frame tick, raycast lookup

### Player
- [x] Low-poly humanoid model (amber shirt — distinct from customers)
- [x] WASD movement with isometric screen-projection, speed 6.5 u/s
- [x] Smooth rotation lerp toward movement direction
- [x] Room boundary clamping
- [x] `DesktopControls` (WASD) + `MobileControls` stub (joystick ready for UI wiring)
- [x] Arrow keys → camera pan (`CameraController`)

---

## Up next (in order)

1. **Customer agents** ← current
   - `Customer.js` — entity: position, state machine, target item, satisfaction score
   - `customerModel.js` — low-poly humanoid (neutral palette, distinct from player)
   - `CustomerSpawner.js` — spawn at entrance at intervals, configurable rate
   - Customer AI: SPAWNING → BROWSING → WALKING → IN_QUEUE → USING → PAYING → EXITING
   - Straight-line pathfinding (no obstacles for MVP single room)
   - Integration: `machine.startSession(customer)` / `machine.endSession(customer)`
2. **Economy** — money counter, per-session fee, tips based on satisfaction
3. **HUD** (PixiJS) — money display, satisfaction meter, task notifications
4. **Waypoint pathfinding** — replace straight-line with node graph for multi-room future
5. **Areas system** — Area class, unlock mechanic for Locker Room / Bathroom etc.
6. **Towel / Laundry system** — Washing Machine cycle, dual Towel Box
7. **Workers** — NPC workers with task priority loops (post-MVP)
8. **Polish** — GSAP money fly-ups, end-of-day summary
9. **Save system** — `localStorage` JSON snapshot

---

## Open decisions
- None. All decisions resolved — see GDD §13.
