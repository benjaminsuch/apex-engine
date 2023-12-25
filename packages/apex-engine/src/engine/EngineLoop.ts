import { plugins } from 'build:info';

import { IInstatiationService } from '../platform/di/common/InstantiationService';
import { AssetLoader, IAssetLoader } from './AssetLoader';
import { GameContext, IGameContext } from './GameContext';
import { IPhysicsContext, PhysicsContext } from './PhysicsContext';
import { IRenderContext, RenderContext } from './renderer/RenderContext'; ;

export class EngineLoop {
  constructor(@IInstatiationService private readonly instantiationService: IInstatiationService) {

  }

  public async init() {
    // Setup important workers
    {
      const assetLoader = new AssetLoader();
      await assetLoader.init();
      this.instantiationService.setServiceInstance(IAssetLoader, assetLoader);

      const gameContext = new GameContext();
      await gameContext.init();
      this.instantiationService.setServiceInstance(IGameContext, gameContext);

      const renderContext = new RenderContext();
      await renderContext.init();
      this.instantiationService.setServiceInstance(IRenderContext, renderContext);

      const physicsContext = new PhysicsContext();
      await physicsContext.init();
      this.instantiationService.setServiceInstance(IPhysicsContext, physicsContext);
    }

    // Activate plugins
    {
      plugins.forEach((module) => {
        module.startup?.();
      });
    }
  }
}
