import { IConsoleLogger } from '../../logging/common';
import { INetDriver } from '../common';

export class WebSocketNetDriver implements INetDriver {
  declare readonly _injectibleService: undefined;

  private socket?: WebSocket;

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger) {}

  public init() {}

  public listen() {}

  public connect() {
    if (!IS_CLIENT) {
      return;
    }

    this.socket = new WebSocket(`ws://localhost:8888`);
    this.socket.addEventListener('open', this);
  }

  public disconnect() {
    this.socket?.removeEventListener('open', this);
  }

  public join() {
    if (!IS_CLIENT) {
      return;
    }
  }

  public tick() {}

  public handleEvent(event: Event) {
    if (event.type === 'open') this.onSocketOpen(event);
  }

  private onSocketOpen(event: Event) {}
}
