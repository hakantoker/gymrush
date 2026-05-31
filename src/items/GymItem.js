import * as THREE        from 'three';
import { MESH_BUILDERS } from './meshBuilders.js';

const STATE_COLORS = {
  IDLE:         null,        // restore typeConfig.color
  IN_USE:       0x4FC3F7,    // blue
  NEEDS_REPAIR: 0xFFA726,    // orange
  BROKEN:       0xEF5350,    // red
  AVAILABLE:    null,
  NEEDS_REFILL: 0xFFA726,
  NEEDS_WASH:   0xAB47BC,    // purple
};

export class GymItem {
  constructor(typeConfig, slotData) {
    this.id            = slotData.id;
    this.typeConfig    = typeConfig;
    this.state         = null;
    this.gridCol       = slotData.gridCol;
    this.gridRow       = slotData.gridRow;
    this.worldPosition = slotData.position.clone();
    this.mesh          = null;   // THREE.Group
    this._scene        = null;
  }

  addToScene(scene) {
    this._scene = scene;
    this.mesh   = this._buildMesh();
    // Group origin = floor level at slot centre
    this.mesh.position.set(this.worldPosition.x, 0, this.worldPosition.z);
    scene.add(this.mesh);
  }

  _buildMesh() {
    const builder = MESH_BUILDERS[this.typeConfig.key];
    const group   = builder ? builder() : this._fallbackBox();
    // Tag every mesh in the group so raycasts can resolve back to this item
    this._tagGroup(group);
    return group;
  }

  _fallbackBox() {
    const [w = 1.4, h = 1.0, d = 1.4] = this.typeConfig.meshSize ?? [];
    const g   = new THREE.Group();
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
    this._updateMeshColor();
  }

  _updateMeshColor() {
    if (!this.mesh) return;
    const tint = STATE_COLORS[this.state];
    this.mesh.traverse(child => {
      if (!child.isMesh) return;
      // Only tint if there's a state override; otherwise restore the original colour
      if (tint != null) {
        child.material = child.material.clone();
        child.material.color.set(tint);
        child.material.emissive.set(tint);
        child.material.emissiveIntensity = 0.15;
      } else {
        child.material = child.material.clone();
        child.material.emissive.set(0x000000);
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
