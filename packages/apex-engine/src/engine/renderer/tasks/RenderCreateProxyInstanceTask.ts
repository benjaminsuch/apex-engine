import { IInstatiationService } from '../../../platform/di/common';
import { IConsoleLogger } from '../../../platform/logging/common';
import { TripleBuffer } from '../../../platform/memory/common';
import type { TRenderSceneProxyCreateData } from '../../../platform/rendering/common';
import { RenderProxyManager } from '../../ProxyManager';
import { ProxyTask } from '../../ProxyTask';
import { type Renderer } from '../Renderer';

export class RenderCreateProxyInstanceTask extends ProxyTask<TRenderSceneProxyCreateData> {
  constructor(
    public override readonly data: TRenderSceneProxyCreateData,
    private readonly renderer: Renderer,
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(data, instantiationService, logger);
  }

  public run(proxyManager: RenderProxyManager) {
    const { constructor, id, messagePort, tb, tick } = this.data;
    const ProxyConstructor = proxyManager.components[constructor] as TClass;

    if (!ProxyConstructor) {
      this.logger.warn(`Constructor (${constructor}) not found for proxy with id "${id}".`);
      return false;
    }

    if (proxyManager.currentTick.id !== tick) {
      //todo: `IS_DEV` does not exist in worker environment (this needs to be fixed in abt/cli.ts).
      this.logger.info(
        this.constructor.name,
        `The render tick (${proxyManager.currentTick.id}) does not match the game tick (${tick}). The task will be deferred to the next tick.`
      );
      return false;
    }

    return proxyManager.registerProxy(
      this.instantiationService.createInstance(
        ProxyConstructor,
        new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
        id,
        messagePort,
        this.renderer
      )
    );
  }
}
