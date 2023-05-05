import { type CameraProxyConstructorData, CameraSceneProxy, SceneProxy } from '../../../engine';
import { InstantiationService, ServiceCollection } from '../../di/common';
import { ConsoleLogger, IConsoleLogger } from '../../logging/common';
import {
  Renderer,
  type TRenderSceneProxyInitMessage,
  type TRenderSetCameraMessage,
  type TRenderWorkerInitData,
  type TRenderWorkerInitMessage,
  type TRenderViewportResizeData,
  type TRenderViewportResizeMessage
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
let instantiationService: InstantiationService;

function onInit({
  canvas,
  initialCanvasHeight,
  initialCanvasWidth,
  messagePort
}: TRenderWorkerInitData) {
  const services = new ServiceCollection();

  services.set(IConsoleLogger, new ConsoleLogger());

  instantiationService = new InstantiationService(services);

  renderer = instantiationService.createInstance(Renderer, canvas);
  renderer.init();
  renderer.setSize(initialCanvasHeight, initialCanvasWidth);
  renderer.start();

  function onMessage(
    event: MessageEvent<
      TRenderSceneProxyInitMessage | TRenderSetCameraMessage | TRenderViewportResizeMessage
    >
  ) {
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
    if (type === 'set-camera') {
      handleSetCamera(event.data.camera);
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
  let proxy: SceneProxy;

  switch (component.objectType) {
    case 'PerspectiveCamera':
      {
        proxy = new CameraSceneProxy(component as CameraProxyConstructorData);
      }
      break;
    default: {
      proxy = new SceneProxy(component);
    }
  }

  renderer.addSceneProxy(proxy);
}

function handleViewportResize(
  height: TRenderViewportResizeData['height'],
  width: TRenderViewportResizeData['width']
) {
  renderer.setSize(height, width);
}

function handleSetCamera(camera: TRenderSetCameraMessage['camera']) {
  const proxy = renderer.getSceneProxy<CameraSceneProxy>(camera.uuid);
  renderer.camera = proxy ?? new CameraSceneProxy(camera);
}
