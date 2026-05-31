# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**GymRush** — a browser-based 3D idle/management simulator. Players run a gym: fix machines, help customers, earn money, upgrade equipment. Full design spec in [GDD.md](GDD.md).

## Commands

```bash
npm start       # dev server at localhost:3000 with HMR
npm run build   # production build → dist/
```

No test runner is configured yet.

## Architecture

The engine is split into two rendering layers that share no canvas:

- `#game-canvas` — Three.js `WebGLRenderer`. Handles the 3D scene (scene graph, camera, lights, meshes, animations).
- `#ui-canvas` — PixiJS `Application`. Transparent overlay sitting above the Three.js canvas (`pointer-events: none` by default). Handles all 2D HUD elements (money counter, day bar, satisfaction meter, tooltips, panels).

Both canvases are initialized in [src/index.js](src/index.js) via `main()`, which wires up:

| Class | File | Role |
|---|---|---|
| `Renderer` | `src/core/Renderer.js` | Wraps `THREE.WebGLRenderer`; owns resize handling and calls `renderer.render(scene, camera)` |
| `GameLoop` | `src/core/GameLoop.js` | `requestAnimationFrame` loop; calls `update(delta)` then `render()` each tick; delta capped at 50ms |
| `InputManager` | `src/core/InputManager.js` | Tracks keyboard (`keys` map by `e.code`) and mouse (NDC coords + buttons) |
| `UI` | `src/ui/UI.js` | Initializes PixiJS app; owns the `hud` Container; exposes methods to update HUD text |

See [PROGRESS.md](PROGRESS.md) for current build status and what to work on next.

### GymRoom layout details
`src/scene/GymRoom.js` — 14×12 world units (7 cols × 6 rows, `CELL=2`). Entrance gap (3 units wide) in the front wall (z = +6, most visible from isometric camera). Exports `CELL`, `ROOM_W`, `ROOM_D`, `gridToWorld(col, row)` for use by other systems.

Slot positions (col, row → world x, z):
- treadmill_1 (1,4) → (-4, 3), treadmill_2 (3,4) → (0, 3)
- bench_1 (1,2) → (-4, -1), bike_1 (3,2) → (0, -1), dumbbell_1 (5,2) → (4, -1)
- bathroom (1,0) → (-4, -5), locker_1 (5,0) → (4, -5)

## Key conventions

- **State machines use explicit string or symbol enums** — no implicit boolean flags per entity.
- **Three.js and PixiJS are strictly separated** — game logic lives in Three.js space; PixiJS only reads game state to render HUD, never writes to the scene.
- **GSAP is used only for UI transitions** (popups, number fly-ups, panel slides). Three.js `AnimationMixer` handles character/model animations.
- **Flat/toon shading only** — use `MeshToonMaterial` or `MeshPhongMaterial`. No textures for MVP.
- **No drag-and-drop machine placement in MVP** — machines occupy fixed floor slots defined in the layout.

## Webpack asset handling

Webpack is pre-configured to emit assets to `dist/assets/`:
- Images/SVG → `assets/textures/`
- `.glb/.gltf/.fbx/.obj` → `assets/models/`
- Audio → `assets/audio/`

Import them directly in JS (`import model from './models/player.glb'`) and Webpack resolves the hashed URL.
