import * as Comlink from 'comlink';
import { type ISceneJSON, Mesh, type Object3D, type Source } from 'three';

import { GLTFLoader } from './GLTFLoader';

export interface ILoadGLTFResponse {
  animations: any[];
  cameras: any[];
  scenes: ISceneJSON[];
}

export interface IInternalAssetsWorkerContext {
  loadGLTF(url: string): Promise<ILoadGLTFResponse>;
}

const gltfLoader = new GLTFLoader();

const context: IInternalAssetsWorkerContext = {
  loadGLTF(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      gltfLoader.load(
        `../${url}.glb`,
        function onLoad(gltf) {
          const scenes: ISceneJSON[] = gltf.scenes.map(transformScene);
          const cameras = gltf.cameras.map(camera => camera.toJSON());
          const transferables = scenes.map(scene => scene.images.map((image: any) => image.source.data)).flat();

          resolve(Comlink.transfer({ scenes, animations: [], cameras }, transferables));
        },
        undefined,
        function onError(event) { reject(event); }
      );
    });
  },
};

Comlink.expose(context);

function transformScene(scene: Object3D): any {
  const { images = [], materials = [], textures = [], ...json }: ISceneJSON = scene.toJSON();
  const bitmaps: Source[] = [];

  scene.traverse((child) => {
    if (child instanceof Mesh) {
      if (child.material) {
        const maps = ['aoMap', 'bumpMap', 'displacementMap', 'emissiveMap', 'envMap', 'lightMap', 'map', 'metalnessMap', 'normalMap', 'roughnessMap'];

        for (const map of maps) {
          const texture = child.material[map];

          if (texture) {
            bitmaps.push(texture.source);
          }
        }
      }
    }
  });

  return {
    ...json,
    images: images.map(image => ({ uuid: image.uuid, source: bitmaps.find(source => source.uuid === image.uuid) })),
    materials,
    textures,
  };
}
