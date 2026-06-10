# GymRush — Build Progress

## Next task (resume here)
**Player interaction — repair & restock.** The maintenance loop runs (machines wear and break, utilities deplete) but the player can't act on it yet. Add:
- Raycast click (or proximity + key) to target a broken / NEEDS_REPAIR machine and run a repair timer.
- Restock utilities (water dispenser, soap) the same way.
- Player "busy" state + on-screen progress while repairing/restocking.
- Tie into Economy (repair may cost money) once the action works.

---

## Milestone 3 — Satisfaction HUD + money fly-ups ✅
- [x] Satisfaction meter (top-right PixiJS): averages active customers' `satisfaction`, red→amber→green, dims when gym empty (`UI.updateSatisfaction`, `CustomerSpawner.averageSatisfaction`)
- [x] GSAP `+$N` fly-up at the cashier on each payment — `Economy.earn(amount, worldPosition)` carries the source point; `index.js` projects world→screen and calls `UI.showMoneyFlyup`
- [x] World→screen projection helper in `index.js` for HUD overlays

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

## Milestone 2 — Customers, economy, RPG stats, cashier ✅

The full customer earning loop runs end-to-end: spawn → pick machines for their program → queue → use (accrue fee) → maybe drink water → pay at cashier → exit.

### Customer agents
- [x] `Customer.js` — full AI state machine (WALKING_TO_MACHINE, IN_QUEUE, USING_MACHINE, WALKING_TO_DISPENSER, AT_DISPENSER, WAITING, WALKING_TO_CASHIER, IN_CASHIER_QUEUE, AT_CASHIER, WALKING_TO_EXIT, LEAVING_UNHAPPY)
- [x] `customerModel.js` — low-poly humanoid, 4 shirt palettes × 4 skin tones (distinct from amber player)
- [x] `CustomerSpawner.js` — spawn every 8s, cap 8 concurrent
- [x] Straight-line pathfinding (single room, no obstacles)
- [x] Multi-machine sessions: each customer visits 3–4 machines per program
- [x] In-use timer bar above machines (camera-facing, green→amber→red)

### RPG stat system (drives machine choice + payout)
- [x] 10 muscle groups (`muscleGroups.js`)
- [x] Disciplines (`disciplines.js`) — Bodybuilder, Cardio Runner, CrossFit, Weight Loss, + 20% Casual
- [x] Training programs (`trainingPrograms.js`) — weighted muscle-group goals, machine count, water chance
- [x] Score-based machine selection: `score = Σ machineEffect[g] × programGoal[g]`
- [x] Greedy `_decide()` builds wish-list and re-picks after each machine

### Satisfaction + economy
- [x] `Economy.js` — money (start 500), `earn()`/`spend()`, listener API
- [x] Satisfaction starts at 50, drains while waiting/queueing (different rates per state)
- [x] Goal-fulfillment bonus (up to +30) applied when wish-list complete
- [x] Money HUD counter (PixiJS, top-left)

### Cashier station
- [x] `CashierStation.js` — left of entrance, queue API mirrors OccupiableItem, MAX_QUEUE=5
- [x] `cashierModel.js` — counter + cash register, amber branding, faces room interior
- [x] Fees accrue per machine, collected only at cashier: `tip = round(accruedFee × satisfaction/50 × 0.3)`
- [x] Design consequence: customers who run out of patience in the cashier line forfeit all accrued fees

---

## Up next (in order)

1. **Satisfaction HUD + money fly-ups** ← next session
   - PixiJS satisfaction meter (top-right)
   - GSAP `+$X` popup at cashier on payment
2. **Player interaction** — raycast-click broken/needs-repair machines to repair; restock utilities
3. **Waypoint pathfinding** — replace straight-line with node graph for multi-room future
4. **Areas system** — Area class, unlock mechanic for Locker Room / Bathroom etc.
5. **Towel / Laundry system** — Washing Machine cycle, dual Towel Box
6. **Workers** — NPC workers with task priority loops (post-MVP)
7. **Polish** — end-of-day summary, sound
8. **Save system** — `localStorage` JSON snapshot

---

## Open decisions
- None. All decisions resolved — see GDD §13.
