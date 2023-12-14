import { IInstatiationService } from '../../../platform/di/common';
import { IConsoleLogger } from '../../../platform/logging/common';
import { TripleBuffer } from '../../../platform/memory/common';
import type { TRenderSceneProxyCreateData } from '../../../platform/rendering/common';
import type { RenderProxyManager } from '../../ProxyManager';
import { ProxyTask } from '../../ProxyTask';
import type { Renderer } from '../Renderer';

export class RenderCreateProxyInstanceTask extends ProxyTask<
  TRenderSceneProxyCreateData | TRenderSceneProxyCreateData[]
> {
  constructor(
    public override readonly data: TRenderSceneProxyCreateData | TRenderSceneProxyCreateData[],
    private readonly renderer: Renderer,
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(data, instantiationService, logger);
  }

  public run(proxyManager: RenderProxyManager, context: any) {
    const data = Array.isArray(this.data) ? this.data : [this.data];

    let hasError = false;

    for (let i = 0; i < data.length; ++i) {
      const { args, constructor, id, messagePort, tb, tick } = data[i];
      const ProxyConstructor = proxyManager.components[constructor] as TClass;

      if (!ProxyConstructor) {
        this.logger.warn(`Constructor (${constructor}) not found for proxy "${id}".`);
        return false;
      }

      //todo: See comment in `ProxyManager.tick`
      // if (proxyManager.currentTick.id !== tick) {
      //   //todo: `IS_DEV` does not exist in worker environment (this needs to be fixed in abt/cli.ts).
      //   this.logger.info(
      //     this.constructor.name,
      //     `The render tick (${proxyManager.currentTick.id}) does not match the game tick (${tick}). The task will be deferred to the next tick.`
      //   );
      //   return false;
      // }

      hasError = !proxyManager.registerProxy(
        this.instantiationService.createInstance(
          ProxyConstructor,
          args,
          new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
          id,
          messagePort,
          this.renderer
        )
      );
    }

    return !hasError;
  }
}
