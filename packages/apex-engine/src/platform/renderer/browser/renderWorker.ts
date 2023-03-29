import { SceneProxy } from '../../../engine/SceneProxy';
import {
  Renderer,
  type TRenderSceneProxyInitMessage,
  type TRenderWorkerInitData,
  type TRenderWorkerInitMessage,
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

  function onMessage(
    event: MessageEvent<TRenderSceneProxyInitMessage | TRenderViewportResizeMessage>
  ) {
    console.log('message received:', event);
    if (typeof event.data !== 'object') {
      return;
    }

    const { type } = event.data;

    if (type === 'init-scene-proxy') {
      handleInitSceneProxy(event.data.component);
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

function handleInitSceneProxy(component: TRenderSceneProxyInitMessage['component']) {
  const proxy = new SceneProxy(component);
  renderer.addSceneProxy(proxy);
  renderer.camera.position.z = 5;
  console.log(proxy);
}

function handleViewportResize(
  height: TRenderViewportResizeData['height'],
  width: TRenderViewportResizeData['width']
) {
  renderer.setSize(height, width);
}
