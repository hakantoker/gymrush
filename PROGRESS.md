# GymRush — Build Progress

## Current task
**Machine state machine** — `IDLE → IN_USE → WARNING → BROKEN → NEEDS_CLEANING` per slot, with placeholder box meshes visible in scene.

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

### Scene setup
- [x] Orthographic isometric camera at (15,15,15), `VIEW_SIZE=10`
- [x] `GymRoom` — 14×12 world-unit room, 7 cols × 6 rows grid (`CELL=2`)
- [x] Floor, 4 walls with 3-unit entrance gap, green entrance mat
- [x] 7 machine slot markers matching GDD layout

---

## Up next (in order)

1. **Machine state machine** ← current
2. Player character — click-to-move on floor, action queue
3. Customer agents — spawn, browse, use machine, pay/leave FSM
4. Waypoint pathfinding — fixed node graph for the room
5. Economy + HUD — money counter, satisfaction score, tips
6. Polish — GSAP number fly-ups, end-of-day summary screen
7. Save system — `localStorage` JSON snapshot

---

## Open decisions
- None currently. All GDD section 13 questions resolved.
