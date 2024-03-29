import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { EProxyThread } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type ProxyInstance } from '../ProxyInstance';
import { ProxyManager } from '../ProxyManager';
import { proxyComponents } from './components';
import { type RenderWorker } from './RenderWorker';
import { SceneComponentProxy } from './SceneComponent';

export class RenderProxyManager extends ProxyManager {
  constructor(
    protected readonly renderer: RenderWorker,
    @IInstantiationService instantiationService: IInstantiationService,
    @IConsoleLogger logger: IConsoleLogger
  ) {
    super(EProxyThread.Render, { ...proxyComponents }, instantiationService, logger);
  }

  protected override onRegisterProxy(Constructor: TClass<ProxyInstance>, args: any[], tb: TripleBuffer, id: number, originThread: number): MaybePromise<ProxyInstance> {
    const proxy = this.instantiationService.createInstance(Constructor, args, tb, id, originThread, this.renderer);

    if (proxy instanceof SceneComponentProxy) {
      this.renderer.addSceneObject(proxy.get());
    }

    return proxy;
  }
}
