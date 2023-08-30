import { type World } from '../../../engine';
import { type PacketHandler } from '../../../engine/net';
import { InstantiationService } from '../../di/common';

export interface INetDriver {
  readonly _injectibleService: undefined;
  packetHandler: PacketHandler | null;
  world: World | null;
  close(): void;
  connect(): void;
  disconnect(): void;
  init(): void;
  join(): void;
  listen(): void;
  tick(): void;
  send(data: ArrayBufferLike): void;
}

export const INetDriver = InstantiationService.createDecorator<INetDriver>('netDriver');
