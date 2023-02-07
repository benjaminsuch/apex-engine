import { io } from 'socket.io-client';

import { EngineLoop } from 'src/engine';
import { InstantiationService, ServiceCollection } from 'src/platform/di/common';
import { ConsoleLogger, IConsoleLogger } from 'src/platform/logging/common';
import { Renderer } from 'src/platform/renderer/browser';

export class BrowserMain {
  private readonly instantiationService: InstantiationService;

  constructor() {
    const services = new ServiceCollection();

    services.set(IConsoleLogger, new ConsoleLogger());

    this.instantiationService = new InstantiationService(services);
  }

  public init() {
    if (IS_CLIENT) {
      const client = io(`ws://localhost:8080`);

      client.on('connect', () => {
        console.log('connection open');
        client.emit('hello', 'world');
      });
    }

    const engineLoop = this.instantiationService.createInstance(
      EngineLoop,
      this.instantiationService,
      this.instantiationService.createInstance(Renderer)
    );

    engineLoop.init();

    if (!engineLoop.isEngineExitRequested()) {
      engineLoop.tick();
    }
  }
}
