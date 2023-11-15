import {
  Renderer,
  type TRenderWorkerInitData,
  type TRenderSetCameraMessage,
  type TRenderViewportResizeMessage
} from '../common/Renderer';

/**
 * For consistency reasons, I implemented this class as if it were a worker. This makes
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

  public handleEvent({
    data
  }: MessageEvent<TRenderSetCameraMessage | TRenderViewportResizeMessage>) {
    if (data.type === 'set-camera') {
      this.handleSetCamera(data.camera);
    }
    if (data.type === 'viewport-resize') {
      this.handleViewportResize(data.height, data.width);
    }
  }

  private getRenderer() {
    if (!this.renderer) {
      throw new Error(`The renderer has not been set up yet.`);
    }
    return this.renderer;
  }

  private handleSetCamera(camera: TRenderSetCameraMessage['camera']): void {}

  private handleViewportResize(
    height: TRenderViewportResizeMessage['height'],
    width: TRenderViewportResizeMessage['width']
  ): void {
    this.getRenderer().setSize(height, width);
  }

  private handleInit({
    canvas,
    initialCanvasHeight,
    initialCanvasWidth,
    messagePort,
    flags
  }: TRenderWorkerInitData) {
    this.renderer = Renderer.create(canvas, flags, messagePort);
    this.renderer.init();
    this.renderer.setSize(initialCanvasHeight, initialCanvasWidth);
    this.renderer.start();

    messagePort.addEventListener('message', this);
    messagePort.start();

    this.isInitialized = true;
  }
}
