import { WorkerThread } from '../../platform/worker/browser';
import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { IGameWorker } from '../../platform/engine/game/common';
import { IRenderWorker } from '../../platform/engine/rendering/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';
import { Renderer } from '../../platform/renderer/browser';

export class BrowserMain {
  private readonly instantiationService: InstantiationService;

  private readonly gameWorker = new WorkerThread('./workers/gameWorker.js');

  private readonly renderWorker = new WorkerThread('./workers/renderWorker.js');

  constructor() {
    const services = new ServiceCollection();

    services.set(IConsoleLogger, new ConsoleLogger());
    services.set(IGameWorker, this.gameWorker);
    services.set(IRenderWorker, this.renderWorker);

    this.instantiationService = new InstantiationService(services);
  }

  public init() {
    const renderer = this.instantiationService.createInstance(Renderer);
    const canvas = document.getElementById('canvas') as HTMLCanvasElement | undefined;

    if (canvas) {
      const offscreenCanvas = canvas.transferControlToOffscreen();
      this.renderWorker.postMessage({ type: 'init', canvas: offscreenCanvas }, [offscreenCanvas]);
    }
  }
}
