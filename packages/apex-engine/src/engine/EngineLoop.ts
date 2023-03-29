import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { IRenderer } from '../platform/renderer/common';
import { GameEngine } from './GameEngine';

export class EngineLoop {
  private isExitRequested: boolean = false;

  constructor(
    @IInstatiationService private readonly instantiationService: IInstatiationService,
    @IRenderer private readonly renderer: IRenderer,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {}

  public init() {
    if (this.renderer) {
      this.renderer.init();
    }

    const engine = this.instantiationService.createInstance(GameEngine, this);

    engine.init();
    engine.start();
  }

  public tick() {
    GameEngine.getInstance().tick();
    setTimeout(() => this.tick(), 1000 / 60);
  }

  public isEngineExitRequested() {
    return this.isExitRequested;
  }

  public requestExit() {
    this.isExitRequested = true;
  }
}
