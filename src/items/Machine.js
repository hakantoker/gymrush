import * as THREE          from 'three';
import { OccupiableItem }  from './OccupiableItem.js';

// Rotation that makes a flat surface face the isometric camera (18,18,18 → origin).
// Elevation = atan(1/√2) ≈ 35.26°, horizontal azimuth = 45°.
const ISO_ROT_X = -Math.atan(1 / Math.SQRT2);   // ≈ -0.6155 rad
const ISO_ROT_Y =  Math.PI / 4;                  // 45°

const BAR_W      = 1.0;   // foreground bar world-unit width
const BAR_HALF   = BAR_W / 2;

export class Machine extends OccupiableItem {
  constructor(typeConfig, slotData) {
    super(typeConfig, slotData);
    this.useCount     = 0;
    this._repairTimer = 0;
    this._fgBar       = null;   // foreground progress mesh
    this._timerGroup  = null;
    this.setState('IDLE');
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  addToScene(scene) {
    super.addToScene(scene);
    this._buildTimerBar();
  }

  // ── Session ────────────────────────────────────────────────────────────────

  endSession(customer) {
    this.useCount++;
    this.usingPeople = this.usingPeople.filter(c => c !== customer);

    if (Math.random() < this._breakChance()) {
      this._repairTimer = this.typeConfig.repairWindow;
      this.setState('NEEDS_REPAIR');
    } else if (this.usingPeople.length === 0) {
      this.setState('IDLE');
    }
  }

  // ── Interactions ───────────────────────────────────────────────────────────

  interact(actor) {
    if (this.state === 'NEEDS_REPAIR') {
      this._repairTimer = 0;
      this.setState('IDLE');
    } else if (this.state === 'BROKEN') {
      this.fullRepair();
    }
  }

  fullRepair() {
    this.useCount     = 0;
    this._repairTimer = 0;
    this.setState('IDLE');
    // TODO: Economy.spend(repairCost)
  }

  // ── Per-frame ──────────────────────────────────────────────────────────────

  update(delta) {
    if (this.state === 'NEEDS_REPAIR') {
      this._repairTimer -= delta;
      if (this._repairTimer <= 0) this.setState('BROKEN');
    }
  }

  /** Called by Customer each frame while a session is running.
   *  @param {number} t  Remaining fraction in [0, 1] (1 = full, 0 = finished). */
  setTimerProgress(t) {
    if (!this._fgBar) return;
    const clamped = Math.max(0, Math.min(1, t));

    this._fgBar.scale.x   = clamped;
    this._fgBar.position.x = -BAR_HALF * (1 - clamped);

    const color = clamped > 0.5 ? 0x43A047   // green
                : clamped > 0.25 ? 0xFB8C00  // amber
                : 0xE53935;                   // red
    this._fgBar.material.color.setHex(color);
    this._fgBar.material.emissive.setHex(color);
  }

  // Override so timer bar visibility tracks state changes
  setState(newState) {
    super.setState(newState);
    if (this._timerGroup) {
      this._timerGroup.visible = (newState === 'IN_USE');
      if (newState !== 'IN_USE') this.setTimerProgress(1); // reset fill
    }
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  _breakChance() {
    const { baseBreakChance, breakChanceGrowth, maxBreakChance } = this.typeConfig;
    return Math.min(maxBreakChance, baseBreakChance + this.useCount * breakChanceGrowth);
  }

  _buildTimerBar() {
    const group = new THREE.Group();
    group.position.set(0, 2.3, 0);
    group.rotation.x = ISO_ROT_X;
    group.rotation.y = ISO_ROT_Y;

    // Dark background track
    const bgMesh = new THREE.Mesh(
      new THREE.BoxGeometry(BAR_W + 0.14, 0.18, 0.04),
      new THREE.MeshPhongMaterial({ color: 0x222222 }),
    );
    group.add(bgMesh);

    // Coloured progress fill
    const fgMat  = new THREE.MeshPhongMaterial({
      color:             0x43A047,
      emissive:          0x43A047,
      emissiveIntensity: 0.25,
    });
    this._fgBar  = new THREE.Mesh(new THREE.BoxGeometry(BAR_W, 0.12, 0.06), fgMat);
    this._fgBar.position.z = 0.01;   // sit slightly in front of background
    group.add(this._fgBar);

    group.visible    = false;
    this._timerGroup = group;
    this.mesh.add(group);
  }

  toJSON() {
    return { ...super.toJSON(), useCount: this.useCount };
  }
}
