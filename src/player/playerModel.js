/**
 * Builds a low-poly humanoid THREE.Group for the player character.
 * Origin is at floor level (y = 0), character faces +Z by default.
 *
 * Colour palette chosen to contrast clearly with future neutral-coloured customers:
 *   Amber shirt, dark charcoal pants, black shoes, warm skin, dark hair.
 */
import * as THREE from 'three';

const SKIN  = 0xF4A460;
const HAIR  = 0x3E2723;
const SHIRT = 0xFF8F00;   // vivid amber — instantly distinguishes player
const PANTS = 0x37474F;   // dark charcoal
const SHOE  = 0x1A1A1A;

function m(color) {
  return new THREE.MeshPhongMaterial({ color });
}

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

function cyl(r, h, color, x = 0, y = 0, z = 0, segs = 6) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segs), m(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

export function buildPlayerModel() {
  const g = new THREE.Group();

  // ── Shoes ─────────────────────────────────────────────────────────────────
  g.add(box(0.16, 0.09, 0.22, SHOE, -0.1,  0.045,  0.02));
  g.add(box(0.16, 0.09, 0.22, SHOE,  0.1,  0.045,  0.02));

  // ── Shins ─────────────────────────────────────────────────────────────────
  g.add(box(0.13, 0.30, 0.13, PANTS, -0.1, 0.24, 0));
  g.add(box(0.13, 0.30, 0.13, PANTS,  0.1, 0.24, 0));

  // ── Thighs ────────────────────────────────────────────────────────────────
  g.add(box(0.15, 0.32, 0.15, PANTS, -0.1, 0.55, 0));
  g.add(box(0.15, 0.32, 0.15, PANTS,  0.1, 0.55, 0));

  // ── Torso (shirt) ─────────────────────────────────────────────────────────
  g.add(box(0.40, 0.48, 0.22, SHIRT, 0, 0.95, 0));

  // ── Upper arms ────────────────────────────────────────────────────────────
  g.add(box(0.13, 0.28, 0.13, SHIRT, -0.275, 0.97, 0));
  g.add(box(0.13, 0.28, 0.13, SHIRT,  0.275, 0.97, 0));

  // ── Forearms (skin) ───────────────────────────────────────────────────────
  g.add(box(0.11, 0.24, 0.11, SKIN, -0.275, 0.72, 0));
  g.add(box(0.11, 0.24, 0.11, SKIN,  0.275, 0.72, 0));

  // ── Neck ──────────────────────────────────────────────────────────────────
  g.add(cyl(0.07, 0.10, SKIN, 0, 1.22, 0));

  // ── Head — low-poly sphere (6 lon × 5 lat = faceted) ─────────────────────
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 6, 5),
    m(SKIN),
  );
  head.position.set(0, 1.48, 0);
  head.castShadow = true;
  g.add(head);

  // ── Hair cap ──────────────────────────────────────────────────────────────
  // Upper hemisphere only — scale Y down so it sits as a cap
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.185, 6, 4),
    m(HAIR),
  );
  hair.scale.y = 0.55;
  hair.position.set(0, 1.58, 0);
  hair.castShadow = true;
  g.add(hair);

  // ── Eyes (two tiny dark boxes) ────────────────────────────────────────────
  g.add(box(0.05, 0.04, 0.03, 0x111111, -0.07, 1.49,  0.165));
  g.add(box(0.05, 0.04, 0.03, 0x111111,  0.07, 1.49,  0.165));

  return g;
}
