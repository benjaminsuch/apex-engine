import { type NetConnection } from './NetConnection';

export class DataChannel {
  public connection: NetConnection | null = null;

  public isClosing: boolean = false;

  public init(connection: NetConnection) {
    this.connection = connection;
  }

  public close() {
    this.isClosing = true;
  }

  public sendPacket() {}
}
