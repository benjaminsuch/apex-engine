import { NetConnection } from '../../../engine/net';
import { IInstatiationService } from '../../di/common';
import { IConsoleLogger } from '../../logging/common';
import { INetDriver } from '../common';

export class WebSocketNetDriver implements INetDriver {
  declare readonly _injectibleService: undefined;

  private socket: WebSocket | null = null;

  private serverConnection?: NetConnection | null = null;

  constructor(
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {}

  public init() {
    this.logger.debug(this.constructor.name, 'Initialize');
  }

  public listen() {}

  public connect() {
    this.logger.debug(this.constructor.name, 'Connecting to ws://localhost:8888');

    this.socket = new WebSocket(`ws://localhost:8888`);
    this.socket.binaryType = 'arraybuffer';
    this.socket.addEventListener('open', this);
    this.socket.addEventListener('message', this);
  }

  public disconnect() {
    this.logger.debug(this.constructor.name, 'Disconnecting');
  }

  public join() {}

  public tick() {}

  public send() {}

  public handleEvent(event: Event | MessageEvent) {
    if (event.type === 'message') this.handleMessageReceived(event as MessageEvent);
    if (event.type === 'open') this.handleSocketOpen(event);
  }

  private handleMessageReceived(event: MessageEvent) {
    this.logger.debug(this.constructor.name, 'Message received:', event.data);
  }

  private handleSocketOpen(event: Event) {
    this.logger.debug(this.constructor.name, 'Connection established');

    this.serverConnection = this.instantiationService.createInstance(NetConnection);
    this.serverConnection.init(this);
  }
}
