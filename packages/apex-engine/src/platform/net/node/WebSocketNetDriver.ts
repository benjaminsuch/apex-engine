import { createServer, type Server } from 'http';
import { WebSocketServer } from 'ws';

import { NetConnection } from '../../../engine/net';
import { IInstatiationService } from '../../di/common';
import { IConsoleLogger } from '../../logging/common';
import { INetDriver, WebSocketNetDriverBase } from '../common';

export class WebSocketNetDriver extends WebSocketNetDriverBase implements INetDriver {
  declare readonly _injectibleService: undefined;

  private readonly server: Server;

  private readonly wss: WebSocketServer;

  private readonly clientConnections: NetConnection[] = [];

  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);

    this.server = createServer();
    this.wss = new WebSocketServer({ server: this.server });
  }

  public override init() {
    this.logger.info(this.constructor.name, 'Initialize');

    this.wss.on('connection', ws => {
      this.logger.info(this.constructor.name, 'Client connected');

      if (ws.protocol === 'ControlChannel') {
        const connection = this.instantiationService.createInstance(NetConnection);
        connection.init(this);

        this.clientConnections.push(connection);
      }

      ws.on('close', () => {
        this.logger.info(this.constructor.name, 'Client disconnected');
      });
    });
  }

  public override listen() {
    this.server.listen(8888, () => {
      this.logger.info(this.constructor.name, `Listening on port ${8888}`);
    });
  }

  // TODO: Close and remove player connections and their data channels
  public override close() {
    this.logger.debug(this.constructor.name, 'Closing server');

    this.wss.close(error => {
      if (error) throw error;
      this.logger.debug(this.constructor.name, 'Server closed');
    });
  }
}
