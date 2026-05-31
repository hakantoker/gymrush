import * as THREE        from 'three';
import { MESH_BUILDERS } from './meshBuilders.js';

// Emissive tint applied over each mesh's own colour to signal state.
// null = no tint (IDLE / AVAILABLE) — emissive reset to black.
const STATE_EMISSIVE = {
  IDLE:         null,
  IN_USE:       0x1A6FA8,   // blue glow
  NEEDS_REPAIR: 0xB85C00,   // orange glow
  BROKEN:       0xAA1500,   // red glow
  AVAILABLE:    null,
  NEEDS_REFILL: 0xB85C00,   // orange glow
  NEEDS_WASH:   0x6B1FA8,   // purple glow
};

const EMISSIVE_INTENSITY = 0.35;

export class GymItem {
  constructor(typeConfig, slotData) {
    this.id            = slotData.id;
    this.typeConfig    = typeConfig;
    this.state         = null;
    this.gridCol       = slotData.gridCol;
    this.gridRow       = slotData.gridRow;
    this.worldPosition = slotData.position.clone();
    this.mesh          = null;
    this._scene        = null;
  }

  addToScene(scene) {
    this._scene = scene;
    this.mesh   = this._buildMesh();
    this.mesh.position.set(this.worldPosition.x, 0, this.worldPosition.z);
    scene.add(this.mesh);
  }

  _buildMesh() {
    const builder = MESH_BUILDERS[this.typeConfig.key];
    const group   = builder ? builder() : this._fallbackBox();
    this._tagGroup(group);
    return group;
  }

  _fallbackBox() {
    const [w = 1.4, h = 1.0, d = 1.4] = this.typeConfig.meshSize ?? [];
    const g    = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshPhongMaterial({ color: this.typeConfig.color ?? 0x888888 }),
    );
    mesh.position.y = h / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return g;
  }

  _tagGroup(group) {
    group.userData.itemId = this.id;
    group.traverse(child => {
      if (child.isMesh) child.userData.itemId = this.id;
    });
  }

  setState(newState) {
    this.state = newState;
    this._applyStateTint();
  }

  // Each builder call creates fresh MeshPhongMaterial instances per mesh,
  // so we can safely modify emissive in-place without cloning.
  _applyStateTint() {
    if (!this.mesh) return;
    const tint = STATE_EMISSIVE[this.state] ?? null;
    this.mesh.traverse(child => {
      if (!child.isMesh) return;
      if (tint !== null) {
        child.material.emissive.setHex(tint);
        child.material.emissiveIntensity = EMISSIVE_INTENSITY;
      } else {
        child.material.emissive.setHex(0x000000);
        child.material.emissiveIntensity = 0;
      }
    });
  }

  interact(actor) {}
  update(delta) {}

  toJSON() {
    return { id: this.id, state: this.state };
  }
}
