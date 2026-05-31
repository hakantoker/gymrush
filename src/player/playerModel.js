import { buildHumanoid } from '../shared/humanoidBuilder.js';

// Amber shirt — instantly distinguishes the player from neutral-coloured customers.
export function buildPlayerModel() {
  return buildHumanoid({
    skin:  0xF4A460,
    hair:  0x3E2723,
    shirt: 0xFF8F00,
    pants: 0x37474F,
    shoe:  0x1A1A1A,
  });
}
