import * as THREE            from 'three';
import { buildCustomerModel } from './customerModel.js';
import { ItemCategory }       from '../items/itemTypes.js';
import { ROOM_D }             from '../scene/GymRoom.js';

export const CState = Object.freeze({
  BROWSING:            'BROWSING',
  WALKING_TO_MACHINE:  'WALKING_TO_MACHINE',
  IN_QUEUE:            'IN_QUEUE',
  USING_MACHINE:       'USING_MACHINE',
  WALKING_TO_EXIT:     'WALKING_TO_EXIT',
  LEAVING_UNHAPPY:     'LEAVING_UNHAPPY',
});

const WALK_SPEED   = 3.8;   // slightly slower than player
const ARRIVAL_DIST = 0.35;
const PATIENCE     = 40;    // seconds before giving up if no machine / queue available
const BROWSE_WAIT  = 1.5;   // re-scan interval while waiting for a machine

export class Customer {
  /**
   * @param {THREE.Scene}   scene
   * @param {ItemManager}   itemManager
   * @param {Economy}       economy
   * @param {(c:Customer)=>void} onDone  called when customer leaves the scene
   */
  constructor(scene, itemManager, economy, onDone) {
    this._scene       = scene;
    this._items       = itemManager;
    this._economy     = economy;
    this._onDone      = onDone;

    this.satisfaction   = 100;
    this._state         = null;
    this._targetMachine = null;
    this._targetPos     = new THREE.Vector3();
    this._sessionTimer  = 0;
    this._patienceTimer = PATIENCE;
    this._browseTimer   = 0;   // starts at 0 so first scan is immediate

    // Spawn inside the entrance gap with slight random x offset
    this.position = new THREE.Vector3(
      (Math.random() * 2 - 1) * 1.6,
      0,
      ROOM_D / 2 - 1.2,
    );

    this.mesh = buildCustomerModel();
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);

    this._setState(CState.BROWSING);
  }

  // ── Public ─────────────────────────────────────────────────────────────────

  get state() { return this._state; }

  update(delta) {
    switch (this._state) {
      case CState.BROWSING:           this._tickBrowsing(delta);          break;
      case CState.WALKING_TO_MACHINE: this._tickWalkingToMachine(delta);  break;
      case CState.IN_QUEUE:           this._tickInQueue(delta);           break;
      case CState.USING_MACHINE:      this._tickUsingMachine(delta);      break;
      case CState.WALKING_TO_EXIT:
      case CState.LEAVING_UNHAPPY:    this._tickWalkingToExit(delta);     break;
    }

    this.mesh.position.set(this.position.x, 0, this.position.z);
  }

  // ── State handlers ─────────────────────────────────────────────────────────

  _tickBrowsing(delta) {
    this._patienceTimer -= delta;
    if (this._patienceTimer <= 0) { this._leaveUnhappy(); return; }

    this._browseTimer -= delta;
    if (this._browseTimer > 0) return;
    this._browseTimer = BROWSE_WAIT;

    // 1. Try to claim an immediately available machine
    const free = this._items.getAvailable(ItemCategory.MACHINE);
    if (free.length > 0) {
      const m = free[Math.floor(Math.random() * free.length)];
      this._targetMachine = m;
      this._targetPos.copy(m.worldPosition);
      this._setState(CState.WALKING_TO_MACHINE);
      return;
    }

    // 2. Try to join a queue
    const queuable = this._items.all().filter(
      item => item.typeConfig?.category === ItemCategory.MACHINE && item.canQueue?.(),
    );
    if (queuable.length > 0) {
      const m      = queuable[Math.floor(Math.random() * queuable.length)];
      const qPos   = m.enqueue(this);
      if (qPos) {
        this._targetMachine = m;
        this._targetPos.copy(qPos);
        this._setState(CState.IN_QUEUE);
      }
    }
    // else: keep waiting and retry after BROWSE_WAIT
  }

  _tickWalkingToMachine(delta) {
    if (!this._moveTo(this._targetPos, delta)) return;

    const m = this._targetMachine;
    if (m.isAvailable()) {
      m.startSession(this);
      this._sessionTimer = m.typeConfig.useDuration;
      this._setState(CState.USING_MACHINE);
    } else if (m.canQueue()) {
      const qPos = m.enqueue(this);
      if (qPos) {
        this._targetPos.copy(qPos);
        this._setState(CState.IN_QUEUE);
      } else {
        this._retryBrowse();
      }
    } else {
      this._retryBrowse();
    }
  }

  _tickInQueue(delta) {
    // Patience erodes faster while queuing
    this._patienceTimer -= delta * 1.4;
    if (this._patienceTimer <= 0) {
      this._targetMachine?.leaveQueue(this);
      this.satisfaction = Math.max(0, this.satisfaction - 20);
      this._leaveUnhappy();
      return;
    }

    // Machine broke while waiting
    if (this._targetMachine?.state === 'BROKEN') {
      this._targetMachine.leaveQueue(this);
      this.satisfaction = Math.max(0, this.satisfaction - 15);
      this._retryBrowse();
      return;
    }

    this._moveTo(this._targetPos, delta);

    // Claim machine when we're first in queue and it becomes idle
    const m = this._targetMachine;
    if (m?.isAvailable() && m.queue[0] === this) {
      m.dequeue();
      m.startSession(this);
      this._sessionTimer = m.typeConfig.useDuration;
      this._setState(CState.USING_MACHINE);
    }
  }

  _tickUsingMachine(delta) {
    this._sessionTimer -= delta;
    if (this._sessionTimer > 0) return;

    const m = this._targetMachine;
    m.endSession(this);

    // Payment: fee + tip proportional to satisfaction (up to 30%)
    const fee = m.typeConfig.feePerSession ?? 10;
    const tip = Math.round(fee * (this.satisfaction / 100) * 0.3);
    this._economy.earn(fee + tip);

    this._targetMachine = null;
    this._walkToExit();
  }

  _tickWalkingToExit(delta) {
    if (this._moveTo(this._targetPos, delta)) this._despawn();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Move toward target. Returns true when arrived. */
  _moveTo(target, delta) {
    const dx   = target.x - this.position.x;
    const dz   = target.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < ARRIVAL_DIST) return true;

    const step = Math.min(dist, WALK_SPEED * delta);
    this.position.x += (dx / dist) * step;
    this.position.z += (dz / dist) * step;
    this.mesh.rotation.y = Math.atan2(dx, dz);
    return false;
  }

  _walkToExit() {
    // Head toward a random spot along the entrance gap
    this._targetPos.set((Math.random() * 2 - 1) * 1.6, 0, ROOM_D / 2 + 0.5);
    this._setState(CState.WALKING_TO_EXIT);
  }

  _leaveUnhappy() {
    this._targetPos.set((Math.random() * 2 - 1) * 1.6, 0, ROOM_D / 2 + 0.5);
    this._setState(CState.LEAVING_UNHAPPY);
  }

  _retryBrowse() {
    this._targetMachine = null;
    this._browseTimer   = BROWSE_WAIT;
    this._setState(CState.BROWSING);
  }

  _setState(s) { this._state = s; }

  _despawn() {
    this._scene.remove(this.mesh);
    this._onDone(this);
  }
}
