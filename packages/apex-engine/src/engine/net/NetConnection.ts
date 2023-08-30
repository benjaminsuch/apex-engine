import { type INetDriver } from '../../platform/net/common';
import { Player } from '../Player';
import { ControlChannel } from './ControlChannel';
import { type DataChannel } from './DataChannel';
import { VoiceChannel } from './VoiceChannel';

export enum EConnectionState {
  Pending,
  Open,
  Closed
}

export class NetConnection extends Player {
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
  }
}
