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

### Current scene state (placeholder)
The scene in `index.js` is a stub: perspective camera, a green ground plane, and a WASD-controlled blue cube. The GDD spec calls for an **orthographic camera** at an isometric angle — this needs to be swapped before building gameplay systems.

### Planned systems (not yet built)
Per the GDD, the next systems to add are:
- **Machine state machine** — `IDLE → IN_USE → WARNING → BROKEN → NEEDS_CLEANING` per machine
- **Customer agent** — spawn, browse, use machine, pay/leave FSM with patience timer
- **Player character** — click-to-move on floor, action queue, walk/idle AnimationMixer
- **Waypoint pathfinding** — simple node graph for the single-room layout (no navmesh for MVP)
- **Economy** — money, satisfaction score, day/time cycle
- **Save system** — `localStorage` JSON snapshot

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
