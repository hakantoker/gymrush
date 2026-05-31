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

## 5. Machines & Tools

### Machine Tiers

| Tier | Visual | Price to Use | Unlock Cost | Notes |
|---|---|---|---|---|
| 1 | Basic, worn look | Low | Free / Starter | Available from game start |
| 2 | Clean, modern | Medium | Mid-game cost | Attracts more customers |
| 3 | Premium, glowing accent | High | Late-game cost | Rare customers, big payout |

### Machine List (MVP)

| Machine | Category | Notes |
|---|---|---|
| Treadmill | Cardio | Most common, customers use frequently |
| Weight Bench | Strength | Medium usage frequency |
| Dumbbell Rack | Strength | Passive, no timer needed |
| Stationary Bike | Cardio | Cheaper alternative to treadmill |
| Pull-up Bar | Strength | Budget option |
| Shower Stall | Facility | Unlockable, requires cleaning |
| Locker | Facility | Increases customer satisfaction |

### Machine States
```
IDLE → IN_USE → NEEDS_CLEANING → IDLE
           ↓
      WARNING (partial break) → BROKEN (if ignored)
```

- **IDLE:** Available for customers
- **IN_USE:** Occupied, timer counting
- **WARNING:** Orange indicator — player must fix within ~30s
- **BROKEN:** Red indicator — machine unusable, refund triggered
- **NEEDS_CLEANING:** After use, must be wiped before next customer

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

## 8. Gym Layout (MVP)

```
┌─────────────────────────────────┐
│  [Entrance]                     │
│                                 │
│  [Treadmill] [Treadmill]        │
│                                 │
│  [Bench]     [Bike]             │
│                                 │
│  [Dumbbell Rack]                │
│                                 │
│  [Bathroom Door]  [Locker Area] │
└─────────────────────────────────┘
```

- Fixed single-room layout for MVP
- Machines have assigned floor slots (not drag-and-drop in MVP)
- Expansion adds a second room to the right

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
- Staff hiring (post-MVP milestone at $15k)
- Multiple gym floors
- Multiplayer / leaderboard
- Sound design (placeholder only)

---

## 13. Open Questions

- [ ] Does the player have an energy/stamina bar, or can they run indefinitely?
- [ ] Is there a day/night cycle that ends the workday, or is it endless?
- [ ] Can machines be sold/removed, or only upgraded?
- [ ] What is the failure state — bankruptcy, or just a soft "bad rating" system?
