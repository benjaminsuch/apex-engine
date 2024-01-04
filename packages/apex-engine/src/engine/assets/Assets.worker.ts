import * as Comlink from 'comlink';
import { type ISceneJSON } from 'three';

import { GLTFLoader } from './GLTFLoader';

export interface ILoadGLTFResponse {
  animations: any[];
  cameras: any[];
  scenes: ISceneJSON[];
}

const gltfLoader = new GLTFLoader();

const context = {
  loadGLTF(url: string): Promise<ILoadGLTFResponse> {
    return new Promise((resolve, reject) => {
      gltfLoader.load(
        `../${url}`,
        function onLoad(gltf) {
          resolve({
            scenes: gltf.scenes.map(scene => scene.toJSON()),
            animations: [],
            cameras: gltf.cameras.map(camera => camera.toJSON()),
          });
        },
        undefined,
        function onError(event) { reject(event); }
      );
    });
  },
} as const;

Comlink.expose(context);
