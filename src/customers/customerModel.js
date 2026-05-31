import { buildHumanoid } from '../shared/humanoidBuilder.js';

// Four shirt palettes — customers look varied at a glance.
const PALETTES = [
  { shirt: 0x607D8B, pants: 0x37474F, shoe: 0x4E342E, hair: 0x212121 },  // steel-blue
  { shirt: 0x8D6E63, pants: 0x4E342E, shoe: 0x3E2723, hair: 0xBCAAA4 },  // brown / light hair
  { shirt: 0x66BB6A, pants: 0x1B5E20, shoe: 0x212121, hair: 0x4E342E },  // green
  { shirt: 0xAB47BC, pants: 0x4A148C, shoe: 0x1A1A1A, hair: 0x6D4C41 },  // purple
];

const SKIN_TONES = [0xF4A460, 0xD2955B, 0xC68642, 0xA0522D];

export function buildCustomerModel() {
  const palette   = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const skin      = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
  return buildHumanoid({ skin, ...palette });
}
