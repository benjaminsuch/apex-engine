let now: number;
let frameTime: number;
let currentTime = Date.now() / 1000;
let t = 0;
let delta = 0.01;
let accumulator = 0;

export class EngineLoop {
  private isRunning = true;

  constructor() {
    this.start();
  }

  private tick() {
    if (!this.isRunning) {
      return;
    }

    now = Date.now() / 1000;
    frameTime = now - currentTime;

    if (frameTime > 0.25) {
      frameTime = 0.25;
    }

    currentTime = now;
    accumulator += frameTime;

    while (accumulator >= delta) {
      t += delta;
      accumulator -= delta;
    }

    setTimeout(this.tick.bind(this));
  }

  public start() {
    this.isRunning = true;
    this.tick();

    return this;
  }

  public stop() {
    this.isRunning = false;

    return this;
  }
}
