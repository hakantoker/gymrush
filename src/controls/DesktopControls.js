/**
 * WASD movement mapped to isometric world directions.
 *
 * The camera sits at (18,18,18) looking at origin, so screen axes project as:
 *   screen right (+D) → world (+x, -z)
 *   screen left  (+A) → world (-x, +z)
 *   screen up    (+W) → world (-x, -z)
 *   screen down  (+S) → world (+x, +z)
 *
 * Arrow keys are NOT bound here — they belong to CameraController (panning).
 */
const INV_SQRT2 = 0.7071067811865476;

export class DesktopControls {
  constructor(input) {
    this._input = input;
  }

  /** @returns {{ x: number, z: number }} Normalised world-space movement vector. */
  getMovement() {
    const i = this._input;
    let sx = 0, sy = 0;   // raw screen-space axes before projection

    if (i.isDown('KeyW')) sy += 1;
    if (i.isDown('KeyS')) sy -= 1;
    if (i.isDown('KeyA')) sx -= 1;
    if (i.isDown('KeyD')) sx += 1;

    if (sx === 0 && sy === 0) return { x: 0, z: 0 };

    // Project screen → world XZ using the isometric camera mapping
    let wx = (sx - sy) * INV_SQRT2;
    let wz = (-sx - sy) * INV_SQRT2;

    // Normalise so all directions (including diagonals) have the same speed
    const len = Math.sqrt(wx * wx + wz * wz);
    return { x: wx / len, z: wz / len };
  }
}
