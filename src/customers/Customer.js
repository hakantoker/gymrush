import * as THREE             from 'three';
import { buildCustomerModel }  from './customerModel.js';
import { ItemCategory }        from '../items/itemTypes.js';
import { ROOM_D }              from '../scene/GymRoom.js';
import { pickDiscipline }      from './disciplines.js';
import { pickProgram }         from './trainingPrograms.js';

export const CState = Object.freeze({
  WALKING_TO_MACHINE:    'WALKING_TO_MACHINE',
  IN_QUEUE:              'IN_QUEUE',
  USING_MACHINE:         'USING_MACHINE',
  WALKING_TO_DISPENSER:  'WALKING_TO_DISPENSER',
  AT_DISPENSER:          'AT_DISPENSER',
  WAITING:               'WAITING',          // all wished machines busy — retry after delay
  WALKING_TO_CASHIER:    'WALKING_TO_CASHIER',
  IN_CASHIER_QUEUE:      'IN_CASHIER_QUEUE',
  AT_CASHIER:            'AT_CASHIER',
  WALKING_TO_EXIT:       'WALKING_TO_EXIT',
  LEAVING_UNHAPPY:       'LEAVING_UNHAPPY',
});

const WALK_SPEED         = 3.8;
const ARRIVAL_DIST       = 0.35;
const INITIAL_SAT        = 50;
const PATIENCE           = 60;    // seconds before forced exit
const DISPENSER_DURATION = 2;     // seconds at water dispenser
const PAYMENT_DURATION   = 2.5;   // seconds being served at the cashier

// Satisfaction drain rates (points/second) by state
const SAT_DRAIN = {
  [CState.WAITING]:          0.6,
  [CState.IN_QUEUE]:         1.2,
  [CState.IN_CASHIER_QUEUE]: 0.8,
};

export class Customer {
  /**
   * @param {THREE.Scene}          scene
   * @param {ItemManager}          itemManager
   * @param {Economy}              economy
   * @param {CashierStation}       cashier
   * @param {(c:Customer)=>void}   onDone
   */
  constructor(scene, itemManager, economy, cashier, onDone) {
    this._scene    = scene;
    this._items    = itemManager;
    this._economy  = economy;
    this._cashier  = cashier;
    this._onDone   = onDone;

    // Discipline (optional) → biases program selection
    this._discipline = pickDiscipline();
    this._program    = pickProgram(this._discipline);

    // Wish list: Set of machine typeKeys scored against program goals
    this._wishList = this._buildWishList();

    // Muscle group gains accumulated across all machines used this session
    this._gainedGroups = {};

    this.satisfaction    = INITIAL_SAT;
    this._state          = null;
    this._targetMachine  = null;
    this._targetTypeKey  = null;
    this._targetDispenser = null;
    this._targetPos      = new THREE.Vector3();
    this._sessionTimer   = 0;
    this._dispenserTimer = 0;
    this._waitTimer      = 0;
    this._paymentTimer   = 0;
    this._patienceTimer  = PATIENCE;

    // Fees accrue per machine used, then paid all at once at the cashier
    this._accruedFee     = 0;

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

  get state()          { return this._state; }
  get programName()    { return this._program.name; }
  get disciplineName() { return this._discipline?.name ?? 'Casual'; }

  update(delta) {
    // Patience countdown — paused once being served or already leaving.
    // Note: customers who give up while heading to / queuing at the cashier
    // leave WITHOUT paying their accrued fee, so a slow line costs the gym.
    if (this._state !== CState.WALKING_TO_EXIT &&
        this._state !== CState.LEAVING_UNHAPPY &&
        this._state !== CState.AT_CASHIER) {
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
      case CState.WALKING_TO_CASHIER:   this._tickWalkToCashier(delta);  break;
      case CState.IN_CASHIER_QUEUE:     this._tickInCashierQueue(delta); break;
      case CState.AT_CASHIER:           this._tickAtCashier(delta);      break;
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

    if (this._wishList.size === 0) { this._goToCashier(); return; }

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

    // Session complete — record muscle group gains
    for (const [group, value] of Object.entries(m.typeConfig.effects ?? {})) {
      this._gainedGroups[group] = Math.min(5,
        (this._gainedGroups[group] ?? 0) + value,
      );
    }

    // Accrue the fee — actual payment happens later at the cashier
    this._accruedFee += m.typeConfig.feePerSession ?? 10;

    m.endSession(this);
    this._wishList.delete(this._targetTypeKey);
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

  _tickWalkToCashier(delta) {
    if (!this._moveTo(this._targetPos, delta)) return;

    // Claim the counter if free, otherwise take a spot in line
    if (this._cashier.isAvailable()) {
      this._cashier.startPayment(this);
      this._paymentTimer = PAYMENT_DURATION;
      this._setState(CState.AT_CASHIER);
    } else {
      const pos = this._cashier.enqueue(this);
      if (pos) {
        this._targetPos.copy(pos);
        this._setState(CState.IN_CASHIER_QUEUE);
      } else {
        // Line is full — wait near the counter and retry shortly
        this._waitTimer = 1.5;
        this._setState(CState.WAITING);
      }
    }
  }

  _tickInCashierQueue(delta) {
    this._moveTo(this._targetPos, delta);

    // Advance to the counter once first in line and it frees up
    if (this._cashier.isAvailable() && this._cashier.queue[0] === this) {
      this._cashier.dequeue();
      this._cashier.startPayment(this);
      this._paymentTimer = PAYMENT_DURATION;
      this._setState(CState.AT_CASHIER);
    } else {
      // Keep our queue target in sync as the line advances
      const idx = this._cashier.queue.indexOf(this);
      if (idx >= 0) this._targetPos.copy(this._cashier.queuePositions[idx]);
    }
  }

  _tickAtCashier(delta) {
    this._paymentTimer -= delta;
    if (this._paymentTimer > 0) return;

    // Final payment: accrued fees + tip scaled by final satisfaction
    const tip   = Math.round(this._accruedFee * (this.satisfaction / INITIAL_SAT) * 0.3);
    const total = this._accruedFee + tip;
    if (total > 0) this._economy.earn(total, this._cashier.worldPosition);

    this._cashier.endPayment();
    this._walkToExit();
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
   * Score a machine type against this program's goals.
   * score = Σ machineEffect[g] × programGoal[g]  for each muscle group g.
   * Small random noise prevents all customers from picking identical lists.
   */
  _scoreMachineType(typeConfig) {
    const goals = this._program.goals;
    let score = 0;
    for (const [group, value] of Object.entries(typeConfig.effects ?? {})) {
      score += value * (goals[group] ?? 0);
    }
    return score + Math.random() * 2; // ±noise for variety
  }

  /**
   * Build a wish list (Set of typeKeys) using score-based greedy selection.
   * Scores each distinct machine type, sorts descending, takes top N.
   * Falls back to all available machines if no type matches the program.
   */
  _buildWishList() {
    const [minCount, maxCount] = this._program.machineCount;
    const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));

    // Collect one score per distinct machine typeKey
    const scored = new Map(); // typeKey → score
    for (const item of this._items.all()) {
      if (item.typeConfig.category !== ItemCategory.MACHINE) continue;
      const key = item.typeConfig.key;
      if (!scored.has(key)) scored.set(key, this._scoreMachineType(item.typeConfig));
    }

    // Sort descending; fall back to all types if nothing scored positively
    const sorted = [...scored.entries()].sort((a, b) => b[1] - a[1]);
    const positive = sorted.filter(([, s]) => s > 0);
    const candidates = positive.length > 0 ? positive : sorted;

    return new Set(candidates.slice(0, Math.min(count, candidates.length)).map(([k]) => k));
  }

  /**
   * Computes a satisfaction bonus (0–30) based on how well the machines used
   * this session fulfilled the program's muscle group goals.
   *
   * fulfillment per group = min(gained[g], 5) / 5    (0–1)
   * bonus = weighted avg of fulfillments × 30
   */
  _computeGoalBonus() {
    const goals = this._program.goals;
    let totalWeight = 0;
    let achieved    = 0;
    for (const [group, weight] of Object.entries(goals)) {
      totalWeight += weight;
      const gained      = Math.min(5, this._gainedGroups[group] ?? 0);
      const fulfillment = gained / 5;
      achieved += fulfillment * weight;
    }
    if (totalWeight === 0) return 0;
    return (achieved / totalWeight) * 30;
  }

  /** Training done — apply goal bonus, then head to the cashier to pay. */
  _goToCashier() {
    // Goal-completion satisfaction bonus is locked in once training ends
    const bonus = this._computeGoalBonus();
    this.satisfaction = Math.min(100, this.satisfaction + bonus);

    this._targetPos.copy(this._cashier.worldPosition);
    this._setState(CState.WALKING_TO_CASHIER);
  }

  _walkToExit() {
    this._targetPos.set((Math.random() * 2 - 1) * 1.6, 0, ROOM_D / 2 + 0.5);
    this._setState(CState.WALKING_TO_EXIT);
  }

  _leaveUnhappy() {
    // No goal bonus — they're leaving early
    this._targetPos.set((Math.random() * 2 - 1) * 1.6, 0, ROOM_D / 2 + 0.5);
    this._setState(CState.LEAVING_UNHAPPY);
  }

  /** Clean up any active machine / cashier queue claim before forcing an exit. */
  _cleanup() {
    if (this._targetMachine && this._state === CState.IN_QUEUE) {
      this._targetMachine.leaveQueue(this);
    }
    if (this._state === CState.IN_CASHIER_QUEUE) {
      this._cashier.leaveQueue(this);
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
