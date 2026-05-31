/**
 * Reads WASD and returns a normalised {x, z} movement vector each frame.
 * Diagonal movement is normalised so speed is consistent in all directions.
 *
 * In world space (camera at +X,+Y,+Z, isometric):
 *   W → -Z   S → +Z   A → -X   D → +X
 */
export class DesktopControls {
  constructor(input) {
    this._input = input;
  }

  /** @returns {{ x: number, z: number }} Each component in [-1, 1]. */
  getMovement() {
    const i = this._input;
    let x = 0, z = 0;

    // WASD only — arrow keys are reserved for camera panning (CameraController)
    if (i.isDown('KeyW')) z -= 1;
    if (i.isDown('KeyS')) z += 1;
    if (i.isDown('KeyA')) x -= 1;
    if (i.isDown('KeyD')) x += 1;

    // Normalise diagonal so player never moves faster on diagonals
    if (x !== 0 && z !== 0) { x *= 0.7071; z *= 0.7071; }

    return { x, z };
  }
}
