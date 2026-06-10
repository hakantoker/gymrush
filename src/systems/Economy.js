/**
 * Central economy tracker.
 * Other systems call earn()/spend() and subscribe via on() for HUD updates.
 */
export class Economy {
  constructor(startingMoney = 500) {
    this.money       = startingMoney;
    this.totalEarned = 0;
    this._listeners  = [];
  }

  /**
   * Add money. Notifies listeners with { type:'earn', amount, total, worldPosition }.
   * @param {number}          amount
   * @param {THREE.Vector3=}  worldPosition  optional source of the income (for fly-ups)
   */
  earn(amount, worldPosition = null) {
    this.money       += amount;
    this.totalEarned += amount;
    this._emit({ type: 'earn', amount, total: this.money, worldPosition });
  }

  /** Deduct money. Notifies listeners with { type:'spend', amount, total }. */
  spend(amount) {
    this.money = Math.max(0, this.money - amount);
    this._emit({ type: 'spend', amount, total: this.money });
  }

  /** Subscribe to economy events. Returns an unsubscribe function. */
  on(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(f => f !== fn); };
  }

  _emit(event) {
    for (const fn of this._listeners) fn(event);
  }

  toJSON() {
    return { money: this.money, totalEarned: this.totalEarned };
  }
}
