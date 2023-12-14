import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { IRenderingPlatform } from '../platform/rendering/common';
import { GameEngine } from './GameEngine';
import { TickFunctionManager } from './TickFunctionManager';

const TICK_RATE = 60;
const MS_PER_UPDATE = 1000 / TICK_RATE;

export interface IEngineLoopTickContext {
  id: number;
  delta: number;
  elapsed: number;
}

export class EngineLoop {
  private isExitRequested: boolean = false;

  private tickInterval: NodeJS.Timer | undefined;

  private tickTaskManager: TickFunctionManager;

  public delta: number = 0;

  public elapsed: number = 0;

  public ticks: number = 0;

  public fps: number = 0;

  constructor(
    @IInstatiationService private readonly instantiationService: IInstatiationService,
    @IRenderingPlatform private readonly renderer: IRenderingPlatform,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    this.tickTaskManager = this.instantiationService.createInstance(TickFunctionManager);
  }

  public async init() {
    const promises: MaybePromise<void>[] = [];

    if (this.renderer) {
      promises.push(this.renderer.init([GameEngine.GAME_FLAGS, GameEngine.RENDER_FLAGS]));
    }

    const engine = this.instantiationService.createInstance(GameEngine, this);
    promises.push(engine.init());

    await Promise.all(promises);

    engine.start();
  }

  public tick() {
    this.tickInterval = setInterval(() => {
      this.ticks++;

      // if (this.ticks < 61) {
      //   console.log('game tick:', this.ticks);
      // }

      const then = performance.now();

      this.delta = then - this.elapsed / 1000;
      this.elapsed = then;
      this.fps = (this.ticks * 1000) / then;

      const currentTick = { delta: this.delta, elapsed: this.elapsed, id: this.ticks };

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
