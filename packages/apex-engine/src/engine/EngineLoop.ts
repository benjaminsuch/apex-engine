import { GameEngine } from './GameEngine';

export class EngineLoop {
  public init() {
    const engine = new GameEngine(this);

    engine.init();
    engine.start();
  }
}
