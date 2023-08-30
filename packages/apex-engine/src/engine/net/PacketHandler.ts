import { IConsoleLogger } from '../../platform/logging/common';
import { type IPacketHandlerComponent } from './PacketHandlerComponent';

export class PacketHandler {
  private readonly handlerComponents: IPacketHandlerComponent[] = [];

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger) {}

  public init() {}

  public incomingPacket(packet: ArrayBuffer): ArrayBuffer {
    this.logger.debug(this.constructor.name, 'Packet received');
    return packet;
  }
}
