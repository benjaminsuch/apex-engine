import { Renderer, TRenderWorkerInitMessage, TRenderComponentMessage } from '../common/Renderer';

console.log('loaded: renderWorker.js');

function onInitMessage(event: MessageEvent<TRenderWorkerInitMessage>) {
  if (typeof event.data !== 'object') {
    return;
  }

  const { type } = event.data;

  if (type === 'init') {
    self.removeEventListener('message', onInitMessage);
    onInit(event.data.canvas);
  }
}

function onInit(canvas: OffscreenCanvas) {
  const renderer = new Renderer(canvas);

  renderer.init();
  renderer.start();

  function onMessage(event: MessageEvent<TRenderComponentMessage>) {
    console.log('message received:', event);
    if (typeof event.data !== 'object') {
      return;
    }

    const { type } = event.data;

    if (type === 'component') {
    }
  }

  self.addEventListener('message', onMessage);
}

function startRenderWorker() {
  self.addEventListener('message', onInitMessage);
}

startRenderWorker();
