import { type INetDriver } from '../../platform/net/common';
import { Player } from '../Player';
import { ControlChannel } from './ControlChannel';
import { type DataChannel } from './DataChannel';
import { VoiceChannel } from './VoiceChannel';

export class NetConnection extends Player {
  public netDriver: INetDriver | null = null;

  public controlChannel: ControlChannel | null = null;

  public voiceChannel: VoiceChannel | null = null;

  public readonly openChannels: DataChannel[] = [];

  public readonly tickChannels: DataChannel[] = [];

  public init(netDriver: INetDriver) {
    this.logger.debug(this.constructor.name, 'Initialize');

    this.netDriver = netDriver;

    this.createInitialChannels();
    this.initPacketHandler();
  }

  private createInitialChannels() {
    this.logger.debug(this.constructor.name, 'Creating initial data channels');

    if (this.netDriver) {
      if (IS_CLIENT) {
        this.controlChannel = this.netDriver.createChannel(ControlChannel);
        this.controlChannel.init(this);
        this.openChannels.push(this.controlChannel);
      }

      this.voiceChannel = this.netDriver.createChannel(VoiceChannel);
      this.voiceChannel.init(this);
      this.openChannels.push(this.voiceChannel);
    }
  }

  private initPacketHandler() {
    this.logger.debug(this.constructor.name, 'Initialize packet handler');
  }
}
