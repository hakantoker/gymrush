import * as THREE from 'three';

export const CELL   = 2;   // world units per grid cell
const COLS          = 7;
const ROWS          = 6;
export const ROOM_W = COLS * CELL;   // 14
export const ROOM_D = ROWS * CELL;   // 12
const WALL_H        = 1.5;           // low walls — player sees room clearly
const WALL_T        = 0.3;
const ENTRANCE_W    = 3;

const floorMat    = new THREE.MeshPhongMaterial({ color: 0xC8A882 });
const wallMat     = new THREE.MeshPhongMaterial({ color: 0xE0D5C5 });
const slotMat     = new THREE.MeshPhongMaterial({ color: 0x7BAABF });
const entranceMat = new THREE.MeshPhongMaterial({ color: 0x88C878 });

// Slot definitions
//   col/row  — top-left grid cell of this slot (col 0–6 left→right, row 0–5 back→front)
//   colSpan/rowSpan — how many cells the item occupies
//   typeKey  — key into ITEM_TYPES; null = reserved / not yet assigned
//
// Layout with 2-row machines (row 5 = entrance buffer, rows 3-4 = treadmills,
// rows 1-2 = bench / bike / dumbbell, row 0 = back utilities)
const SLOT_DEFS = [
  { id: 'treadmill_1', col: 1, row: 3, colSpan: 1, rowSpan: 2, typeKey: 'TREADMILL'     },
  { id: 'treadmill_2', col: 3, row: 3, colSpan: 1, rowSpan: 2, typeKey: 'TREADMILL'     },
  { id: 'bench_1',     col: 1, row: 1, colSpan: 1, rowSpan: 2, typeKey: 'BENCH'         },
  { id: 'bike_1',      col: 3, row: 1, colSpan: 1, rowSpan: 2, typeKey: 'BIKE'          },
  { id: 'dumbbell_1',  col: 5, row: 1, colSpan: 2, rowSpan: 1, typeKey: 'DUMBBELL_RACK' },
  { id: 'bathroom',    col: 0, row: 0, colSpan: 1, rowSpan: 1, typeKey: null             },
  { id: 'locker_1',    col: 4, row: 0, colSpan: 2, rowSpan: 1, typeKey: null             },
];

// Returns the world-space centre of a slot given its top-left cell + span.
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
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_W, 0.1, ROOM_D),
      floorMat,
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
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, WALL_H, d),
        wallMat,
      );
      mesh.position.set(x, hy, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    };

    wall(ROOM_W + WALL_T, WALL_T, 0, -hd);          // back
    wall(WALL_T, ROOM_D,          -hw, 0);            // left
    wall(WALL_T, ROOM_D,           hw, 0);            // right
    const sideW = (ROOM_W - ENTRANCE_W) / 2;
    wall(sideW, WALL_T, -hw + sideW / 2, hd);        // front-left
    wall(sideW, WALL_T,  hw - sideW / 2, hd);        // front-right
  }

  _buildEntrance() {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(ENTRANCE_W, 0.08, 1),
      entranceMat,
    );
    mesh.position.set(0, 0.04, ROOM_D / 2 - 0.6);
    this.scene.add(mesh);
  }

  _buildSlots() {
    for (const def of SLOT_DEFS) {
      const pos     = gridToWorld(def.col, def.row, def.colSpan, def.rowSpan);
      const markerW = def.colSpan * CELL - 0.2;
      const markerD = def.rowSpan * CELL - 0.2;

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(markerW, 0.06, markerD),
        slotMat,
      );
      mesh.position.set(pos.x, 0.03, pos.z);
      this.scene.add(mesh);

      this.slots.push({
        id:           def.id,
        typeKey:      def.typeKey,
        gridCol:      def.col,
        gridRow:      def.row,
        gridColSpan:  def.colSpan,
        gridRowSpan:  def.rowSpan,
        position:     pos,
        markerMesh:   mesh,
        item:         null,
      });
    }
  }
}
