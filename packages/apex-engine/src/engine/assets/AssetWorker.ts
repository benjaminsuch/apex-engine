import type * as THREE from 'three';

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
    console.log('GLTF file loaded:', gltf);
    const scene = gltf.scene.toJSON();
    const returnValue = { ...scene, object: renameChildType(scene.object) };
    self.postMessage({ type: 'ipc-response', partial: 1, total: 1, originId: 1, returnValue });
  });
}

function renameChildType(object: ReturnType<THREE.Object3D['toJSON']>): ReturnType<THREE.Object3D['toJSON']> {
  const children = object.children ?? [];

  for (let i = 0; i < children.length; ++i) {
    object.children[i] = renameChildType(children[i]);
  }

  return { ...object, type: getComponentTypeFromObject(object.type) };
}

function getComponentTypeFromObject(type: THREE.Object3D['type']): string {
  const components = {
    Bone: 'BoneComponent',
    Group: 'SceneComponent',
    Object3D: 'SceneComponent',
    Mesh: 'MeshComponent',
    SkinnedMesh: 'SkinnedMeshComponent',
  } as const;
  return components[type as keyof typeof components] ?? type;
}
