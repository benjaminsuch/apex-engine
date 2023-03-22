import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three';
import { Renderer, TRenderWorkerInitMessage, TRenderComponentMessage } from '../common/Renderer';

console.log('loaded: renderWorker.js');

function onInitMessage(event: MessageEvent<TRenderWorkerInitMessage>) {
  if (typeof event.data !== 'object') {
    return;
  }

  const { type } = event.data;

  if (type === 'init') {
    const { canvas, messagePort } = event.data;

    self.removeEventListener('message', onInitMessage);
    onInit(canvas, messagePort);
  }
}

let renderer: Renderer;

function onInit(canvas: OffscreenCanvas, messagePort: MessagePort) {
  renderer = new Renderer(canvas);
  renderer.init();
  renderer.start();

  function onMessage(event: MessageEvent<TRenderComponentMessage>) {
    console.log('message received:', event);
    if (typeof event.data !== 'object') {
      return;
    }

    const { type } = event.data;

    if (type === 'component') {
      handleComponentMessage(event.data.component);
    }
  }

  messagePort.addEventListener('message', onMessage);
  messagePort.start();
}

function startRenderWorker() {
  self.addEventListener('message', onInitMessage);
}

startRenderWorker();

//////////////////////////////////////////////////////////////////////

function handleComponentMessage(component: TRenderComponentMessage['component']) {
  renderer.scene.add(
    new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0x00aaff }))
  );
  renderer.camera.position.z = 5;
}
