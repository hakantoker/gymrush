# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**GymRush** — a browser-based 3D idle/management simulator (Monkey Mart style). Players run a gym: fix machines, help customers, earn money, upgrade equipment. Full design spec in [GDD.md](GDD.md). Current build status in [PROGRESS.md](PROGRESS.md).

## Commands

```bash
npm start       # dev server at localhost:3000 with HMR
npm run build   # production build → dist/
```

No test runner configured.

## Directory structure

```
src/
  core/           # Engine primitives (Renderer, GameLoop, InputManager, CameraController)
  ui/             # PixiJS HUD layer (UI.js — transparent overlay over Three.js canvas)
  scene/          # Static world geometry (GymRoom.js)
  items/          # Item class hierarchy + type configs + mesh builders
  systems/        # Cross-cutting managers (ItemManager.js)
  player/         # Player entity and model builder
  controls/       # Input abstraction (DesktopControls, MobileControls stub)
```

## Architecture

Two rendering layers, two canvases, no shared state between them:

- **`#game-canvas`** — Three.js `WebGLRenderer`. Owns the 3D scene, camera, lights, all meshes.
- **`#ui-canvas`** — PixiJS `Application`, transparent, `pointer-events:none`, z-index 10. Owns all 2D HUD elements.

`src/index.js` wires everything together. System init order: Renderer → InputManager → UI → Scene/Room → Items → Player → CameraController → GameLoop.

### Core systems

| Class | File | Role |
|---|---|---|
| `Renderer` | `core/Renderer.js` | Wraps `THREE.WebGLRenderer`; handles orthographic camera resize (left/right/top/bottom) |
| `GameLoop` | `core/GameLoop.js` | `requestAnimationFrame`; calls `update(delta)` then `render()`; delta capped at 50ms |
| `InputManager` | `core/InputManager.js` | Key state by `e.code`; mouse NDC coords + buttons |
| `CameraController` | `core/CameraController.js` | Arrow-key isometric panning (9 u/s). Arrow keys are reserved — **not** bound to player movement |

### Camera

`THREE.OrthographicCamera`, `VIEW_SIZE=13`, positioned at `(18, 18, 18)` looking at origin. Isometric 45° angle. In-game screen axes map to world as:

| Screen | World XZ |
|---|---|
| Right (D / →) | `(+x, -z)` |
| Left (A / ←) | `(-x, +z)` |
| Up (W / ↑) | `(-x, -z)` |
| Down (S / ↓) | `(+x, +z)` |

### GymRoom

`src/scene/GymRoom.js` — `CELL=2`, `COLS=10`, `ROWS=8` → **20×16 world units**.

Floor uses a procedural `CanvasTexture` (128 px/cell, recessed rubber-tile look) with `texture.repeat.set(COLS, ROWS)` — exactly one tile per grid cell.

Walls: height 1.5 (low, so isometric camera sees the full room). Entrance gap: 4 units in the front wall (z = +8).

`gridToWorld(col, row, colSpan, rowSpan)` converts grid coords to world-space centre. Slots carry `gridCol`, `gridRow`, `gridColSpan`, `gridRowSpan`, `typeKey`, and `position`.

### Item system

All items are data-driven. Adding a new item type = one entry in `itemTypes.js`, no new class.

```
GymItem                     base: state, mesh (THREE.Group), interact(actor), update(delta)
├── OccupiableItem          usingPeople[], maxCapacity, queue[], queuePositions[], startSession/endSession
│   ├── Machine             wear-based break chance, repairTimer, NEEDS_REPAIR/BROKEN states
│   └── SharedFeature       multi-customer areas (boxing ring, mat area)
└── Utility                 stock/capacity, AVAILABLE/NEEDS_REFILL
    └── TowelBox            dual cleanCount/dirtyCount, washComplete()
```

State tinting uses **emissive-only** (no material cloning). Each builder call creates fresh material instances so in-place emissive modification is safe.

`ItemManager` (`systems/ItemManager.js`) — factory by `typeKey`, ticks all items, provides `getAvailable(category)` and `getByMeshId(itemId)` for raycasts.

`meshBuilders.js` — composed `THREE.Group` models for TREADMILL, BENCH, BIKE, DUMBBELL_RACK. Every mesh in a group is tagged `userData.itemId` for raycast lookup.

### Player

`Player` (`player/Player.js`) — WASD movement, `SPEED=6.5` u/s, clamped to room bounds. Smooth rotation toward movement direction (`ROT_SPEED=14` rad/s, short-arc lerp). Low-poly humanoid model (amber shirt — distinct from customers).

Controls abstraction: `getMovement() → {x, z}`. Current implementation: `DesktopControls` (WASD). Stub: `MobileControls` (joystick `setJoystick(x,z)` called by PixiJS UI — not yet wired).

## Key conventions

- **Explicit string state enums** — no boolean flags per entity (`'IDLE'`, `'IN_USE'`, etc.)
- **Three.js and PixiJS are strictly separated** — game logic in Three.js space; PixiJS only reads state to render HUD
- **GSAP for UI transitions only** — `AnimationMixer` for character animations (not yet implemented)
- **Flat/toon shading** — `MeshPhongMaterial`, no textures except the procedural floor `CanvasTexture`
- **Fixed machine slots** — no drag-and-drop; slot positions defined in `GymRoom.SLOT_DEFS`
- **Arrow keys = camera, WASD = player** — never overlap these bindings

## Webpack asset handling

Assets in `src/` import directly; Webpack emits to `dist/assets/`:
- Images/SVG → `assets/textures/`
- `.glb/.gltf/.fbx/.obj` → `assets/models/`
- Audio → `assets/audio/`
