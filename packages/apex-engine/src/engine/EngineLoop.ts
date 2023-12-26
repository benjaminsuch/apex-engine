import { plugins } from 'build:info';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { AssetLoader, IAssetLoader } from './AssetLoader';
import { GameContext, IGameContext } from './GameContext';
import { IPhysicsContext, PhysicsContext } from './PhysicsContext';
import { IRenderContext, RenderContext } from './renderer/RenderContext';

export class EngineLoop {
  constructor(@IInstantiationService private readonly instantiationService: IInstantiationService) {

  }

  public async init() {
    // Setup important workers
    {
      const assetLoader = new AssetLoader();
      this.instantiationService.setServiceInstance(IAssetLoader, assetLoader);

      const gameContext = new GameContext();
      this.instantiationService.setServiceInstance(IGameContext, gameContext);

      const renderContext = new RenderContext();
      this.instantiationService.setServiceInstance(IRenderContext, renderContext);

      const physicsContext = new PhysicsContext();
      this.instantiationService.setServiceInstance(IPhysicsContext, physicsContext);

      // The order is important. The asset loader needs to be available to load the map or cinematics.
      await assetLoader.init();
      await gameContext.init();
      await renderContext.init();
      await physicsContext.init();
    }

    // Activate plugins
    {
      plugins.forEach(async (module) => {
        await module.startup?.();
      });
    }
  }
}
