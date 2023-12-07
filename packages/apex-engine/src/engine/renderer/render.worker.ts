import type {
  TRenderWorkerInitData,
  TRenderWorkerInitMessage
} from '../../platform/rendering/common';
import { RenderProxyManager } from '../ProxyManager';
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
  const renderer = Renderer.create(canvas, flags, messagePort, RenderProxyManager);
  renderer.init();
  renderer.setSize(initialCanvasHeight, initialCanvasWidth);
  renderer.start();
}

function startRenderWorker() {
  self.addEventListener('message', onInitMessage);
}

startRenderWorker();
