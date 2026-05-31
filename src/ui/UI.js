import * as PIXI from 'pixi.js';

export class UI {
  constructor() {
    this.app = new PIXI.Application();
    this.hud = null;
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

    window.addEventListener('resize', () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
    });
  }

  // HUD element builders will be added here as economy / game systems are implemented.
  // e.g. addMoneyCounter(), addSatisfactionMeter(), addTaskNotification()
}
