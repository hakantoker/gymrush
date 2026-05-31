import { ItemCategory, ITEM_TYPES } from '../items/itemTypes.js';
import { Machine }       from '../items/Machine.js';
import { SharedFeature } from '../items/SharedFeature.js';
import { Utility }       from '../items/Utility.js';
import { TowelBox }      from '../items/TowelBox.js';

export class ItemManager {
  constructor(scene) {
    this._scene = scene;
    /** @type {Map<string, import('../items/GymItem.js').GymItem>} */
    this._items = new Map();
  }

  // Instantiate an item from a type key string and slot data, add it to the scene.
  createItem(typeKey, slotData) {
    const typeConfig = ITEM_TYPES[typeKey];
    if (!typeConfig) throw new Error(`Unknown item type: "${typeKey}"`);

    const item = this._instantiate(typeConfig, slotData);
    item.addToScene(this._scene);
    this._items.set(item.id, item);
    return item;
  }

  _instantiate(typeConfig, slotData) {
    switch (typeConfig.category) {
      case ItemCategory.MACHINE:        return new Machine(typeConfig, slotData);
      case ItemCategory.SHARED_FEATURE: return new SharedFeature(typeConfig, slotData);
      case ItemCategory.UTILITY:        return new Utility(typeConfig, slotData);
      case ItemCategory.TOWEL_BOX:      return new TowelBox(typeConfig, slotData);
      default: throw new Error(`No class mapped for category: "${typeConfig.category}"`);
    }
  }

  // ── Lookups ────────────────────────────────────────────────────────────────

  getById(id) {
    return this._items.get(id) ?? null;
  }

  // Returns all items whose typeConfig.category matches and that are available.
  getAvailable(category) {
    return [...this._items.values()].filter(
      item => item.typeConfig.category === category && item.isAvailable?.()
    );
  }

  // Returns the item whose mesh was hit by a raycast (via mesh.userData.itemId).
  getByMeshId(itemId) {
    return this._items.get(itemId) ?? null;
  }

  all() {
    return [...this._items.values()];
  }

  // ── Game loop ──────────────────────────────────────────────────────────────

  update(delta) {
    for (const item of this._items.values()) {
      item.update(delta);
    }
  }

  // ── Save / load ────────────────────────────────────────────────────────────

  toJSON() {
    return [...this._items.values()].map(item => item.toJSON());
  }
}
