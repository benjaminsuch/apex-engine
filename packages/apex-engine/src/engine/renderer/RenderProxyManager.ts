import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { proxyComponents } from '../components';
import { EProxyThread } from '../core/class/specifiers/proxy';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyManager } from '../ProxyManager';
import { type RenderProxy } from './RenderProxy';

export class RenderProxyManager extends ProxyManager<RenderProxy> {
  public static override getInstance(): RenderProxyManager {
    return this.getInstance() as RenderProxyManager;
  }

  constructor(
    @IInstantiationService instantiationService: IInstantiationService,
    @IConsoleLogger logger: IConsoleLogger
  ) {
    super(EProxyThread.Render, { ...proxyComponents }, instantiationService, logger);
  }

  public override tick(tick: IEngineLoopTickContext): void {
    super.tick(tick);

    for (let i = 0; i < this.proxies.entries; ++i) {
      const proxy = this.proxies.getProxyByIndex(i);

      if (proxy) {
        proxy.target.tick(tick);
      }
    }
  }
}
