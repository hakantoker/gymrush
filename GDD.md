# Game Design Document — GymRush (Working Title)

## 1. Overview

| Field | Value |
|---|---|
| Genre | Idle / Management Simulator |
| Perspective | 2.5D Orthographic |
| Platform | Web (Browser) |
| Art Style | Low-poly, flat shading, limited palette |
| Core Fantasy | Build and run the best gym in town |

---

## 2. Visual Style

- **Camera:** Fixed orthographic camera, slight top-down angle (isometric-like)
- **Models:** Simple low-poly 3D humanoids and props, no textures — flat `MeshToonMaterial` or `MeshPhongMaterial`
- **Palette:** Warm neutrals for gym floor/walls, accent colors per machine tier
- **Lighting:** Soft ambient + single directional light, no harsh shadows
- **UI:** PixiJS 2D overlay — clean, minimal icons and panels. GSAP transitions for popups/notifications.

---

## 3. Core Gameplay Loop

```
Customer enters gym
    → Uses machine (timer counts down)
    → Player maintains gym while customer is active
        → Fix broken machines
        → Clean bathroom
        → Help customers in trouble
    → Customer finishes and pays
        → Player earns money
→ Player spends money on upgrades
→ Repeat with more customers / better machines
```

---

## 4. Player

### Character
- Simple 3D humanoid, low-poly
- Controlled by the player: click/tap a task → player walks to it and performs it
- Has a single action queue (one task at a time)

### Player Tasks
| Task | Trigger | Time Cost | Consequence if Ignored |
|---|---|---|---|
| Fix machine | Machine shows warning icon | Medium | Machine breaks fully, customer refunded |
| Clean bathroom | Dirt meter fills over time | Short | Customer satisfaction drops, some leave |
| Help customer | Customer shows "!" icon | Short | Customer leaves without paying, satisfaction penalty |
| Restock supplies | Supply meter empty | Medium | Bathroom unusable |

### Player Movement
- Click-to-move on the gym floor
- Player auto-faces the target task
- Walk animation (looped) while moving, idle otherwise

---

## 5. Items

All interactive items in the gym belong to one of two categories: **Machines** or **Utilities**. Each category has its own state machine. Every item type is defined by a config object (data-driven) so new items can be added without new classes.

---

### Category A — Machines (gym equipment)

Customers occupy machines for a session. Machines can malfunction and escalate to broken if ignored.

**State machine:**
```
IDLE → IN_USE ──(malfunction chance per session)──→ NEEDS_REPAIR
  ↑                                                      ↓
  └──────────── player fixes (quick) ────────────────────┘
                                                          ↓ (timer expires)
                                                       BROKEN
                                                          ↓
                                              player fixes (costs $) → IDLE
```

| State | Indicator | Description |
|---|---|---|
| IDLE | — | Available for next customer |
| IN_USE | Blue | Occupied, session timer running |
| NEEDS_REPAIR | Orange | Malfunctioned — player must fix within repair window |
| BROKEN | Red | Repair window missed — costs money to fix, customer refunded |

**Malfunction** happens randomly during a session (configurable chance per item type). NEEDS_REPAIR has a countdown timer; if it expires the machine transitions to BROKEN.

**Machine list:**

| Item | Area | Tier | Notes |
|---|---|---|---|
| Treadmill | Main Gym | 1–3 | Most common, high malfunction rate |
| Weight Bench | Main Gym | 1–3 | Medium frequency |
| Stationary Bike | Main Gym | 1–3 | Cheaper cardio option |
| Dumbbell Rack | Main Gym | 1 | Passive — no timer, no malfunction |
| Pull-up Bar | Main Gym | 1 | Budget option |
| Boxing Bag | Boxing Ring | 1–2 | Unlockable area |
| Sauna Chair | Sauna | 2–3 | Unlockable area |

**Machine tiers:**

| Tier | Visual | Fee | Unlock | Notes |
|---|---|---|---|---|
| 1 | Basic, worn | Low | Free | Starter |
| 2 | Clean, modern | Medium | Mid-game | More customers |
| 3 | Premium, glowing | High | Late-game | Rare customers, big payout |

---

### Category B — Utilities (consumables & service tools)

Utilities are not used by customers for sessions — they support the gym environment. They drain over time or per use and need restocking/refilling by the player or a worker.

**State machine:**
```
AVAILABLE ──(drains per use or over time)──→ NEEDS_REFILL
                                                   ↓
                                      player/worker refills → AVAILABLE
```

| Item | Area | Drains by | Notes |
|---|---|---|---|
| Water Dispenser | Locker Room | Per customer use | Customers stop at it after sessions |
| Towel Box (clean) | Locker Room | Per customer (1 towel taken) | Part of the towel system — see §5a |
| Towel Box (dirty) | Locker Room | Per customer (1 towel returned) | Fills up — triggers laundry need |
| Soap Dispenser | Bathroom | Per shower use | — |
| Toilet Paper | Bathroom | Over time | — |

---

### 5a. Towel System (Laundry Area unlock)

Unlocking the **Laundry Area** adds the full towel cycle to the gym.

**The towel box is a dual-slot utility:**
- **Clean side** — stock of fresh towels customers pick up before training
- **Dirty side** — pile of used towels customers return after training

**Customer towel cycle:**
```
Customer enters
→ picks up 1 clean towel (clean count -1)
→ trains
→ returns towel to dirty side (dirty count +1)
→ exits
```

**Laundry cycle:**
```
Dirty side reaches threshold
→ NEEDS_WASH indicator appears
→ Player or Laundry Worker loads Washing Machine
→ Washing Machine runs (timed cycle)
→ Cycle complete → dirty count resets, clean count refills
```

If clean towels run out → customers cannot get a towel → satisfaction penalty.

---

## 6. Customers

### Behavior Flow
```
Spawn at entrance
→ Browse (look for free machine of preferred type)
→ Use machine (pay reservation)
→ Finish → walk to exit → pay remainder
         OR
→ Get stuck / need help → show "!" → wait for player
→ If ignored too long → leave without paying + satisfaction penalty
```

### Customer Types (MVP)

| Type | Preferred Machines | Patience | Tip Chance |
|---|---|---|---|
| Casual | Treadmill, Bike | High | Low |
| Bodybuilder | Bench, Dumbbell | Medium | Medium |
| Regular | Any | High | High |
| Elderly | Low-impact only | Very High | Medium |
| Influencer | Tier 3 only | Low | Very High |

### Customer Satisfaction
- Per-visit score: affects tip amount
- Satisfaction reduces on: broken machine, long wait, dirty bathroom, ignored trouble
- Satisfaction increases on: quick player response, Tier 2/3 machines, clean facility

---

## 7. Economy

### Income Sources
| Source | Amount |
|---|---|
| Machine usage fee | Fixed per tier per session |
| Customer tip | Variable (0–30% of fee) based on satisfaction |
| VIP customer bonus | Rare flat bonus |

### Expenses / Costs
| Item | Cost Type |
|---|---|
| Buy new machine | One-time |
| Upgrade machine to next tier | One-time (replaces model) |
| Restock bathroom supplies | Recurring |
| Repair a fully broken machine | One-time penalty cost |

### Progression Milestones (Draft)

| Milestone | Unlock |
|---|---|
| Day 1 | 2 Treadmills (Tier 1), 1 Bench (Tier 1) |
| $500 earned | Unlock Shower Stall slot |
| $1,200 earned | Unlock first Tier 2 upgrade |
| $3,000 earned | Second gym room / expansion area |
| $7,500 earned | Tier 3 machines available |
| $15,000 earned | Hire an NPC helper (auto-cleans bathroom) |

---

## 7a. Workers

Players can hire NPC workers to automate tasks. Workers are persistent NPCs with their own movement and action loops — they are not player-controlled.

### Worker Types

| Worker | Automates | Hire Cost | Salary |
|---|---|---|---|
| Personal Trainer | Helps troubled customers (replaces player "!" response) | High | Medium |
| Laundry Worker | Loads washing machine, refills towel box | Medium | Low |
| Cashier | Speeds up customer payment at exit | Medium | Low |
| Cleaning Worker | Cleans bathroom, wipes machines after use | Low | Low |

### Worker Behavior
- Each worker has a **task priority list** — they scan for their task type and walk to it
- Workers have the same `IDLE → MOVING → WORKING` states as the player
- Workers are independent of each other and the player
- Player can dismiss (fire) a worker at any time

### Unlock Condition
Workers become available for hire after a specific milestone (TBD — tied to progression economy).

---

## 8. Areas & Layout

Each area is a predefined room with fixed item slots. Areas are unlocked by spending money and appear adjacent to existing rooms in the scene.

### Area List

| Area | Default | Key Items |
|---|---|---|
| Main Gym | Unlocked | Treadmills, Bench, Bike, Dumbbell Rack, Pull-up Bar |
| Locker Room | Unlocked | Lockers, Water Dispenser, Towel Box |
| Bathroom | Unlocked | Showers, Soap Dispenser, Toilet Paper |
| Sauna | Locked | Sauna Chairs |
| Laundry | Locked | Washing Machine (enables full towel system) |
| Boxing Ring | Locked | Boxing Bags |

### MVP Layout (Main Gym — single room)

```
┌─────────────────────────────────┐
│           [Entrance]            │
│                                 │
│  [Treadmill]    [Treadmill]     │
│                                 │
│  [Bench]  [Bike]  [Dumbbell]   │
│                                 │
│  [Bathroom ->]  [Locker Room ->]│
└─────────────────────────────────┘
```

- Fixed slots per area — no drag-and-drop
- Expansion unlocks new rooms that appear adjacent in the scene

---

## 9. UI / HUD (PixiJS Layer)

| Element | Position | Notes |
|---|---|---|
| Money counter | Top-left | Animated +$X on earn |
| Day / time bar | Top-center | Day cycle drives customer spawn rate |
| Satisfaction meter | Top-right | Average of recent customers |
| Task notification | Above player | Arrow + icon pointing to urgent task |
| Machine tooltip | On hover | Shows tier, fee, status |
| Upgrade panel | Bottom drawer | Opens on machine click when idle |
| End-of-day summary | Full-screen overlay | Revenue, tips, incidents, day rating |

---

## 10. Game Feel Targets

- Player should always feel **slightly busy** — never bored, never overwhelmed
- Broken machine warning gives **enough time to react** but creates tension
- Money animations (+$) and **GSAP popups** should feel satisfying
- Customer "!" help requests should feel **urgent but fair**
- Day end summary should feel like a **reward beat**

---

## 11. Technical Notes

| Concern | Approach |
|---|---|
| 3D scene | Three.js, orthographic camera, toon/flat shading |
| UI overlay | PixiJS canvas over Three.js canvas |
| Animations | GSAP for UI; Three.js AnimationMixer for character walk/idle |
| Customer pathfinding | Simple waypoint system (no full navmesh for MVP) |
| State machine | Each machine and customer has explicit state enum |
| Save system | localStorage JSON snapshot |

---

## 12. Out of Scope (MVP)

- Drag-and-drop machine placement
- Multiple gym floors (vertical expansion)
- Multiplayer / leaderboard
- Sound design (placeholder only)
- Workers (post-MVP — unlocked via progression milestones)

---

## 13. Design Decisions

- [x] **Stamina bar** — No. Player runs indefinitely.
- [x] **Day/night cycle** — No cycle. Always daytime; the gym runs continuously.
- [x] **Machine placement** — Predefined fixed slots per room. No drag-and-drop placement. Machines can be upgraded in-place or sold to free the slot.
- [x] **Failure state** — No bankruptcy or hard failure. Customer satisfaction affects tips and rating only; player always earns money and continues playing.
- [x] **Expansion model** — Unlocking a new room adds a new predefined area to manage (Monkey Mart style). Layout is designed to maximize player movement and urgency, not player customization.
