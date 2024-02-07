import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { EProxyThread, type IProxyOrigin } from './core/class/specifiers/proxy';
import { type IEngineLoopTickContext } from './EngineLoop';
import { IPhysicsWorkerContext } from './physics/PhysicsWorkerContext';
import { ProxyManager } from './ProxyManager';
import { IRenderWorkerContext } from './renderer/RenderWorkerContext';

export class GameProxyManager extends ProxyManager<IProxyOrigin> {
  public static override getInstance(): GameProxyManager {
    return super.getInstance() as GameProxyManager;
  }

  constructor(
    @IInstantiationService instantiationService: IInstantiationService,
    @IConsoleLogger logger: IConsoleLogger,
    @IRenderWorkerContext protected readonly renderContext: IRenderWorkerContext,
    @IPhysicsWorkerContext protected readonly physicsContext: IPhysicsWorkerContext
  ) {
    super(EProxyThread.Game, {}, instantiationService, logger);
    this.logger.debug(this.constructor.name, this);
  }

  protected override onProcessProxyQueue(tick: IEngineLoopTickContext): boolean {
    // No need to use `await` here, we just send the proxies and are done.
    this.renderContext.createProxies(this.proxyQueue[EProxyThread.Render]);
    this.physicsContext.createProxies(this.proxyQueue[EProxyThread.Physics]);

    return true;
  }
}
