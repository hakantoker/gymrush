export class GameLoop {
  constructor(updateFn, renderFn) {
    this.update = updateFn;
    this.render = renderFn;
    this.lastTime = 0;
    this.running = false;
    this._tick = this._tick.bind(this);
  }

  start() {
    this.running = true;
    requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
  }

  _tick(timestamp) {
    if (!this.running) return;
    const delta = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap at 50ms
    this.lastTime = timestamp;
    this.update(delta);
    this.render();
    requestAnimationFrame(this._tick);
  }
}
