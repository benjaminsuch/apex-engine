import { proxyComponents } from '../components';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyManager } from '../ProxyManager';
import { type RenderProxy } from './RenderProxy';

const proxyConstructors = { ...proxyComponents };

export class RenderProxyManager extends ProxyManager<RenderProxy> {
  public static override getInstance(): RenderProxyManager {
    return this.getInstance() as RenderProxyManager;
  }

  public getProxyConstructor(id: string): TClass {
    return proxyConstructors[id as keyof typeof proxyConstructors];
  }

  public getProxy(id: number): RenderProxy | void {
    for (const proxy of this.proxies) {
      if (proxy.id === id) {
        return proxy;
      }
    }
  }

  public override tick(tick: IEngineLoopTickContext): void {
    super.tick(tick);

    for (let i = 0; i < this.proxies.entries; ++i) {
      const proxy = this.proxies.getProxyByIndex(i);

      if (proxy) {
        proxy.tick(tick);
      }
    }
  }
}
