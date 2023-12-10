import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { TRenderSceneProxyMessage } from '../../platform/rendering/common';
import { getTargetId } from '../class';
import type { TProxyOriginConstructor, IProxyOrigin } from '../class/specifiers/proxy';
import { type GameProxyManager } from '../ProxyManager';
import { ProxyTask } from '../ProxyTask';

export class GameCreateProxyInstanceTask extends ProxyTask<IProxyOrigin> {
  private static currentBatch: TRenderSceneProxyMessage[] = [];

  private static transferables: Transferable[] = [];

  private static error: any;

  constructor(
    public override readonly data: IProxyOrigin,
    private readonly args: any[],
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(data, instantiationService, logger);
  }

  public run(proxyManager: GameProxyManager) {
    const messagePort = this.data.getProxyMessagePort();
    const constructor = (this.data.constructor as TProxyOriginConstructor).proxyClassName;

    GameCreateProxyInstanceTask.currentBatch.push({
      type: 'proxy',
      //@ts-ignore
      constructor,
      args: this.args,
      id: getTargetId(this.data) as number,
      tb: this.data.tripleBuffer,
      messagePort,
      tick: proxyManager.currentTick.id
    });
    GameCreateProxyInstanceTask.transferables.push(messagePort);

    return true;
  }

  public override tickEnd(proxyManager: GameProxyManager): boolean {
    if (GameCreateProxyInstanceTask.error) {
      return false;
    }

    if (GameCreateProxyInstanceTask.currentBatch.length === 0) {
      return true;
    }

    proxyManager.send(
      { type: 'proxy', data: GameCreateProxyInstanceTask.currentBatch },
      GameCreateProxyInstanceTask.transferables
    );

    GameCreateProxyInstanceTask.currentBatch = [];
    GameCreateProxyInstanceTask.transferables = [];

    return true;
  }
}
