import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three';

import {
  Renderer,
  type TRenderWorkerInitData,
  type TRenderWorkerInitMessage,
  type TRenderComponentMessage,
  type TRenderViewportResizeData,
  type TRenderViewportResizeMessage
} from '../common/Renderer';

console.log('loaded: renderWorker.js');

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

function onInit({
  canvas,
  initialCanvasHeight,
  initialCanvasWidth,
  messagePort
}: TRenderWorkerInitData) {
  renderer = new Renderer(canvas);
  renderer.init();
  renderer.setSize(initialCanvasHeight, initialCanvasWidth);
  renderer.start();

  function onMessage(event: MessageEvent<TRenderComponentMessage | TRenderViewportResizeMessage>) {
    console.log('message received:', event);
    if (typeof event.data !== 'object') {
      return;
    }

    const { type } = event.data;

    if (type === 'component') {
      handleComponentMessage(event.data.component);
    }
    if (type === 'viewport-resize') {
      const { height, width } = event.data;
      handleViewportResize(height, width);
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

function handleComponentMessage(component: TRenderComponentMessage['component']) {
  renderer.scene.add(
    new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0x00aaff }))
  );
  renderer.camera.position.z = 5;
}

function handleViewportResize(
  height: TRenderViewportResizeData['height'],
  width: TRenderViewportResizeData['width']
) {
  renderer.setSize(height, width);
}
