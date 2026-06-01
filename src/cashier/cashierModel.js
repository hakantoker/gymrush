/**
 * Low-poly cashier counter with a cash register.
 * Group origin is at floor level (y=0), front face of counter looks toward -Z
 * so customers approaching from the room interior see the screen.
 */
import * as THREE from 'three';

function mat(color) {
  return new THREE.MeshPhongMaterial({ color });
}

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function buildCashierModel() {
  const g = new THREE.Group();

  // ── Counter body ──────────────────────────────────────────────────────────
  g.add(box(2.2, 1.1, 0.9,  0x8D6E63,  0,    0.55,  0));    // main body (warm brown)
  g.add(box(2.2, 0.08, 1.0, 0x9E7D6B,  0,    1.14,  0));    // top surface (slightly lighter)
  g.add(box(2.2, 0.06, 0.06,0x5D4037,  0,    0.06, -0.47)); // bottom front trim

  // ── Legs / feet ───────────────────────────────────────────────────────────
  g.add(box(0.12, 0.12, 0.85, 0x6D4C41, -1.0, 0.06, 0));
  g.add(box(0.12, 0.12, 0.85, 0x6D4C41,  1.0, 0.06, 0));

  // ── Cash register body ────────────────────────────────────────────────────
  g.add(box(0.58, 0.40, 0.35, 0x37474F, -0.55, 1.34, -0.08)); // register block

  // Screen (faces -Z toward customer)
  const screenMat = new THREE.MeshPhongMaterial({
    color:             0x1565C0,
    emissive:          0x0D47A1,
    emissiveIntensity: 0.4,
  });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.26, 0.04), screenMat);
  screen.position.set(-0.55, 1.56, -0.255);
  screen.castShadow = true;
  g.add(screen);

  // Keypad
  g.add(box(0.36, 0.16, 0.04, 0x546E7A, -0.55, 1.22, -0.255));

  // ── Card reader ───────────────────────────────────────────────────────────
  g.add(box(0.14, 0.10, 0.08, 0x455A64, 0.0, 1.20, -0.46));

  // ── Gym branding strip (amber = player/brand colour) ─────────────────────
  g.add(box(0.72, 0.22, 0.04, 0xFF8F00, 0.6, 1.34, -0.47));

  // ── Small receipt printer ─────────────────────────────────────────────────
  g.add(box(0.28, 0.12, 0.22, 0x455A64, 0.55, 1.22, -0.05));
  g.add(box(0.20, 0.02, 0.08, 0xEEEEEE, 0.55, 1.28, -0.05)); // paper strip

  return g;
}
