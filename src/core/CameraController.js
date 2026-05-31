import * as THREE from 'three';

// Isometric pan directions for each arrow key.
// In isometric space (camera at +X,+Y,+Z looking at origin):
//   Right  → world (+x, -z)
//   Left   → world (-x, +z)
//   Up     → world (-x, -z)
//   Down   → world (+x, +z)
// All diagonals, so each component is 1/√2 ≈ 0.707.
const PAN = {
  ArrowRight: new THREE.Vector3( 1,  0, -1).normalize(),
  ArrowLeft:  new THREE.Vector3(-1,  0,  1).normalize(),
  ArrowUp:    new THREE.Vector3(-1,  0, -1).normalize(),
  ArrowDown:  new THREE.Vector3( 1,  0,  1).normalize(),
};

const PAN_SPEED = 9;   // world units per second

export class CameraController {
  constructor(camera, input) {
    this.camera = camera;
    this.input  = input;
  }

  update(delta) {
    const move = new THREE.Vector3();

    for (const [key, dir] of Object.entries(PAN)) {
      if (this.input.isDown(key)) move.add(dir);
    }

    if (move.lengthSq() === 0) return;

    move.normalize().multiplyScalar(PAN_SPEED * delta);
    this.camera.position.add(move);
    // No need to call lookAt — camera keeps its fixed isometric orientation
  }
}
