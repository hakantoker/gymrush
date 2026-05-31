import { Utility } from './Utility.js';

// Two-counter utility: clean towels given to customers, dirty ones returned.
// The Washing Machine (future system) calls washComplete() to replenish clean stock.
export class TowelBox extends Utility {
  constructor(typeConfig, slotData) {
    super(typeConfig, slotData);
    this.cleanCount = this.capacity;
    this.dirtyCount = 0;
    // Sync parent stock with clean count so generic UI reads correctly
    this.stock = this.cleanCount;
  }

  // Customer picks up a clean towel on entry. Returns false if none available.
  takeClean(customer) {
    if (this.cleanCount <= 0) return false;
    this.cleanCount--;
    this.stock = this.cleanCount;
    if (this.cleanCount === 0) this.setState('NEEDS_WASH');
    return true;
  }

  // Customer drops off a dirty towel on exit.
  returnDirty(customer) {
    this.dirtyCount++;
  }

  // Called by Washing Machine when its cycle finishes.
  washComplete() {
    this.cleanCount = this.capacity;
    this.dirtyCount = 0;
    this.stock      = this.cleanCount;
    this.setState('AVAILABLE');
  }

  // Player/worker cannot directly refill — must use the washing machine.
  // Override to prevent parent's refill() from being called by interact().
  interact(actor) {}

  toJSON() {
    return { ...super.toJSON(), cleanCount: this.cleanCount, dirtyCount: this.dirtyCount };
  }
}
