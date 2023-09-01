import { createServer, type Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

import { NetConnection } from '../../../engine/net';
import { IInstatiationService } from '../../di/common';
import { IConsoleLogger } from '../../logging/common';
import { INetDriver, WebSocketNetDriverBase } from '../common';
import { type World } from '../../../engine';

export class WebSocketNetDriver extends WebSocketNetDriverBase implements INetDriver {
  declare readonly _injectibleService: undefined;

  private readonly server: Server;

  private readonly wss: WebSocketServer;

  private readonly clientConnections: NetConnection[] = [];

  public readonly connectionSocketMap: WeakMap<NetConnection, WebSocket | null> = new WeakMap();

  public readonly socketConnectionMap: WeakMap<WebSocket, NetConnection> = new WeakMap();

  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);

    this.server = createServer();
    this.wss = new WebSocketServer({ server: this.server });
  }

  public override init(world: World) {
    super.init(world);

    this.wss.on('connection', ws => {
      this.logger.info(this.constructor.name, 'Client connected');

      const connection = this.instantiationService.createInstance(NetConnection);

      this.clientConnections.push(connection);
      this.connectionSocketMap.set(connection, ws);
      this.socketConnectionMap.set(ws, connection);

      connection.init(this);

      if (connection.controlChannel) {
        if (this.world) {
          this.world.getGameMode().preLogin();
          this.world.welcomePlayer(connection);
        }
      }

      ws.on('message', data => {
        this.logger.debug(this.constructor.name, 'Message received');

        if (this.packetHandler) {
          if (data instanceof Buffer) {
            data = data.buffer;
          } else if (!(data instanceof ArrayBuffer)) {
            return;
          }

          const packet = this.packetHandler.incomingPacket(data);
          const connection = this.socketConnectionMap.get(ws);

          if (connection) {
            connection.receiveRawPacket(packet);
          }
        }
      });

      ws.on('close', () => {
        this.logger.info(this.constructor.name, 'Client disconnected');

        const connection = this.socketConnectionMap.get(ws);

        if (connection) {
          connection.close();
          this.socketConnectionMap.delete(ws);
          this.connectionSocketMap.set(connection, null);
        }

        ws.removeAllListeners();
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
