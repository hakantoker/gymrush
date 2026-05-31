import * as THREE from 'three';

export const CELL = 2;          // world units per grid cell
const COLS      = 7;
const ROWS      = 6;
export const ROOM_W = COLS * CELL;  // 14
export const ROOM_D = ROWS * CELL;  // 12
const WALL_H    = 3.5;
const WALL_T    = 0.3;
const ENTRANCE_W = 3;

// Warm-neutral palette (GDD: flat shading, limited palette)
const floorMat   = new THREE.MeshPhongMaterial({ color: 0xC8A882 });
const wallMat    = new THREE.MeshPhongMaterial({ color: 0xE0D5C5 });
const slotMat    = new THREE.MeshPhongMaterial({ color: 0x7BAABF });
const entranceMat = new THREE.MeshPhongMaterial({ color: 0x88C878 });

// Slot definitions — col/row in grid coords (col 0–6 left→right, row 0–5 back→front)
// row 0 = back of room (z ≈ -5), row 5 = front near entrance (z ≈ +5)
// typeKey maps to ITEM_TYPES in itemTypes.js; null = reserved slot with no item yet
const SLOT_DEFS = [
  { id: 'treadmill_1', col: 1, row: 4, typeKey: 'TREADMILL' },
  { id: 'treadmill_2', col: 3, row: 4, typeKey: 'TREADMILL' },
  { id: 'bench_1',     col: 1, row: 2, typeKey: 'BENCH'     },
  { id: 'bike_1',      col: 3, row: 2, typeKey: 'BIKE'      },
  { id: 'dumbbell_1',  col: 5, row: 2, typeKey: 'DUMBBELL_RACK' },
  { id: 'bathroom',    col: 1, row: 0, typeKey: null         },
  { id: 'locker_1',    col: 5, row: 0, typeKey: null         },
];

export function gridToWorld(col, row) {
  return new THREE.Vector3(
    -ROOM_W / 2 + col * CELL + CELL / 2,
    0,
    -ROOM_D / 2 + row * CELL + CELL / 2
  );
}

export class GymRoom {
  constructor(scene) {
    this.scene = scene;
    /** @type {Array<{id:string, position:THREE.Vector3, mesh:THREE.Mesh, machine:null}>} */
    this.slots = [];
    this._buildFloor();
    this._buildWalls();
    this._buildEntrance();
    this._buildSlots();
  }

  _buildFloor() {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_W, 0.1, ROOM_D),
      floorMat
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
        wallMat
      );
      mesh.position.set(x, hy, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    };

    // Back wall (z = -hd)
    wall(ROOM_W + WALL_T, WALL_T, 0, -hd);
    // Left wall (x = -hw)
    wall(WALL_T, ROOM_D, -hw, 0);
    // Right wall (x = +hw)
    wall(WALL_T, ROOM_D, hw, 0);
    // Front wall with entrance gap (z = +hd): two side segments
    const sideW = (ROOM_W - ENTRANCE_W) / 2;
    wall(sideW, WALL_T, -hw + sideW / 2, hd);
    wall(sideW, WALL_T,  hw - sideW / 2, hd);
  }

  _buildEntrance() {
    // Green mat just inside the entrance gap
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(ENTRANCE_W, 0.08, 1),
      entranceMat
    );
    mesh.position.set(0, 0.04, ROOM_D / 2 - 0.6);
    this.scene.add(mesh);
  }

  _buildSlots() {
    for (const def of SLOT_DEFS) {
      const pos = gridToWorld(def.col, def.row);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(CELL - 0.2, 0.06, CELL - 0.2),
        slotMat
      );
      mesh.position.set(pos.x, 0.03, pos.z);
      this.scene.add(mesh);
      this.slots.push({
        id:      def.id,
        typeKey: def.typeKey,
        gridCol: def.col,
        gridRow: def.row,
        position: pos,
        markerMesh: mesh,  // the blue slot-marker quad; distinct from the item mesh
        item: null,        // filled by ItemManager after item creation
      });
    }
  }
}
