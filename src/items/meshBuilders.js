/**
 * Mesh builders for gym items.
 * Each builder returns a THREE.Group whose local origin sits at floor level (y=0),
 * centred on the item's grid footprint. All geometry uses MeshPhongMaterial,
 * no textures — consistent with the GDD flat/low-poly art style.
 */

import * as THREE from 'three';

// ── Shared helpers ─────────────────────────────────────────────────────────────

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

function cyl(rt, h, color, x = 0, y = 0, z = 0, segs = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rt, h, segs), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function group(...children) {
  const g = new THREE.Group();
  children.forEach(c => g.add(c));
  return g;
}

// ── Treadmill (footprint ~1.8 × 3.8 within 2 × 4 world-unit slot) ──────────────

function buildTreadmill() {
  // Colours
  const C_FRAME   = 0x212121;   // near-black metal frame
  const C_BELT    = 0x424242;   // dark gray running belt
  const C_RAILS   = 0x616161;   // mid-gray side rails
  const C_SCREEN  = 0x1A237E;   // deep blue console screen
  const C_ACCENT  = 0xF57F17;   // amber accent stripe

  const g = new THREE.Group();

  // Running platform
  g.add(box(1.7, 0.14, 3.6, C_BELT,  0, 0.07,  0));
  // Side rails (raised edges of belt)
  g.add(box(0.08, 0.08, 3.6, C_RAILS, -0.81, 0.18, 0));
  g.add(box(0.08, 0.08, 3.6, C_RAILS,  0.81, 0.18, 0));
  // Front accent stripe
  g.add(box(1.7, 0.05, 0.12, C_ACCENT, 0, 0.15, 1.7));

  // Handle uprights — positioned toward the front (+z side)
  g.add(box(0.07, 1.3, 0.07, C_FRAME, -0.72, 0.79, 1.55));
  g.add(box(0.07, 1.3, 0.07, C_FRAME,  0.72, 0.79, 1.55));
  // Handle cross-bar
  g.add(box(1.44, 0.07, 0.07, C_FRAME, 0, 1.43, 1.55));
  // Angled lower grip bars
  g.add(box(0.07, 0.07, 0.5, C_FRAME, -0.72, 1.0, 1.3));
  g.add(box(0.07, 0.07, 0.5, C_FRAME,  0.72, 1.0, 1.3));

  // Console / screen
  g.add(box(0.9, 0.38, 0.1, C_FRAME,  0, 1.55, 1.6));
  g.add(box(0.72, 0.24, 0.06, C_SCREEN, 0, 1.56, 1.66));

  return g;
}

// ── Weight Bench (footprint ~1.4 × 3.8 within 2 × 4 world-unit slot) ──────────

function buildBench() {
  const C_PAD    = 0x6D1F1F;   // dark red padding
  const C_FRAME  = 0x37474F;   // blue-gray metal
  const C_BAR    = 0xB0BEC5;   // silver barbell
  const C_WEIGHT = 0x263238;   // very dark weight plates

  const g = new THREE.Group();

  // Main bench pad (flat bench, lower half of slot)
  g.add(box(0.6, 0.14, 1.7, C_PAD,   0, 0.82, -0.8));
  // Back-rest pad (upper half, vertical)
  g.add(box(0.6, 1.0, 0.14, C_PAD,   0, 1.2,   0.6));

  // Four legs
  const legY = 0.42;
  const lh   = 0.84;
  g.add(cyl(0.04, lh, C_FRAME, -0.22, legY, -1.5));
  g.add(cyl(0.04, lh, C_FRAME,  0.22, legY, -1.5));
  g.add(cyl(0.04, lh, C_FRAME, -0.22, legY,  0.1));
  g.add(cyl(0.04, lh, C_FRAME,  0.22, legY,  0.1));
  // Bottom crossbar
  g.add(box(0.44, 0.05, 0.05, C_FRAME, 0, 0.06, -0.7));

  // Barbell uprights
  g.add(cyl(0.04, 0.9, C_FRAME, -0.52, 1.35, 0.75));
  g.add(cyl(0.04, 0.9, C_FRAME,  0.52, 1.35, 0.75));
  // Barbell bar (long horizontal rod)
  const barMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8),
    mat(C_BAR),
  );
  barMesh.rotation.z = Math.PI / 2;
  barMesh.position.set(0, 1.82, 0.75);
  barMesh.castShadow = true;
  g.add(barMesh);
  // Weight plates (pair each side)
  g.add(cyl(0.19, 0.08, C_WEIGHT, -0.92, 1.82, 0.75, 12));
  g.add(cyl(0.19, 0.08, C_WEIGHT,  0.92, 1.82, 0.75, 12));
  g.add(cyl(0.16, 0.07, C_FRAME,  -0.82, 1.82, 0.75, 12));
  g.add(cyl(0.16, 0.07, C_FRAME,   0.82, 1.82, 0.75, 12));

  return g;
}

// ── Stationary Bike (footprint ~1.6 × 3.6 within 2 × 4 world-unit slot) ───────

function buildBike() {
  const C_FRAME  = 0x1B5E20;   // dark green frame
  const C_WHEEL  = 0x424242;   // dark gray wheel
  const C_SEAT   = 0x212121;   // black seat
  const C_BAR    = 0x37474F;   // handlebar
  const C_ACCENT = 0x76FF03;   // lime accent

  const g = new THREE.Group();

  // Main body / frame
  g.add(box(0.22, 0.8, 1.0, C_FRAME, 0, 0.55, 0));

  // Rear flywheel
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 0.12, 20),
    mat(C_WHEEL),
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.62, -1.1);
  wheel.castShadow = true;
  g.add(wheel);
  // Wheel hub
  g.add(cyl(0.12, 0.18, C_FRAME, 0, 0.62, -1.1, 8));

  // Seat post + seat
  g.add(box(0.07, 0.65, 0.07, C_SEAT, 0, 0.92, -0.3));
  g.add(box(0.38, 0.07, 0.22, C_SEAT, 0, 1.26, -0.24));

  // Handlebar post
  g.add(box(0.07, 0.6, 0.07, C_BAR,  0, 0.9,   0.5));
  // Handlebar (horizontal)
  g.add(box(0.9, 0.07, 0.07, C_BAR,  0, 1.22,  0.52));
  // Grip ends
  g.add(cyl(0.04, 0.22, C_FRAME, -0.4, 1.22, 0.52));
  g.add(cyl(0.04, 0.22, C_FRAME,  0.4, 1.22, 0.52));
  // Accent stripe on body
  g.add(box(0.24, 0.06, 0.95, C_ACCENT, 0, 0.96, 0));

  // Pedal cranks (visual only)
  const crank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.35, 6),
    mat(C_FRAME),
  );
  crank.rotation.z = Math.PI / 2;
  crank.position.set(0, 0.62, -0.45);
  g.add(crank);
  g.add(cyl(0.04, 0.13, C_SEAT, -0.18, 0.62, -0.45)); // left pedal
  g.add(cyl(0.04, 0.13, C_SEAT,  0.18, 0.62, -0.45)); // right pedal

  return g;
}

// ── Dumbbell Rack (footprint ~3.6 × 1.6 within 4 × 2 world-unit slot) ─────────

function buildDumbbellRack() {
  const C_FRAME   = 0x212121;
  const C_SHELF   = 0x424242;
  const C_LIGHT   = 0xCD7F32;  // bronze — lightest
  const C_MED     = 0x9E9E9E;  // silver — medium
  const C_HEAVY   = 0x546E7A;  // blue-gray — heaviest

  const g = new THREE.Group();

  // Back wall of rack
  g.add(box(3.7, 1.5, 0.12, C_FRAME, 0, 0.75, -0.55));
  // Vertical side panels
  g.add(box(0.1, 1.5, 0.9, C_FRAME, -1.8, 0.75, -0.15));
  g.add(box(0.1, 1.5, 0.9, C_FRAME,  1.8, 0.75, -0.15));

  // Three shelves
  [0.28, 0.72, 1.16].forEach(y => {
    g.add(box(3.5, 0.07, 0.75, C_SHELF, 0, y, -0.12));
  });

  // Dumbbell helper: handle + two end cylinders
  function dumbbell(x, y, z, plateColor) {
    // Handle
    const h = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.52, 8),
      mat(C_SHELF),
    );
    h.rotation.z = Math.PI / 2;
    h.position.set(x, y, z);
    h.castShadow = true;
    g.add(h);
    // Plates
    [-0.22, 0.22].forEach(dx => {
      const p = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.1, 10),
        mat(plateColor),
      );
      p.rotation.z = Math.PI / 2;
      p.position.set(x + dx, y, z);
      p.castShadow = true;
      g.add(p);
    });
  }

  // Light dumbbells — bottom shelf
  dumbbell(-1.1, 0.38, 0.1, C_LIGHT);
  dumbbell(-0.3, 0.38, 0.1, C_LIGHT);
  dumbbell( 0.5, 0.38, 0.1, C_LIGHT);
  // Medium — middle shelf
  dumbbell(-1.1, 0.82, 0.1, C_MED);
  dumbbell(-0.3, 0.82, 0.1, C_MED);
  dumbbell( 0.5, 0.82, 0.1, C_MED);
  // Heavy — top shelf
  dumbbell(-1.1, 1.26, 0.1, C_HEAVY);
  dumbbell(-0.3, 1.26, 0.1, C_HEAVY);
  dumbbell( 0.5, 1.26, 0.1, C_HEAVY);

  return g;
}

// ── Registry ──────────────────────────────────────────────────────────────────

export const MESH_BUILDERS = {
  TREADMILL:    buildTreadmill,
  BENCH:        buildBench,
  BIKE:         buildBike,
  DUMBBELL_RACK: buildDumbbellRack,
};
