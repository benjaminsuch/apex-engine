import { type INetDriver } from '../../platform/net/common';
import { Player } from '../Player';
import { type DataChannel } from './DataChannel';

export class NetConnection extends Player {
  public netDriver: INetDriver | null = null;

  public openChannels: DataChannel[] = [];

  public init(netDriver: INetDriver) {
    this.netDriver = netDriver;
    this.initPacketHandler();
  }

  private initPacketHandler() {}
}
