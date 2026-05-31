import * as THREE            from 'three';
import { buildCustomerModel } from './customerModel.js';
import { ItemCategory }       from '../items/itemTypes.js';
import { ROOM_D }             from '../scene/GymRoom.js';
import { PROGRAMS }           from './trainingPrograms.js';

export const CState = Object.freeze({
  WALKING_TO_MACHINE:    'WALKING_TO_MACHINE',
  IN_QUEUE:              'IN_QUEUE',
  USING_MACHINE:         'USING_MACHINE',
  WALKING_TO_DISPENSER:  'WALKING_TO_DISPENSER',
  AT_DISPENSER:          'AT_DISPENSER',
  WAITING:               'WAITING',          // all wished machines busy — retry after delay
  WALKING_TO_EXIT:       'WALKING_TO_EXIT',
  LEAVING_UNHAPPY:       'LEAVING_UNHAPPY',
});

const WALK_SPEED         = 3.8;
const ARRIVAL_DIST       = 0.35;
const INITIAL_SAT        = 50;
const PATIENCE           = 60;    // seconds before forced exit
const DISPENSER_DURATION = 2;     // seconds at water dispenser

// Satisfaction drain rates (points/second) by state
const SAT_DRAIN = {
  [CState.WAITING]:   0.6,
  [CState.IN_QUEUE]:  1.2,
};

export class Customer {
  /**
   * @param {THREE.Scene}          scene
   * @param {ItemManager}          itemManager
   * @param {Economy}              economy
   * @param {(c:Customer)=>void}   onDone
   */
  constructor(scene, itemManager, economy, onDone) {
    this._scene    = scene;
    this._items    = itemManager;
    this._economy  = economy;
    this._onDone   = onDone;

    // Pick a random training program
    this._program  = PROGRAMS[Math.floor(Math.random() * PROGRAMS.length)];

    // Build the wish list: Set of machine typeKeys this customer plans to use
    this._wishList = this._buildWishList();

    this.satisfaction    = INITIAL_SAT;
    this._state          = null;
    this._targetMachine  = null;
    this._targetTypeKey  = null;
    this._targetDispenser = null;
    this._targetPos      = new THREE.Vector3();
    this._sessionTimer   = 0;
    this._dispenserTimer = 0;
    this._waitTimer      = 0;
    this._patienceTimer  = PATIENCE;

    // Spawn just inside the entrance gap with a small random x offset
    this.position = new THREE.Vector3(
      (Math.random() * 2 - 1) * 1.6,
      0,
      ROOM_D / 2 - 1.2,
    );

    this.mesh = buildCustomerModel();
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);

    // Immediately decide what to do
    this._decide();
  }

  // ── Public ─────────────────────────────────────────────────────────────────

  get state()       { return this._state; }
  get programName() { return this._program.name; }

  update(delta) {
    // Patience countdown regardless of state (except exit walks)
    if (this._state !== CState.WALKING_TO_EXIT &&
        this._state !== CState.LEAVING_UNHAPPY) {
      this._patienceTimer -= delta;
      if (this._patienceTimer <= 0) {
        this._cleanup();
        this._leaveUnhappy();
        return;
      }
    }

    // Satisfaction drains while waiting
    const drain = SAT_DRAIN[this._state] ?? 0;
    if (drain > 0) {
      this.satisfaction = Math.max(0, this.satisfaction - drain * delta);
    }

    switch (this._state) {
      case CState.WALKING_TO_MACHINE:   this._tickWalkToMachine(delta);  break;
      case CState.IN_QUEUE:             this._tickInQueue(delta);        break;
      case CState.USING_MACHINE:        this._tickUsingMachine(delta);   break;
      case CState.WALKING_TO_DISPENSER: this._tickWalkToDispenser(delta);break;
      case CState.AT_DISPENSER:         this._tickAtDispenser(delta);    break;
      case CState.WAITING:              this._tickWaiting(delta);        break;
      case CState.WALKING_TO_EXIT:
      case CState.LEAVING_UNHAPPY:      this._tickWalkToExit(delta);     break;
    }

    this.mesh.position.set(this.position.x, 0, this.position.z);
  }

  // ── Core decision function ─────────────────────────────────────────────────

  /**
   * Evaluates the wish list and transitions to the best available next action.
   * Priority: free machine → join queue → wait and retry.
   * If wish list is empty → walk to exit.
   */
  _decide() {
    // Drop types that have no gym instances (area not unlocked yet)
    for (const key of this._wishList) {
      if (this._getInstances(key).length === 0) this._wishList.delete(key);
    }

    if (this._wishList.size === 0) { this._walkToExit(); return; }

    // Priority 1 — find a free machine for any wished type
    for (const typeKey of this._wishList) {
      const free = this._getInstances(typeKey).filter(m => m.isAvailable());
      if (free.length > 0) {
        const m = free[Math.floor(Math.random() * free.length)];
        this._targetMachine = m;
        this._targetTypeKey = typeKey;
        this._targetPos.copy(m.worldPosition);
        this._setState(CState.WALKING_TO_MACHINE);
        return;
      }
    }

    // Priority 2 — join a queue (pick one with queue space)
    for (const typeKey of this._wishList) {
      const queuable = this._getInstances(typeKey).filter(m => m.canQueue?.());
      if (queuable.length > 0) {
        const m   = queuable[Math.floor(Math.random() * queuable.length)];
        const pos = m.enqueue(this);
        if (pos) {
          this._targetMachine = m;
          this._targetTypeKey = typeKey;
          this._targetPos.copy(pos);
          this._setState(CState.IN_QUEUE);
          return;
        }
      }
    }

    // Priority 3 — everything busy, wait then retry
    this._waitTimer = 3 + Math.random() * 2;
    this._setState(CState.WAITING);
  }

  // ── State handlers ─────────────────────────────────────────────────────────

  _tickWalkToMachine(delta) {
    if (!this._moveTo(this._targetPos, delta)) return;

    const m = this._targetMachine;
    if (m.isAvailable()) {
      m.startSession(this);
      this._sessionTimer = m.typeConfig.useDuration;
      this._setState(CState.USING_MACHINE);
    } else {
      // Machine was taken while walking — decide again (may pick same type or another)
      this._targetMachine = null;
      this._targetTypeKey = null;
      this._decide();
    }
  }

  _tickInQueue(delta) {
    // Machine broke while waiting
    if (this._targetMachine?.state === 'BROKEN') {
      this._targetMachine.leaveQueue(this);
      this.satisfaction = Math.max(0, this.satisfaction - 10);
      this._targetMachine = null;
      this._targetTypeKey = null;
      this._decide();
      return;
    }

    this._moveTo(this._targetPos, delta);

    // Claim the machine when we're at the front and it becomes free
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

    const m        = this._targetMachine;
    const progress = this._sessionTimer / m.typeConfig.useDuration;
    m.setTimerProgress(Math.max(0, progress));

    if (this._sessionTimer > 0) return;

    // Session complete — pay for this machine
    const fee = m.typeConfig.feePerSession ?? 10;
    const tip = Math.round(fee * (this.satisfaction / INITIAL_SAT) * 0.2);
    this._economy.earn(fee + tip);

    m.endSession(this);
    this._wishList.delete(this._targetTypeKey); // mark this type as done
    this._targetMachine = null;
    this._targetTypeKey = null;

    // Possibly go to water dispenser before the next machine
    this._tryGoToDispenser();
  }

  _tickWalkToDispenser(delta) {
    if (!this._moveTo(this._targetPos, delta)) return;
    this._targetDispenser.consume(1);
    this._dispenserTimer = DISPENSER_DURATION;
    this._setState(CState.AT_DISPENSER);
  }

  _tickAtDispenser(delta) {
    this._dispenserTimer -= delta;
    if (this._dispenserTimer <= 0) {
      this._targetDispenser = null;
      this._decide();
    }
  }

  _tickWaiting(delta) {
    this._waitTimer -= delta;
    if (this._waitTimer <= 0) this._decide();
  }

  _tickWalkToExit(delta) {
    if (this._moveTo(this._targetPos, delta)) this._despawn();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** After finishing a machine, optionally visit water dispenser first. */
  _tryGoToDispenser() {
    if (Math.random() > this._program.waterChance) {
      this._decide();
      return;
    }

    const dispensers = this._items.all().filter(
      item => item.typeConfig.key === 'WATER_DISPENSER' && item.state === 'AVAILABLE',
    );

    if (dispensers.length > 0) {
      this._targetDispenser = dispensers[0];
      this._targetPos.copy(dispensers[0].worldPosition);
      this._setState(CState.WALKING_TO_DISPENSER);
    } else {
      this._decide(); // no water available, skip
    }
  }

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

  /** All machines for all wish-list types of this typeKey. */
  _getInstances(typeKey) {
    return this._items.all().filter(item => item.typeConfig.key === typeKey);
  }

  /**
   * Build a wish list (Set of typeKeys) by matching machine effects
   * against this program's target effects, then shuffling and capping.
   */
  _buildWishList() {
    const [minCount, maxCount] = this._program.machineCount;
    const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));

    const matching = new Set();
    for (const item of this._items.all()) {
      if (item.typeConfig.category !== ItemCategory.MACHINE) continue;
      const effects = item.typeConfig.effects ?? [];
      if (effects.some(e => this._program.effects.includes(e))) {
        matching.add(item.typeConfig.key);
      }
    }

    // Fisher-Yates shuffle then slice
    const arr = [...matching];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return new Set(arr.slice(0, Math.min(count, arr.length)));
  }

  _walkToExit() {
    this._targetPos.set((Math.random() * 2 - 1) * 1.6, 0, ROOM_D / 2 + 0.5);
    this._setState(CState.WALKING_TO_EXIT);
  }

  _leaveUnhappy() {
    this._targetPos.set((Math.random() * 2 - 1) * 1.6, 0, ROOM_D / 2 + 0.5);
    this._setState(CState.LEAVING_UNHAPPY);
  }

  /** Clean up any active machine/queue claim before forcing an exit. */
  _cleanup() {
    if (this._targetMachine && this._state === CState.IN_QUEUE) {
      this._targetMachine.leaveQueue(this);
    }
    this._targetMachine = null;
    this._targetTypeKey = null;
  }

  _setState(s) { this._state = s; }

  _despawn() {
    this._scene.remove(this.mesh);
    this._onDone(this);
  }
}
