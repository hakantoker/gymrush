import * as THREE from 'three';

// State → mesh tint colour. Subclasses can extend STATE_COLORS.
const STATE_COLORS = {
  IDLE:          null,          // use typeConfig.color
  IN_USE:        0x4FC3F7,      // blue
  NEEDS_REPAIR:  0xFFA726,      // orange
  BROKEN:        0xEF5350,      // red
  AVAILABLE:     null,          // use typeConfig.color
  NEEDS_REFILL:  0xFFA726,      // orange
  NEEDS_WASH:    0xAB47BC,      // purple
};

export class GymItem {
  constructor(typeConfig, slotData) {
    this.id           = slotData.id;
    this.typeConfig   = typeConfig;
    this.state        = null;          // initialised by subclass via setState()
    this.gridCol      = slotData.gridCol;
    this.gridRow      = slotData.gridRow;
    this.worldPosition = slotData.position.clone();
    this.mesh         = null;
    this._scene       = null;
  }

  // Called by ItemManager after construction.
  addToScene(scene) {
    this._scene = scene;
    this.mesh = this._buildMesh();
    const [, h] = this.typeConfig.meshSize ?? [1.4, 1.0, 1.4];
    this.mesh.position.set(this.worldPosition.x, h / 2, this.worldPosition.z);
    scene.add(this.mesh);
  }

  _buildMesh() {
    const [w, h, d] = this.typeConfig.meshSize ?? [1.4, 1.0, 1.4];
    const mat = new THREE.MeshPhongMaterial({ color: this.typeConfig.color ?? 0x888888 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Store ref so interact raycasts can map mesh → item
    mesh.userData.itemId = this.id;
    return mesh;
  }

  setState(newState) {
    this.state = newState;
    this._updateMeshColor();
  }

  _updateMeshColor() {
    if (!this.mesh) return;
    const tint = STATE_COLORS[this.state];
    this.mesh.material.color.set(tint ?? this.typeConfig.color ?? 0x888888);
  }

  // Override in subclasses. actor = { type: 'player' | 'worker', ... }
  interact(actor) {}

  // Called every frame by ItemManager.
  update(delta) {}

  // Minimal snapshot for save system.
  toJSON() {
    return { id: this.id, state: this.state };
  }
}
