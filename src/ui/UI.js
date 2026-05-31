import * as PIXI from 'pixi.js';

const TEXT_STYLE = {
  fontFamily: 'monospace',
  fontWeight: 'bold',
  fontSize:   22,
  fill:       '#ffffff',
  stroke:     { color: '#000000', width: 4 },
};

export class UI {
  constructor() {
    this.app = new PIXI.Application();
    this.hud = null;
    this._moneyText = null;
  }

  async init() {
    await this.app.init({
      canvas:          document.getElementById('ui-canvas'),
      width:           window.innerWidth,
      height:          window.innerHeight,
      backgroundAlpha: 0,
      antialias:       true,
    });

    this.hud = new PIXI.Container();
    this.app.stage.addChild(this.hud);

    this._buildMoneyDisplay();

    window.addEventListener('resize', () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
    });
  }

  // ── HUD builders ────────────────────────────────────────────────────────────

  _buildMoneyDisplay() {
    this._moneyText = new PIXI.Text({ text: '$ 500', style: TEXT_STYLE });
    this._moneyText.position.set(16, 16);
    this.hud.addChild(this._moneyText);
  }

  // ── Public update API ────────────────────────────────────────────────────────

  /** Called by Economy listener on every earn/spend event. */
  updateMoney(amount) {
    if (this._moneyText) {
      this._moneyText.text = `$ ${amount.toLocaleString()}`;
    }
  }
}
