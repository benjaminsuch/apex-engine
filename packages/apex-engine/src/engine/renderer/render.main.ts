import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';
import { type TRenderWorkerInitData } from '../../platform/rendering/common';
import { Renderer } from './Renderer';

/**
 * For consistency reasons, I implemented the class as if it were a worker. This makes
 * it easier to use in the Renderer-classes.
 */
export default class RenderMainThread extends EventTarget implements EventListenerObject, Worker {
  private renderer?: Renderer;

  public onerror: Worker['onerror'] = null;

  public onmessage: Worker['onmessage'] = null;

  public onmessageerror: Worker['onmessageerror'] = null;

  private isInitialized: boolean = false;

  public postMessage(message: any): void {
    if (typeof message !== 'object') {
      return;
    }

    if (message.type === 'init' && !this.isInitialized) {
      this.handleInit(message);
    }
  }

  public terminate(): void {}

  public handleEvent(event: MessageEvent) {}

  private handleInit({
    canvas,
    initialCanvasHeight,
    initialCanvasWidth,
    messagePort,
    flags,
  }: TRenderWorkerInitData) {
    const logger = new ConsoleLogger();
    const services = new ServiceCollection([IConsoleLogger, logger]);
    const instantiationService = new InstantiationService(services);

    this.renderer = Renderer.create(canvas, flags, messagePort, instantiationService);
    this.renderer.init();
    this.renderer.setSize(initialCanvasHeight, initialCanvasWidth);
    this.renderer.start();

    this.isInitialized = true;
  }
}
