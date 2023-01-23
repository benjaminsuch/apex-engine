import type { Server as TServer } from 'socket.io';

const Server = IS_SERVER
  ? (await import('socket.io')).Server
  : (class {
      constructor() {
        throw new Error(`The client cannot create an instance of WebsocketServer.`);
      }
    } as typeof TServer);

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
