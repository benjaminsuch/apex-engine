import {
  IRenderProxyManager,
  Renderer,
  type TRenderWorkerInitData,
  type TRenderWorkerInitMessage
} from '../../platform/renderer/common';
import { RenderProxyManager } from '../ProxyManager';

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
  const renderer = Renderer.create(
    canvas,
    flags,
    messagePort,
    //todo: Improve types (I think we have to move `RenderProxyManager` into `../../platform/renderer/common`)
    RenderProxyManager as TClass<IRenderProxyManager>
  );
  renderer.init();
  renderer.setSize(initialCanvasHeight, initialCanvasWidth);
  renderer.start();
}

function startRenderWorker() {
  self.addEventListener('message', onInitMessage);
}

startRenderWorker();
