import { IInstatiationService } from '../../../platform/di/common';
import { IConsoleLogger } from '../../../platform/logging/common';
import type { TRenderRPCData } from '../../../platform/rendering/common';
import { ProxyTask } from '../../ProxyTask';
import type { RenderProxy } from '../RenderProxy';

export class RenderRPCTask extends ProxyTask<TRenderRPCData> {
  constructor(
    public override readonly data: TRenderRPCData,
    private readonly proxy: RenderProxy | undefined = undefined,
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(data, instantiationService, logger);
  }

  public run() {
    const { name, params, tick } = this.data;

    // if (proxyManager.currentTick.id !== tick) {
    //   //todo: `IS_DEV` does not exist in worker environment (this needs to be fixed in abt/cli.ts).
    //   this.logger.info(
    //     this.constructor.name,
    //     `The render tick (${proxyManager.currentTick.id}) does not match the game tick (${tick}). The task will be deferred to the next tick.`
    //   );
    //   return false;
    // }

    if (!this.proxy) {
      this.logger.info(
        this.constructor.name,
        `RPC execution failed: The target for this rpc does not exist yet. Task will be deferred to the next tick.`
      );
      return false;
    }

    const method = this.proxy[name];

    if (!method) {
      this.logger.warn(
        this.constructor.name,
        `RPC execution failed: A method "${name}" does not exist on ${this.proxy.constructor.name}.`
      );
    } else {
      method.apply(this.proxy, params);
    }

    return true;
  }
}
