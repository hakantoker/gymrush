export const ItemCategory = Object.freeze({
  MACHINE:        'machine',
  SHARED_FEATURE: 'shared_feature',
  UTILITY:        'utility',
  TOWEL_BOX:      'towel_box',
});

// All item type definitions. Adding a new item = add one entry here, no new class needed.
export const ITEM_TYPES = {

  // ── Machines ──────────────────────────────────────────────────────────────
  TREADMILL: {
    category:          ItemCategory.MACHINE,
    label:             'Treadmill',
    color:             0x5B8CCC,
    meshSize:          [1.4, 0.9, 0.7],   // [w, h, d] placeholder box
    maxCapacity:       1,
    useDuration:       60,                 // seconds per session
    baseBreakChance:   0.05,
    breakChanceGrowth: 0.02,
    maxBreakChance:    0.70,
    repairWindow:      30,                 // seconds before NEEDS_REPAIR → BROKEN
    tier:              1,
    feePerSession:     10,
  },

  BENCH: {
    category:          ItemCategory.MACHINE,
    label:             'Weight Bench',
    color:             0xCC6B5B,
    meshSize:          [1.6, 0.5, 0.7],
    maxCapacity:       1,
    useDuration:       90,
    baseBreakChance:   0.03,
    breakChanceGrowth: 0.015,
    maxBreakChance:    0.60,
    repairWindow:      30,
    tier:              1,
    feePerSession:     12,
  },

  BIKE: {
    category:          ItemCategory.MACHINE,
    label:             'Stationary Bike',
    color:             0x5BCC7A,
    meshSize:          [0.9, 1.1, 1.2],
    maxCapacity:       1,
    useDuration:       50,
    baseBreakChance:   0.04,
    breakChanceGrowth: 0.018,
    maxBreakChance:    0.65,
    repairWindow:      30,
    tier:              1,
    feePerSession:     8,
  },

  DUMBBELL_RACK: {
    category:          ItemCategory.MACHINE,
    label:             'Dumbbell Rack',
    color:             0x8B7355,
    meshSize:          [1.8, 1.0, 0.6],
    maxCapacity:       1,
    useDuration:       45,
    baseBreakChance:   0.01,
    breakChanceGrowth: 0.005,
    maxBreakChance:    0.30,
    repairWindow:      40,
    tier:              1,
    feePerSession:     6,
  },

  // ── Shared Features ───────────────────────────────────────────────────────
  BOXING_RING: {
    category:          ItemCategory.SHARED_FEATURE,
    label:             'Boxing Ring',
    color:             0xCC5B5B,
    meshSize:          [3.6, 0.3, 3.6],
    maxCapacity:       4,
    useDuration:       120,
    tier:              2,
    feePerSession:     20,
  },

  MAT_AREA: {
    category:          ItemCategory.SHARED_FEATURE,
    label:             'Mat Area',
    color:             0x7ABD7A,
    meshSize:          [3.6, 0.1, 3.6],
    maxCapacity:       6,
    useDuration:       60,
    tier:              1,
    feePerSession:     5,
  },

  // ── Utilities ─────────────────────────────────────────────────────────────
  WATER_DISPENSER: {
    category:          ItemCategory.UTILITY,
    label:             'Water Dispenser',
    color:             0x87CEEB,
    meshSize:          [0.5, 1.3, 0.5],
    capacity:          20,             // uses before NEEDS_REFILL
    refillDuration:    5,
  },

  SOAP_DISPENSER: {
    category:          ItemCategory.UTILITY,
    label:             'Soap Dispenser',
    color:             0xF0E68C,
    meshSize:          [0.3, 0.6, 0.3],
    capacity:          30,
    refillDuration:    3,
  },

  // ── Towel Box (special dual-counter utility) ──────────────────────────────
  TOWEL_BOX: {
    category:          ItemCategory.TOWEL_BOX,
    label:             'Towel Box',
    color:             0xFFF8DC,
    meshSize:          [1.0, 0.8, 0.6],
    capacity:          15,             // starting clean towel count
  },
};
