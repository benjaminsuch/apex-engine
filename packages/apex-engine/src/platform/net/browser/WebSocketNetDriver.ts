import { EConnectionState, NetConnection } from '../../../engine/net';
import { INetDriver, WebSocketNetDriverBase } from '../common';

export class WebSocketNetDriver extends WebSocketNetDriverBase implements INetDriver {
  declare readonly _injectibleService: undefined;

  private serverConnection?: NetConnection | null = null;

  private socket: WebSocket | null = null;

  public override connect() {
    this.logger.debug(this.constructor.name, 'Connecting to ws://localhost:8888');

    this.socket = new WebSocket(`ws://localhost:8888`);
    this.socket.binaryType = 'arraybuffer';
    this.socket.addEventListener('close', this);
    this.socket.addEventListener('error', this);
    this.socket.addEventListener('message', this);
    this.socket.addEventListener('open', this);

    this.serverConnection = this.instantiationService.createInstance(NetConnection);
    this.serverConnection.init(this);
  }

  public override send(data: ArrayBufferLike) {
    this.socket?.send(data);
  }

  public override handleEvent(event: Event | MessageEvent) {
    super.handleEvent(event);

    if (event.type === 'message') this.handleMessageReceived(event as MessageEvent);
    if (event.type === 'open') this.handleSocketOpen(event);
    if (event.type === 'close') this.handleSocketClosed(event);
    if (event.type === 'error') this.handleSocketError(event);
  }

  private handleMessageReceived(event: MessageEvent) {
    this.logger.debug(this.constructor.name, 'Message received');

    if (this.packetHandler) {
      const packet = this.packetHandler.incomingPacket(event.data);

      if (this.serverConnection) {
        this.serverConnection.receiveRawPacket(packet);
      }
    }
  }

  private handleSocketOpen(event: Event) {
    this.logger.debug(this.constructor.name, 'Connection established');

    if (this.serverConnection) {
      this.serverConnection.state = EConnectionState.Open;
    }

    this.send(new TextEncoder().encode('message from client'));
  }

  private handleSocketClosed(event: Event) {
    this.logger.debug(this.constructor.name, 'Connection closed');
    this.serverConnection?.close();
  }

  private handleSocketError(event: Event) {
    this.logger.debug(this.constructor.name, 'Socket error', event);
  }
}
