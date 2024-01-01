import { plugins } from 'build:info';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { ApexEngine } from './ApexEngine';
import { AssetWorkerContext, IAssetWorkerContext } from './assets/AssetWorkerContext';
import { IPhysicsWorkerContext, PhysicsWorkerContext } from './physics/PhysicsWorkerContext';
import { IRenderWorkerContext, RenderWorkerContext } from './renderer/RenderWorkerContext';
import { TickFunctionManager } from './TickFunctionManager';

export interface IEngineLoopTickContext {
  id: number;
  delta: number;
  elapsed: number;
}

const TICK_RATE = 60;
const MS_PER_UPDATE = 1000 / TICK_RATE;

export class EngineLoop {
  private tickInterval: IntervalReturn;

  private tickManager: TickFunctionManager;

  public delta: number = 0;

  public elapsed: number = 0;

  public ticks: number = 0;

  public fps: number = 0;

  constructor(@IInstantiationService private readonly instantiationService: IInstantiationService) {
    this.tickManager = this.instantiationService.createInstance(TickFunctionManager);
  }

  public async init(): Promise<void> {
    // Setup important workers
    {
      const assetContext = this.instantiationService.createInstance(AssetWorkerContext);
      this.instantiationService.setServiceInstance(IAssetWorkerContext, assetContext);

      const renderContext = this.instantiationService.createInstance(RenderWorkerContext);
      this.instantiationService.setServiceInstance(IRenderWorkerContext, renderContext);

      const physicsContext = this.instantiationService.createInstance(PhysicsWorkerContext);
      this.instantiationService.setServiceInstance(IPhysicsWorkerContext, physicsContext);

      // The order is important. The asset loader needs to be available to load the map or cinematics.
      await assetContext.init();
      await renderContext.init();
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
    engine.start();
  }

  public tick(): IntervalReturn {
    this.tickInterval = setInterval(() => {
      this.ticks++;

      const then = performance.now();

      this.delta = then - this.elapsed / 1000;
      this.elapsed = then;
      this.fps = (this.ticks * 1000) / then;

      const currentTick = { delta: this.delta, elapsed: this.elapsed, id: this.ticks };

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
