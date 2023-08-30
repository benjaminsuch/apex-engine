import { type DataChannel, NetConnection } from '../../../engine/net';
import { INetDriver, WebSocketNetDriverBase } from '../common';

export class WebSocketNetDriver extends WebSocketNetDriverBase implements INetDriver {
  declare readonly _injectibleService: undefined;

  private serverConnection?: NetConnection | null = null;

  public socketChannels: Map<WebSocket, DataChannel[]> = new Map();

  public channelsSocket: WeakMap<typeof DataChannel, WebSocket> = new WeakMap();

  public override connect() {
    this.logger.debug(this.constructor.name, 'Connecting to ws://localhost:8888');

    this.serverConnection = this.instantiationService.createInstance(NetConnection);
    this.serverConnection.init(this);
  }

  public override createChannel(Class: typeof DataChannel) {
    const channel = this.instantiationService.createInstance(Class);
    let ws: WebSocket | undefined = this.channelsSocket.get(Class);

    if (!ws) {
      ws = this.createWebSocket([Class.name]);

      this.channelsSocket.set(Class, ws);
      this.socketChannels.set(ws, [channel]);
    } else {
      this.socketChannels.get(ws)?.push(channel);
    }

    return channel;
  }

  public override handleEvent(event: Event | MessageEvent) {
    if (event.type === 'message') this.handleMessageReceived(event as MessageEvent);
    if (event.type === 'open') this.handleSocketOpen(event);
  }

  private handleMessageReceived(event: MessageEvent) {
    this.logger.debug(this.constructor.name, 'Message received:', event.data);
  }

  private handleSocketOpen(event: Event) {
    this.logger.debug(this.constructor.name, 'Connection established');
  }

  private createWebSocket(protocols: string[] = []): WebSocket {
    const ws = new WebSocket(`ws://localhost:8888`, protocols);
    ws.binaryType = 'arraybuffer';
    ws.addEventListener('open', this);
    ws.addEventListener('message', this);

    return ws;
  }
}
