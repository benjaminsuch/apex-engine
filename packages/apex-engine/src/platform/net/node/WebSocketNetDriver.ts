import { createServer, type Server } from 'http';
import { WebSocketServer } from 'ws';

import { IConsoleLogger } from '../../logging/common';
import { INetDriver } from '../common';

export class WebSocketNetDriver implements INetDriver {
  declare readonly _injectibleService: undefined;

  private readonly server: Server;

  private readonly wss: WebSocketServer;

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger) {
    // We can skip the `IS_SERVER` check here, since an "inactive" WebSocketServer
    // doesn't do any harm and also doesn't have a significant memory usage.
    this.server = createServer();
    this.wss = new WebSocketServer({ server: this.server });
  }

  public init() {
    if (!IS_SERVER) {
      return;
    }

    this.wss.on('connection', () => {
      this.logger.info(this.constructor.name, 'Client connected');
    });
  }

  public listen() {
    if (!IS_SERVER) {
      return;
    }

    this.server.listen(8888, () => {
      this.logger.info(this.constructor.name, `Listening on port ${8888}`);
    });
  }

  public connect() {}

  public join() {}

  public tick() {}
}
