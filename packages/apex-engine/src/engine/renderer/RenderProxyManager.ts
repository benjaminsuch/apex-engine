import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { EProxyThread } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyManager } from '../ProxyManager';
import { proxyComponents } from './components';
import { type RenderProxy } from './RenderProxy';
import { type RenderWorker } from './RenderWorker';

export class RenderProxyManager extends ProxyManager<RenderProxy> {
  public static override getInstance(): RenderProxyManager {
    return super.getInstance() as RenderProxyManager;
  }

  constructor(
    private readonly renderer: RenderWorker,
    @IInstantiationService instantiationService: IInstantiationService,
    @IConsoleLogger logger: IConsoleLogger
  ) {
    super(EProxyThread.Render, { ...proxyComponents }, instantiationService, logger);
  }

  protected override onCreateInstance(Constructor: TClass<any>, args: any[], tb: TripleBuffer, id: number, originThread: number): RenderProxy {
    return this.instantiationService.createInstance(Constructor, args, tb, id, originThread, this.renderer);
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
