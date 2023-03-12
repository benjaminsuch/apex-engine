import { Renderer } from '../common/Renderer';

console.log('loaded: renderWorker.js');

interface InitEventData {
  type: 'init';
  canvas: OffscreenCanvas;
}

function onInitMessage(event: MessageEvent<InitEventData>) {
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
  // Es sollten nur RenderThread-relevanter Code geladen/ausgeführt werden
  const renderer = new Renderer(canvas);
}

function startRenderWorker() {
  self.addEventListener('message', onInitMessage);
}

startRenderWorker();
