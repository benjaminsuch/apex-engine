import { type World } from '../../../engine';
import { type DataChannel } from '../../../engine/net';
import { IInstatiationService } from '../../di/common';
import { IConsoleLogger } from '../../logging/common';
import { INetDriver } from './NetDriver';

export abstract class WebSocketNetDriverBase implements INetDriver {
  declare readonly _injectibleService: undefined;

  public world: World | null = null;

  constructor(
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {}

  public init() {
    this.logger.debug(this.constructor.name, 'Initialize');
  }

  public listen() {}

  public connect() {}

  public disconnect() {
    this.logger.debug(this.constructor.name, 'Disconnecting');
  }

  public createChannel(Class: typeof DataChannel) {
    return this.instantiationService.createInstance(Class);
  }

  public close() {}

  public join() {}

  public tick() {}

  public send() {}

  public handleEvent(event: Event | MessageEvent) {}
}
