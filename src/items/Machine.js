import { OccupiableItem } from './OccupiableItem.js';

export class Machine extends OccupiableItem {
  constructor(typeConfig, slotData) {
    super(typeConfig, slotData);
    this.useCount     = 0;    // wear accumulator — only fullRepair() resets this
    this._repairTimer = 0;    // counts down while NEEDS_REPAIR
    this.setState('IDLE');
  }

  // ── Session lifecycle ──────────────────────────────────────────────────────

  endSession(customer) {
    this.useCount++;
    this.usingPeople = this.usingPeople.filter(c => c !== customer);

    if (Math.random() < this._breakChance()) {
      this._repairTimer = this.typeConfig.repairWindow;
      this.setState('NEEDS_REPAIR');
    } else if (this.usingPeople.length === 0) {
      this.setState('IDLE');
    }
  }

  // ── Interactions ───────────────────────────────────────────────────────────

  interact(actor) {
    if (this.state === 'NEEDS_REPAIR') {
      // Quick fix: back to IDLE but wear (useCount) continues accumulating
      this._repairTimer = 0;
      this.setState('IDLE');
    } else if (this.state === 'BROKEN') {
      this.fullRepair();
    }
  }

  // Full repair costs money (economy deduction handled by caller via event/callback — TBD).
  // Resets useCount to 0 — machine is as good as new.
  fullRepair() {
    this.useCount     = 0;
    this._repairTimer = 0;
    this.setState('IDLE');
  }

  // ── Per-frame update ───────────────────────────────────────────────────────

  update(delta) {
    if (this.state === 'NEEDS_REPAIR') {
      this._repairTimer -= delta;
      if (this._repairTimer <= 0) {
        this.setState('BROKEN');
      }
    }
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  _breakChance() {
    const { baseBreakChance, breakChanceGrowth, maxBreakChance } = this.typeConfig;
    return Math.min(maxBreakChance, baseBreakChance + this.useCount * breakChanceGrowth);
  }

  toJSON() {
    return { ...super.toJSON(), useCount: this.useCount };
  }
}
