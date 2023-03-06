import { InstantiationService, ServiceCollection } from '../../../di/common';
import { ConsoleLogger, IConsoleLogger } from '../../../logging/common';
import { EngineLoop } from '../../../../engine';

console.log('loaded: renderWorker.js');

interface InitEventData {
  type: 'init';
  canvas: OffscreenCanvas;
}

let canvas: OffscreenCanvas;

function onInitMessage(event: MessageEvent<InitEventData>) {
  if (typeof event.data !== 'object') {
    return;
  }

  const { type } = event.data;

  if (type === 'init') {
    canvas = event.data.canvas;

    self.removeEventListener('message', onInitMessage);
    onInit();
  }
}

function onInit() {
  const services = new ServiceCollection();

  services.set(IConsoleLogger, new ConsoleLogger());

  const instantiationService = new InstantiationService(services);
  const engineLoop = instantiationService.createInstance(EngineLoop, instantiationService);
  console.log(engineLoop);
  engineLoop.init();
}

function startRenderWorker() {
  self.addEventListener('message', onInitMessage);
}

startRenderWorker();
