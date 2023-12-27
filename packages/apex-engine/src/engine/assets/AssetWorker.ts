import { MemoryUtils } from '../core/memory/MemoryUtils';
import { GLTFLoader } from './GLTFLoader';

const gltfLoader = new GLTFLoader();

self.addEventListener('message', (event) => {
  if (typeof event.data !== 'object') {
    return;
  }

  const { type } = event.data;

  if (type === 'ipc-request') {
    const { name, params } = event.data;

    if (name === 'loadGLTF') {
      loadGLTF(params[0]);
    }
  }
});

function loadGLTF(url: string): void {
  gltfLoader.load(`../${url}`, (gltf) => {
    console.log(gltf);
    self.postMessage({ type: 'ipc-response', originId: 1, returnValue: JSON.parse(JSON.stringify(gltf)) });
  }, (event) => {
    console.log('loading gltf file...', `${MemoryUtils.formatBytes(event.loaded)} loaded`);
  });
}
