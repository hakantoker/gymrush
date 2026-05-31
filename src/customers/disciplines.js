/**
 * Customer disciplines — the high-level fitness identity.
 * A discipline biases which training program a customer picks via
 * programWeights (higher = more likely). Missing keys default to weight 1.
 *
 * 20% of customers have no discipline ("Casual") and pick programs uniformly.
 */

export const DISCIPLINES = [
  {
    id:   'BODYBUILDER',
    name: 'Bodybuilder',
    programWeights: {
      upper_strength: 5,
      leg_day:        4,
      full_body:      2,
      cardio_day:     1,
      quick_cardio:   0,
      core_endurance: 1,
    },
  },
  {
    id:   'CARDIO_RUNNER',
    name: 'Cardio Runner',
    programWeights: {
      cardio_day:     5,
      quick_cardio:   4,
      core_endurance: 2,
      full_body:      2,
      leg_day:        2,
      upper_strength: 1,
    },
  },
  {
    id:   'CROSSFIT',
    name: 'CrossFit',
    programWeights: {
      full_body:      5,
      leg_day:        3,
      cardio_day:     3,
      upper_strength: 3,
      core_endurance: 3,
      quick_cardio:   2,
    },
  },
  {
    id:   'WEIGHT_LOSS',
    name: 'Weight Loss',
    programWeights: {
      cardio_day:     4,
      core_endurance: 4,
      full_body:      3,
      quick_cardio:   3,
      leg_day:        2,
      upper_strength: 1,
    },
  },
];

/** Returns a random discipline, or null (20% chance = casual customer). */
export function pickDiscipline() {
  if (Math.random() < 0.2) return null;
  return DISCIPLINES[Math.floor(Math.random() * DISCIPLINES.length)];
}
