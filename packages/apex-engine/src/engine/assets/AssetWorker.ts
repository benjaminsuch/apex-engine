import * as Comlink from 'comlink';

import { GLTFLoader, type GLTFOnLoadResult } from './GLTFLoader';

const gltfLoader = new GLTFLoader();

const context = {
  loadGLTF(url: string): Promise<GLTFOnLoadResult> {
    return new Promise((resolve, reject) => {
      gltfLoader.load(`../${url}`, (gltf) => {
        console.log('GLTF file loaded:', gltf);
        resolve({
          scenes: gltf.scenes.map(scene => scene.toJSON()),
          animations: [],
          cameras: gltf.cameras.map(camera => camera.toJSON()),
        });
      });
    });
  },
};

Comlink.expose(context);
