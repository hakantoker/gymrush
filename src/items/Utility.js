import { GymItem } from './GymItem.js';

export class Utility extends GymItem {
  constructor(typeConfig, slotData) {
    super(typeConfig, slotData);
    this.capacity = typeConfig.capacity;
    this.stock    = typeConfig.capacity;
    this.setState('AVAILABLE');
  }

  // Called by customer agents or other systems when the utility is used.
  consume(amount = 1) {
    this.stock = Math.max(0, this.stock - amount);
    if (this.stock === 0) this.setState('NEEDS_REFILL');
  }

  refill() {
    this.stock = this.capacity;
    this.setState('AVAILABLE');
  }

  interact(actor) {
    if (this.state === 'NEEDS_REFILL') this.refill();
  }

  toJSON() {
    return { ...super.toJSON(), stock: this.stock };
  }
}
