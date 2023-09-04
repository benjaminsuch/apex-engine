import { IConsoleLogger } from '../../platform/logging/common';
import { type IPacketHandlerComponent } from './PacketHandlerComponent';

export class PacketHandler {
  private readonly handlerComponents: IPacketHandlerComponent[] = [];

  public isInitialized: boolean = false;

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger) {}

  public init() {
    this.isInitialized = true;
  }

  public incomingPacket(packet: ArrayBuffer): ArrayBuffer {
    this.logger.debug(this.constructor.name, 'Packet received');
    return packet;
  }

  public tick() {}

  public getQueuedPackets() {
    return [];
  }
}
