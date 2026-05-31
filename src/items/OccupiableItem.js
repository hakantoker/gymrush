import * as THREE from 'three';
import { GymItem }  from './GymItem.js';
import { CELL }     from '../scene/GymRoom.js';

export class OccupiableItem extends GymItem {
  constructor(typeConfig, slotData) {
    super(typeConfig, slotData);

    this.maxCapacity  = typeConfig.maxCapacity  ?? 1;
    this.maxQueueSize = typeConfig.maxQueueSize ?? 3;

    /** Customers currently using the item. */
    this.usingPeople = [];

    /** Ordered list of waiting customers (index 0 = next in line). */
    this.queue = [];

    /** World-space positions where queuing customers stand.
     *  Extends in +z (toward entrance) from the item's front edge. */
    this.queuePositions = this._computeQueuePositions(
      slotData.gridRowSpan ?? 1,
    );
  }

  // ── Availability ───────────────────────────────────────────────────────────

  isAvailable() {
    return this.state === 'IDLE' && this.usingPeople.length < this.maxCapacity;
  }

  canQueue() {
    return this.queue.length < this.maxQueueSize;
  }

  // ── Session lifecycle ──────────────────────────────────────────────────────

  startSession(customer) {
    this.usingPeople.push(customer);
    this.setState('IN_USE');
  }

  // Subclasses (Machine) override this to add wear logic before calling super.
  endSession(customer) {
    this.usingPeople = this.usingPeople.filter(c => c !== customer);
    if (this.usingPeople.length === 0) this.setState('IDLE');
  }

  // ── Queue management ───────────────────────────────────────────────────────

  /** Add a customer to the back of the queue. Returns their queue position. */
  enqueue(customer) {
    if (!this.canQueue()) return null;
    this.queue.push(customer);
    return this.queuePositions[this.queue.length - 1] ?? null;
  }

  /** Remove and return the next customer from the front of the queue. */
  dequeue() {
    return this.queue.shift() ?? null;
  }

  /** Remove a specific customer from anywhere in the queue (e.g. impatient leave). */
  leaveQueue(customer) {
    this.queue = this.queue.filter(c => c !== customer);
  }

  /** World position a customer at queue index i should stand at. */
  getQueuePosition(index) {
    return this.queuePositions[index] ?? null;
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  _computeQueuePositions(rowSpan) {
    const frontEdgeZ = this.worldPosition.z + (rowSpan * CELL) / 2;
    const positions  = [];
    for (let i = 0; i < this.maxQueueSize; i++) {
      positions.push(new THREE.Vector3(
        this.worldPosition.x,
        0,
        frontEdgeZ + 0.6 + i * 0.9,
      ));
    }
    return positions;
  }

  toJSON() {
    return { ...super.toJSON(), usingCount: this.usingPeople.length, queueLength: this.queue.length };
  }
}
