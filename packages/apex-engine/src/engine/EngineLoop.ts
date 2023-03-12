import { type InstantiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { Renderer } from '../platform/renderer/browser';
import { GameEngine } from './GameEngine';

export class EngineLoop {
  private isExitRequested: boolean = false;

  constructor(
    private readonly instantiationService: InstantiationService,
    private readonly renderer: Renderer | null,
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

  public tick() {}

  public isEngineExitRequested() {
    return this.isExitRequested;
  }

  public requestExit() {
    this.isExitRequested = true;
  }
}
