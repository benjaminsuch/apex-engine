import { plugins } from 'build:info';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { ApexEngine } from './ApexEngine';
import { AssetLoader, IAssetLoader } from './AssetLoader';
import { IPhysicsContext, PhysicsContext } from './PhysicsContext';
import { IRenderContext, RenderContext } from './renderer/RenderContext';

const TICK_RATE = 60;
const MS_PER_UPDATE = 1000 / TICK_RATE;

export class EngineLoop {
  private tickInterval: IntervalReturn;

  public delta: number = 0;

  public elapsed: number = 0;

  public ticks: number = 0;

  public fps: number = 0;

  constructor(@IInstantiationService private readonly instantiationService: IInstantiationService) {

  }

  public async init(): Promise<void> {
    // Setup important workers
    {
      const assetLoader = new AssetLoader();
      this.instantiationService.setServiceInstance(IAssetLoader, assetLoader);

      const renderContext = new RenderContext();
      this.instantiationService.setServiceInstance(IRenderContext, renderContext);

      const physicsContext = new PhysicsContext();
      this.instantiationService.setServiceInstance(IPhysicsContext, physicsContext);

      // The order is important. The asset loader needs to be available to load the map or cinematics.
      await assetLoader.init();
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
      } catch (error) {
        clearInterval(this.tickInterval as number);
        throw error;
      }

      if (performance.now() - then > MS_PER_UPDATE) {
        clearInterval(this.tickInterval as number);

        try {
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
