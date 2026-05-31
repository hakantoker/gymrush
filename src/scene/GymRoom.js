import * as THREE from 'three';

export const CELL   = 2;
const COLS          = 10;
const ROWS          = 8;
export const ROOM_W = COLS * CELL;   // 20
export const ROOM_D = ROWS * CELL;   // 16
const WALL_H        = 1.5;
const WALL_T        = 0.3;
const ENTRANCE_W    = 4;

// ── Grid floor texture ─────────────────────────────────────────────────────────
// Each canvas tile = one grid cell. Looks like recessed rubber gym floor tiles.
function createGridTexture() {
  const px   = 128;                               // pixels per cell
  const c    = document.createElement('canvas');
  c.width    = px;
  c.height   = px;
  const ctx  = c.getContext('2d');
  const g    = 4;                                 // groove width in px

  // Outer groove (dark)
  ctx.fillStyle = '#7A5C38';
  ctx.fillRect(0, 0, px, px);

  // Tile face (warm rubber floor)
  ctx.fillStyle = '#C8A882';
  ctx.fillRect(g, g, px - g * 2, px - g * 2);

  // Top-left highlight — simulates soft overhead light
  const hlSize = px - g * 2;
  ctx.fillStyle = 'rgba(255, 230, 160, 0.10)';
  ctx.fillRect(g, g, hlSize, 6);
  ctx.fillRect(g, g, 6, hlSize);

  // Bottom-right shadow
  ctx.fillStyle = 'rgba(60, 35, 10, 0.14)';
  ctx.fillRect(g, px - g - 6, hlSize, 6);
  ctx.fillRect(px - g - 6, g, 6, hlSize);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const wallMat     = new THREE.MeshPhongMaterial({ color: 0xE0D5C5 });
const slotMat     = new THREE.MeshPhongMaterial({ color: 0x7BAABF, transparent: true, opacity: 0.75 });
const entranceMat = new THREE.MeshPhongMaterial({ color: 0x88C878 });

// ── Slot definitions ────────────────────────────────────────────────────────────
// col/row = top-left grid cell, colSpan/rowSpan = footprint in cells.
// row 0 = back wall side (z ≈ -ROOM_D/2 + 1), row ROWS-1 = front/entrance side.
const SLOT_DEFS = [
  // Cardio row — near entrance (rows 5-6)
  { id: 'treadmill_1', col: 1, row: 5, colSpan: 1, rowSpan: 2, typeKey: 'TREADMILL'     },
  { id: 'treadmill_2', col: 3, row: 5, colSpan: 1, rowSpan: 2, typeKey: 'TREADMILL'     },
  { id: 'treadmill_3', col: 6, row: 5, colSpan: 1, rowSpan: 2, typeKey: 'TREADMILL'     },

  // Strength row — mid room (rows 2-3)
  { id: 'bench_1',    col: 1, row: 2, colSpan: 1, rowSpan: 2, typeKey: 'BENCH'          },
  { id: 'bike_1',     col: 3, row: 2, colSpan: 1, rowSpan: 2, typeKey: 'BIKE'           },
  { id: 'dumbbell_1', col: 6, row: 2, colSpan: 2, rowSpan: 1, typeKey: 'DUMBBELL_RACK'  },

  // Back utilities (row 0)
  { id: 'bathroom',   col: 0, row: 0, colSpan: 1, rowSpan: 1, typeKey: null             },
  { id: 'locker_1',   col: 5, row: 0, colSpan: 2, rowSpan: 1, typeKey: null             },
];

// Returns the world-space centre of a slot.
export function gridToWorld(col, row, colSpan = 1, rowSpan = 1) {
  return new THREE.Vector3(
    -ROOM_W / 2 + col * CELL + (colSpan * CELL) / 2,
    0,
    -ROOM_D / 2 + row * CELL + (rowSpan * CELL) / 2,
  );
}

export class GymRoom {
  constructor(scene) {
    this.scene = scene;
    this.slots = [];
    this._buildFloor();
    this._buildWalls();
    this._buildEntrance();
    this._buildSlots();
  }

  _buildFloor() {
    const tex = createGridTexture();
    tex.repeat.set(COLS, ROWS);   // one tile per grid cell

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_W, 0.1, ROOM_D),
      new THREE.MeshPhongMaterial({ map: tex }),
    );
    mesh.position.y = -0.05;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  _buildWalls() {
    const hw = ROOM_W / 2;
    const hd = ROOM_D / 2;
    const hy = WALL_H / 2;

    const wall = (w, d, x, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_H, d), wallMat);
      m.position.set(x, hy, z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.scene.add(m);
    };

    wall(ROOM_W + WALL_T, WALL_T, 0, -hd);              // back
    wall(WALL_T, ROOM_D,          -hw, 0);               // left
    wall(WALL_T, ROOM_D,           hw, 0);               // right
    const sw = (ROOM_W - ENTRANCE_W) / 2;
    wall(sw, WALL_T, -hw + sw / 2, hd);                  // front-left
    wall(sw, WALL_T,  hw - sw / 2, hd);                  // front-right
  }

  _buildEntrance() {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(ENTRANCE_W, 0.08, 1.2),
      entranceMat,
    );
    m.position.set(0, 0.04, ROOM_D / 2 - 0.7);
    this.scene.add(m);
  }

  _buildSlots() {
    for (const def of SLOT_DEFS) {
      const pos  = gridToWorld(def.col, def.row, def.colSpan, def.rowSpan);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(
          def.colSpan * CELL - 0.25,
          0.06,
          def.rowSpan * CELL - 0.25,
        ),
        slotMat,
      );
      mesh.position.set(pos.x, 0.03, pos.z);
      this.scene.add(mesh);

      this.slots.push({
        id:          def.id,
        typeKey:     def.typeKey,
        gridCol:     def.col,
        gridRow:     def.row,
        gridColSpan: def.colSpan,
        gridRowSpan: def.rowSpan,
        position:    pos,
        markerMesh:  mesh,
        item:        null,
      });
    }
  }
}
