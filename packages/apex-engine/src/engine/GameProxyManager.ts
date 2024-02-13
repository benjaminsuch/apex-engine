import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { EProxyThread, type IProxyConstructionData } from './core/class/specifiers/proxy';
import { IPhysicsWorkerContext } from './physics/PhysicsWorkerContext';
import { ProxyManager } from './ProxyManager';
import { IRenderWorkerContext } from './renderer/RenderWorkerContext';

export class GameProxyManager extends ProxyManager {
  constructor(
    @IInstantiationService instantiationService: IInstantiationService,
    @IConsoleLogger logger: IConsoleLogger,
    @IRenderWorkerContext protected readonly renderContext: IRenderWorkerContext,
    @IPhysicsWorkerContext protected readonly physicsContext: IPhysicsWorkerContext
  ) {
    super(EProxyThread.Game, {}, instantiationService, logger);
  }

  protected override onSubmitDeployments(queue: IProxyConstructionData[][]): void {
    this.physicsContext.createProxies(queue[EProxyThread.Physics]);
    this.renderContext.createProxies(queue[EProxyThread.Render]);
  }
}
