/**
 * Mobile joystick controls — stub.
 * Will be wired to a virtual joystick UI element (PixiJS overlay).
 * The joystick sets _x/_z in [-1, 1] via setJoystick(), called by the UI layer.
 */
export class MobileControls {
  constructor() {
    this._x = 0;
    this._z = 0;
  }

  /** Called by the joystick UI when the stick moves. */
  setJoystick(x, z) {
    this._x = x;
    this._z = z;
  }

  /** Called by the joystick UI when the stick is released. */
  release() {
    this._x = 0;
    this._z = 0;
  }

  /** @returns {{ x: number, z: number }} */
  getMovement() {
    return { x: this._x, z: this._z };
  }
}
