import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';
import type {
  TRenderWorkerInitData,
  TRenderWorkerInitMessage
} from '../../platform/rendering/common';
import { Renderer } from './Renderer';

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

function onInit({
  canvas,
  initialCanvasHeight,
  initialCanvasWidth,
  messagePort,
  flags
}: TRenderWorkerInitData) {
  const logger = new ConsoleLogger();
  const services = new ServiceCollection([IConsoleLogger, logger]);
  const instantiationService = new InstantiationService(services);
  const renderer = Renderer.create(canvas, flags, messagePort, instantiationService);

  renderer.init();
  renderer.setSize(initialCanvasHeight, initialCanvasWidth);
}

function startRenderWorker() {
  self.addEventListener('message', onInitMessage);
}

startRenderWorker();
