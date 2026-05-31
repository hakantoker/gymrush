/**
 * Training programs and machine effect tags.
 *
 * A program defines:
 *   effects      — which effect tags this customer's plan targets
 *   machineCount — [min, max] distinct machine types they plan to use
 *   waterChance  — probability (0–1) of visiting the water dispenser after each machine
 *
 * When a Customer spawns it picks a random PROGRAM, then generates a wish list:
 *   - all machine types whose effects[] overlap with program.effects
 *   - shuffled, capped at a random count in [min, max]
 */

export const Effect = Object.freeze({
  CARDIO:     'cardio',
  ENDURANCE:  'endurance',
  STRENGTH:   'strength',
  UPPER_BODY: 'upper_body',
  LOWER_BODY: 'lower_body',
});

export const PROGRAMS = [
  {
    id:           'cardio_blast',
    name:         'Cardio Blast',
    effects:      [Effect.CARDIO, Effect.ENDURANCE],
    machineCount: [2, 3],
    waterChance:  0.65,   // runners drink a lot
  },
  {
    id:           'strength',
    name:         'Strength Day',
    effects:      [Effect.STRENGTH, Effect.UPPER_BODY],
    machineCount: [3, 4],
    waterChance:  0.35,
  },
  {
    id:           'full_body',
    name:         'Full Body',
    effects:      [Effect.CARDIO, Effect.STRENGTH, Effect.UPPER_BODY, Effect.LOWER_BODY],
    machineCount: [4, 6],
    waterChance:  0.50,
  },
  {
    id:           'leg_cardio',
    name:         'Legs & Cardio',
    effects:      [Effect.LOWER_BODY, Effect.CARDIO],
    machineCount: [2, 4],
    waterChance:  0.50,
  },
  {
    id:           'quick_hit',
    name:         'Quick Session',
    effects:      [Effect.CARDIO],
    machineCount: [1, 2],
    waterChance:  0.80,
  },
];
