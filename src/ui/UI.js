import * as PIXI from 'pixi.js';
import { gsap }   from 'gsap';

const TEXT_STYLE = {
  fontFamily: 'monospace',
  fontWeight: 'bold',
  fontSize:   22,
  fill:       '#ffffff',
  stroke:     { color: '#000000', width: 4 },
};

// Satisfaction meter geometry
const METER_W      = 180;
const METER_H      = 18;
const METER_MARGIN = 16;
const METER_LABEL_STYLE = {
  fontFamily: 'monospace',
  fontWeight: 'bold',
  fontSize:   14,
  fill:       '#ffffff',
  stroke:     { color: '#000000', width: 3 },
};

// Fly-up appearance
const FLYUP_STYLE = {
  fontFamily: 'monospace',
  fontWeight: 'bold',
  fontSize:   20,
  fill:       '#7CFC6B',
  stroke:     { color: '#0a3d0a', width: 4 },
};

export class UI {
  constructor() {
    this.app = new PIXI.Application();
    this.hud = null;
    this._moneyText   = null;
    this._satFill     = null;
    this._satLabel    = null;
    this._satContainer = null;
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
    this._buildSatisfactionMeter();

    window.addEventListener('resize', () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
      this._layoutSatisfactionMeter();
    });
  }

  // ── HUD builders ────────────────────────────────────────────────────────────

  _buildMoneyDisplay() {
    this._moneyText = new PIXI.Text({ text: '$ 500', style: TEXT_STYLE });
    this._moneyText.position.set(16, 16);
    this.hud.addChild(this._moneyText);
  }

  _buildSatisfactionMeter() {
    const c = new PIXI.Container();

    const label = new PIXI.Text({ text: 'GYM MOOD', style: METER_LABEL_STYLE });
    label.position.set(0, 0);
    c.addChild(label);

    // Track (dark background)
    const track = new PIXI.Graphics()
      .roundRect(0, 22, METER_W, METER_H, 5)
      .fill({ color: 0x000000, alpha: 0.45 });
    c.addChild(track);

    // Fill (recolored each frame). Anchored at left; width animates.
    const fill = new PIXI.Graphics()
      .roundRect(0, 0, METER_W, METER_H, 5)
      .fill({ color: 0xffffff });
    fill.position.set(0, 22);
    c.addChild(fill);

    // Border on top
    const border = new PIXI.Graphics()
      .roundRect(0, 22, METER_W, METER_H, 5)
      .stroke({ color: 0x000000, width: 2, alpha: 0.6 });
    c.addChild(border);

    this._satFill      = fill;
    this._satLabel     = label;
    this._satContainer = c;
    this.hud.addChild(c);
    this._layoutSatisfactionMeter();

    // Start empty (no customers)
    this.updateSatisfaction(null);
  }

  _layoutSatisfactionMeter() {
    if (!this._satContainer) return;
    this._satContainer.position.set(
      window.innerWidth - METER_W - METER_MARGIN,
      METER_MARGIN,
    );
  }

  // ── Public update API ────────────────────────────────────────────────────────

  /** Called by Economy listener on every earn/spend event. */
  updateMoney(amount) {
    if (this._moneyText) {
      this._moneyText.text = `$ ${amount.toLocaleString()}`;
    }
  }

  /**
   * Update the satisfaction meter. Pass a 0–100 value, or null when the gym is
   * empty (meter dims to a neutral idle state).
   */
  updateSatisfaction(value) {
    if (!this._satFill) return;

    if (value === null) {
      this._satFill.width = METER_W;
      this._satFill.tint  = 0x555555;
      this._satFill.alpha = 0.35;
      this._satLabel.text = 'GYM MOOD —';
      return;
    }

    const t = Math.max(0, Math.min(1, value / 100));
    this._satFill.width = Math.max(2, METER_W * t);
    this._satFill.alpha = 1;
    this._satFill.tint  = this._moodColor(t);
    this._satLabel.text = `GYM MOOD ${Math.round(value)}%`;
  }

  /** Red (low) → amber (mid) → green (high). */
  _moodColor(t) {
    if (t < 0.5) {
      // red → amber over [0, 0.5]
      const k = t / 0.5;
      return this._lerpColor(0xE53935, 0xFFB300, k);
    }
    // amber → green over [0.5, 1]
    const k = (t - 0.5) / 0.5;
    return this._lerpColor(0xFFB300, 0x43A047, k);
  }

  _lerpColor(a, b, k) {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    const r = Math.round(ar + (br - ar) * k);
    const g = Math.round(ag + (bg - ag) * k);
    const bl = Math.round(ab + (bb - ab) * k);
    return (r << 16) | (g << 8) | bl;
  }

  /**
   * Spawn a floating "+$N" that rises and fades at a screen position.
   * @param {number} amount
   * @param {number} screenX
   * @param {number} screenY
   */
  showMoneyFlyup(amount, screenX, screenY) {
    const text = new PIXI.Text({ text: `+$${amount}`, style: FLYUP_STYLE });
    text.anchor.set(0.5, 0.5);
    text.position.set(screenX, screenY);
    this.hud.addChild(text);

    gsap.to(text, {
      y:        screenY - 55,
      alpha:    0,
      duration: 1.1,
      ease:     'power1.out',
      onComplete: () => {
        this.hud.removeChild(text);
        text.destroy();
      },
    });
    gsap.fromTo(text.scale,
      { x: 0.6, y: 0.6 },
      { x: 1, y: 1, duration: 0.25, ease: 'back.out(2)' },
    );
  }
}
