import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { IRenderer } from '../platform/renderer/common';
import { GameEngine } from './GameEngine';

const TICK_RATE = 60;
const MS_PER_UPDATE = 1000 / TICK_RATE;

export interface Tick {
  delta: number;
  elapsed: number;
}

export class EngineLoop {
  private isExitRequested: boolean = false;

  private tickInterval: NodeJS.Timer | undefined;

  public delta: number = 0;

  public elapsed: number = 0;

  public frames: number = 0;

  public fps: number = 0;

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
    this.tickInterval = setInterval(() => {
      this.frames++;

      const then = performance.now();

      this.delta = then - this.elapsed / 1000;
      this.elapsed = then;
      this.fps = (this.frames * 1000) / then;

      const currentTick = { delta: this.delta, elapsed: this.elapsed };

      try {
        GameEngine.getInstance().tick(currentTick);
      } catch (error) {
        clearInterval(this.tickInterval);
        throw error;
      }

      if (performance.now() - then > MS_PER_UPDATE) {
        clearInterval(this.tickInterval);

        try {
          GameEngine.getInstance().tick(currentTick);
        } catch (error) {
          clearInterval(this.tickInterval);
          throw error;
        }

        this.tickInterval = this.tick();
      }
    }, MS_PER_UPDATE);

    return this.tickInterval;
  }

  public isEngineExitRequested() {
    return this.isExitRequested;
  }

  public requestExit() {
    this.isExitRequested = true;
  }
}
