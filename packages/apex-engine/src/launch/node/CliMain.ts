import { EngineLoop } from 'src/engine';
import { InstantiationService, ServiceCollection } from 'src/platform/di/common';
import { ConsoleLogger, IConsoleLogger } from 'src/platform/logging/common';
import { WebsocketServer } from 'src/platform/websocket/node';

const port = 8080;

export class CliMain {
  private readonly instantiationService: InstantiationService;

  constructor(args: string[]) {
    const services = new ServiceCollection();

    services.set(IConsoleLogger, new ConsoleLogger());

    this.instantiationService = new InstantiationService(services);
  }

  public init() {
    if (IS_SERVER) {
      const server = this.instantiationService.createInstance(WebsocketServer, port, {
        cors: {
          origin: '*'
        }
      });

      server.on('connection', socket => {
        console.log('client connected');
        socket.on('hello', data => console.log('received "hello":', data));
      });
    }

    const engineLoop = this.instantiationService.createInstance(
      EngineLoop,
      this.instantiationService,
      null
    );

    engineLoop.init();

    if (!engineLoop.isEngineExitRequested()) {
      engineLoop.tick();
    }
  }
}
