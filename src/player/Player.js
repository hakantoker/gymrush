import * as THREE          from 'three';
import { buildPlayerModel } from './playerModel.js';
import { ROOM_W, ROOM_D }   from '../scene/GymRoom.js';

const SPEED      = 6.5;   // world units per second
const HALF_W     = ROOM_W / 2 - 0.3;
const HALF_D     = ROOM_D / 2 - 0.3;
const ROT_SPEED  = 14;    // radians per second for smooth facing

export class Player {
  /**
   * @param {THREE.Scene} scene
   * @param {DesktopControls|MobileControls} controls
   */
  constructor(scene, controls) {
    this._scene    = scene;
    this._controls = controls;

    // Start just inside the entrance (front of room)
    this.position = new THREE.Vector3(0, 0, ROOM_D / 2 - 1.5);
    this._targetAngle = 0;

    this.mesh = buildPlayerModel();
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
  }

  update(delta) {
    const { x, z } = this._controls.getMovement();
    const moving    = x !== 0 || z !== 0;

    if (moving) {
      // Translate
      this.position.x = THREE.MathUtils.clamp(
        this.position.x + x * SPEED * delta, -HALF_W, HALF_W,
      );
      this.position.z = THREE.MathUtils.clamp(
        this.position.z + z * SPEED * delta, -HALF_D, HALF_D,
      );

      // Smooth facing — lerp toward target angle
      this._targetAngle = Math.atan2(x, z);
    }

    // Always lerp rotation so the character eases into facing direction
    const current = this.mesh.rotation.y;
    let diff = this._targetAngle - current;
    // Wrap to [-π, π] to always take the short arc
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.mesh.rotation.y += diff * Math.min(1, ROT_SPEED * delta);

    this.mesh.position.set(this.position.x, 0, this.position.z);
  }

  /** Returns the controls instance so the UI layer can call setJoystick() on mobile. */
  get controls() { return this._controls; }
}
