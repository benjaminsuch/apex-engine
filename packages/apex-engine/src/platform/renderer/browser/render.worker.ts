import { InstantiationService, ServiceCollection } from '../../di/common';
import { ConsoleLogger, IConsoleLogger } from '../../logging/common';
import {
  createProxyMessages,
  Renderer,
  type TRenderSceneProxyMessage,
  type TRenderWorkerInitData,
  type TRenderWorkerInitMessage
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
  messagePort,
  flags
}: TRenderWorkerInitData) {
  renderer = instantiationService.createInstance(Renderer, canvas);
  renderer.init(flags);
  renderer.setSize(initialCanvasHeight, initialCanvasWidth);
  renderer.start();

  function onMessage(event: MessageEvent<TRenderSceneProxyMessage>) {
    if (typeof event.data !== 'object') {
      return;
    }

    logger.debug('render.worker:', 'onMessage', event.data);

    const { action, type } = event.data;

    if (type === 'proxy') {
      if (action === 'create') {
        createProxyMessages.push(event.data);
      }
    }
  }

  messagePort.addEventListener('message', onMessage);
  messagePort.start();
}

function startRenderWorker() {
  self.addEventListener('message', onInitMessage);
}

startRenderWorker();

////////////////////////////////////////////////////////////////////
