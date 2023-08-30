import { type World } from '../../../engine';
import { type DataChannel } from '../../../engine/net';
import { InstantiationService } from '../../di/common';

export interface INetDriver {
  readonly _injectibleService: undefined;
  world: World | null;
  close(): void;
  connect(): void;
  createChannel(Class: typeof DataChannel): InstanceType<typeof Class>;
  disconnect(): void;
  init(): void;
  join(): void;
  listen(): void;
  tick(): void;
  send(): void;
}

export const INetDriver = InstantiationService.createDecorator<INetDriver>('netDriver');
