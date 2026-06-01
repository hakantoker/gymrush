import * as THREE          from 'three';
import { ROOM_D }          from '../scene/GymRoom.js';
import { buildCashierModel } from './cashierModel.js';

const MAX_QUEUE = 5;

export class CashierStation {
  /**
   * Positioned left of the entrance so it doesn't block the main traffic path.
   * Queue extends into the room interior (toward -Z from the counter).
   */
  constructor(scene) {
    this._scene = scene;

    // Left side of entrance area, just inside the front wall
    this.worldPosition = new THREE.Vector3(-5, 0, ROOM_D / 2 - 1.8);

    this._currentCustomer = null;
    this.queue            = [];
    this.maxQueueSize     = MAX_QUEUE;

    // Queue line extends toward room interior (-Z) at 1.2-unit spacing
    this.queuePositions = Array.from({ length: MAX_QUEUE }, (_, i) =>
      new THREE.Vector3(
        this.worldPosition.x,
        0,
        this.worldPosition.z - 1.3 - i * 1.2,
      ),
    );

    this.mesh = buildCashierModel();
    this.mesh.position.copy(this.worldPosition);
    // Rotate so the front face (screen, keypad) faces the room interior (-Z)
    this.mesh.rotation.y = Math.PI;
    scene.add(this.mesh);
  }

  // ── Queue API (mirrors OccupiableItem for customer compatibility) ──────────

  isAvailable() { return this._currentCustomer === null; }
  canQueue()    { return this.queue.length < this.maxQueueSize; }

  /** Add customer to queue tail. Returns their queue position, or null if full. */
  enqueue(customer) {
    if (!this.canQueue()) return null;
    this.queue.push(customer);
    return this.queuePositions[this.queue.length - 1];
  }

  /** Remove and return the first customer in line. */
  dequeue() { return this.queue.shift() ?? null; }

  /** Remove a specific customer from anywhere in the queue. */
  leaveQueue(customer) {
    this.queue = this.queue.filter(c => c !== customer);
  }

  // ── Payment lifecycle ─────────────────────────────────────────────────────

  /** Called by Customer when they arrive at the counter. */
  startPayment(customer) {
    this._currentCustomer = customer;
  }

  /** Called by Customer when their payment timer completes. */
  endPayment() {
    this._currentCustomer = null;
  }
}
