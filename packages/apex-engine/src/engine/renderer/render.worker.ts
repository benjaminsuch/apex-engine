import {
  Renderer,
  type TRenderWorkerInitData,
  type TRenderWorkerInitMessage
} from '../../platform/renderer/common';

import * as components from '../components';

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
    components as unknown as Record<string, TClass>
  );
  renderer.init();
  renderer.setSize(initialCanvasHeight, initialCanvasWidth);
  renderer.start();
}

function startRenderWorker() {
  self.addEventListener('message', onInitMessage);
}

startRenderWorker();
