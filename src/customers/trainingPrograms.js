/**
 * Training programs — the session-level goal each customer pursues.
 *
 * goals:        muscle group → importance weight (1–5).
 *               Only groups that matter to the program need to be listed.
 * machineCount: [min, max] distinct machine types to use.
 * waterChance:  probability (0–1) of going to the water dispenser after each machine.
 */
import { MG } from './muscleGroups.js';

export const PROGRAMS = [
  {
    id:   'upper_strength',
    name: 'Upper Body Strength',
    goals: {
      [MG.CHEST]:     5,
      [MG.SHOULDERS]: 4,
      [MG.ARMS]:      3,
      [MG.BACK]:      2,
    },
    machineCount: [3, 4],
    waterChance:  0.30,
  },
  {
    id:   'leg_day',
    name: 'Leg Day',
    goals: {
      [MG.LEGS]:   5,
      [MG.GLUTES]: 4,
      [MG.CARDIO]: 2,
    },
    machineCount: [2, 3],
    waterChance:  0.45,
  },
  {
    id:   'cardio_day',
    name: 'Cardio Day',
    goals: {
      [MG.CARDIO]:    5,
      [MG.ENDURANCE]: 4,
      [MG.LEGS]:      2,
    },
    machineCount: [2, 3],
    waterChance:  0.70,
  },
  {
    id:   'full_body',
    name: 'Full Body',
    goals: {
      [MG.CARDIO]:  3,
      [MG.CHEST]:   3,
      [MG.BACK]:    3,
      [MG.LEGS]:    3,
      [MG.ARMS]:    2,
      [MG.CORE]:    2,
    },
    machineCount: [4, 6],
    waterChance:  0.50,
  },
  {
    id:   'quick_cardio',
    name: 'Quick Cardio',
    goals: {
      [MG.CARDIO]:    5,
      [MG.ENDURANCE]: 3,
    },
    machineCount: [1, 2],
    waterChance:  0.80,
  },
  {
    id:   'core_endurance',
    name: 'Core & Endurance',
    goals: {
      [MG.CORE]:        5,
      [MG.ENDURANCE]:   4,
      [MG.FLEXIBILITY]: 3,
      [MG.CARDIO]:      2,
    },
    machineCount: [2, 3],
    waterChance:  0.55,
  },
];

/**
 * Weighted-random program picker.
 * @param {object|null} discipline  A DISCIPLINES entry, or null for casual.
 * @returns {object}  One of the PROGRAMS entries.
 */
export function pickProgram(discipline) {
  const weights = PROGRAMS.map(p => discipline?.programWeights?.[p.id] ?? 1);
  const total   = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < PROGRAMS.length; i++) {
    r -= weights[i];
    if (r <= 0) return PROGRAMS[i];
  }
  return PROGRAMS[PROGRAMS.length - 1];
}
