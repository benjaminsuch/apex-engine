import { getTargetId } from '../class';
import { type TProxyConstructor, type IProxy } from '../class/specifiers/proxy';
import { GameProxyManager } from '../ProxyManager';
import { ProxyTask } from '../ProxyTask';

export class GameCreateProxyInstanceTask extends ProxyTask<IProxy> {
  public run(proxyManager: GameProxyManager) {
    const messagePort = this.data.getProxyMessagePort();
    const constructor = (this.data.constructor as TProxyConstructor).proxyClassName;

    proxyManager.send(
      {
        type: 'proxy',
        constructor,
        id: getTargetId(this.data) as number,
        tb: this.data.tripleBuffer,
        messagePort,
        tick: proxyManager.currentTick.id
      },
      [messagePort]
    );

    return true;
  }
}
