import { Manager as SocketManager } from 'socket.io-client';

export class WebsocketClient extends SocketManager {
  constructor(...args: ConstructorParameters<typeof SocketManager>) {
    super(...args);
  }
}
