import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { TRenderRPCData } from '../../platform/rendering/common';
import { type IProxy } from '../class/specifiers/proxy';
import { GameProxyManager } from '../ProxyManager';
import { ProxyTask } from '../ProxyTask';

export class GameRPCTask extends ProxyTask<Omit<TRenderRPCData, 'tick'>> {
  constructor(
    public override readonly data: Omit<TRenderRPCData, 'tick'>,
    private readonly proxy: IProxy,
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(data, instantiationService, logger);
  }

  public run(proxyManager: GameProxyManager) {
    this.proxy.proxyMessageChannel.port1.postMessage({
      ...this.data,
      type: 'rpc',
      tick: proxyManager.currentTick.id
    });

    return true;
  }
}