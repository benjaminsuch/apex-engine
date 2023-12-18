import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { type TRenderRPCData } from '../../platform/rendering/common';
import { type IProxyOrigin } from '../class/specifiers/proxy';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { type GameProxyManager } from '../ProxyManager';
import { ProxyTask } from '../ProxyTask';

export class GameRPCTask extends ProxyTask<Omit<TRenderRPCData, 'tick'>> {
  constructor(
    public override readonly data: Omit<TRenderRPCData, 'tick'>,
    private readonly proxy: IProxyOrigin,
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(data, instantiationService, logger);
  }

  public run(proxyManager: GameProxyManager, context: IEngineLoopTickContext) {
    this.proxy.proxyMessageChannel.port1.postMessage({
      ...this.data,
      type: 'rpc',
      tick: context.id,
    });

    return true;
  }
}
