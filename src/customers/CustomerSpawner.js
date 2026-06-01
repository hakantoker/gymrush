import { Customer } from './Customer.js';

const SPAWN_INTERVAL = 8;    // seconds between spawns
const MAX_CUSTOMERS  = 8;    // concurrent customer cap

export class CustomerSpawner {
  constructor(scene, itemManager, economy, cashier) {
    this._scene       = scene;
    this._items       = itemManager;
    this._economy     = economy;
    this._cashier     = cashier;
    this._customers   = [];
    this._timer       = 2;   // short delay before first customer appears
  }

  get activeCount() { return this._customers.length; }

  update(delta) {
    this._timer -= delta;
    if (this._timer <= 0 && this._customers.length < MAX_CUSTOMERS) {
      this._spawn();
      this._timer = SPAWN_INTERVAL;
    }

    for (const c of this._customers) c.update(delta);
  }

  _spawn() {
    const customer = new Customer(
      this._scene,
      this._items,
      this._economy,
      this._cashier,
      (c) => { this._customers = this._customers.filter(x => x !== c); },
    );
    this._customers.push(customer);
  }
}
