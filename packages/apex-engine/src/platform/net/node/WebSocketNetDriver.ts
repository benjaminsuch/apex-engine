import { createServer, type Server } from 'http';
import { WebSocketServer } from 'ws';

import { NetConnection } from '../../../engine/net';
import { IInstatiationService } from '../../di/common';
import { IConsoleLogger } from '../../logging/common';
import { INetDriver } from '../common';

export class WebSocketNetDriver implements INetDriver {
  declare readonly _injectibleService: undefined;

  private readonly server: Server;

  private readonly wss: WebSocketServer;

  private readonly clientConnections: NetConnection[] = [];

  constructor(
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {
    this.server = createServer();
    this.wss = new WebSocketServer({ server: this.server });
  }

  public init() {
    this.logger.info(this.constructor.name, 'Initialize');

    let connection: NetConnection;

    this.wss.on('connection', ws => {
      this.logger.info(this.constructor.name, 'Client connected');

      connection = this.instantiationService.createInstance(NetConnection);
      connection.init(this);

      this.clientConnections.push(connection);

      ws.on('message', data => {
        this.logger.info(this.constructor.name, 'Client message received:', data);
      });

      ws.on('close', () => {
        this.logger.info(this.constructor.name, 'Client disconnected');
      });
    });
  }

  public listen() {
    this.server.listen(8888, () => {
      this.logger.info(this.constructor.name, `Listening on port ${8888}`);
    });
  }

  public connect() {}

  public join() {}

  public tick() {}

  public send() {}
}
