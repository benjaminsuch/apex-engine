import { IWorker } from '../platform/core/worker/common';
import { IConsoleLogger } from '../platform/logging/common';
import { type InstantiationService } from '../platform/di/common';
import { type Renderer } from '../platform/renderer/browser';
import { GameEngine } from './GameEngine';

/**
 * The main loop.
 *
 * It's job is to initialize the engine and run the game loop.
 */
export class EngineLoop {
  private isExitRequested: boolean = false;

  constructor(
    private readonly instantiationService: InstantiationService,
    @IWorker private readonly gameWorker: IWorker,
    @IWorker private readonly renderWorker: IWorker,
    public readonly renderer: Renderer | null = null,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {}

  public init() {
    if (this.renderer) {
      this.renderer.render();
    }

    const engine = this.instantiationService.createInstance(GameEngine, this);

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

  public isEngineExitRequested() {
    return this.isExitRequested;
  }

  public requestExit() {
    this.isExitRequested = true;
  }
}
