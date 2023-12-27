import * as THREE from 'three';

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
    console.log('GLTF file loaded:', gltf);
    const graph: any[] = [];
    const childObjectMap = new WeakMap();
    let currentGraph: any[] = graph;
    let currentParent: any = gltf.scene;

    gltf.scene.traverse((child) => {
      if (currentParent !== child) {
        if (child.parent) {
          currentParent = child.parent;
          currentGraph = childObjectMap.get(currentParent).children;
        }
      }

      let obj: any;

      if (child instanceof THREE.SkinnedMesh) {
        const { geometries, materials, object, skeletons } = child.toJSON();
        obj = { type: 'SkinnedMeshComponent', args: [object, geometries[0].data, materials[0], skeletons[0]], children: [] };
      } else if (child instanceof THREE.Bone) {
        const { geometries, images, materials, object, textures } = child.toJSON();
        obj = { type: 'BoneComponent', args: [object, geometries, images, materials, textures], children: [] };
      } else if (child instanceof THREE.Mesh) {
        const { geometries, materials, object } = child.toJSON();
        obj = { type: 'MeshComponent', args: [object, geometries[0].data, materials[0]], children: [] };
      } else if (child instanceof THREE.Group || child instanceof THREE.Object3D) {
        obj = { type: 'SceneComponent', args: [], children: [] };
      }

      if (obj) {
        childObjectMap.set(child, obj);
        currentGraph.push(obj);
      }
    });

    if (IS_DEV) {
      const gltfSize = new Blob([JSON.stringify(gltf)]).size;
      const graphSize = new Blob([JSON.stringify(graph)]).size;
      const log = gltfSize < graphSize ? console.warn : console.log;

      log(
        `[${url}]: The graph size (${MemoryUtils.formatBytes(graphSize)}) is larger than the size of the original GLTF object (${MemoryUtils.formatBytes(gltfSize)}).`
        + ` This could lead to potential performance issues and browser violations.`
      );
    }

    self.postMessage({ type: 'ipc-response', originId: 1, returnValue: graph });
  });
}
