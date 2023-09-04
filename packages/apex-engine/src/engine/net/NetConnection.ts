import { type INetDriver } from '../../platform/net/common';
import { Player } from '../Player';
import { ControlChannel } from './ControlChannel';
import { type DataChannel } from './DataChannel';
import { PacketHandler } from './PacketHandler';
import { VoiceChannel } from './VoiceChannel';

export enum EConnectionState {
  Pending,
  Open,
  Closed
}

export class NetConnection extends Player {
  private packetHandler: PacketHandler | null = null;

  public netDriver: INetDriver | null = null;

  public controlChannel: ControlChannel | null = null;

  public voiceChannel: VoiceChannel | null = null;

  public readonly openChannels: DataChannel[] = [];

  public readonly tickChannels: DataChannel[] = [];

  public state: EConnectionState = EConnectionState.Pending;

  public init(netDriver: INetDriver) {
    this.logger.debug(this.constructor.name, 'Initialize');

    this.netDriver = netDriver;

    this.createInitialChannels();
    this.initPacketHandler();
  }

  public receiveRawPacket(packet: ArrayBuffer) {
    this.logger.debug(this.constructor.name, 'Received raw packet');
  }

  public close() {
    this.state = EConnectionState.Closed;
  }

  public tick() {
    if (this.tickChannels.length > this.openChannels.length) {
      throw new Error(`There are more tick channels than open channels!`);
    }

    for (let i = 0; i < this.tickChannels.length; ++i) {
      this.tickChannels[i].tick();
    }

    if (this.packetHandler?.isInitialized) {
      this.packetHandler.tick();
      // TODO: Resend queued up raw packets

      const queuedPackets = this.packetHandler.getQueuedPackets();

      while (queuedPackets.length) {
        const packet = queuedPackets.pop();
        //this.send(packet)
      }
    }
  }

  public flush() {}

  private createInitialChannels() {
    this.logger.debug(this.constructor.name, 'Creating initial data channels');

    if (this.netDriver) {
      if (IS_CLIENT) {
        this.controlChannel = this.instantiationService.createInstance(ControlChannel);
        this.controlChannel.init(this);
        this.openChannels.push(this.controlChannel);
      }

      this.voiceChannel = this.instantiationService.createInstance(VoiceChannel);
      this.voiceChannel.init(this);
      this.openChannels.push(this.voiceChannel);
    }
  }

  private initPacketHandler() {
    this.logger.debug(this.constructor.name, 'Initialize packet handler');

    if (!this.packetHandler) {
      this.packetHandler = this.instantiationService.createInstance(PacketHandler);
      this.packetHandler.init();
    }
  }
}
