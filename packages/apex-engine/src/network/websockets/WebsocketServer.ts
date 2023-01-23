import { Server } from 'socket.io';

export class WebsocketServer extends Server {
  private static instance?: WebsocketServer;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(
        `No instance of WebsocketServer found. Please create one first with new WebsocketServer().`
      );
    }
    return this.instance;
  }

  constructor(...args: ConstructorParameters<typeof Server>) {
    super(...args);

    WebsocketServer.instance = this;
  }
}
