import { InstantiationService, ServiceCollection } from '../../di/common';
import { ConsoleLogger, IConsoleLogger } from '../../logging/common';
import {
  Renderer,
  type TRenderSceneProxyInitMessage,
  type TRenderSetCameraMessage,
  type TRenderWorkerInitData,
  type TRenderWorkerInitMessage,
  type TRenderViewportResizeMessage
} from '../common/Renderer';

function onInitMessage(event: MessageEvent<TRenderWorkerInitMessage>) {
  if (typeof event.data !== 'object') {
    return;
  }

  const { type } = event.data;

  if (type === 'init') {
    self.removeEventListener('message', onInitMessage);
    onInit(event.data);
  }
}

let renderer: Renderer;

const logger = new ConsoleLogger();
const services = new ServiceCollection([IConsoleLogger, logger]);
const instantiationService = new InstantiationService(services);

function onInit({
  canvas,
  initialCanvasHeight,
  initialCanvasWidth,
  messagePort
}: TRenderWorkerInitData) {
  renderer = instantiationService.createInstance(Renderer, canvas);
  renderer.init();
  renderer.setSize(initialCanvasHeight, initialCanvasWidth);
  renderer.start();

  function onMessage(
    event: MessageEvent<
      TRenderSceneProxyInitMessage | TRenderSetCameraMessage | TRenderViewportResizeMessage
    >
  ) {
    if (typeof event.data !== 'object') {
      return;
    }

    logger.debug('render.worker:', 'onMessage', event.data);

    const { type } = event.data;
  }

  messagePort.addEventListener('message', onMessage);
  messagePort.start();
}

function startRenderWorker() {
  self.addEventListener('message', onInitMessage);
}

startRenderWorker();

////////////////////////////////////////////////////////////////////
