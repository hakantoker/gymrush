import * as THREE from 'three';

export class Renderer {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    if (!this.camera) return;
    if (this.camera.isOrthographicCamera) {
      const aspect = w / h;
      const v = this._orthoViewSize;
      this.camera.left   = -v * aspect;
      this.camera.right  =  v * aspect;
      this.camera.top    =  v;
      this.camera.bottom = -v;
    } else {
      this.camera.aspect = w / h;
    }
    this.camera.updateProjectionMatrix();
  }

  setCamera(camera, orthoViewSize) {
    this.camera = camera;
    if (orthoViewSize !== undefined) this._orthoViewSize = orthoViewSize;
  }

  render(scene) {
    this.renderer.render(scene, this.camera);
  }
}
