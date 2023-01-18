import { Renderer } from 'src/renderer';
import { GameEngine } from './GameEngine';

export class EngineLoop {
  private renderer?: Renderer;

  public preInit() {
    // Initialize platform specific code

    if (IS_CLIENT) {
      this.renderer = new Renderer();
      this.renderer.render();
    }
  }

  public init() {
    const engine = new GameEngine(this);

    engine.init();
    engine.start();
  }

  public tick() {
    if (typeof window === 'undefined') {
      setImmediate(this.tick.bind(this));
    } else {
      setTimeout(this.tick.bind(this), 1000 / 60);
    }

    GameEngine.getInstance().tick();
  }
}
