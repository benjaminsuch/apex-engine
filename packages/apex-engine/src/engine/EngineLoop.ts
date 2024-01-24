import { plugins } from 'build:info';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { ApexEngine } from './ApexEngine';
import { Flags } from './Flags';
import GameMode from './GameMode';
import { IPhysicsWorkerContext, PhysicsWorkerContext } from './physics/PhysicsWorkerContext';
import { IRenderWorkerContext, RenderWorkerContext } from './renderer/RenderWorkerContext';
import { TickManager } from './TickManager';

export interface IEngineLoopTickContext {
  id: number;
  delta: number;
  elapsed: number;
}

const TICK_RATE = 60;
const MS_PER_UPDATE = 1000 / TICK_RATE;

export class EngineLoop {
  private tickInterval: IntervalReturn;

  private tickManager: TickManager;

  private tickId: number = 0;

  public delta: number = 0;

  public elapsed: number = 0;

  public fps: number = 0;

  constructor(@IInstantiationService private readonly instantiationService: IInstantiationService) {
    this.tickManager = this.instantiationService.createInstance(TickManager);
  }

  public async init(): Promise<void> {
    // Import and assign default classes
    {
      const defaultPawn = await import(DEFAULT_PAWN);

      if (!defaultPawn.default) {
        throw new Error(`Invalid default pawn: Your default pawn module (defined in your apex.config.ts) does not have a "default" export.`);
      }

      GameMode.DefaultPawnClass = defaultPawn.default;

      const defaultGameMode = await import(DEFAULT_GAME_MODE);

      if (!defaultGameMode.default) {
        throw new Error(`Invalid default game mode class: Your default game mode module (defined in your apex.config.ts) does not have a "default" export.`);
      }

      GameMode.DefaultGameModeClass = defaultGameMode.default;
    }

    // Setup important workers
    {
      const renderContext = this.instantiationService.createInstance(RenderWorkerContext);
      this.instantiationService.setServiceInstance(IRenderWorkerContext, renderContext);

      await renderContext.init([Flags.GAME_FLAGS, Flags.RENDER_FLAGS]);

      const physicsContext = this.instantiationService.createInstance(PhysicsWorkerContext);
      this.instantiationService.setServiceInstance(IPhysicsWorkerContext, physicsContext);

      await physicsContext.init();
    }

    // Activate plugins
    {
      plugins.forEach(async (module) => {
        await module.startup?.();
      });
    }

    const engine = this.instantiationService.createInstance(ApexEngine);

    engine.init();
    await engine.start();
  }

  public tick(): IntervalReturn {
    this.tickInterval = setInterval(() => {
      ++this.tickId;

      const then = performance.now();

      this.delta = (then - this.elapsed) / 1000;
      this.elapsed = then;
      this.fps = (this.tickId * 1000) / then;

      const currentTick = { delta: this.delta, elapsed: this.elapsed, id: this.tickId };

      try {
        ApexEngine.getInstance().tick(currentTick);
      } catch (error) {
        clearInterval(this.tickInterval as number);
        throw error;
      }

      if (performance.now() - then > MS_PER_UPDATE) {
        clearInterval(this.tickInterval as number);

        try {
          ApexEngine.getInstance().tick(currentTick);
        } catch (error) {
          clearInterval(this.tickInterval as number);
          throw error;
        }

        this.tickInterval = this.tick();
      }
    }, MS_PER_UPDATE);

    return this.tickInterval;
  }
}
