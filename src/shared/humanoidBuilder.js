/**
 * Shared low-poly humanoid mesh builder.
 * Returns a THREE.Group whose origin is at floor level (y=0), facing +Z.
 * Both the player and customers use this — differentiated only by colour palette.
 */
import * as THREE from 'three';

function mat(color) {
  return new THREE.MeshPhongMaterial({ color });
}

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function cyl(r, h, color, x = 0, y = 0, z = 0, segs = 6) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segs), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/**
 * @param {{ skin:number, hair:number, shirt:number, pants:number, shoe:number }} palette
 * @returns {THREE.Group}
 */
export function buildHumanoid({ skin, hair, shirt, pants, shoe }) {
  const g = new THREE.Group();

  // Shoes
  g.add(box(0.16, 0.09, 0.22, shoe,  -0.1,  0.045,  0.02));
  g.add(box(0.16, 0.09, 0.22, shoe,   0.1,  0.045,  0.02));

  // Shins
  g.add(box(0.13, 0.30, 0.13, pants, -0.1,  0.24,   0));
  g.add(box(0.13, 0.30, 0.13, pants,  0.1,  0.24,   0));

  // Thighs
  g.add(box(0.15, 0.32, 0.15, pants, -0.1,  0.55,   0));
  g.add(box(0.15, 0.32, 0.15, pants,  0.1,  0.55,   0));

  // Torso
  g.add(box(0.40, 0.48, 0.22, shirt,  0,    0.95,   0));

  // Upper arms
  g.add(box(0.13, 0.28, 0.13, shirt, -0.275, 0.97,  0));
  g.add(box(0.13, 0.28, 0.13, shirt,  0.275, 0.97,  0));

  // Forearms
  g.add(box(0.11, 0.24, 0.11, skin,  -0.275, 0.72,  0));
  g.add(box(0.11, 0.24, 0.11, skin,   0.275, 0.72,  0));

  // Neck
  g.add(cyl(0.07, 0.10, skin,  0, 1.22, 0));

  // Head — 6×5 sphere = faceted low-poly look
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), mat(skin));
  head.position.set(0, 1.48, 0);
  head.castShadow = true;
  g.add(head);

  // Hair cap — flattened upper hemisphere
  const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.185, 6, 4), mat(hair));
  hairMesh.scale.y = 0.55;
  hairMesh.position.set(0, 1.58, 0);
  hairMesh.castShadow = true;
  g.add(hairMesh);

  // Eyes
  g.add(box(0.05, 0.04, 0.03, 0x111111, -0.07, 1.49,  0.165));
  g.add(box(0.05, 0.04, 0.03, 0x111111,  0.07, 1.49,  0.165));

  return g;
}
