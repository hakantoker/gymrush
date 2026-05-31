import * as PIXI from 'pixi.js';

export class UI {
  constructor() {
    this.app = new PIXI.Application();
  }

  async init() {
    await this.app.init({
      canvas: document.getElementById('ui-canvas'),
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundAlpha: 0,
      antialias: true,
    });

    this._buildHUD();
    window.addEventListener('resize', () => this._onResize());
  }

  _buildHUD() {
    this.hud = new PIXI.Container();
    this.app.stage.addChild(this.hud);

    // Example health label — replace with real UI later
    this.healthLabel = new PIXI.Text({ text: 'HP: 100', style: { fill: 0xffffff, fontSize: 18 } });
    this.healthLabel.position.set(16, 16);
    this.hud.addChild(this.healthLabel);
  }

  setHealth(value) {
    this.healthLabel.text = `HP: ${value}`;
  }

  _onResize() {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
  }
}
