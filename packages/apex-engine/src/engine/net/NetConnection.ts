import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { type INetDriver } from '../../platform/net/common';
import { Player } from '../Player';
import { ControlChannel } from './ControlChannel';
import { type DataChannel } from './DataChannel';
import { VoiceChannel } from './VoiceChannel';

export class NetConnection extends Player {
  public netDriver: INetDriver | null = null;

  public controlChannel: ControlChannel | null = null;

  public voiceChannel: VoiceChannel | null = null;

  public openChannels: DataChannel[] = [];

  public tickChannels: DataChannel[] = [];

  constructor(
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(logger);
  }

  public init(netDriver: INetDriver) {
    this.logger.debug(this.constructor.name, 'Initialize');

    this.netDriver = netDriver;

    this.createInitialChannels();
    this.initPacketHandler();
  }

  private createInitialChannels() {
    this.logger.debug(this.constructor.name, 'Creating initial data channels');

    if (IS_CLIENT) {
      this.controlChannel = this.instantiationService.createInstance(ControlChannel);
      this.controlChannel.init(this);
      this.openChannels.push(this.controlChannel);
    }

    this.voiceChannel = this.instantiationService.createInstance(VoiceChannel);
    this.voiceChannel.init(this);
    this.openChannels.push(this.voiceChannel);
  }

  private initPacketHandler() {
    this.logger.debug(this.constructor.name, 'Initialize packet handler');
  }
}
