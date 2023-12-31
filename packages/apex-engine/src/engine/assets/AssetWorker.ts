import * as Comlink from 'comlink';

import { GLTFLoader } from './GLTFLoader';

const gltfLoader = new GLTFLoader();

const context = {
  loadGLTF(url: string): Promise<LoadGLTFResponse> {
    return new Promise((resolve, reject) => {
      gltfLoader.load(`../${url}`, (gltf) => {
        resolve({
          scenes: gltf.scenes.map(scene => scene.toJSON()),
          animations: [],
          cameras: gltf.cameras.map(camera => camera.toJSON()),
        });
      });
    });
  },
} as const;

export interface LoadGLTFResponse {
  animations: any[];
  cameras: any[];
  scenes: any[];
}

Comlink.expose(context);
