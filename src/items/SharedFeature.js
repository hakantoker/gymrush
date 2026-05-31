import { OccupiableItem } from './OccupiableItem.js';

// Multi-occupancy areas: boxing ring, mat area, swimming pool, etc.
// No wear system by default. Subclass and override interact()/update() if needed.
export class SharedFeature extends OccupiableItem {
  constructor(typeConfig, slotData) {
    super(typeConfig, slotData);
    this.setState('IDLE');
  }

  interact(actor) {
    // No default interaction — subclasses can override (e.g. a boxing ring
    // could have bags that need replacing after heavy use).
  }
}
