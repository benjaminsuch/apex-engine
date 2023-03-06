import { IConsoleLogger } from '../platform/logging/common';
import { type InstantiationService } from '../platform/di/common';
import { GameEngine } from './GameEngine';

export class EngineLoop {
  private isExitRequested: boolean = false;

  constructor(
    private readonly instantiationService: InstantiationService,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {}

  public init() {
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
