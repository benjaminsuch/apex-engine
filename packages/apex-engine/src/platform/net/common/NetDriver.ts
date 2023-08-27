import { InstantiationService } from '../../di/common';

export interface INetDriver {
  readonly _injectibleService: undefined;
  connect(): void;
  init(): void;
  join(): void;
  listen(): void;
  tick(): void;
  send(): void;
}

export const INetDriver = InstantiationService.createDecorator<INetDriver>('netDriver');
