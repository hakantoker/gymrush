export const ItemCategory = Object.freeze({
  MACHINE:        'machine',
  SHARED_FEATURE: 'shared_feature',
  UTILITY:        'utility',
  TOWEL_BOX:      'towel_box',
});

export const ITEM_TYPES = {

  // ── Machines ──────────────────────────────────────────────────────────────
  TREADMILL: {
    key:               'TREADMILL',
    category:          ItemCategory.MACHINE,
    label:             'Treadmill',
    color:             0x3A6EA5,
    effects:           ['cardio', 'endurance'],
    maxCapacity:       1,
    maxQueueSize:      3,
    useDuration:       18,
    baseBreakChance:   0.05,
    breakChanceGrowth: 0.02,
    maxBreakChance:    0.70,
    repairWindow:      20,
    tier:              1,
    feePerSession:     10,
  },

  BENCH: {
    key:               'BENCH',
    category:          ItemCategory.MACHINE,
    label:             'Weight Bench',
    color:             0x8B3A3A,
    effects:           ['strength', 'upper_body'],
    maxCapacity:       1,
    maxQueueSize:      2,
    useDuration:       22,
    baseBreakChance:   0.03,
    breakChanceGrowth: 0.015,
    maxBreakChance:    0.60,
    repairWindow:      30,
    tier:              1,
    feePerSession:     12,
  },

  BIKE: {
    key:               'BIKE',
    category:          ItemCategory.MACHINE,
    label:             'Stationary Bike',
    color:             0x2E7D32,
    effects:           ['cardio', 'lower_body', 'endurance'],
    maxCapacity:       1,
    maxQueueSize:      2,
    useDuration:       14,
    baseBreakChance:   0.04,
    breakChanceGrowth: 0.018,
    maxBreakChance:    0.65,
    repairWindow:      20,
    tier:              1,
    feePerSession:     8,
  },

  DUMBBELL_RACK: {
    key:               'DUMBBELL_RACK',
    category:          ItemCategory.MACHINE,
    label:             'Dumbbell Rack',
    color:             0x5D4037,
    effects:           ['strength', 'upper_body'],
    maxCapacity:       1,
    maxQueueSize:      3,
    useDuration:       14,
    baseBreakChance:   0.01,
    breakChanceGrowth: 0.005,
    maxBreakChance:    0.30,
    repairWindow:      25,
    tier:              1,
    feePerSession:     6,
  },

  // ── Shared Features ───────────────────────────────────────────────────────
  BOXING_RING: {
    key:               'BOXING_RING',
    category:          ItemCategory.SHARED_FEATURE,
    label:             'Boxing Ring',
    color:             0xB71C1C,
    maxCapacity:       4,
    maxQueueSize:      4,
    useDuration:       120,
    tier:              2,
    feePerSession:     20,
  },

  MAT_AREA: {
    key:               'MAT_AREA',
    category:          ItemCategory.SHARED_FEATURE,
    label:             'Mat Area',
    color:             0x33691E,
    maxCapacity:       6,
    maxQueueSize:      4,
    useDuration:       60,
    tier:              1,
    feePerSession:     5,
  },

  // ── Utilities ─────────────────────────────────────────────────────────────
  WATER_DISPENSER: {
    key:               'WATER_DISPENSER',
    category:          ItemCategory.UTILITY,
    label:             'Water Dispenser',
    color:             0x0288D1,
    capacity:          20,
    refillDuration:    5,
  },

  SOAP_DISPENSER: {
    key:               'SOAP_DISPENSER',
    category:          ItemCategory.UTILITY,
    label:             'Soap Dispenser',
    color:             0xF9A825,
    capacity:          30,
    refillDuration:    3,
  },

  // ── Towel Box ─────────────────────────────────────────────────────────────
  TOWEL_BOX: {
    key:               'TOWEL_BOX',
    category:          ItemCategory.TOWEL_BOX,
    label:             'Towel Box',
    color:             0xFFF8DC,
    capacity:          15,
  },
};
