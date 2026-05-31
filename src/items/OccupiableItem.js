import { GymItem } from './GymItem.js';

export class OccupiableItem extends GymItem {
  constructor(typeConfig, slotData) {
    super(typeConfig, slotData);
    this.usingPeople  = [];
    this.maxCapacity  = typeConfig.maxCapacity ?? 1;
  }

  isAvailable() {
    return this.state === 'IDLE' && this.usingPeople.length < this.maxCapacity;
  }

  // Called by a customer agent when they claim this item.
  startSession(customer) {
    this.usingPeople.push(customer);
    this.setState('IN_USE');
  }

  // Called by a customer agent when their session ends.
  // Subclasses override to add post-session logic (wear check, etc.)
  endSession(customer) {
    this.usingPeople = this.usingPeople.filter(c => c !== customer);
    if (this.usingPeople.length === 0) {
      this.setState('IDLE');
    }
  }

  toJSON() {
    return { ...super.toJSON(), usingCount: this.usingPeople.length };
  }
}
